import { apiClient } from './apiClient';
import type {
    CompetencyAggregate,
    PagedResponse,
    UserCompetencyState,
    UserCompetencySummary
} from '../features/competency-dashboard/types';

export type UserCompetencySummariesParams = {
    search?: string;
    roleIds?: string[];
    projectIds?: string[];
    page?: number;
    size?: number;
};

function buildQuery(params: UserCompetencySummariesParams): string {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    for (const roleId of params.roleIds ?? []) query.append('roleIds', roleId);
    for (const projectId of params.projectIds ?? []) query.append('projectIds', projectId);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
}

export const competencyDashboardService = {
    /**
     * Team-wide competency signal: for every live competency, the level and
     * source distribution across all users -- real competence from the
     * ledger, not step-completion.
     */
    async fetchCompetencyAggregate(): Promise<CompetencyAggregate[]> {
        return await apiClient.fetch<CompetencyAggregate[]>('/api/v1/onboarding/dashboard/competencies');
    },

    /**
     * Paginated, per-user breakdown of each user's full competency ledger.
     * Supports filtering by search query, project roles, and projects.
     */
    async fetchUserCompetencySummaries(
        params: UserCompetencySummariesParams = {}
    ): Promise<PagedResponse<UserCompetencySummary>> {
        return await apiClient.fetch<PagedResponse<UserCompetencySummary>>(
            `/api/v1/onboarding/dashboard/users${buildQuery(params)}`
        );
    },

    /**
     * One user's full competency ledger, labeled -- the per-member view for
     * the team member detail page, replacing the retired per-user skill
     * assessments.
     */
    async fetchUserCompetencies(userId: string): Promise<UserCompetencyState[]> {
        return await apiClient.fetch<UserCompetencyState[]>(
            `/api/v1/onboarding/dashboard/users/${userId}`
        );
    }
};
