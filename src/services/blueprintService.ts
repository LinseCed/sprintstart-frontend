import { apiClient } from './apiClient';
import type {
    BlueprintProposal,
    GenerateBlueprintsResult,
    ProposedBlueprints,
} from '../features/blueprint-authoring/types';

const BASE_URL = '/api/v1/onboarding/blueprints';

export const blueprintService = {
    /**
     * Generates baseline blueprint proposals from the ingested corpus.
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

    /** Lists blueprint versions awaiting PM review. */
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

    /** Approves a single proposed step within a version. */
    async approveStep(proposalId: string): Promise<void> {
        await apiClient.fetch(`${BASE_URL}/steps/${proposalId}/approve`, { method: 'POST' });
    },

    /** Rejects a single proposed step, so it is left out when the version is approved. */
    async rejectStep(proposalId: string, reason?: string): Promise<void> {
        await apiClient.fetch(`${BASE_URL}/steps/${proposalId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: reason ?? null })
        });
    }
};
