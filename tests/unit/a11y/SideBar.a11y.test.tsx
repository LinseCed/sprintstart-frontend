import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { SideBar } from '../../../src/components/layout/SideBar';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../src/components/common/UserAvatar', () => ({
    UserAvatar: () => <svg role="img" aria-label="User Avatar" width="32" height="32" />
}));

vi.mock('../../../src/context/useAuth', () => ({
    useAuth: () => ({
        profile: {
            id: 'user123',
            username: 'Test User',
            email: 'test@example.com',
            permissionGroup: 'ADMIN',
            projectRoles: [],
            profileIcon: 'Test'
        },
        logout: vi.fn(),
        status: 'authenticated'
    })
}));

vi.mock('../../../src/context/useTheme', () => ({
    useTheme: () => ({
        isDarkMode: false,
        toggleTheme: vi.fn()
    })
}));

describe('SideBar Accessibility', () => {
    it('should not have any a11y violations', async () => {
        const { baseElement } = render(
            <MemoryRouter>
                <main>
                    <SideBar />
                </main>
            </MemoryRouter>
        );
        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
