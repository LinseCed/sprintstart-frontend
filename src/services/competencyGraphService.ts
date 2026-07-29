import { apiClient } from './apiClient';
import type {
    CreateCompetencyInput,
    DeleteCompetencyResult,
    LiveCompetency,
    LiveGraph,
    UpdateCompetencyInput,
} from '../features/graph-authoring/types';

const BASE_URL = '/api/v1/onboarding/competency-graph';

/**
 * Reading and authoring the competency vocabulary.
 *
 * There is no proposal queue any more, and no edges: generation, approve/reject, batch approval and
 * the edge endpoints all went with the graph. What is left is a list a PM reads and corrects.
 */
export const competencyGraphService = {
    /**
     * Reads the whole live vocabulary.
     *
     * Carries no per-user state and no ordering — a flat list of what somebody can be proficient in.
     */
    async fetchGraph(): Promise<LiveGraph> {
        return await apiClient.fetch<LiveGraph>(BASE_URL);
    },

    /**
     * Hand-authors a new competency.
     *
     * The returned competency's `key` may differ from the one sent — the backend slugifies it into
     * the house style.
     */
    async createCompetency(input: CreateCompetencyInput): Promise<LiveCompetency> {
        return await apiClient.fetch<LiveCompetency>(`${BASE_URL}/competencies`, {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    /** Reads one live competency's authoring detail. */
    async fetchCompetency(key: string): Promise<LiveCompetency> {
        return await apiClient.fetch<LiveCompetency>(
            `${BASE_URL}/competencies/${encodeURIComponent(key)}`
        );
    },

    /**
     * Applies a PM's edit to a live competency. Omitted fields are left alone.
     *
     * There is no `key` field on purpose -- the backend rejects key changes, because the key is
     * what the ledger and every module point at.
     */
    async updateCompetency(key: string, input: UpdateCompetencyInput): Promise<LiveCompetency> {
        return await apiClient.fetch<LiveCompetency>(
            `${BASE_URL}/competencies/${encodeURIComponent(key)}`,
            {
                method: 'PUT',
                body: JSON.stringify(input),
            }
        );
    },

    /**
     * Deletes a competency from the vocabulary.
     *
     * Nobody un-earns anything and no authored module is destroyed: both are keyed by the
     * competency *key* rather than by a foreign key, so both survive the row going. A module stops
     * appearing until a competency with that key exists again.
     */
    async deleteCompetency(key: string): Promise<DeleteCompetencyResult> {
        return await apiClient.fetch<DeleteCompetencyResult>(
            `${BASE_URL}/competencies/${encodeURIComponent(key)}`,
            { method: 'DELETE' }
        );
    },
};
