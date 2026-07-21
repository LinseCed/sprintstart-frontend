import { apiClient } from './apiClient';
import type { BaselineEntry, SetBaselineEntryInput } from '../features/graph-authoring/types';

const BASE = '/api/v1/onboarding/blueprints/projects';

function entryUrl(projectId: string, competencyKey: string): string {
    return `${BASE}/${encodeURIComponent(projectId)}/baseline/${encodeURIComponent(competencyKey)}`;
}

/**
 * Direct baseline authoring: a PM marks approved competencies "expected on this project" without the
 * AI proposal round trip. Writes the project's active baseline in place. PM/ADMIN write; PM/HR/ADMIN
 * read.
 */
export const baselineService = {
    async fetchBaseline(projectId: string): Promise<{ entries: BaselineEntry[] }> {
        return await apiClient.fetch<{ entries: BaselineEntry[] }>(
            `${BASE}/${encodeURIComponent(projectId)}/baseline`,
        );
    },

    async setEntry(
        projectId: string,
        competencyKey: string,
        input: SetBaselineEntryInput,
    ): Promise<BaselineEntry> {
        return await apiClient.fetch<BaselineEntry>(entryUrl(projectId, competencyKey), {
            method: 'PUT',
            body: JSON.stringify(input),
        });
    },

    async removeEntry(projectId: string, competencyKey: string): Promise<void> {
        await apiClient.fetch<void>(entryUrl(projectId, competencyKey), { method: 'DELETE' });
    },
};
