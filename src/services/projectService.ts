// ============================================================
// projectService.ts
// ============================================================

import { apiClient } from "./apiClient";
import projectMock from "../mocks/projectMock.json";

const USE_PROJECT_MOCKS = true;
const MOCK_DELAY_MS = 180;

export type GlobalUserRole = "ADMIN" | "USER" | (string & {});

export type ProjectRole = "MEMBER" | "MANAGER" | "TEAMLEAD" | (string & {});

export type ProjectSourceType =
    | "GITHUB"
    | "JIRA"
    | "SONARQUBE"
    | "UPLOAD"
    | (string & {});

export type ProjectSourceStatus =
    | "CONNECTED"
    | "DISCONNECTED"
    | "INDEXING"
    | "ERROR"
    | (string & {});

export type ProjectSource = {
    id: string;
    name: string;
    type: ProjectSourceType;
    status: ProjectSourceStatus;
};

export type ProjectUserSummary = {
    id: string;
    username: string;
    email: string;

    /**
     * Project-specific roles are only valid in a project context.
     */
    projectRoles: ProjectRole[];
};

export type ProjectUser = {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;

    /**
     * Global application roles, for example ADMIN or USER.
     */
    roles: GlobalUserRole[];

    /**
     * Project-specific access roles for this exact project.
     */
    projectRoles: ProjectRole[];

    enabled: boolean;
};

export type AdminProject = {
    id: string;
    name: string;
    description: string;
    tags?: string[];
    sources: ProjectSource[];
    users: ProjectUserSummary[];
};

export type AdminProjectDetails = Omit<AdminProject, "users"> & {
    users: ProjectUser[];
};

export type CreateProjectRequest = {
    name: string;
    description?: string;
    tags?: string[];
};

export type UpdateProjectRequest = {
    name?: string;
    description?: string;
    tags?: string[];
};

export type AssignProjectUsersRequest = {
    userIds: string[];

    /**
     * Optional because the original endpoint only required userIds.
     * If omitted, the mock assigns MEMBER by default.
     */
    projectRoles?: ProjectRole[];
};

type MockAdminUser = {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    firstname?: string;
    lastname?: string;
    roles?: unknown[];
    permissionGroup?: string;
    enabled?: boolean;
};

type ProjectMock = {
    adminProjects: AdminProject[];
    adminUsers?: MockAdminUser[];
};

const mock = projectMock as ProjectMock;

let mockProjects: AdminProject[] = clone(mock.adminProjects ?? []);
let mockUsers: MockAdminUser[] = clone(mock.adminUsers ?? []);

function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clone<T>(value: T): T {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
}

async function withMockDelay<T>(value: T): Promise<T> {
    await wait(MOCK_DELAY_MS);
    return clone(value);
}

function createMockId(prefix: string): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeGlobalRoles(user?: MockAdminUser): GlobalUserRole[] {
    if (!user) {
        return ["USER"];
    }

    if (user.permissionGroup) {
        return [user.permissionGroup.toUpperCase() as GlobalUserRole];
    }

    if (!Array.isArray(user.roles)) {
        return ["USER"];
    }

    const stringRoles = user.roles.filter(
        (role): role is string => typeof role === "string",
    );

    if (stringRoles.length > 0) {
        return stringRoles.map((role) => role.toUpperCase() as GlobalUserRole);
    }

    return ["USER"];
}

function getMockProjectById(projectId: string): AdminProject {
    const project = mockProjects.find((candidate) => candidate.id === projectId);

    if (!project) {
        throw new Error(`Project with id "${projectId}" was not found.`);
    }

    return project;
}

function getMockUserById(userId: string): MockAdminUser {
    const user = mockUsers.find((candidate) => candidate.id === userId);

    if (!user) {
        throw new Error(`User with id "${userId}" was not found.`);
    }

    return user;
}

function findMockUserById(userId: string): MockAdminUser | undefined {
    return mockUsers.find((candidate) => candidate.id === userId);
}

function getFallbackNameParts(userSummary: ProjectUserSummary) {
    const usernameParts = userSummary.username
        .split(".")
        .map((part) => part.trim())
        .filter(Boolean);

    if (usernameParts.length >= 2) {
        return {
            firstName: capitalize(usernameParts[0]),
            lastName: capitalize(usernameParts.slice(1).join(" ")),
        };
    }

    return {
        firstName: "",
        lastName: "",
    };
}

function capitalize(value: string): string {
    if (!value) return value;

    return value.charAt(0).toUpperCase() + value.slice(1);
}

function toProjectUser(userSummary: ProjectUserSummary): ProjectUser {
    const user = findMockUserById(userSummary.id);
    const fallbackNameParts = getFallbackNameParts(userSummary);

    return {
        id: userSummary.id,
        username: user?.username ?? userSummary.username,
        email: user?.email ?? userSummary.email,
        firstName:
            user?.firstName ??
            user?.firstname ??
            fallbackNameParts.firstName,
        lastName:
            user?.lastName ??
            user?.lastname ??
            fallbackNameParts.lastName,
        roles: normalizeGlobalRoles(user),
        projectRoles: userSummary.projectRoles,
        enabled: user?.enabled ?? true,
    };
}

function toProjectDetails(project: AdminProject): AdminProjectDetails {
    return {
        ...project,
        tags: project.tags ?? [],
        users: project.users.map(toProjectUser),
    };
}

function toProjectUserSummary(
    user: MockAdminUser,
    projectRoles: ProjectRole[],
): ProjectUserSummary {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        projectRoles,
    };
}

export const projectService = {
    /**
     * GET /api/v1/admin/projects
     *
     * Returns all projects, including metadata, connected sources
     * and assigned project users.
     */
    async getProjects(): Promise<AdminProject[]> {
        if (USE_PROJECT_MOCKS) {
            return withMockDelay(mockProjects);
        }

        return apiClient.fetch<AdminProject[]>("/api/v1/admin/projects");
    },

    /**
     * GET /api/v1/admin/projects/{id}
     *
     * Returns detailed information for a specific project.
     */
    async getProjectById(projectId: string): Promise<AdminProjectDetails> {
        if (USE_PROJECT_MOCKS) {
            return withMockDelay(toProjectDetails(getMockProjectById(projectId)));
        }

        return apiClient.fetch<AdminProjectDetails>(
            `/api/v1/admin/projects/${projectId}`,
        );
    },

    /**
     * POST /api/v1/admin/projects
     *
     * Request body:
     * {
     *   name: "SprintStart Frontend",
     *   description: "Frontend web application for SprintStart",
     *   tags: ["Frontend", "React"]
     * }
     */
    async createProject(
        request: CreateProjectRequest,
    ): Promise<AdminProjectDetails> {
        if (USE_PROJECT_MOCKS) {
            const createdProject: AdminProject = {
                id: createMockId("project"),
                name: request.name,
                description: request.description ?? "",
                tags: request.tags ?? [],
                sources: [],
                users: [],
            };

            mockProjects = [createdProject, ...mockProjects];

            return withMockDelay(toProjectDetails(createdProject));
        }

        return apiClient.fetch<AdminProjectDetails>("/api/v1/admin/projects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        });
    },

    /**
     * PATCH /api/v1/admin/projects/{projectId}
     *
     * Request body:
     * {
     *   name: "SprintStart Frontend",
     *   description: "Updated frontend web application description",
     *   tags: ["Frontend", "React"]
     * }
     */
    async updateProject(
        projectId: string,
        request: UpdateProjectRequest,
    ): Promise<AdminProjectDetails> {
        if (USE_PROJECT_MOCKS) {
            const project = getMockProjectById(projectId);

            const updatedProject: AdminProject = {
                ...project,
                name: request.name ?? project.name,
                description: request.description ?? project.description,
                tags: request.tags ?? project.tags ?? [],
            };

            mockProjects = mockProjects.map((candidate) =>
                candidate.id === projectId ? updatedProject : candidate,
            );

            return withMockDelay(toProjectDetails(updatedProject));
        }

        return apiClient.fetch<AdminProjectDetails>(
            `/api/v1/admin/projects/${projectId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            },
        );
    },

    /**
     * DELETE /api/v1/admin/projects/{projectId}
     *
     * Successful deletion should return 204 No Content.
     */
    async deleteProject(projectId: string): Promise<void> {
        if (USE_PROJECT_MOCKS) {
            getMockProjectById(projectId);

            mockProjects = mockProjects.filter(
                (candidate) => candidate.id !== projectId,
            );

            await wait(MOCK_DELAY_MS);
            return;
        }

        await apiClient.fetch<void>(`/api/v1/admin/projects/${projectId}`, {
            method: "DELETE",
        });
    },

    /**
     * GET /api/v1/admin/projects/{projectId}/users
     *
     * Returns all users assigned to a specific project.
     * projectRoles are included here because this response is project-specific.
     */
    async getProjectUsers(projectId: string): Promise<ProjectUser[]> {
        if (USE_PROJECT_MOCKS) {
            const project = getMockProjectById(projectId);

            return withMockDelay(project.users.map(toProjectUser));
        }

        return apiClient.fetch<ProjectUser[]>(
            `/api/v1/admin/projects/${projectId}/users`,
        );
    },

    /**
     * POST /api/v1/admin/projects/{projectId}/users
     *
     * Request body:
     * {
     *   userIds: ["user-uuid-1", "user-uuid-2"],
     *   projectRoles: ["MEMBER"]
     * }
     *
     * projectRoles is optional in this frontend type because the original
     * endpoint only required userIds. The mock uses MEMBER as default.
     */
    async assignUsersToProject(
        projectId: string,
        request: AssignProjectUsersRequest,
    ): Promise<ProjectUser[]> {
        if (USE_PROJECT_MOCKS) {
            const project = getMockProjectById(projectId);
            const projectRoles = request.projectRoles ?? ["MEMBER"];

            const nextUsers = [...project.users];

            request.userIds.forEach((userId) => {
                const user = getMockUserById(userId);
                const existingIndex = nextUsers.findIndex(
                    (candidate) => candidate.id === userId,
                );

                const userSummary = toProjectUserSummary(user, projectRoles);

                if (existingIndex >= 0) {
                    nextUsers[existingIndex] = userSummary;
                    return;
                }

                nextUsers.push(userSummary);
            });

            const updatedProject: AdminProject = {
                ...project,
                users: nextUsers,
            };

            mockProjects = mockProjects.map((candidate) =>
                candidate.id === projectId ? updatedProject : candidate,
            );

            return withMockDelay(updatedProject.users.map(toProjectUser));
        }

        await apiClient.fetch<void>(
            `/api/v1/admin/projects/${projectId}/users`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            },
        );

        return projectService.getProjectUsers(projectId);
    },

    /**
     * DELETE /api/v1/admin/projects/{projectId}/users/{userId}
     *
     * Successful removal should return 204 No Content.
     * No response body like { removed: true } is expected.
     */
    async removeUserFromProject(
        projectId: string,
        userId: string,
    ): Promise<void> {
        if (USE_PROJECT_MOCKS) {
            const project = getMockProjectById(projectId);

            const hasAssignment = project.users.some((user) => user.id === userId);

            if (!hasAssignment) {
                throw new Error(
                    `User with id "${userId}" is not assigned to project "${projectId}".`,
                );
            }

            const updatedProject: AdminProject = {
                ...project,
                users: project.users.filter((user) => user.id !== userId),
            };

            mockProjects = mockProjects.map((candidate) =>
                candidate.id === projectId ? updatedProject : candidate,
            );

            await wait(MOCK_DELAY_MS);
            return;
        }

        await apiClient.fetch<void>(
            `/api/v1/admin/projects/${projectId}/users/${userId}`,
            {
                method: "DELETE",
            },
        );
    },

    /**
     * Frontend helper only.
     *
     * Useful for tests or for resetting the local mock state after creating,
     * updating or deleting projects while USE_PROJECT_MOCKS is enabled.
     */
    resetProjectMocks(): void {
        mockProjects = clone(mock.adminProjects ?? []);
        mockUsers = clone(mock.adminUsers ?? []);
    },
};
