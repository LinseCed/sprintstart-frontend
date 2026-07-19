import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { SkillAssessmentPage } from '../../../src/pages/SkillAssessmentPage';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'user1' }, status: 'authenticated' }),
}));

vi.mock('../../../src/services/assessmentService', () => ({
    assessmentService: {
        startAssessment: vi.fn().mockResolvedValue({ sessionId: 'session1', question: 'Walk me through a recent PR.' }),
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

describe('SkillAssessmentPage Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <MemoryRouter>
                <main>
                    <SkillAssessmentPage />
                </main>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Walk me through a recent PR.')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
