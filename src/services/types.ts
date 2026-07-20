export const PermissionGroup = {
  USER: "USER",
  PM: "PM",
  HR: "HR",
  ADMIN: "ADMIN",
} as const;
export type PermissionGroup =
  (typeof PermissionGroup)[keyof typeof PermissionGroup];

export const DocumentStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type DocumentStatus =
  (typeof DocumentStatus)[keyof typeof DocumentStatus];

export type DocumentMetadata = {
  id: string;
  name: string;
  mime: string;
  size?: number;
  status: DocumentStatus;
  uploadDate: string;
};

export type UploadResult = {
  id: string;
  filename: string;
  status: "ok" | "failed";
  error?: string;
};

export interface ProjectRoleSummary {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  authId: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  projectRoles: ProjectRoleSummary[];
  projectIds: string[];
  permissionGroup: PermissionGroup;
  enabled: boolean;
  profileIcon: string | null;
  hasCompletedOnboarding: boolean;
  /**
   * The GitHub account this user contributes as, lower-cased, or null if they
   * haven't declared one. Artifact-tier onboarding checks attribute a submitted
   * pull request to its author, so a hire can't pass one without this set.
   */
  githubLogin: string | null;
  /**
   * How the login was established. Nothing here proves account ownership --
   * `SELF_DECLARED` is the user's own claim, `PM_CONFIRMED` was set by a PM.
   */
  githubLoginSource: GithubLoginSource | null;
}

export type GithubLoginSource = "SELF_DECLARED" | "PM_CONFIRMED";
