import { apiClient } from './apiClient';
import type {
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
     * The approved pool ranked against the authenticated hire's ledger.
     *
     * Ranking is an AI call, so this is deliberately not folded into the path read -- it's
     * fetched only when a hire is actually choosing.
     */
    async fetchMyMatches(): Promise<RankedStarterWorkTask[]> {
        return await apiClient.fetch<RankedStarterWorkTask[]>(`${BASE_URL}/me/matches`);
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
