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

vi.mock('../../../src/services/userService', () => ({
    userService: {
        getMyProjects: vi.fn(),
    },
}));

vi.mock('../../../src/services/buddyService', () => ({
    getMessages: vi.fn().mockResolvedValue([]),
    openBuddy: vi.fn().mockResolvedValue({ greeting: 'Welcome back!', action: null }),
    streamMessage: vi.fn(),
    performAction: vi.fn(),
    // The chips are the backend's now, gated on the tools mounted for this hire — the page no
    // longer holds a list of its own, which is what let "Is my PR stuck?" reach every role.
    getSuggestions: vi.fn().mockResolvedValue([
        { label: 'What should I work on?', question: 'What should I work on next?' },
    ]),
}));

vi.mock('../../../src/services/onboardingMetricsService', () => ({
    onboardingMetricsService: {
        fetchMyTimeline: vi.fn().mockRejectedValue(new Error('no metrics')),
    },
}));

vi.mock('../../../src/features/projects/useProjectContext', async () => {
    const { createProjectContextValue, createSelectableProject } = await import(
        '../setup/projectContext'
    );
    return {
        useProjectContext: () =>
            createProjectContextValue({
                selectedProjectId: 'p1',
                projects: [createSelectableProject({ id: 'p1', name: 'Project One' })],
                selectedProject: createSelectableProject({ id: 'p1', name: 'Project One' }),
            }),
    };
});

import { assessmentService } from '../../../src/services/assessmentService';
import { userService } from '../../../src/services/userService';
import { openBuddy, streamMessage } from '../../../src/services/buddyService';

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
        vi.mocked(userService.getMyProjects).mockResolvedValue([{ id: 'p1', name: 'Project One' }]);
    });

    it('shows the no-project state when the hire is not on a project yet', async () => {
        vi.mocked(userService.getMyProjects).mockResolvedValue([]);

        renderPage();

        expect(await screen.findByText(/not on a project yet/)).toBeInTheDocument();
        expect(assessmentService.fetchAssessmentStatus).not.toHaveBeenCalled();
        expect(assessmentService.startAssessment).not.toHaveBeenCalled();
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

    /**
     * ⚠️ **A chip fills the composer; it does not send.** This page's chips used to call
     * `sendMessage` directly, which meant the first thing the mentor ever heard from a hire were
     * words the page had chosen. The hire presses send now — and can edit the question first, which
     * is how somebody discovers they are allowed to.
     */
    it('fills the composer from a chip instead of sending it', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: true });

        const user = userEvent.setup();
        renderPage();

        await user.click(await screen.findByRole('button', { name: 'What should I work on?' }));

        expect(screen.getByPlaceholderText('Ask your buddy anything...')).toHaveValue(
            'What should I work on next?',
        );
        expect(streamMessage).not.toHaveBeenCalled();
    });
});
