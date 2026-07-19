import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthGuard } from '../../../src/router/AuthGuard';
import { useAuth } from '../../../src/context/useAuth';
import {
    assessmentService,
    isAssessmentGateSnoozed,
} from '../../../src/services/assessmentService';
import { PermissionGroup, type UserProfile } from '../../../src/services/types';

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../../src/services/assessmentService', () => ({
    assessmentService: {
        fetchAssessmentStatus: vi.fn(),
    },
    isAssessmentGateSnoozed: vi.fn(),
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
                <Route path="/onboarding/assessment" element={<LocationDisplay />} />
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
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({
            completed: true,
        });
        vi.mocked(isAssessmentGateSnoozed).mockReturnValue(false);
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

    it('renders children when the assessment is already completed', async () => {
        authenticatedAs(mockProfile);

        renderGuarded();

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
        expect(assessmentService.fetchAssessmentStatus).toHaveBeenCalled();
    });

    it('redirects a USER to /onboarding/assessment when no completed assessment exists', async () => {
        authenticatedAs(mockProfile);
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({
            completed: false,
        });

        renderGuarded();

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/assessment');
        });
    });

    it('never gates non-USER permission groups on the assessment', async () => {
        authenticatedAs({ ...mockProfile, permissionGroup: PermissionGroup.PM });

        renderGuarded();

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
        expect(assessmentService.fetchAssessmentStatus).not.toHaveBeenCalled();
    });

    it('does not redirect while the assessment gate is snoozed', async () => {
        authenticatedAs(mockProfile);
        vi.mocked(isAssessmentGateSnoozed).mockReturnValue(true);
        vi.mocked(assessmentService.fetchAssessmentStatus).mockResolvedValue({
            completed: false,
        });

        renderGuarded();

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
        expect(assessmentService.fetchAssessmentStatus).not.toHaveBeenCalled();
    });

    it('fails open when the status check errors instead of trapping the user', async () => {
        authenticatedAs(mockProfile);
        vi.mocked(assessmentService.fetchAssessmentStatus).mockRejectedValue(
            new Error('backend down'),
        );

        renderGuarded();

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });
});
