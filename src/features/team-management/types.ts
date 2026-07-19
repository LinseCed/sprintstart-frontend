export type SkipRequestStatus =
    | 'PENDING'
    | 'ACCEPTED'
    | 'DENIED';

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
    profileIcon?: string;
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
    } | null;
    hasFeedback: boolean;
};

export type ProjectRole = {
    id: string;
    name: string;
    description: string;
};

export type SkillStatus = 'ACTIVE' | 'RETIRED';

export type Skill = {
    id: string;
    name: string;
    roleIds: string[];
    status: SkillStatus;
};

export function isSkillLinkedToRole(skill: Skill, roleId: string): boolean {
    return skill.roleIds.includes(roleId);
}

export type TeamOverviewFilters = {
    roleId: string;
    sortBy:
        | 'LONGEST_STEP'
        | 'SHORTEST_STEP'
        | 'HIGHEST_PROGRESS'
        | 'LOWEST_PROGRESS';
};
