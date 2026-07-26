import { render, screen, waitFor } from '@testing-library/react';
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
    useAuth: () => ({ profile: { id: 'user1', firstName: 'Test', lastName: 'User' } }),
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
} = vi.hoisted(() => ({
    mockGetIngestionRuns: vi.fn(),
    mockGetIngestionStatus: vi.fn(),
    mockConnectGithubRepository: vi.fn(),
    mockGetGithubPatNames: vi.fn(),
    mockUpdateAllGithubRepositories: vi.fn(),
    mockUpdateGithubRepository: vi.fn(),
    mockGetAccessibleProject: vi.fn(),
    mockGetProjectArtifactSnapshot: vi.fn(),
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
        selectProject();
    });

    it('renders sources, artifacts, and runs tabs after loading', async () => {
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'sources' })).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'artifacts' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'runs' })).toBeInTheDocument();
    });

    it('lists the project sources fetched from the accessible-project endpoint', async () => {
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        expect(await screen.findByText('octocat/hello-world')).toBeInTheDocument();
        expect(mockGetAccessibleProject).toHaveBeenCalledWith('proj1');
    });

    it('switches to the artifacts tab when clicked', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'artifacts' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'artifacts' }));

        expect(screen.getByRole('button', { name: 'artifacts' })).toHaveClass('bg-app-brand');
    });

    it('switches to the runs tab when clicked', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'runs' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'runs' }));

        expect(screen.getByRole('button', { name: 'runs' })).toHaveClass('bg-app-brand');
    });

    it('opens the source connect modal when Add Source is clicked', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Add Source/ })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Add Source/ }));

        await waitFor(() => {
            expect(screen.getByText('Add Data Source')).toBeInTheDocument();
        });
    });

    it('parses owner/repo format and calls connectGithubRepository on submit', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><DataIngestionPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Add Source/ })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Add Source/ }));

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
            expect(screen.getByRole('button', { name: /Add Source/ })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Add Source/ }));

        await waitFor(() => {
            expect(screen.getByLabelText('Repository owner')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText('Repository owner'), 'octocat/hello-world');
        await user.click(screen.getByRole('button', { name: 'Connect Source' }));

        expect(await screen.findByText(/only connect sources to projects you manage/i)).toBeInTheDocument();
        expect(mockConnectGithubRepository).not.toHaveBeenCalled();
    });
});
