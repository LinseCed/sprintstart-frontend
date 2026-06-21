export type SkipRequestStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';

export type SkipRequest = {
    id: string;
    stepId: string;
    reason: string;
    status: SkipRequestStatus;
    reviewComment: string | null;
    reviewedAt: string | null;
};

export type TeamOverviewUser = {
    userId: string;
    firstname: string;
    lastname: string;
    project: {
        id: string;
        name: string;
    };
    role: {
        id: string;
        name: string;
    };
    progressPercentage: number;
    currentPhase: {
        id: string;
        title: string;
    };
    currentStep: {
        id: string;
        title: string;
        startedAt: string;
        skip: SkipRequest | null;
    };
    hasFeedback: boolean;
};

export type TeamOverviewFilters = {
    roleId: string;
};