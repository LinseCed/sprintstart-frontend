import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { axe } from 'vitest-axe';
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
        getMyProjects: vi.fn().mockResolvedValue([{ id: 'p1', name: 'Project One' }]),
    },
}));

vi.mock('../../../src/services/buddyService', () => ({
    getMessages: vi.fn().mockResolvedValue([]),
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
import { userService } from '../../../src/services/userService';

describe('BuddyPage Accessibility', () => {
    afterEach(() => {
        // The no-project test below overrides this per-file default; reset it so later tests in
        // this file don't inherit an empty project list.
        vi.mocked(userService.getMyProjects).mockResolvedValue([{ id: 'p1', name: 'Project One' }]);
    });

    it('has no violations in the no-project state', async () => {
        vi.mocked(userService.getMyProjects).mockResolvedValue([]);

        const { baseElement } = render(
            <MemoryRouter>
                <main>
                    <BuddyPage />
                </main>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/not on a project yet/)).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });

    it('has no violations in intake mode', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: false });
        vi.mocked(assessmentService.startAssessment).mockResolvedValue({
            sessionId: 's1',
            question: 'Walk me through a recent PR.',
        });

        const { baseElement } = render(
            <MemoryRouter>
                <main>
                    <BuddyPage />
                </main>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Walk me through a recent PR.')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });

    it('has no violations in mentor mode', async () => {
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({ completed: true });

        const { baseElement } = render(
            <MemoryRouter>
                <main>
                    <BuddyPage />
                </main>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('What should I work on?')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
