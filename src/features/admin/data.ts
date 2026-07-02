import type { AdminUser, UserEditFormState, UserFilter } from "./types";
import type { BadgeVariant } from "../../components/ui/Badge";

export const PAGE_SIZE = 8;
export const DRAWER_CLOSE_DELAY_MS = 260;
export const PERMISSION_GROUP_OPTIONS = ["Admin", "User", "Project Manager"] as const;

export const USER_FILTER_OPTIONS: Array<{ value: UserFilter; label: string }> = [
    { value: "all", label: "All users" },
    { value: "enabled", label: "Enabled" },
    { value: "disabled", label: "Disabled" },
    { value: "onboarded", label: "Onboarding completed" },
    { value: "not-onboarded", label: "Onboarding open" },
];

export function getDisplayName(user: AdminUser) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.username || user.email;
}



export function getPermissionGroupVariant(permissionGroup: string): BadgeVariant {
    const normalized = permissionGroup.toUpperCase();

    if (normalized.includes("ADMIN")) return "warning";
    if (normalized.includes("PROJECT")) return "success";
    return "neutral";
}

export function getSourceStatusVariant(status: string): BadgeVariant {
    const normalizedStatus = status.trim().toUpperCase();

    if (normalizedStatus === "CONNECTED") return "success";
    if (normalizedStatus === "INDEXING") return "warning";
    if (normalizedStatus === "ERROR") return "danger";
    if (normalizedStatus === "DISCONNECTED") return "neutral";

    return "brand";
}

export function getProjectUsersCount(project: { users: unknown[] }) {
    return project.users.length;
}

export function getProjectSourcesCount(project: { sources: unknown[] }) {
    return project.sources.length;
}

export function getUserEditFormState(user: AdminUser): UserEditFormState {
    return {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        permissionGroup: user.permissionGroup,
        enabled: user.enabled,
    };
}

export function getDraftDisplayName(user: AdminUser, draftUser: UserEditFormState) {
    const fullName = [draftUser.firstName, draftUser.lastName]
        .filter(Boolean)
        .join(" ");

    return fullName || user.username || draftUser.email;
}
