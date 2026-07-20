import { apiClient } from './apiClient';
import type {
    BlueprintProposal,
    GenerateBlueprintsResult,
    ProposedBlueprints,
} from '../features/blueprint-authoring/types';

const BASE_URL = '/api/v1/onboarding/blueprints';

export const blueprintService = {
    /**
     * Generates baseline proposals from the ingested corpus: a competency
     * selection per scope, drawn from the live competency graph.
     *
     * Proposal-only: nothing becomes the mandatory baseline until a PM approves
     * it. Omitting `scopes` lets the backend pick the scopes it knows about.
     */
    async generate(scopes?: string[]): Promise<GenerateBlueprintsResult> {
        return await apiClient.fetch<GenerateBlueprintsResult>(`${BASE_URL}/generate`, {
            method: 'POST',
            body: JSON.stringify({ scopes: scopes ?? null })
        });
    },

    /** Lists baseline versions awaiting PM review. */
    async fetchProposed(): Promise<ProposedBlueprints> {
        return await apiClient.fetch<ProposedBlueprints>(`${BASE_URL}/proposed`);
    },

    /**
     * Approves a proposed version, making it the ACTIVE baseline for that scope.
     *
     * This is what unblocks path generation: personalization refuses to run for a
     * user whose scopes have no ACTIVE blueprint.
     */
    async approve(scope: string, version: string): Promise<BlueprintProposal> {
        return await apiClient.fetch<BlueprintProposal>(
            `${BASE_URL}/${encodeURIComponent(scope)}/approve`,
            { method: 'POST', body: JSON.stringify({ version }) }
        );
    },

    /** Rejects and archives a proposed version; the ACTIVE baseline is untouched. */
    async reject(scope: string, version: string, reason?: string): Promise<BlueprintProposal> {
        return await apiClient.fetch<BlueprintProposal>(
            `${BASE_URL}/${encodeURIComponent(scope)}/reject`,
            { method: 'POST', body: JSON.stringify({ version, reason: reason ?? null }) }
        );
    },

    /** Keeps a single proposed competency in the baseline. */
    async approveCompetency(proposalId: string): Promise<void> {
        await apiClient.fetch(`${BASE_URL}/competencies/${proposalId}/approve`, {
            method: 'POST'
        });
    },

    /**
     * Drops a single proposed competency, so it is left out when the version is
     * approved -- it stops being something everyone in the scope must reach.
     */
    async rejectCompetency(proposalId: string, reason?: string): Promise<void> {
        await apiClient.fetch(`${BASE_URL}/competencies/${proposalId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: reason ?? null })
        });
    }
};
