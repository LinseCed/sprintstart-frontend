/**
 * One team member as the team list sees them: who they are, and what they can actually do.
 *
 * Sourced from `GET /api/v1/onboarding/dashboard/users`. The journey-shaped fields this type
 * used to carry -- `progressPercentage`, `currentPhase`, `currentStep`, `skip` -- are gone with
 * the per-user step tree they described (backend#53). Progress through a checklist was never the
 * signal anyway: a step marked done and a competency actually verified are different claims, and
 * the ledger is the one that means something.
 */
export type TeamOverviewUser = {
    userId: string;
    firstname: string;
    lastname: string;
    profileIcon?: string | null;
    projects: {
        id: string;
        name: string;
    }[];
    roles: ProjectRole[];
    /** The member's durable competency ledger. */
    competencies: TeamMemberCompetency[];
    hasFeedback: boolean;
};

export type TeamMemberCompetency = {
    competencyKey: string;
    label: string;
    /** 0..4; 0 means "asked, saw no competence" -- neither held nor a gap. */
    level: number;
    source: 'ASSESSED' | 'VERIFIED' | 'DECLARED';
    updatedAt: string;
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

/**
 * Sorting is by what people can do, not by position in a checklist. The old
 * `LONGEST_STEP`/`SHORTEST_STEP`/`*_PROGRESS` options described the per-user step tree that no
 * longer exists; "fewest competencies" is the honest way to surface who may need attention.
 */
export type TeamOverviewFilters = {
    roleId: string;
    sortBy: 'MOST_COMPETENCIES' | 'FEWEST_COMPETENCIES' | 'RECENTLY_ACTIVE';
};
