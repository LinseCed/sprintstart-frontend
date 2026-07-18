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

import { assessmentService, getLastSeenGraphVersion } from '../../../src/services/assessmentService';

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
});
