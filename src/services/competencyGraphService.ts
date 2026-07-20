import { apiClient } from './apiClient';
import type {
    ApproveGraphBatchResult,
    CompetencyEdgeProposal,
    CompetencyProposal,
    DeleteCompetencyResult,
    EdgeKind,
    GenerateGraphResult,
    LiveCompetency,
    LiveCompetencyEdge,
    LiveGraph,
    ProposedGraph,
    UpdateCompetencyInput,
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

    /**
     * Approves proposed competencies and edges as one graph version.
     *
     * Preferred over approving a node and then its edges separately: batched, the whole subgraph
     * classifies ADDITIVE and reaches hires already wired, instead of the node arriving first as
     * an orphan with no prerequisites that can re-lock once its edges land.
     */
    async approveBatch(
        competencyProposalIds: string[],
        edgeProposalIds: string[]
    ): Promise<ApproveGraphBatchResult> {
        return await apiClient.fetch<ApproveGraphBatchResult>(`${BASE_URL}/approve-batch`, {
            method: 'POST',
            body: JSON.stringify({ competencyProposalIds, edgeProposalIds }),
        });
    },

    /**
     * Reads the whole live graph: every visible competency and edge at the head version.
     *
     * The PM counterpart to `assessmentService.fetchPath`. That returns a hire's projection --
     * scoped to one project's baseline, carrying their per-user node state -- so authoring
     * against it meant editing the graph through somebody's onboarding, and a project with no
     * approved baseline showed nothing to edit at all.
     */
    async fetchGraph(): Promise<LiveGraph> {
        return await apiClient.fetch<LiveGraph>(BASE_URL);
    },

    /**
     * Reads one live competency's authoring detail -- including the `description` and
     * `targetLevel` the projected path doesn't carry.
     */
    async fetchCompetency(key: string): Promise<LiveCompetency> {
        return await apiClient.fetch<LiveCompetency>(
            `${BASE_URL}/competencies/${encodeURIComponent(key)}`
        );
    },

    /**
     * Applies a PM's edit to a live competency. Omitted fields are left alone.
     *
     * There is no `key` field on purpose -- the backend rejects key changes, because the key is
     * what the ledger, edges and modules all point at.
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
     * Removes a competency and every edge touching it from the live graph.
     *
     * Nothing is deleted: the node stops appearing on paths, and every hire keeps any level they
     * already earned on it.
     */
    async deleteCompetency(key: string): Promise<DeleteCompetencyResult> {
        return await apiClient.fetch<DeleteCompetencyResult>(
            `${BASE_URL}/competencies/${encodeURIComponent(key)}`,
            { method: 'DELETE' }
        );
    },

    /**
     * Adds a hand-authored edge between two live competencies.
     *
     * Rejected with a 400 if it would close a prerequisite cycle.
     */
    async createEdge(
        fromKey: string,
        toKey: string,
        kind: EdgeKind = 'PREREQUISITE'
    ): Promise<LiveCompetencyEdge> {
        return await apiClient.fetch<LiveCompetencyEdge>(`${BASE_URL}/edges`, {
            method: 'POST',
            body: JSON.stringify({ fromKey, toKey, kind }),
        });
    },

    /** Removes one edge, leaving both endpoint competencies in place. */
    async deleteEdge(
        fromKey: string,
        toKey: string,
        kind: EdgeKind = 'PREREQUISITE'
    ): Promise<LiveCompetencyEdge> {
        const params = new URLSearchParams({ fromKey, toKey, kind });
        return await apiClient.fetch<LiveCompetencyEdge>(`${BASE_URL}/edges?${params.toString()}`, {
            method: 'DELETE',
        });
    },
};
