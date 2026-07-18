import { apiClient } from './apiClient';
import type {
    CompetencyEdgeProposal,
    CompetencyProposal,
    GenerateGraphResult,
    ProposedGraph,
} from '../features/graph-authoring/types';

const BASE_URL = '/api/v1/onboarding/competency-graph';

export const competencyGraphService = {
    /**
     * Triggers AI competency graph proposal generation over the ingested corpus. Generated
     * competencies/edges are stored as PROPOSED, awaiting individual PM review.
     */
    async generate(): Promise<GenerateGraphResult> {
        return await apiClient.fetch<GenerateGraphResult>(`${BASE_URL}/generate`, {
            method: 'POST',
        });
    },

    /**
     * Lists the competencies and edges currently awaiting PM review (PROPOSED status).
     */
    async fetchProposed(): Promise<ProposedGraph> {
        return await apiClient.fetch<ProposedGraph>(`${BASE_URL}/proposed`);
    },

    /**
     * Approves a proposed competency, creating it as a real node in the live graph.
     */
    async approveCompetency(id: string): Promise<CompetencyProposal> {
        return await apiClient.fetch<CompetencyProposal>(`${BASE_URL}/competencies/${id}/approve`, {
            method: 'POST',
        });
    },

    /**
     * Rejects a proposed competency; the live graph is left untouched.
     */
    async rejectCompetency(id: string, reason?: string): Promise<CompetencyProposal> {
        return await apiClient.fetch<CompetencyProposal>(`${BASE_URL}/competencies/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    /**
     * Approves a proposed prerequisite/related edge, creating it in the live graph.
     */
    async approveEdge(id: string): Promise<CompetencyEdgeProposal> {
        return await apiClient.fetch<CompetencyEdgeProposal>(`${BASE_URL}/edges/${id}/approve`, {
            method: 'POST',
        });
    },

    /**
     * Rejects a proposed edge; the live graph is left untouched.
     */
    async rejectEdge(id: string, reason?: string): Promise<CompetencyEdgeProposal> {
        return await apiClient.fetch<CompetencyEdgeProposal>(`${BASE_URL}/edges/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },
};
