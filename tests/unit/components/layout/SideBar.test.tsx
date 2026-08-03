import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SideBar } from '../../../../src/components/layout/SideBar';
import * as useAuthHook from '../../../../src/context/useAuth';
import { ThemeProvider } from '../../../../src/context/ThemeProvider';
import { PermissionGroup } from '../../../../src/services/types';

vi.mock('../../../../src/features/projects/useProjectContext', async () => {
    const { createProjectContextValue, createSelectableProject } = await import('../../setup/projectContext');
    const project = createSelectableProject({ id: 'proj1' });
    return {
        useProjectContext: () =>
            createProjectContextValue({
                projects: [project],
                selectedProject: project,
                selectedProjectId: 'proj1',
                canManageSelected: true,
            }),
    };
});

vi.mock('../../../../src/context/useAuth', () => ({
    useAuth: vi.fn(),
}));

const mockProfile = {
    id: '1',
    authId: 'auth',
    username: 'TestUser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    projectRoles: [],
    projectIds: [],
    permissionGroup: PermissionGroup.USER,
    enabled: true,
    profileIcon: null,
    hasCompletedOnboarding: true,
    githubLogin: null,
    githubLoginSource: null,
    githubLoginVerification: null,
    githubLoginVerifiedAt: null,
};

function renderWithProviders(ui: React.ReactElement) {
    return render(
        <MemoryRouter>
            <ThemeProvider>{ui}</ThemeProvider>
        </MemoryRouter>,
    );
}

describe('SideBar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        document.documentElement.className = '';
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
            })),
        });
    });

    it('renders basic nav items for regular user', () => {
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            status: 'authenticated',
            profile: mockProfile,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });

        renderWithProviders(<SideBar />);

        expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
        expect(screen.queryByText('Access Management')).not.toBeInTheDocument();
    });

    it('makes the buddy the onboarding nav item — First Week and Where I stand are retired', () => {
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            status: 'authenticated',
            profile: mockProfile,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });

        renderWithProviders(<SideBar />);

        // Desktop and mobile copies both render, hence getAllBy*.
        expect(screen.getAllByText('Buddy').length).toBeGreaterThan(0);
        expect(screen.queryByText('Onboarding')).not.toBeInTheDocument();
        expect(screen.queryByText('Where I stand')).not.toBeInTheDocument();
    });

    it('renders admin nav items for admin user', () => {
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            status: 'authenticated',
            profile: { ...mockProfile, permissionGroup: PermissionGroup.ADMIN },
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });

        renderWithProviders(<SideBar />);

        expect(screen.getAllByText('Access Management').length).toBeGreaterThan(0);
    });

    it('handles mobile sidebar toggling', async () => {
        const user = userEvent.setup();
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            status: 'authenticated',
            profile: mockProfile,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });

        renderWithProviders(<SideBar />);

        await user.click(screen.getByLabelText('Open sidebar'));

        expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
        expect(screen.getByLabelText('Close sidebar overlay')).toBeInTheDocument();
    });
});
