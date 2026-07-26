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
    mockGetProjectArtifactSnapshot,
    mockGetUnifiedArtifacts,
} = vi.hoisted(() => ({
    mockGetIngestionRuns: vi.fn(),
    mockGetIngestionStatus: vi.fn(),
    mockConnectGithubRepository: vi.fn(),
    mockGetGithubPatNames: vi.fn(),
    mockUpdateAllGithubRepositories: vi.fn(),
    mockUpdateGithubRepository: vi.fn(),
    mockGetAccessibleProject: vi.fn(),
    mockGetProjectArtifactSnapshot: vi.fn(),
    mockGetUnifiedArtifacts: vi.fn(),
}));

vi.mock('../../../src/services/ingestionService', () => ({
    getIngestionRuns: mockGetIngestionRuns,
    getIngestionStatus: mockGetIngestionStatus,
    getProjectArtifactSnapshot: mockGetProjectArtifactSnapshot,
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
        mockGetProjectArtifactSnapshot.mockResolvedValue({ artifacts: [], totalElements: 0 });
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
            await screen.findByRole('button', { name: /add a single repository instead/i }),
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
            await screen.findByRole('button', { name: /add a single repository instead/i }),
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
