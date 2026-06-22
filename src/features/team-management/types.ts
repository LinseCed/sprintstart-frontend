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
    roles: ProjectRole[];
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

export type ProjectRole = {
    id: string;
    name: string;
    description: string;
};

export type SkillLevel =
    | 'BEGINNER'
    | 'INTERMEDIATE'
    | 'ADVANCED'
    | 'EXPERT';

export type Skill = {
    id: string;
    name: string;
    roleId: string;
    level?: SkillLevel;
};

export type TeamOverviewFilters = {
    roleId: string;
    sortBy:
        | 'LONGEST_STEP'
        | 'SHORTEST_STEP'
        | 'HIGHEST_PROGRESS'
        | 'LOWEST_PROGRESS';
};