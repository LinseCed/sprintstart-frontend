import { apiClient } from './apiClient';
import type { MyEnvironment, MyTaskZero } from '../features/first-week/types';

const BASE = '/api/v1/onboarding';

export const firstWeekService = {
    /**
     * The authenticated hire's environment readiness on a project. Readiness is
     * settled by evidence (a reported build/CI run, or a pull request they
     * authored), never self-declared here — so there is no "mark ready" call.
     * Not-ready (`ready: false`) is an ordinary response, not an error.
     *
     * @param projectId The project to read readiness for.
     * @throws ApiError 404 when the caller is not a member of the project.
     */
    async fetchEnvironment(projectId: string): Promise<MyEnvironment> {
        return await apiClient.fetch<MyEnvironment>(
            `${BASE}/me/environment?projectId=${encodeURIComponent(projectId)}`
        );
    },

    /**
     * The authenticated hire's Task 0. Reading it assigns one automatically once
     * the environment is ready and none is assigned yet, so a first day never
     * ends with "pick something". Ready-but-nothing-eligible is a handled state.
     *
     * @param projectId The project to read Task 0 for.
     * @throws ApiError 404 when the caller is not a member of the project.
     */
    async fetchTaskZero(projectId: string): Promise<MyTaskZero> {
        return await apiClient.fetch<MyTaskZero>(
            `${BASE}/me/task-zero?projectId=${encodeURIComponent(projectId)}`
        );
    },

    /**
     * Undoes the caller's Task 0 assignment, freeing the task for someone else.
     * Earns nothing, so un-earns nothing.
     *
     * @param projectId The project the assignment belongs to.
     */
    async unassignTaskZero(projectId: string): Promise<void> {
        await apiClient.fetch<void>(
            `${BASE}/me/task-zero?projectId=${encodeURIComponent(projectId)}`,
            { method: 'DELETE' }
        );
    }
};
