import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TeamMemberDetailPage } from '../../../src/pages/TeamMemberDetailPage';
import type { TeamOverviewUser, ProjectRole } from '../../../src/features/team-management/types';
import type { KnowledgeGap } from '../../../src/features/knowledge-gaps/types';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({ profile: { id: 'pm1', firstName: 'PM', lastName: 'User' } }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ userId: 'user1' }),
        useNavigate: () => vi.fn(),
    };
});

const {
    mockGetTeamMember,
    mockGetProjectRoles,
    mockFetchUserCompetencies,
    mockGetUserOnboardingPath,
    mockGetUserOnboardingFeedback,
    mockGetOnboardingTasksByStep,
    mockAssignProjectRoleToUser,
    mockUnassignProjectRoleFromUser,
    mockGetProjectRolesForUserOnProject,
    mockAcceptOnboardingSkipRequest,
    mockDenyOnboardingSkipRequest,
} = vi.hoisted(() => ({
    mockGetTeamMember: vi.fn(),
    mockGetProjectRoles: vi.fn(),
    mockFetchUserCompetencies: vi.fn(),
    mockGetUserOnboardingPath: vi.fn(),
    mockGetUserOnboardingFeedback: vi.fn(),
    mockGetOnboardingTasksByStep: vi.fn(),
    mockAssignProjectRoleToUser: vi.fn(),
    mockUnassignProjectRoleFromUser: vi.fn(),
    mockGetProjectRolesForUserOnProject: vi.fn(),
    mockAcceptOnboardingSkipRequest: vi.fn(),
    mockDenyOnboardingSkipRequest: vi.fn(),
}));

vi.mock('../../../src/services/competencyDashboardService', () => ({
    competencyDashboardService: {
        fetchUserCompetencies: mockFetchUserCompetencies,
    },
}));

vi.mock('../../../src/services/teamManagementService', () => ({
    getTeamMember: mockGetTeamMember,
    getProjectRoles: mockGetProjectRoles,
    getUserOnboardingPath: mockGetUserOnboardingPath,
    getUserOnboardingFeedback: mockGetUserOnboardingFeedback,
    getOnboardingTasksByStep: mockGetOnboardingTasksByStep,
    assignProjectRoleToUser: mockAssignProjectRoleToUser,
    getProjectRolesForUserOnProject: mockGetProjectRolesForUserOnProject,
    unassignProjectRoleFromUser: mockUnassignProjectRoleFromUser,
    markOnboardingFeedbackRead: vi.fn(),
    deleteOnboardingStep: vi.fn(),
    deleteOnboardingTask: vi.fn(),
    createOnboardingStepForPhase: vi.fn(),
    createOnboardingTaskForStep: vi.fn(),
}));

vi.mock('../../../src/services/knowledgeGapService', () => ({
    knowledgeGapService: {
        fetchKnowledgeGaps: vi.fn().mockResolvedValue({ gaps: [] as KnowledgeGap[] }),
    },
}));

vi.mock('../../../src/components/common/UserAvatar', () => ({
    UserAvatar: () => <svg role="img" aria-label="User Avatar" width="56" height="56" />,
}));

vi.mock('../../../src/features/team-management/components/detail/MemberOnboardingSection', () => ({
    MemberOnboardingSection: () => <div data-testid="member-onboarding-section">Onboarding</div>,
}));

vi.mock('../../../src/features/team-management/components/detail/MemberGapsPanel', () => ({
    MemberGapsPanel: () => <div data-testid="member-gaps-panel">Gaps</div>,
}));

vi.mock('../../../src/features/team-management/components/detail/StepDetailsPanel', () => ({
    StepDetailsPanel: () => <div data-testid="step-details-panel">Step Details</div>,
}));

vi.mock('../../../src/features/team-management/components/detail/AddCustomStepModal', () => ({
    AddCustomStepModal: () => <div data-testid="add-custom-step-modal">Add Step</div>,
}));

vi.mock('../../../src/features/team-management/components/detail/MemberDetailDialogs', () => ({
    MemberDetailDialogs: (props: { roleToRemove: ProjectRole | null; onConfirmRoleRemove: (role: ProjectRole) => void }) => (
        <div data-testid="member-detail-dialogs">
            {props.roleToRemove && (
                <button onClick={() => props.onConfirmRoleRemove(props.roleToRemove!)}>
                    Confirm Remove {props.roleToRemove.name}
                </button>
            )}
        </div>
    ),
}));

function createMockUser(overrides: Partial<TeamOverviewUser> = {}): TeamOverviewUser {
    return {
        userId: 'user1',
        firstname: 'Alice',
        lastname: 'Smith',
        roles: [{ id: 'role1', name: 'Backend', description: 'Backend developer' }],
        competencies: [],
        hasFeedback: false,
        projects: [{ id: 'proj1', name: 'Project 1' }],
        ...overrides,
    };
}

const mockRoles: ProjectRole[] = [
    { id: 'role1', name: 'Backend', description: 'Backend developer' },
    { id: 'role2', name: 'Frontend', description: 'Frontend developer' },
];

describe('TeamMemberDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetTeamMember.mockResolvedValue(createMockUser());
        mockGetProjectRoles.mockResolvedValue(mockRoles);
        mockFetchUserCompetencies.mockResolvedValue([]);
        mockGetUserOnboardingPath.mockResolvedValue({
            id: 'path1',
            userId: 'user1',
            createdAt: '',
            phases: [],
        });
        mockGetUserOnboardingFeedback.mockResolvedValue([]);
        mockGetOnboardingTasksByStep.mockResolvedValue([]);
        mockAssignProjectRoleToUser.mockResolvedValue(undefined);
        mockUnassignProjectRoleFromUser.mockResolvedValue(undefined);
        // Roles are held per project now; the modal reads the selected project's set.
        mockGetProjectRolesForUserOnProject.mockResolvedValue([
            { id: 'role1', name: 'Backend', description: 'Backend developer' },
        ]);
        mockAcceptOnboardingSkipRequest.mockResolvedValue(undefined);
        mockDenyOnboardingSkipRequest.mockResolvedValue(undefined);
    });

    it('loads and displays member details', async () => {
        render(<MemoryRouter><TeamMemberDetailPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        expect(mockGetTeamMember).toHaveBeenCalledWith('user1');
        expect(screen.getByText('Backend')).toBeInTheDocument();
    });

    it('opens the roles modal and adds a new role', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><TeamMemberDetailPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Backend'));

        await waitFor(() => {
            expect(screen.getByText('Manage Roles')).toBeInTheDocument();
        });

        // Two comboboxes now: which project, then which role to add on it. A role is held on a
        // project, so the picker is part of the question rather than context around it.
        const roleSelect = screen.getByRole('combobox', { name: /Role to add/i });
        await user.selectOptions(roleSelect, 'role2');

        await user.click(screen.getByRole('button', { name: /Add/ }));

        await waitFor(() => {
            expect(mockAssignProjectRoleToUser).toHaveBeenCalledWith('proj1', 'user1', 'role2');
        });
    });

    it('removes a role through the confirmation dialog', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><TeamMemberDetailPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Backend'));

        await waitFor(() => {
            expect(screen.getByText('Manage Roles')).toBeInTheDocument();
        });

        const removeButton = screen.getByLabelText('Remove Backend');
        await user.click(removeButton);

        await waitFor(() => {
            expect(screen.getByText('Confirm Remove Backend')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Confirm Remove Backend'));

        await waitFor(() => {
            expect(mockUnassignProjectRoleFromUser).toHaveBeenCalledWith('proj1', 'user1', 'role1');
        });
    });

    it('leads with the ledger, not a journey', async () => {
        // Progress is what somebody has proven, not how far through a checklist
        // they are -- the phases view went with the per-user tree (backend#53).
        render(<MemoryRouter><TeamMemberDetailPage /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Competencies held')).toBeInTheDocument();
        });
        expect(screen.queryByText(/skip request/i)).not.toBeInTheDocument();
    });
});
