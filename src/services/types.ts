export const PermissionGroup = {
    USER: 'USER',
    PM: 'PM',
    HR: 'HR',
    ADMIN: 'ADMIN',
} as const;
export type PermissionGroup = (typeof PermissionGroup)[keyof typeof PermissionGroup];

export const WorkingArea = {
    NO_WORKING_AREA: 'NO_WORKING_AREA',
    FRONTEND_DEV: 'FRONTEND_DEV',
    BACKEND_DEV: 'BACKEND_DEV',
    DEV_OPS: 'DEV_OPS',
    QA: 'QA',
    HR: 'HR',
} as const;
export type WorkingArea = (typeof WorkingArea)[keyof typeof WorkingArea];

export const DocumentStatus = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

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
    status: 'ok' | 'failed';
    error?: string;
};

export interface UserProfile {
    id: string;
    authId: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    workingArea: WorkingArea;
    permissionGroup: PermissionGroup;
    enabled: boolean;
    profileIcon: string | null;
    hasCompletedOnboarding: boolean;
}
