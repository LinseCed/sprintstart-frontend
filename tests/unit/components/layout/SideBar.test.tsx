import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SideBar } from '../../../../src/components/layout/SideBar';
import * as useAuthHook from '../../../../src/context/useAuth';
import * as useThemeHook from '../../../../src/context/useTheme';
import { PermissionGroup } from '../../../../src/services/types';

describe('SideBar', () => {
    const mockProfile = {
        id: '1',
        authId: 'auth',
        username: 'TestUser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        projectRoles: [],
        permissionGroup: PermissionGroup.USER, // regular user
        enabled: true,
        profileIcon: null,
        hasCompletedOnboarding: true,
    };

    it('renders basic nav items for regular user', () => {
        vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
            status: 'authenticated',
            profile: mockProfile,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });
        vi.spyOn(useThemeHook, 'useTheme').mockReturnValue({
            theme: 'light',
            isDarkMode: false,
            toggleTheme: vi.fn(),
        });

        render(
            <MemoryRouter>
                <SideBar />
            </MemoryRouter>
        );

        const dashboardLinks = screen.getAllByText('Dashboard');
        expect(dashboardLinks.length).toBeGreaterThan(0);
        expect(screen.queryByText('Access Management')).not.toBeInTheDocument();
    });

    it('renders admin nav items for admin user', () => {
        vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
            status: 'authenticated',
            profile: { ...mockProfile, permissionGroup: PermissionGroup.ADMIN },
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });
        vi.spyOn(useThemeHook, 'useTheme').mockReturnValue({
            theme: 'light',
            isDarkMode: false,
            toggleTheme: vi.fn(),
        });

        render(
            <MemoryRouter>
                <SideBar />
            </MemoryRouter>
        );

        expect(screen.getAllByText('Access Management').length).toBeGreaterThan(0);
    });

    it('handles mobile sidebar toggling', () => {
        vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
            status: 'authenticated',
            profile: mockProfile,
            login: vi.fn(),
            logout: vi.fn(),
            refetchProfile: vi.fn(),
        });
        vi.spyOn(useThemeHook, 'useTheme').mockReturnValue({
            theme: 'light',
            isDarkMode: false,
            toggleTheme: vi.fn(),
        });

        render(
            <MemoryRouter>
                <SideBar />
            </MemoryRouter>
        );

        const openButton = screen.getByLabelText('Open sidebar');
        fireEvent.click(openButton);

        expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
        expect(screen.getByLabelText('Close sidebar overlay')).toBeInTheDocument();
    });
});
