import { apiClient } from './apiClient';
import type {
    CreateStarterWorkTaskInput,
    GenerateStarterWorkResult,
    PathGoal,
    ProposedStarterWork,
    RankedStarterWorkTask,
    StarterWorkTask,
} from '../features/starter-work/types';

const BASE_URL = '/api/v1/onboarding/starter-work';

export const starterWorkService = {
    /** Mines the ingested corpus for well-scoped starter tasks, stored as PROPOSED for review. */
    async generate(): Promise<GenerateStarterWorkResult> {
        return await apiClient.fetch<GenerateStarterWorkResult>(`${BASE_URL}/generate`, {
            method: 'POST',
        });
    },

    /** The starter tasks currently awaiting PM review. */
    async fetchProposed(): Promise<ProposedStarterWork> {
        return await apiClient.fetch<ProposedStarterWork>(`${BASE_URL}/proposed`);
    },

    /**
     * Hand-authors a starter task, with no AI mining. It is born `APPROVED` and its `CONTRIBUTION`
     * node lands in the graph at once, so it never joins the review queue — the returned task is
     * already approved.
     */
    async create(input: CreateStarterWorkTaskInput): Promise<StarterWorkTask> {
        return await apiClient.fetch<StarterWorkTask>(BASE_URL, {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    /**
     * Approves a task, creating a `CONTRIBUTION` node plus prerequisite edges from its tagged
     * competencies. This is what makes the task claimable as a goal.
     */
    async approve(id: string): Promise<StarterWorkTask> {
        return await apiClient.fetch<StarterWorkTask>(`${BASE_URL}/${id}/approve`, {
            method: 'POST',
        });
    },

    /** Rejects a task; the graph is left untouched. */
    async reject(id: string, reason?: string): Promise<StarterWorkTask> {
        return await apiClient.fetch<StarterWorkTask>(`${BASE_URL}/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    /**
     * The approved pool ranked for the authenticated hire on one project.
     *
     * Ranking is deterministic and local since backend#74 — no AI call — and every entry carries
     * the `reasons` it was suggested. Project-scoped because two of the signals (prior involvement
     * and how fast a repository answers pull requests) only mean anything inside one project.
     *
     * @param projectId The project to rank the pool for.
     */
    async fetchMyMatches(projectId: string): Promise<RankedStarterWorkTask[]> {
        return await apiClient.fetch<RankedStarterWorkTask[]>(
            `${BASE_URL}/me/matches?projectId=${encodeURIComponent(projectId)}`
        );
    },

    /** Claims an approved task as this hire's goal for a project, replacing any previous one. */
    async claimGoal(projectId: string, taskId: string): Promise<PathGoal> {
        return await apiClient.fetch<PathGoal>(
            `${BASE_URL}/me/goal?projectId=${encodeURIComponent(projectId)}`,
            { method: 'POST', body: JSON.stringify({ taskId }) }
        );
    },

    /** Drops this hire's goal; their path falls back to the project's baseline. */
    async clearGoal(projectId: string): Promise<void> {
        await apiClient.fetch<void>(
            `${BASE_URL}/me/goal?projectId=${encodeURIComponent(projectId)}`,
            { method: 'DELETE' }
        );
    },
};
