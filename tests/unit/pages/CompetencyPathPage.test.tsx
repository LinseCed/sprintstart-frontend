import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompetencyPathPage } from '../../../src/pages/CompetencyPathPage';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'user1' } }),
}));

vi.mock('../../../src/services/assessmentService', () => ({
    assessmentService: {
        startAssessment: vi.fn(),
        answerAssessment: vi.fn(),
        fetchPath: vi.fn(),
    },
    getLastSeenGraphVersion: vi.fn(),
    markGraphVersionSeen: vi.fn(),
}));

const setSelectedProjectId = vi.fn();
vi.mock('../../../src/features/projects/useProjectSelection', () => ({
    useProjectSelection: () => ({
        projects: [{ id: 'proj1', name: 'Project One' }],
        selectedProject: { id: 'proj1', name: 'Project One' },
        selectedProjectId: 'proj1',
        isLoading: false,
        errorMessage: null,
        setSelectedProjectId,
        reloadProjects: vi.fn(),
    }),
}));

vi.mock('../../../src/services/onboardingService', () => ({
    onboardingService: { personalizePath: vi.fn() },
}));

import { assessmentService, getLastSeenGraphVersion } from '../../../src/services/assessmentService';
import { onboardingService } from '../../../src/services/onboardingService';
import { ApiError } from '../../../src/services/apiClient';

describe('CompetencyPathPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the path', async () => {
        vi.mocked(getLastSeenGraphVersion).mockReturnValue(null);
        vi.mocked(assessmentService.fetchPath).mockResolvedValue({
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 }],
            edges: [],
            graphVersion: 1,
        });

        render(<CompetencyPathPage />);

        await waitFor(() => {
            expect(screen.getByText('Kotlin')).toBeInTheDocument();
        });
        expect(screen.queryByText(/your path was updated/i)).not.toBeInTheDocument();
    });

    it('shows the reconciliation notice when the graph version changed', async () => {
        vi.mocked(getLastSeenGraphVersion).mockReturnValue(1);
        vi.mocked(assessmentService.fetchPath).mockResolvedValue({
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 }],
            edges: [],
            graphVersion: 2,
        });

        const user = userEvent.setup();
        render(<CompetencyPathPage />);

        await waitFor(() => {
            expect(screen.getByText(/your path was updated/i)).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Dismiss notice' }));

        expect(screen.queryByText(/your path was updated/i)).not.toBeInTheDocument();
    });

    it('shows an error state with a retry button when loading fails', async () => {
        vi.mocked(getLastSeenGraphVersion).mockReturnValue(null);
        vi.mocked(assessmentService.fetchPath)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ nodes: [], edges: [], graphVersion: 1 });

        const user = userEvent.setup();
        render(<CompetencyPathPage />);

        await waitFor(() => {
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Try again' }));

        await waitFor(() => {
            expect(screen.getByText(/no competencies in your path yet/i)).toBeInTheDocument();
        });
    });

    it('kicks off generation for the selected project when it has no path yet', async () => {
        vi.mocked(getLastSeenGraphVersion).mockReturnValue(null);
        vi.mocked(assessmentService.fetchPath).mockRejectedValue(new ApiError(404, 'no path'));
        // Never resolves the SSE, so the page stays in the generating state.
        vi.mocked(onboardingService.personalizePath).mockReturnValue(new Promise(() => {}));

        render(<CompetencyPathPage />);

        await waitFor(() => {
            expect(onboardingService.personalizePath).toHaveBeenCalledWith(
                expect.any(Object),
                'proj1',
            );
        });
        expect(screen.getByText(/building your path for this project/i)).toBeInTheDocument();
    });
});
