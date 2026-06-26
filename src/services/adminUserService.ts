// ============================================================
// adminUserService.ts
// ============================================================
//
// Mock-first service for the Admin Page.
//
// Put adminPageMock.json in:
//   src/mocks/adminPageMock.json
//
// Ownership boundary based on the latest API discussion:
//
// Keycloak-owned but exposed through SprintStart backend orchestration:
// - username
// - email
// - firstName
// - lastName
// - permissionGroup
// - enabled / disabled
// - delete user
//
// SprintStart-owned:
// - roles = project-related working areas
// - projects
// - profileIcon
// - hasCompletedOnboarding
//
// Password flows are intentionally not part of this service.
// Password change, reset and initial setup should stay inside Keycloak flows.

import { apiClient } from "./apiClient";
import adminPageMock from "../mocks/adminPageMock.json";

const USE_ADMIN_PAGE_MOCKS = import.meta.env.VITE_USE_ADMIN_PAGE_MOCKS === "true";
const MOCK_DELAY_MS = 180;

type BackendPermissionGroup = "ADMIN" | "HR" | "PM" | "USER";

type BackendUserResponse = {
    id: string;
    authId: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    workingArea: string;
    permissionGroup: BackendPermissionGroup;
    enabled: boolean;
    profileIcon: string | null;
    hasCompletedOnboarding: boolean;
};

export type RoleType = "primary" | "secondary";

export type UserRole = {
    id: string;
    name: string;
    description: string;
    type: RoleType;
};

export type RoleAssignment = {
    id: string;
    type: RoleType;
};

export type ProjectSummary = {
    id: string;
    name: string;
};

export type UserProfile = {
    id: string;
    authId: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
    permissionGroup: string;
    projects: ProjectSummary[];
    enabled: boolean;
    profileIcon: string;
    hasCompletedOnboarding: boolean;
};

export type AdminUser = {
    id: string;
    authId?: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
    permissionGroup: string;
    projects: ProjectSummary[];
    enabled: boolean;
    profileIcon: string;
    hasCompletedOnboarding: boolean;
};

export type UpdateAdminUserRequest = {
    email?: string;
    firstName?: string;
    lastName?: string;
    permissionGroup?: string;
};

export type UpdateAdminUserRolesRequest = {
    roles: RoleAssignment[];
};

export type UpdateAdminUserEnabledRequest = {
    enabled: boolean;
};

export type DeleteAdminUserResponse = {
    id: string;
    deleted: boolean;
};

export type AvailableRole = {
    id: string;
    name: string;
    description: string;
};

type AdminPageMock = {
    usersMe: UserProfile;
    adminUsers: AdminUser[];
};

const mock = adminPageMock as AdminPageMock;
let mockAdminUsers: AdminUser[] = clone(mock.adminUsers);

function wait(ms: number) {
    return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
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

function getMockUserById(userId: string): AdminUser {
    const user = mockAdminUsers.find((candidate) => candidate.id === userId);

    if (!user) {
        throw new Error(`User with id "${userId}" was not found.`);
    }

    return user;
}

function updateMockUser(userId: string, patch: Partial<AdminUser>): AdminUser {
    const user = getMockUserById(userId);

    const updatedUser: AdminUser = {
        ...user,
        ...patch,
    };

    mockAdminUsers = mockAdminUsers.map((candidate) =>
        candidate.id === userId ? updatedUser : candidate,
    );

    return updatedUser;
}

function getAvailableRolesFromUsers(users: AdminUser[]): AvailableRole[] {
    const roleMap = new Map<string, AvailableRole>();

    users.forEach((user) => {
        user.roles.forEach((role) => {
            if (!roleMap.has(role.id)) {
                roleMap.set(role.id, {
                    id: role.id,
                    name: role.name,
                    description: role.description,
                });
            }
        });
    });

    return Array.from(roleMap.values()).sort((left, right) =>
        left.name.localeCompare(right.name),
    );
}

function toUserRole(assignment: RoleAssignment): UserRole {
    const availableRole = getAvailableRolesFromUsers(mockAdminUsers).find(
        (role) => role.id === assignment.id,
    );

    return {
        id: assignment.id,
        name: availableRole?.name ?? assignment.id,
        description: availableRole?.description ?? "",
        type: assignment.type,
    };
}

function toPermissionGroupLabel(permissionGroup: string): string {
    switch (permissionGroup.trim().toUpperCase()) {
        case "PM":
        case "PROJECT_MANAGER":
        case "PROJECT MANAGER":
            return "Project Manager";
        case "HR":
            return "HR";
        case "ADMIN":
            return "Admin";
        case "USER":
        default:
            return "User";
    }
}

function toBackendPermissionGroup(permissionGroup: string): BackendPermissionGroup {
    switch (permissionGroup.trim().toUpperCase()) {
        case "ADMIN":
            return "ADMIN";
        case "HR":
            return "HR";
        case "PM":
        case "PROJECT_MANAGER":
        case "PROJECT MANAGER":
            return "PM";
        case "USER":
        default:
            return "USER";
    }
}

function toUserRoleFromWorkingArea(workingArea: string): UserRole[] {
    if (workingArea === "NO_WORKING_AREA") {
        return [];
    }

    const name = workingArea
        .split("_")
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(" ");

    return [
        {
            id: `working-area-${workingArea.toLowerCase().replaceAll("_", "-")}`,
            name,
            description: "Assigned working area",
            type: "primary",
        },
    ];
}

function toAdminUser(user: BackendUserResponse): AdminUser {
    return {
        id: user.id,
        authId: user.authId,
        username: user.username,
        email: user.email ?? "",
        firstName: user.firstName,
        lastName: user.lastName,
        roles: toUserRoleFromWorkingArea(user.workingArea),
        permissionGroup: toPermissionGroupLabel(user.permissionGroup),
        projects: [],
        enabled: user.enabled,
        profileIcon: user.profileIcon ?? "",
        hasCompletedOnboarding: user.hasCompletedOnboarding,
    };
}

function toUserProfile(user: BackendUserResponse): UserProfile {
    return {
        ...toAdminUser(user),
        authId: user.authId,
    };
}

function toBackendUpdateRequest(request: UpdateAdminUserRequest) {
    return {
        ...request,
        permissionGroup: request.permissionGroup
            ? toBackendPermissionGroup(request.permissionGroup)
            : undefined,
    };
}

export const adminUserService = {
    /**
     * GET /api/v1/users/me
     *
     * Returns the currently authenticated user.
     * This is a combined response containing Keycloak-owned data and
     * SprintStart-owned data.
     */
    async getCurrentUser(): Promise<UserProfile> {
        if (USE_ADMIN_PAGE_MOCKS) {
            return withMockDelay(mock.usersMe);
        }

        const user = await apiClient.fetch<BackendUserResponse>("/api/v1/users/me");
        return toUserProfile(user);
    },

    /**
     * GET /api/v1/admin/users
     *
     * Returns all users visible for admin user management.
     */
    async getUsers(): Promise<AdminUser[]> {
        if (USE_ADMIN_PAGE_MOCKS) {
            return withMockDelay(mockAdminUsers);
        }

        const users = await apiClient.fetch<BackendUserResponse[]>("/api/v1/admin/users");
        return users.map(toAdminUser);
    },

    /**
     * GET /api/v1/admin/users/{id}
     *
     * Returns detailed information for a specific user.
     */
    async getUserById(userId: string): Promise<AdminUser> {
        if (USE_ADMIN_PAGE_MOCKS) {
            return withMockDelay(getMockUserById(userId));
        }

        const user = await apiClient.fetch<BackendUserResponse>(
            `/api/v1/admin/users/${userId}`,
        );
        return toAdminUser(user);
    },

    /**
     * PATCH /api/v1/admin/users/{id}
     *
     * Updates admin-editable user fields through the SprintStart backend.
     * The backend may forward Keycloak-owned changes to Keycloak.
     *
     * Password fields are intentionally excluded.
     *
     * Request body:
     * {
     *   email?: "max.mustermann@example.com",
     *   firstName?: "Max",
     *   lastName?: "Mustermann",
     *   permissionGroup?: "USER"
     * }
     */
    async updateUser(
        userId: string,
        request: UpdateAdminUserRequest,
    ): Promise<AdminUser> {
        if (USE_ADMIN_PAGE_MOCKS) {
            const updatedUser = updateMockUser(userId, request);
            return withMockDelay(updatedUser);
        }

        const updatedUser = await apiClient.fetch<BackendUserResponse>(
            `/api/v1/admin/users/${userId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(toBackendUpdateRequest(request)),
            },
        );

        return toAdminUser(updatedUser);
    },

    /**
     * PATCH /api/v1/admin/users/{id}/roles
     *
     * Updates SprintStart-owned project-related working areas.
     *
     * Request body:
     * {
     *   roles: [
     *     { id: "role-backend-developer", type: "primary" },
     *     { id: "role-frontend-developer", type: "secondary" }
     *   ]
     * }
     */
    async updateUserRoles(
        userId: string,
        request: UpdateAdminUserRolesRequest,
    ): Promise<AdminUser> {
        if (USE_ADMIN_PAGE_MOCKS) {
            const updatedUser = updateMockUser(userId, {
                roles: request.roles.map(toUserRole),
            });

            return withMockDelay(updatedUser);
        }

        await apiClient.fetch<void>(`/api/v1/admin/users/${userId}/roles`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        });

        return adminUserService.getUserById(userId);
    },

    /**
     * PATCH /api/v1/admin/users/{id}/enabled
     *
     * Enables or disables a user account through the SprintStart backend.
     * The backend may forward the change to Keycloak.
     *
     * Request body:
     * {
     *   enabled: false
     * }
     */
    async updateUserEnabled(
        userId: string,
        request: UpdateAdminUserEnabledRequest,
    ): Promise<AdminUser> {
        if (USE_ADMIN_PAGE_MOCKS) {
            const updatedUser = updateMockUser(userId, {
                enabled: request.enabled,
            });

            return withMockDelay(updatedUser);
        }

        const updatedUser = await apiClient.fetch<BackendUserResponse>(
            `/api/v1/admin/users/${userId}/enabled`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            },
        );

        return toAdminUser(updatedUser);
    },

    /**
     * DELETE /api/v1/admin/users/{id}
     *
     * Permanently deletes a user account through the SprintStart backend.
     * Account activation/deactivation should use:
     * PATCH /api/v1/admin/users/{id}/enabled
     */
    async deleteUser(userId: string): Promise<DeleteAdminUserResponse> {
        if (USE_ADMIN_PAGE_MOCKS) {
            getMockUserById(userId);

            mockAdminUsers = mockAdminUsers.filter(
                (candidate) => candidate.id !== userId,
            );

            return withMockDelay({
                id: userId,
                deleted: true,
            });
        }

        return apiClient.fetch<DeleteAdminUserResponse>(
            `/api/v1/admin/users/${userId}`,
            {
                method: "DELETE",
            },
        );
    },

    /**
     * Frontend helper only.
     *
     * There is no separate endpoint for this. The role options are derived from
     * the roles that are already present in GET /api/v1/admin/users.
     */
    getAvailableRolesFromUsers,
};
