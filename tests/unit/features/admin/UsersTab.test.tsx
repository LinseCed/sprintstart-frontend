/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UsersTab } from '../../../../src/features/admin/components/UsersTab';

describe('UsersTab', () => {
    const mockUsers = [
        {
            id: '1',
            username: 'user1',
            email: 'user1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            roles: [],
            permissionGroup: 'Admin',
            projects: [],
            enabled: true,
            profileIcon: '',
            hasCompletedOnboarding: true,
        },
        {
            id: '2',
            username: 'user2',
            email: 'user2@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            roles: [],
            permissionGroup: 'User',
            projects: [],
            enabled: false,
            profileIcon: '',
            hasCompletedOnboarding: true,
        }
    ];

    const defaultProps = {
        paginatedUsers: mockUsers as any,
        selectedUserIds: new Set<string>(),
        allVisibleUsersSelected: false,
        openUserMenuId: null,
        onToggleAllVisibleUsers: vi.fn(),
        onToggleUserSelection: vi.fn(),
        onOpenUserDetails: vi.fn(),
        onToggleUserContextMenu: vi.fn(),
        onOpenUserDetailsFromMenu: vi.fn(),
        onRequestUserDeleteFromMenu: vi.fn(),
    };

    it('renders empty state if no users provided', () => {
        render(<UsersTab {...defaultProps} paginatedUsers={[]} />);
        expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('renders user list', () => {
        render(<UsersTab {...defaultProps} />);
        
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
        expect(screen.getAllByText('user1@example.com').length).toBeGreaterThan(0);
    });

    it('calls onToggleUserSelection when checkbox is clicked', () => {
        render(<UsersTab {...defaultProps} />);
        
        // The SelectionCheckbox might not be directly queryable by role="checkbox" depending on its implementation,
        // but it has ariaLabel="Select John Doe".
        const checkbox = screen.getAllByLabelText('Select John Doe')[0];
        fireEvent.click(checkbox);
        
        expect(defaultProps.onToggleUserSelection).toHaveBeenCalledWith('1');
    });

    it('calls onOpenUserDetails when row is clicked', () => {
        render(<UsersTab {...defaultProps} />);
        
        // Find the row for user1, which has a role="button"
        const rows = screen.getAllByRole('button').filter(el => el.textContent?.includes('John Doe'));
        
        // Click the first one (desktop view)
        fireEvent.click(rows[0]);
        
        expect(defaultProps.onOpenUserDetails).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('renders and interacts with the context menu correctly', () => {
        render(<UsersTab {...defaultProps} openUserMenuId="1" />);
        expect(screen.getAllByText('Open details').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);

        const deleteBtn = screen.getAllByText('Delete')[0];
        fireEvent.click(deleteBtn);
        
        expect(defaultProps.onRequestUserDeleteFromMenu).toHaveBeenCalled();
    });
});
