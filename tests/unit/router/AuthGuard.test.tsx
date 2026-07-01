/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthGuard } from '../../../src/router/AuthGuard';
import { useAuth } from '../../../src/context/useAuth';
import type { AuthContextType } from '../../../src/context/useAuth';
import * as teamService from '../../../src/services/teamManagementService';
import type { TeamOverviewUser, Skill } from '../../../src/services/teamManagementService';

vi.unmock('react-router-dom');
vi.unmock('react-router');

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../../src/services/teamManagementService', () => ({
    getSkillAssessmentPromptState: vi.fn(),
    getMyTeamOverview: vi.fn(),
    hasCompletedSkillAssessment: vi.fn(),
    getSkills: vi.fn(),
}));

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
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
        } as unknown as AuthContextType);

        const { container } = render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/protected" element={<AuthGuard><div>Protected</div></AuthGuard>} />
                </Routes>
            </MemoryRouter>
        );

        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
        expect(screen.queryByText('Protected')).not.toBeInTheDocument();
    });

    it('redirects to /login if unauthenticated and not on /login', async () => {
        vi.mocked(useAuth).mockReturnValue({
            status: 'unauthenticated',
            profile: null,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        } as unknown as AuthContextType);

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/login" element={<LocationDisplay />} />
                    <Route path="/protected" element={
                        <AuthGuard>
                            <LocationDisplay />
                        </AuthGuard>
                    } />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/login');
        });
    });

    it('redirects to / if authenticated and on /login', async () => {
        vi.mocked(useAuth).mockReturnValue({
            status: 'authenticated',
            profile: { id: 'user1' } as any,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        } as unknown as AuthContextType);

        vi.mocked(teamService.getMyTeamOverview).mockResolvedValue({
            id: 'teamMember1',
            userId: 'user1',
            roles: [],
        } as unknown as TeamOverviewUser);
        vi.mocked(teamService.getSkills).mockResolvedValue([]);
        vi.mocked(teamService.hasCompletedSkillAssessment).mockResolvedValue(true);

        render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/" element={<LocationDisplay />} />
                    <Route path="/login" element={
                        <AuthGuard>
                            <div>Login Page</div>
                        </AuthGuard>
                    } />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/');
        });
    });

    it('renders children if authenticated and no skill assessment needed', async () => {
        vi.mocked(useAuth).mockReturnValue({
            status: 'authenticated',
            profile: { id: 'user1' } as any,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        } as unknown as AuthContextType);

        vi.mocked(teamService.getMyTeamOverview).mockResolvedValue({
            id: 'teamMember1',
            userId: 'user1',
            roles: [],
        } as unknown as TeamOverviewUser);
        vi.mocked(teamService.getSkills).mockResolvedValue([]);
        vi.mocked(teamService.hasCompletedSkillAssessment).mockResolvedValue(true);
        
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/protected" element={
                        <AuthGuard>
                            <div data-testid="protected-content">Protected Content</div>
                        </AuthGuard>
                    } />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
    });

    it('redirects to /skill-wizard if skill assessment is needed', async () => {
        vi.mocked(useAuth).mockReturnValue({
            status: 'authenticated',
            profile: { id: 'user1' } as any,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        } as unknown as AuthContextType);

        vi.mocked(teamService.getMyTeamOverview).mockResolvedValue({
            id: 'teamMember1',
            userId: 'user1',
            roles: [{ id: 'role1' }],
        } as unknown as TeamOverviewUser);
        vi.mocked(teamService.getSkills).mockResolvedValue([
            { id: 'skill1', roleId: 'role1', name: 'Skill 1', description: '' }
        ] as unknown as Skill[]);
        vi.mocked(teamService.hasCompletedSkillAssessment).mockResolvedValue(false);
        vi.mocked(teamService.getSkillAssessmentPromptState).mockReturnValue(null);
        
        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/skill-wizard" element={<LocationDisplay />} />
                    <Route path="/protected" element={
                        <AuthGuard>
                            <div data-testid="protected-content">Protected Content</div>
                        </AuthGuard>
                    } />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/skill-wizard');
        });
    });
});
