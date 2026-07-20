import { apiClient } from './apiClient';
import type { MyRamp } from '../features/ramp/types';

const BASE = '/api/v1/onboarding';

export const rampService = {
    /**
     * Where the authenticated hire is on the ramp of real tasks, for one project.
     *
     * Reading this also credits any merged work not yet in the ledger, which is idempotent on the
     * backend — so calling it again after a merge lands is the intended way to see credit appear.
     *
     * @param projectId The project the ramp is scoped to.
     * @throws ApiError 404 when the caller is not a member of the project.
     */
    async fetchMyRamp(projectId: string): Promise<MyRamp> {
        return await apiClient.fetch<MyRamp>(
            `${BASE}/me/ramp?projectId=${encodeURIComponent(projectId)}`
        );
    }
};
