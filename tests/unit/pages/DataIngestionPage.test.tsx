import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DataIngestionPage } from '../../../src/pages/DataIngestionPage';
import { createProjectContextValue, createSelectableProject } from '../setup/projectContext';

const { mockUseProjectContext } = vi.hoisted(() => ({ mockUseProjectContext: vi.fn() }));

vi.mock('../../../src/features/projects/useProjectContext', () => ({
    useProjectContext: mockUseProjectContext,
}));

/** Points the mocked context at a project the current user manages (or not). */
function selectProject(overrides = {}) {
    const project = createSelectableProject({ id: 'proj1', isManaged: true, ...overrides });
    mockUseProjectContext.mockReturnValue(
        createProjectContextValue({
            projects: [project],
            selectedProject: project,
            selectedProjectId: 'proj1',
            canManageSelected: project.isManaged,
        }),
    );
}

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({
        profile: { id: 'user1', firstName: 'Test', lastName: 'User', permissionGroup: 'PM' },
    }),
}));

const {
    mockGetIngestionRuns,
    mockGetIngestionStatus,
    mockConnectGithubRepository,
    mockGetGithubPatNames,
    mockUpdateAllGithubRepositories,
    mockUpdateGithubRepository,
    mockGetAccessibleProject,
    mockGetIngestionSourceStatuses,
    mockGetUnifiedArtifacts,
} = vi.hoisted(() => ({
    mockGetIngestionRuns: vi.fn(),
    mockGetIngestionStatus: vi.fn(),
    mockConnectGithubRepository: vi.fn(),
    mockGetGithubPatNames: vi.fn(),
    mockUpdateAllGithubRepositories: vi.fn(),
    mockUpdateGithubRepository: vi.fn(),
    mockGetAccessibleProject: vi.fn(),
    mockGetIngestionSourceStatuses: vi.fn(),
    mockGetUnifiedArtifacts: vi.fn(),
}));

vi.mock('../../../src/services/ingestionService', () => ({
    getIngestionRuns: mockGetIngestionRuns,
    getIngestionStatus: mockGetIngestionStatus,
    getIngestionSourceStatuses: mockGetIngestionSourceStatuses,
}));

vi.mock('../../../src/services/projectService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../src/services/projectService')>();
    return {
        ...actual,
        projectService: { ...actual.projectService, getAccessibleProject: mockGetAccessibleProject },
    };
});

vi.mock('../../../src/services/sources/githubService', () => ({
    connectGithubRepository: mockConnectGithubRepository,
    getGithubPatNames: mockGetGithubPatNames,
    updateAllGithubRepositories: mockUpdateAllGithubRepositories,
    updateGithubRepository: mockUpdateGithubRepository,
}));

vi.mock('../../../src/services/knowledgeService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../src/services/knowledgeService')>();
    return {
        ...actual,
        knowledgeService: { ...actual.knowledgeService, getUnifiedArtifacts: mockGetUnifiedArtifacts },
    };
});

describe('DataIngestionPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetIngestionRuns.mockResolvedValue([]);
        mockGetIngestionStatus.mockResolvedValue([]);
        mockGetGithubPatNames.mockResolvedValue(['token1']);
        mockConnectGithubRepository.mockResolvedValue({ transactionId: 'tx1' });
        mockUpdateAllGithubRepositories.mockResolvedValue({ transactionId: 'tx2' });
        mockUpdateGithubRepository.mockResolvedValue({ transactionId: 'tx3' });
        mockGetAccessibleProject.mockResolvedValue({
            id: 'proj1',
            name: 'Project Alpha',
            description: '',
            manager: null,
            sources: [
                { id: 'src1', name: 'octocat/hello-world', type: 'GITHUB', status: 'CONNECTED' },
            ],
            users: [],
        });
        mockGetIngestionSourceStatuses.mockResolvedValue([]);
        mockGetUnifiedArtifacts.mockResolvedValue([]);
        selectProject();
    });

    it('renders the section filter after loading', async () => {
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByRole('group', { name: /filter sections/i })).toBeInTheDocument();
        });

        const filter = within(screen.getByRole('group', { name: /filter sections/i }));
        expect(filter.getByRole('button', { name: /overview/i })).toBeInTheDocument();
        expect(filter.getByRole('button', { name: /sources/i })).toBeInTheDocument();
        expect(filter.getByRole('button', { name: /runs/i })).toBeInTheDocument();
    });

    it('lists the project sources fetched from the accessible-project endpoint', async () => {
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        expect(await screen.findByText('octocat/hello-world')).toBeInTheDocument();
        expect(mockGetAccessibleProject).toHaveBeenCalledWith('proj1');
    });

    it('builds the GitHub source card from the per-repo ingestion status endpoint', async () => {
        mockGetIngestionSourceStatuses.mockResolvedValue([
            {
                sourceSystem: 'GITHUB',
                sourceId: 'octocat/hello-world',
                repositoryId: 'repo-uuid',
                owner: 'octocat',
                name: 'hello-world',
                sourceUrl: 'https://github.com/octocat/hello-world',
                status: 'CONNECTED',
                enabled: true,
                lastRunTime: '2026-07-01T00:00:00Z',
                ingestedCount: 12,
                updatedCount: 7,
                deletedCount: 1,
                failedCount: 0,
                failedItems: [],
                artifactCount: 340,
                lastCommitsSyncAt: '2026-07-01T00:00:00Z',
                lastIssuesSyncAt: null,
                lastPullRequestsSyncAt: null,
            },
        ]);

        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        // Rendered both as the source card and in the overview's per-source breakdown.
        expect(
            (await screen.findAllByText('octocat/hello-world')).length,
        ).toBeGreaterThan(0);

        // The repo's stored artifact count (#5) drives the card and the overview KPI,
        // instead of being counted from a full artifact snapshot.
        await waitFor(() => {
            expect(screen.getAllByText('340').length).toBeGreaterThan(0);
        });

        // Owner comes from the endpoint, not from parsed artifact metadata.
        expect(screen.getByText('octocat')).toBeInTheDocument();
        expect(mockGetIngestionSourceStatuses).toHaveBeenCalledWith('proj1');
    });

    it('opens the connectors modal from Manage connectors', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /manage connectors/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /manage connectors/i }));

        await waitFor(() => {
            expect(
                screen.getByText('Enable or disable a connector, and choose which sources are in scope for this project.'),
            ).toBeInTheDocument();
        });
    });

    it('filters to the runs section when its control is clicked', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByRole('group', { name: /filter sections/i })).toBeInTheDocument();
        });

        const filter = () => within(screen.getByRole('group', { name: /filter sections/i }));
        await user.click(filter().getByRole('button', { name: /runs/i }));

        expect(filter().getByRole('button', { name: /runs/i })).toHaveClass('bg-app-brand');
    });

    it('opens the add-source wizard and reaches GitHub discovery via Continue', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getAllByRole('button', { name: /Add sources/i }).length).toBeGreaterThan(0);
        });

        await user.click(screen.getAllByRole('button', { name: /Add sources/i })[0]);

        // Step 1: the source-type chooser.
        await waitFor(() => {
            expect(screen.getByText('Add a data source')).toBeInTheDocument();
        });

        // Step 2 (GitHub is the default type): discovery.
        await user.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => {
            expect(screen.getByText('Discover GitHub repositories')).toBeInTheDocument();
        });
    });

    it('parses owner/repo format and calls connectGithubRepository via the single-repo fallback', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getAllByRole('button', { name: /Add sources/i }).length).toBeGreaterThan(0);
        });

        await user.click(screen.getAllByRole('button', { name: /Add sources/i })[0]);
        await user.click(await screen.findByRole('button', { name: /continue/i }));
        await user.click(
            await screen.findByRole('button', { name: /add single repo/i }),
        );

        await waitFor(() => {
            expect(screen.getByLabelText('Repository owner')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText('Repository owner'), 'octocat/hello-world');

        await user.click(screen.getByRole('button', { name: 'Connect Source' }));

        await waitFor(() => {
            expect(mockConnectGithubRepository).toHaveBeenCalledWith(
                expect.objectContaining({
                    owner: 'octocat',
                    name: 'hello-world',
                    tokenName: 'token1',
                }),
            );
        });
    });

    it('warns instead of connecting when the user only has member access to the project', async () => {
        selectProject({ isManaged: false });
        const user = userEvent.setup();
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getAllByRole('button', { name: /Add sources/i }).length).toBeGreaterThan(0);
        });

        await user.click(screen.getAllByRole('button', { name: /Add sources/i })[0]);
        await user.click(await screen.findByRole('button', { name: /continue/i }));
        await user.click(
            await screen.findByRole('button', { name: /add single repo/i }),
        );

        await waitFor(() => {
            expect(screen.getByLabelText('Repository owner')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText('Repository owner'), 'octocat/hello-world');
        await user.click(screen.getByRole('button', { name: 'Connect Source' }));

        expect(await screen.findByText(/only connect sources to projects you manage/i)).toBeInTheDocument();
        expect(mockConnectGithubRepository).not.toHaveBeenCalled();
    });
});
