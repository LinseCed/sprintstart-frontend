import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthGuard } from '../../../src/router/AuthGuard';
import { useAuth } from '../../../src/context/useAuth';
import { PermissionGroup, type UserProfile } from '../../../src/services/types';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: vi.fn(),
}));

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
}

const mockProfile: UserProfile = {
    id: 'user1',
    authId: 'auth-1',
    username: 'testuser',
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
    jiraDisplayName: null,
};

function authenticatedAs(profile: UserProfile | null) {
    vi.mocked(useAuth).mockReturnValue({
        status: 'authenticated',
        profile,
        login: vi.fn(),
        logout: vi.fn(),
        refetchProfile: vi.fn(),
    });
}

function renderGuarded(initialPath = '/protected') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/" element={<LocationDisplay />} />
                <Route path="/login" element={<LocationDisplay />} />
                <Route
                    path="/protected"
                    element={
                        <AuthGuard>
                            <div data-testid="protected-content">Protected Content</div>
                        </AuthGuard>
                    }
                />
            </Routes>
        </MemoryRouter>,
    );
}

describe('AuthGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading spinner when status is loading', () => {
        vi.mocked(useAuth).mockReturnValue({
            status: 'loading',
            profile: null,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });

        const { container } = renderGuarded();

        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects to /login if unauthenticated and not on /login', async () => {
        vi.mocked(useAuth).mockReturnValue({
            status: 'unauthenticated',
            profile: null,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });

        renderGuarded();

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/login');
        });
    });

    it('redirects to / if authenticated and on /login', async () => {
        authenticatedAs(mockProfile);

        render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/" element={<LocationDisplay />} />
                    <Route
                        path="/login"
                        element={
                            <AuthGuard>
                                <div>Login Page</div>
                            </AuthGuard>
                        }
                    />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/');
        });
    });

    it('renders children for an authenticated USER without any assessment check', async () => {
        // ⚠️ The assessment does not gate the app: an authenticated hire lands where they
        // navigate, whether or not they have ever taken it. Gating here reintroduces a
        // redirect loop.
        authenticatedAs(mockProfile);

        renderGuarded();

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    function renderAtRoot(profile: UserProfile) {
        authenticatedAs(profile);
        return render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <AuthGuard>
                                <div data-testid="protected-content">Dashboard</div>
                            </AuthGuard>
                        }
                    />
                    <Route path="/buddy" element={<LocationDisplay />} />
                </Routes>
            </MemoryRouter>,
        );
    }

    it('sends a USER landing on the root to the buddy, their onboarding front door', async () => {
        // The buddy *is* the onboarding now: a hire's home is the conversation, not the
        // generic dashboard. Role-based, no network, no assessment — so it can't recreate
        // the retired-gate bug class.
        renderAtRoot(mockProfile);

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/buddy');
        });
    });

    it('does not redirect a USER away from a non-landing route', async () => {
        // The landing redirect fires only from '/', so a hire navigates freely everywhere else.
        authenticatedAs(mockProfile);

        renderGuarded();

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    it('keeps the dashboard as home for non-USER roles', async () => {
        renderAtRoot({ ...mockProfile, permissionGroup: PermissionGroup.PM });

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });
});
