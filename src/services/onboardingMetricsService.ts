import { apiClient } from './apiClient';
import type { HireTimeline, ProjectOnboardingMetrics } from '../features/onboarding-metrics/types';

const BASE = '/api/v1/onboarding/metrics';

export const onboardingMetricsService = {
    /**
     * A project's onboarding metrics: the aggregates (median time-to-first-merged-PR,
     * review-latency median/p90, stalls, PRs waiting on anyone) plus every hire's
     * timeline in one read. PM/HR/ADMIN only.
     *
     * Derived on request on the backend — there is no pipeline to fall behind — so
     * an empty `hires` list means "no hires yet", not a stale cache.
     *
     * @param projectId The project to read metrics for.
     * @throws ApiError 403 when the caller lacks the role.
     */
    async fetchProjectMetrics(projectId: string): Promise<ProjectOnboardingMetrics> {
        return await apiClient.fetch<ProjectOnboardingMetrics>(
            `${BASE}/projects/${encodeURIComponent(projectId)}`
        );
    },

    /**
     * One hire's onboarding timeline on a project (PM/HR/ADMIN). The project read
     * already embeds every hire's timeline, so this is only for a focused view.
     *
     * @param projectId The project the hire belongs to.
     * @param userId The hire.
     * @throws ApiError 404 when the user is not a member of the project.
     */
    async fetchHireTimeline(projectId: string, userId: string): Promise<HireTimeline> {
        return await apiClient.fetch<HireTimeline>(
            `${BASE}/projects/${encodeURIComponent(projectId)}/users/${encodeURIComponent(userId)}`
        );
    }
};
