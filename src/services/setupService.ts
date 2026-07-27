import { apiClient } from './apiClient';
import type { SetupReadiness } from '../features/onboarding-setup/types';

const BASE = '/api/v1/onboarding/setup';

export const setupService = {
    /**
     * A project's onboarding-setup readiness: the four stages the onboarding backend owns
     * (skill map, starter tasks) plus whether they are all done.
     *
     * Derived on request — an empty or WARN rung is a live state, never a stale cache. Corpus
     * health is intentionally absent (it lives with data ingestion); the caller composes the
     * corpus rung onto the top of the ladder. PM/HR/ADMIN only.
     *
     * @param projectId The project to read readiness for.
     * @throws ApiError 403 when the caller lacks the role.
     */
    async fetchReadiness(projectId: string): Promise<SetupReadiness> {
        return await apiClient.fetch<SetupReadiness>(
            `${BASE}/status?projectId=${encodeURIComponent(projectId)}`,
        );
    },
};
