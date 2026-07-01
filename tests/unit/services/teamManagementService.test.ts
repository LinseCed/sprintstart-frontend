import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    getTeamOverview, 
    getTeamMember, 
    getProjectRoles, 
    createProjectRole,
    assignProjectRoleToUser 
} from '../../../src/services/teamManagementService';
import { apiClient } from '../../../src/services/apiClient';

vi.mock('../../../src/services/apiClient', () => ({
    apiClient: {
        fetch: vi.fn(),
    }
}));

describe('teamManagementService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear module state if possible, though it uses in-memory mock data
        // For testing, we rely on checking how it interacts with the apiClient
    });

    it('getTeamOverview fetches from backend and falls back to mocks on 404', async () => {
        vi.mocked(apiClient.fetch).mockRejectedValue({ status: 404 });
        
        const overview = await getTeamOverview();
        
        // Ensure the API was called
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/onboarding/team-overview?size=100');
        // Ensure we get mock data back (should have at least a few users)
        expect(overview.length).toBeGreaterThan(0);
    });

    it('getTeamMember fetches from backend and falls back to mocks', async () => {
        vi.mocked(apiClient.fetch).mockRejectedValueOnce({ status: 404 });
        
        const member = await getTeamMember('7faae48c-f9f2-4e85-899f-7c5fca87d371');
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/onboarding/team-overview?size=100');
        expect(member).not.toBeNull();
        expect(member?.userId).toBe('7faae48c-f9f2-4e85-899f-7c5fca87d371');
    });

    it('getProjectRoles fetches from backend successfully', async () => {
        const mockRoles = [{ id: 'role1', name: 'Developer' }];
        vi.mocked(apiClient.fetch).mockResolvedValue(mockRoles);
        
        const roles = await getProjectRoles();
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/projectRoles');
        expect(roles).toEqual(mockRoles);
    });

    it('createProjectRole posts to backend and updates mock list on fallback', async () => {
        // Fallback scenario
        vi.mocked(apiClient.fetch).mockRejectedValue(new Error('Not found'));
        
        const newRole = await createProjectRole('Tester', 'QA');
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/projectRoles', {
            method: 'POST',
            body: JSON.stringify({ name: 'Tester', description: 'QA' })
        });
        
        expect(newRole.id).toMatch(/^mock-role-/);
        expect(newRole.name).toBe('Tester');
    });

    it('assignProjectRoleToUser sends PUT to backend', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue({});
        
        await assignProjectRoleToUser('user1', 'role1');
        
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/users/user1/project-roles', {
            method: 'POST',
            body: JSON.stringify({ roleId: 'role1' })
        });
    });
});
