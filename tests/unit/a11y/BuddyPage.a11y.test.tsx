import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

describe('BuddyPage Accessibility', () => {
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
