import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyPathPage } from '../../../src/pages/MyPathPage';

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

vi.mock('../../../src/services/myCompetencyService', () => ({
    myCompetencyService: { fetchMyCompetencies: vi.fn() },
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
    onboardingService: { personalizePath: vi.fn(), fetchStep: vi.fn() },
}));

import { assessmentService, getLastSeenGraphVersion } from '../../../src/services/assessmentService';
import { myCompetencyService } from '../../../src/services/myCompetencyService';
import { onboardingService } from '../../../src/services/onboardingService';
import { ApiError } from '../../../src/services/apiClient';

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/my-path']}>
            <Routes>
                <Route path="/my-path" element={<MyPathPage />} />
                <Route path="/my-path/module/:stepId" element={<p>module route</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('MyPathPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(myCompetencyService.fetchMyCompetencies).mockResolvedValue([]);
        vi.mocked(onboardingService.fetchStep).mockResolvedValue({
            id: 'step1',
            estimatedMinutes: 15,
            pages: [{ kind: 'LESSON', title: 'Learn', content: '# Hi' }],
            tasks: [],
            resources: [],
        } as never);
    });

    it('renders the graph', async () => {
        vi.mocked(getLastSeenGraphVersion).mockReturnValue(null);
        vi.mocked(assessmentService.fetchPath).mockResolvedValue({
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 }],
            edges: [],
            graphVersion: 1,
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByTestId('graph-node-kotlin')).toBeInTheDocument();
        });
        expect(screen.queryByText(/your path was updated/i)).not.toBeInTheDocument();
    });

    it('splits the skills rail into on-graph and transferable competencies', async () => {
        vi.mocked(getLastSeenGraphVersion).mockReturnValue(null);
        vi.mocked(assessmentService.fetchPath).mockResolvedValue({
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 }],
            edges: [],
            graphVersion: 1,
        });
        vi.mocked(myCompetencyService.fetchMyCompetencies).mockResolvedValue([
            {
                competencyKey: 'kotlin',
                label: 'Kotlin',
                kind: 'SKILL',
                level: 3,
                source: 'VERIFIED',
                updatedAt: '2026-07-01T00:00:00Z',
            },
            {
                competencyKey: 'terraform',
                label: 'Terraform',
                kind: 'SKILL',
                level: 2,
                source: 'ASSESSED',
                updatedAt: '2026-07-01T00:00:00Z',
            },
        ]);

        renderPage();

        const rail = await screen.findByTestId('skills-rail');
        await waitFor(() => {
            expect(within(rail).getByText('Terraform')).toBeInTheDocument();
        });
        expect(within(rail).getByText(/transferable/i)).toBeInTheDocument();
        expect(within(rail).getByText('Kotlin')).toBeInTheDocument();
    });

    it('opens a node detail panel from the list view and navigates into its module', async () => {
        vi.mocked(getLastSeenGraphVersion).mockReturnValue(null);
        vi.mocked(assessmentService.fetchPath).mockResolvedValue({
            nodes: [
                {
                    key: 'kotlin',
                    label: 'Kotlin',
                    kind: 'SKILL',
                    state: 'AVAILABLE',
                    stepId: 'step1',
                },
            ],
            edges: [],
            graphVersion: 1,
        });

        const user = userEvent.setup();
        renderPage();

        await user.click(await screen.findByRole('button', { name: /list view/i }));
        await user.click(await screen.findByRole('button', { name: /Kotlin/ }));

        const panel = await screen.findByTestId('node-detail-panel');
        expect(within(panel).getByText(/no prerequisites/i)).toBeInTheDocument();

        await user.click(screen.getByTestId('start-module'));

        expect(await screen.findByText('module route')).toBeInTheDocument();
    });

    it('explains a locked node with clickable blockers', async () => {
        vi.mocked(getLastSeenGraphVersion).mockReturnValue(null);
        vi.mocked(assessmentService.fetchPath).mockResolvedValue({
            nodes: [
                { key: 'basics', label: 'Basics', kind: 'SKILL', state: 'AVAILABLE', stepId: 's0' },
                { key: 'advanced', label: 'Advanced', kind: 'SKILL', state: 'LOCKED', stepId: 's1' },
            ],
            edges: [{ from: 'basics', to: 'advanced' }],
            graphVersion: 1,
        });

        const user = userEvent.setup();
        renderPage();

        // `fireEvent` rather than `user.click`: a real pointer sequence reaches
        // React Flow's d3-zoom pane handler, which jsdom can't satisfy.
        fireEvent.click(await screen.findByTestId('graph-node-advanced'));

        const panel = await screen.findByTestId('node-detail-panel');
        expect(within(panel).getByText(/waiting on 1 prerequisite/i)).toBeInTheDocument();

        await user.click(within(panel).getByRole('button', { name: 'Basics' }));

        await waitFor(() => {
            expect(
                within(screen.getByTestId('node-detail-panel')).getByRole('heading', {
                    name: 'Basics',
                }),
            ).toBeInTheDocument();
        });
    });

    it('shows the reconciliation notice when the graph version changed', async () => {
        vi.mocked(getLastSeenGraphVersion).mockReturnValue(1);
        vi.mocked(assessmentService.fetchPath).mockResolvedValue({
            nodes: [{ key: 'kotlin', label: 'Kotlin', kind: 'SKILL', state: 'MASTERED', level: 3 }],
            edges: [],
            graphVersion: 2,
        });

        const user = userEvent.setup();
        renderPage();

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
        renderPage();

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

        renderPage();

        await waitFor(() => {
            expect(onboardingService.personalizePath).toHaveBeenCalledWith(
                expect.any(Object),
                'proj1',
            );
        });
        expect(screen.getByText(/building your path for this project/i)).toBeInTheDocument();
    });
});
