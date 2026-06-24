import { apiClient } from './apiClient';
import teamOverviewMock from '../mocks/teamOverviewMock.json';
import skillsMock from '../mocks/skillsMock.json';
import type {
    ProjectRole,
    Skill,
    TeamOverviewUser,
} from '../features/team-management/types';

let mockUsers = teamOverviewMock.users as TeamOverviewUser[];

let mockProjectRoles: ProjectRole[] = Array.from(
    new Map(
        mockUsers
            .flatMap((user) => user.roles)
            .map((role) => [role.id, role])
    ).values()
);

let mockSkills = skillsMock.skills as Skill[];

export async function getTeamOverview(): Promise<TeamOverviewUser[]> {
    try {
        const response = await apiClient.fetch<{ users: TeamOverviewUser[] }>(
            '/api/v1/onboarding/team-overview'
        );

        return response.users;
    } catch {
        return mockUsers;
    }
}

export async function getTeamMember(
    userId: string
): Promise<TeamOverviewUser | undefined> {
    const users = await getTeamOverview();

    return users.find((user) => user.userId === userId);
}

export async function getProjectRoles(): Promise<ProjectRole[]> {
    try {
        const response = await apiClient.fetch<{
            projectRoles: ProjectRole[];
        }>('/api/v1/projectRoles');

        return response.projectRoles;
    } catch {
        return mockProjectRoles;
    }
}

export async function createProjectRole(
    name: string,
    description: string
): Promise<ProjectRole> {
    try {
        return await apiClient.fetch<ProjectRole>('/api/v1/projectRoles', {
            method: 'POST',
            body: JSON.stringify({
                name,
                description,
            }),
        });
    } catch {
        const newRole: ProjectRole = {
            id: `mock-role-${Date.now()}`,
            name,
            description,
        };

        mockProjectRoles = [...mockProjectRoles, newRole];

        return newRole;
    }
}

export async function assignProjectRoleToUser(
    userId: string,
    roleId: string
): Promise<void> {
    try {
        await apiClient.fetch(`/api/v1/users/${userId}/project-roles`, {
            method: 'POST',
            body: JSON.stringify({
                projectRoleId: roleId,
            }),
        });

        return;
    } catch {
        const role = mockProjectRoles.find(
            (projectRole) => projectRole.id === roleId
        );

        if (!role) return;

        mockUsers = mockUsers.map((user) => {
            if (user.userId !== userId) return user;

            const alreadyAssigned = user.roles.some(
                (userRole) => userRole.id === roleId
            );

            if (alreadyAssigned) return user;

            return {
                ...user,
                roles: [...user.roles, role],
            };
        });
    }
}

export async function unassignProjectRoleFromUser(
    userId: string,
    roleId: string
): Promise<void> {
    try {
        await apiClient.fetch(
            `/api/v1/users/${userId}/project-roles/${roleId}`,
            {
                method: 'DELETE',
            }
        );

        return;
    } catch {
        mockUsers = mockUsers.map((user) => {
            if (user.userId !== userId) return user;

            return {
                ...user,
                roles: user.roles.filter((role) => role.id !== roleId),
            };
        });
    }
}

export async function getSkills(): Promise<Skill[]> {
    try {
        const response = await apiClient.fetch<{ skills?: Skill[]; skill?: Skill[] }>(
            '/api/v1/skills'
        );

        return response.skills ?? response.skill ?? [];
    } catch {
        return mockSkills;
    }
}

export async function createSkill(
    name: string,
    roleId: string
): Promise<Skill> {
    try {
        return await apiClient.fetch<Skill>('/api/v1/skills', {
            method: 'POST',
            body: JSON.stringify({
                name,
                roleId,
            }),
        });
    } catch {
        const newSkill: Skill = {
            id: `mock-skill-${Date.now()}`,
            name,
            roleId,
        };

        mockSkills = [...mockSkills, newSkill];

        return newSkill;
    }
}

export async function deleteProjectRole(roleId: string): Promise<void> {
    try {
        await apiClient.fetch(`/api/v1/projectRoles/${roleId}`, {
            method: 'DELETE',
        });

        return;
    } catch {
        mockProjectRoles = mockProjectRoles.filter(
            (role) => role.id !== roleId
        );

        mockSkills = mockSkills.filter(
            (skill) => skill.roleId !== roleId
        );

        mockUsers = mockUsers.map((user) => ({
            ...user,
            roles: user.roles.filter((role) => role.id !== roleId),
        }));
    }
}

export async function deleteSkill(skillId: string): Promise<void> {
    try {
        await apiClient.fetch(`/api/v1/skills/${skillId}`, {
            method: 'DELETE',
        });

        return;
    } catch {
        mockSkills = mockSkills.filter((skill) => skill.id !== skillId);
    }
}

export async function addRoleToTeamMember(
    userId: string,
    roleId: string
): Promise<void> {
    console.log('add role to member', { userId, roleId });
}

export async function removeRoleFromTeamMember(
    userId: string,
    roleId: string
): Promise<void> {
    console.log('remove role from member', { userId, roleId });
}