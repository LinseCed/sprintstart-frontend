import { apiClient } from './apiClient';
import type {
    CreateStarterWorkTaskInput,
    GenerateStarterWorkResult,
    StarterWorkTask,
    UnreviewedStarterWork,
} from '../features/starter-work/types';

const BASE_URL = '/api/v1/onboarding/starter-work';

/**
 * The PM's side of the starter-work pool.
 *
 * ⚠️ **Nothing here gates a hire.** Mined tasks are claimable the moment they land — S3b deleted
 * the approval gate — so reviewing one lifts the fit-ranking demotion it carries while nobody has
 * vouched for it, and removing one takes it out of the pool for good. The two are not opposites.
 *
 * This module's routes and prose said otherwise for a while: `/proposed`, `/approved`,
 * `/{id}/approve`, and comments about creating `CONTRIBUTION` nodes in a competency graph that S0
 * deleted. The behaviour was right the whole time; the names described the system it replaced.
 */
export const starterWorkService = {
    /** Mines the ingested corpus for well-scoped starter tasks. They are claimable on arrival. */
    async generate(): Promise<GenerateStarterWorkResult> {
        return await apiClient.fetch<GenerateStarterWorkResult>(`${BASE_URL}/generate`, {
            method: 'POST',
        });
    },

    /** The live tasks nobody has vouched for yet — not a queue anything is waiting in. */
    async fetchUnreviewed(): Promise<UnreviewedStarterWork> {
        return await apiClient.fetch<UnreviewedStarterWork>(`${BASE_URL}/unreviewed`);
    },

    /** The whole live pool, reviewed or not — what a PM can author orientation for. */
    async fetchPool(): Promise<StarterWorkTask[]> {
        return await apiClient.fetch<StarterWorkTask[]>(`${BASE_URL}/pool`);
    },

    /**
     * Hand-authors a starter task, with no AI mining in the loop.
     *
     * It comes back already reviewed: a PM writing the task *is* the review, so it carries no
     * unvouched demotion and never appears in the unreviewed list.
     */
    async create(input: CreateStarterWorkTaskInput): Promise<StarterWorkTask> {
        return await apiClient.fetch<StarterWorkTask>(BASE_URL, {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    /**
     * Records that somebody has looked at the task and is happy with it.
     *
     * ⚠️ This admits nothing — the task was claimable before and is claimable after. What changes
     * is that it stops being demoted for having nobody behind it. Idempotent.
     */
    async markReviewed(id: string): Promise<StarterWorkTask> {
        return await apiClient.fetch<StarterWorkTask>(`${BASE_URL}/${id}/review`, {
            method: 'POST',
        });
    },

    /** Takes the task out of the pool for good. Sticky: mining never brings it back. */
    async reject(id: string, reason?: string): Promise<StarterWorkTask> {
        return await apiClient.fetch<StarterWorkTask>(`${BASE_URL}/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },
};
