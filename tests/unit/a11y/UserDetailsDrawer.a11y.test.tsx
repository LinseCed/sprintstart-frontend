import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { UserDetailsDrawer } from '../../../src/features/admin/components/UserDetailsDrawer';
import type { AdminUser } from '../../../src/features/admin/types';

const adminUser: AdminUser = {
    id: 'user-1',
    authId: 'auth-1',
    username: 'john.doe',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: [{ id: 'role-dev', name: 'Developer', description: '', type: 'primary' }],
    permissionGroup: 'User',
    projects: [],
    enabled: true,
    profileIcon: '',
    hasCompletedOnboarding: true,
};

describe('UserDetailsDrawer Accessibility', () => {
    it('has no axe violations in read and edit mode', async () => {
        const user = userEvent.setup();
        const { baseElement } = render(
            <UserDetailsDrawer
                user={adminUser}
                availableProjects={[]}
                isOpen
                onClose={vi.fn()}
                onOpenProjectDetails={vi.fn()}
                onUserUpdated={vi.fn()}
                onRequestDelete={vi.fn()}
            />,
        );

        expect(screen.getByRole('dialog', { name: 'John Doe' })).toBeInTheDocument();
        expect(await axe(baseElement)).toHaveNoViolations();

        await user.click(screen.getByRole('button', { name: 'Edit User' }));

        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(await axe(baseElement)).toHaveNoViolations();
    });
});
