import type {
    AdminUser,
    ProjectSummary,
    UpdateAdminUserRequest,
} from "../../services/adminUserService";
import type {
    AdminProject,
    AdminProjectDetails,
    ProjectSource,
    ProjectUser,
    ProjectUserSummary,
} from "../../services/projectService";

export type LoadingState = "idle" | "loading" | "success" | "error";
export type UserFilter = "all" | "enabled" | "disabled" | "onboarded" | "not-onboarded";
export type AdminTab = "users" | "projects";

export type UserEditFormState = {
    email: string;
    firstName: string;
    lastName: string;
    permissionGroup: string;
};

export type ProjectOverview = AdminProject;

export type {
    AdminProjectDetails,
    AdminUser,
    ProjectSource,
    ProjectSummary,
    ProjectUser,
    ProjectUserSummary,
    UpdateAdminUserRequest,
};
