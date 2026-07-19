import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { CompetencyPathPage } from '../../../src/pages/CompetencyPathPage';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'user1' } }),
}));

vi.mock('../../../src/services/assessmentService', () => ({
    assessmentService: {
        startAssessment: vi.fn(),
        answerAssessment: vi.fn(),
        fetchPath: vi.fn().mockResolvedValue({
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 }],
            edges: [],
            graphVersion: 2,
        }),
    },
    getLastSeenGraphVersion: vi.fn().mockReturnValue(1),
    markGraphVersionSeen: vi.fn(),
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

vi.mock('../../../src/services/onboardingService', () => ({
    onboardingService: { personalizePath: vi.fn() },
}));

describe('CompetencyPathPage Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <main>
                <CompetencyPathPage />
            </main>,
        );

        await waitFor(() => {
            expect(screen.getByText('Kotlin')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
