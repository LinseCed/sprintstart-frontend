import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BuddyPage } from '../../../src/pages/BuddyPage';

vi.mock('../../../src/services/assessmentService', () => ({
    assessmentService: {
        fetchAssessmentStatus: vi.fn(),
        startAssessment: vi.fn(),
        answerAssessment: vi.fn(),
    },
}));

vi.mock('../../../src/services/buddyService', () => ({
    getMessages: vi.fn().mockResolvedValue([]),
    openBuddy: vi.fn().mockResolvedValue({ greeting: 'Welcome back!', action: null }),
    streamMessage: vi.fn(),
    performAction: vi.fn(),
}));

vi.mock('../../../src/services/onboardingMetricsService', () => ({
    onboardingMetricsService: {
        fetchMyTimeline: vi.fn().mockRejectedValue(new Error('no metrics')),
    },
}));

vi.mock('../../../src/features/projects/useProjectSelection', () => ({
    useProjectSelection: () => ({
        projects: [{ id: 'p1', name: 'Project One' }],
        selectedProject: { id: 'p1', name: 'Project One' },
        selectedProjectId: 'p1',
        isLoading: false,
        errorMessage: null,
        setSelectedProjectId: vi.fn(),
        reloadProjects: vi.fn(),
    }),
}));

import { assessmentService } from '../../../src/services/assessmentService';
import { openBuddy } from '../../../src/services/buddyService';

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/buddy']}>
            <BuddyPage />
        </MemoryRouter>,
    );
}

describe('BuddyPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    it('opens the mentor for a hire who already has a placement', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: true });

        renderPage();

        // The mentor's empty state, not an interview: no session is started.
        expect(await screen.findByText('What should I work on?')).toBeInTheDocument();
        expect(assessmentService.startAssessment).not.toHaveBeenCalled();
        expect(openBuddy).toHaveBeenCalled();
    });

    it('calibrates in-conversation when there is no placement, then flips to the mentor', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: false });
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 's1',
            question: 'Walk me through a recent PR.',
        });
        vi.mocked(assessmentService.answerAssessment).mockResolvedValue({
            done: true,
            question: null,
        });

        const user = userEvent.setup();
        renderPage();

        // The interviewer speaks in the buddy thread — no separate app, no suggestions yet.
        expect(await screen.findByText('Walk me through a recent PR.')).toBeInTheDocument();
        expect(screen.queryByText('What should I work on?')).not.toBeInTheDocument();
        expect(openBuddy).not.toHaveBeenCalled();

        await user.type(screen.getByPlaceholderText('Type your answer...'), 'It fixed a flaky test.');
        await user.click(screen.getByRole('button', { name: 'Send message' }));

        expect(assessmentService.answerAssessment).toHaveBeenCalledWith('s1', 'It fixed a flaky test.');

        // Placement done: the same page is now the mentor, suggestions and all.
        expect(await screen.findByText('What should I work on?')).toBeInTheDocument();
        expect(screen.queryByText('Walk me through a recent PR.')).not.toBeInTheDocument();
        expect(openBuddy).toHaveBeenCalled();
    });

    it('shows a retry when starting the interview fails', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: false });
        vi.mocked(assessmentService.startAssessment)
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValue({ sessionId: 's1', question: 'Q1' });

        const user = userEvent.setup();
        renderPage();

        const retry = await screen.findByRole('button', { name: 'Try again' });
        await user.click(retry);

        expect(await screen.findByText('Q1')).toBeInTheDocument();
    });
});
