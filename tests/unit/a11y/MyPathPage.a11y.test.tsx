import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { MyPathPage } from '../../../src/pages/MyPathPage';

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

vi.mock('../../../src/services/myCompetencyService', () => ({
    myCompetencyService: {
        fetchMyCompetencies: vi.fn().mockResolvedValue([
            {
                competencyKey: 'kotlin',
                label: 'Kotlin',
                kind: 'SKILL',
                level: 3,
                source: 'VERIFIED',
                updatedAt: '2026-07-01T00:00:00Z',
            },
        ]),
    },
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

describe('MyPathPage Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <MemoryRouter>
                <main>
                    <MyPathPage />
                </main>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('skills-rail')).toBeInTheDocument();
        });

        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
