import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SideBar } from '../../../../src/components/layout/SideBar';
import * as useAuthHook from '../../../../src/context/useAuth';
import { ThemeProvider } from '../../../../src/context/ThemeProvider';
import { PermissionGroup } from '../../../../src/services/types';
import { humanLoopService } from '../../../../src/services/humanLoopService';
import type { Mentee } from '../../../../src/features/human-loop/types';

vi.mock('../../../../src/context/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../../../src/services/humanLoopService', () => ({
    humanLoopService: { fetchMyMentees: vi.fn().mockResolvedValue([]) },
}));

function menteeWithAlerts(hireId: string, alertCount: number): Mentee {
    return {
        hireId,
        hireName: `Hire ${hireId}`,
        hireGithubLogin: null,
        projectId: 'p1',
        cadenceTargetDays: 7,
        assignedAt: '2026-07-01T00:00:00Z',
        lastContactAt: null,
        daysSinceContact: 3,
        overdue: alertCount > 0,
        alerts: Array.from({ length: alertCount }, () => ({
            reason: 'A pull request has been waiting 3 days for a response',
            severity: 'BLOCKED' as const,
            days: 3,
        })),
    };
}

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
        vi.mocked(humanLoopService.fetchMyMentees).mockResolvedValue([]);
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

    it('badges the Dashboard link with the count of mentees needing a check-in', async () => {
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            status: 'authenticated',
            profile: mockProfile,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });
        // Two mentees returned, but only one has something outstanding — the badge counts moves,
        // not mentees.
        vi.mocked(humanLoopService.fetchMyMentees).mockResolvedValue([
            menteeWithAlerts('h1', 2),
            menteeWithAlerts('h2', 0),
        ]);

        renderWithProviders(<SideBar />);

        // Rendered in both the desktop and mobile copies of the nav.
        const badges = await screen.findAllByLabelText('1 mentee needs a check-in');
        expect(badges.length).toBeGreaterThan(0);
        expect(badges[0]).toHaveTextContent('1');
    });

    it('shows no mentee badge when nothing is outstanding', async () => {
        vi.mocked(useAuthHook.useAuth).mockReturnValue({
            status: 'authenticated',
            profile: mockProfile,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });
        vi.mocked(humanLoopService.fetchMyMentees).mockResolvedValue([menteeWithAlerts('h1', 0)]);

        renderWithProviders(<SideBar />);

        await screen.findAllByText('Dashboard');
        expect(screen.queryByLabelText(/check-in/i)).not.toBeInTheDocument();
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
