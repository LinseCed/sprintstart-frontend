// ============================================================
// adminUserService.ts
// ============================================================
//
// Mock-first service for the Admin Page.
//
// Put adminPageMock.json in:
//   src/mocks/adminPageMock.json
//
// The mock objects intentionally contain only the fields from the final endpoint
// description. No projectRoles, no onboardingStatus, no date fields, no role catalog.

import { apiClient } from "./apiClient";
import adminPageMock from "../mocks/adminPageMock.json";

const USE_ADMIN_PAGE_MOCKS = true;
const MOCK_DELAY_MS = 180;

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

export type UpdateAdminUserRolesRequest = {
    roles: RoleAssignment[];
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

function getMockUserById(userId: string): AdminUser {
    const user = mockAdminUsers.find((candidate) => candidate.id === userId);

    if (!user) {
        throw new Error(`User with id "${userId}" was not found.`);
    }

    return user;
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

export const adminUserService = {
    /**
     * GET /api/v1/users/me
     */
    async getCurrentUser(): Promise<UserProfile> {
        if (USE_ADMIN_PAGE_MOCKS) {
            return withMockDelay(mock.usersMe);
        }

        return apiClient.fetch<UserProfile>("/api/v1/users/me");
    },

    /**
     * GET /api/v1/admin/users
     */
    async getUsers(): Promise<AdminUser[]> {
        if (USE_ADMIN_PAGE_MOCKS) {
            return withMockDelay(mockAdminUsers);
        }

        return apiClient.fetch<AdminUser[]>("/api/v1/admin/users");
    },

    /**
     * GET /api/v1/admin/users/{id}
     */
    async getUserById(userId: string): Promise<AdminUser> {
        if (USE_ADMIN_PAGE_MOCKS) {
            return withMockDelay(getMockUserById(userId));
        }

        return apiClient.fetch<AdminUser>(`/api/v1/admin/users/${userId}`);
    },

    /**
     * PATCH /api/v1/admin/users/{id}/roles
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
            const user = getMockUserById(userId);

            const updatedUser: AdminUser = {
                ...user,
                roles: request.roles.map(toUserRole),
            };

            mockAdminUsers = mockAdminUsers.map((candidate) =>
                candidate.id === userId ? updatedUser : candidate,
            );

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
     * Frontend helper only.
     *
     * There is no separate endpoint for this. The role options are derived from
     * the roles that are already present in GET /api/v1/admin/users.
     */
    getAvailableRolesFromUsers,
};
