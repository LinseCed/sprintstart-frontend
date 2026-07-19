import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SkillAssessmentPage } from '../../../src/pages/SkillAssessmentPage';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'user1' }, status: 'authenticated' }),
}));

vi.mock('../../../src/services/assessmentService', () => ({
    assessmentService: {
        startAssessment: vi.fn(),
        answerAssessment: vi.fn(),
        fetchPath: vi.fn(),
    },
    hasCompletedAssessment: vi.fn().mockReturnValue(false),
    markAssessmentCompleted: vi.fn(),
    snoozeAssessmentGate: vi.fn(),
}));

vi.mock('../../../src/features/projects/useProjectSelection', () => ({
    useProjectSelection: () => ({
        projects: [{ id: 'proj1', name: 'Project One' }],
        selectedProject: { id: 'proj1', name: 'Project One' },
        selectedProjectId: 'proj1',
        isLoading: false,
        errorMessage: null,
        setSelectedProjectId: vi.fn(),
        reloadProjects: vi.fn(),
    }),
}));

import {
    assessmentService,
    snoozeAssessmentGate,
} from '../../../src/services/assessmentService';

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/onboarding/assessment']}>
            <Routes>
                <Route path="/" element={<LocationDisplay />} />
                <Route path="/onboarding/assessment" element={<SkillAssessmentPage />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('SkillAssessmentPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('starts the assessment and shows the first question', async () => {
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 'session1',
            question: 'Walk me through a recent PR.',
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Walk me through a recent PR.')).toBeInTheDocument();
        });
    });

    it('walks through turns and shows the path view once done', async () => {
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 'session1',
            question: 'Q1',
        });
        vi.mocked(assessmentService.answerAssessment).mockResolvedValue({ done: true, question: null });
        vi.mocked(assessmentService.fetchPath).mockResolvedValue({
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED' }],
            edges: [],
            graphVersion: 1,
        });

        const user = userEvent.setup();
        renderPage();

        await waitFor(() => expect(screen.getByText('Q1')).toBeInTheDocument());

        await user.type(screen.getByPlaceholderText('Type your answer...'), 'my answer');
        await user.click(screen.getByRole('button', { name: 'Send answer' }));

        await waitFor(() => {
            expect(screen.getByText('Kotlin')).toBeInTheDocument();
        });
        expect(screen.getByText('Your personalized path')).toBeInTheDocument();
    });

    it('shows an error state with a retry button when starting fails', async () => {
        vi.mocked(assessmentService.startAssessment)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ sessionId: 'session1', question: 'Q1' });

        const user = userEvent.setup();
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Try again' }));

        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeInTheDocument();
        });
    });

    it('skip for now snoozes the gate and returns to the dashboard', async () => {
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 'session1',
            question: 'Q1',
        });

        const user = userEvent.setup();
        renderPage();

        await waitFor(() => expect(screen.getByText('Q1')).toBeInTheDocument());

        await user.click(screen.getByRole('button', { name: 'Skip for now' }));

        expect(snoozeAssessmentGate).toHaveBeenCalledWith('user1');
        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/');
        });
    });
});
