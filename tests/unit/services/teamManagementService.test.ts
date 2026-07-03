import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getTeamOverview,
    getTeamMember,
    getProjectRoles,
    createProjectRole,
    assignProjectRoleToUser,
} from '../../../src/services/teamManagementService';
import { http, HttpResponse } from 'msw';
import { server } from '../../unit/setup/vitest.setup';

describe('teamManagementService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getTeamOverview returns team users from API', async () => {
        const overview = await getTeamOverview();
        expect(overview.length).toBeGreaterThan(0);
        expect(overview[0].firstname).toBe('Alice');
    });

    it('getTeamMember finds a user by ID', async () => {
        const member = await getTeamMember('user1');
        expect(member).not.toBeNull();
        expect(member?.userId).toBe('user1');
    });

    it('getProjectRoles returns project roles', async () => {
        server.use(
            http.get('/api/v1/projectRoles', () =>
                HttpResponse.json([{ id: 'role1', name: 'Developer' }]),
            ),
        );

        const roles = await getProjectRoles();
        expect(roles).toHaveLength(1);
        expect(roles[0].name).toBe('Developer');
    });

    it('createProjectRole posts to backend and returns the new role', async () => {
        server.use(
            http.post('/api/v1/projectRoles', async ({ request }) => {
                const body = (await request.json()) as { name: string; description: string };
                return HttpResponse.json({
                    id: 'new-role-1',
                    name: body.name,
                    description: body.description,
                });
            }),
        );

        const newRole = await createProjectRole('Tester', 'QA');
        expect(newRole.name).toBe('Tester');
        expect(newRole.id).toBe('new-role-1');
    });

    it('assignProjectRoleToUser sends request to backend', async () => {
        let captured = false;
        server.use(
            http.post('/api/v1/users/user1/project-roles', () => {
                captured = true;
                return new HttpResponse(null, { status: 200 });
            }),
        );

        await assignProjectRoleToUser('user1', 'role1');
        expect(captured).toBe(true);
    });
});
