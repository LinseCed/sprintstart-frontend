import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminUserService } from '../../../src/services/adminUserService';
import { apiClient } from '../../../src/services/apiClient';

vi.mock('../../../src/services/apiClient', () => ({
    apiClient: {
        fetch: vi.fn(),
    }
}));

describe('adminUserService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockBackendUser = {
        id: '123',
        authId: 'auth123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        projectRoles: [{ id: 'role1', name: 'Developer' }],
        permissionGroup: 'PM',
        enabled: true,
        profileIcon: null,
        hasCompletedOnboarding: true,
    };

    it('getCurrentUser fetches and maps user correctly', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue(mockBackendUser);
        
        const user = await adminUserService.getCurrentUser();
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/users/me');
        expect(user.id).toBe('123');
        expect(user.permissionGroup).toBe('Project Manager'); // mapped from PM
        expect(user.roles[0].name).toBe('Developer');
    });

    it('getUsers fetches and maps users', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue([mockBackendUser]);
        
        const users = await adminUserService.getUsers();
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/admin/users');
        expect(users.length).toBe(1);
        expect(users[0].username).toBe('testuser');
    });

    it('updateUser sends PATCH request with correct mapped payload', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue(mockBackendUser);
        
        await adminUserService.updateUser('123', {
            firstName: 'New',
            permissionGroup: 'HR'
        });
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/admin/users/123', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: 'New', permissionGroup: 'HR' })
        });
    });

    it('deleteUser sends DELETE request', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue({ id: '123', deleted: true });
        
        const res = await adminUserService.deleteUser('123');
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/admin/users/123', {
            method: 'DELETE'
        });
        expect(res.deleted).toBe(true);
    });

    it('getAvailableRolesFromUsers extracts unique roles and sorts them', () => {
        const users = [
            {
                ...mockBackendUser,
                roles: [
                    { id: 'b', name: 'Beta Role', description: '', type: 'primary' as const },
                    { id: 'a', name: 'Alpha Role', description: '', type: 'primary' as const }
                ],
                projects: [],
                permissionGroup: 'User'
            },
            {
                ...mockBackendUser,
                id: '2',
                roles: [
                    { id: 'b', name: 'Beta Role', description: '', type: 'primary' as const } // Duplicate
                ],
                projects: [],
                permissionGroup: 'User'
            }
        ];

        const roles = adminUserService.getAvailableRolesFromUsers(users as unknown as import('../../../src/services/adminUserService').AdminUser[]);
        
        expect(roles.length).toBe(2);
        // Alpha should be sorted before Beta
        expect(roles[0].name).toBe('Alpha Role');
        expect(roles[1].name).toBe('Beta Role');
    });
});
