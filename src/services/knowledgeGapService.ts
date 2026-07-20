import { apiClient } from './apiClient';
import type {
    KnowledgeGapOverview,
    KnowledgeGap,
    KnowledgeGapOwner
} from '../features/knowledge-gaps/types';

export const knowledgeGapService = {

    async fetchKnowledgeGaps(): Promise<KnowledgeGapOverview> {
        // No mock fallback: the page renders a real empty state, and the old fallback fired on
        // *any* error including a 404 -- so a genuinely empty result showed fabricated gaps.
        return await apiClient.fetch<KnowledgeGapOverview>('/api/v1/insights/knowledge-gaps');
    },

    async fetchKnowledgeGap(gapId: string): Promise<KnowledgeGap> {
        return await apiClient.fetch<KnowledgeGap>(
            `/api/v1/insights/knowledge-gaps/${gapId}`
        );
    },

    /**
     * Triggers the backend to (re)detect knowledge gaps via the AI service.
     *
     * Unlike the fetch methods, this does not fall back to mock data: the caller
     * needs to know whether the refresh actually succeeded, so errors propagate.
     *
     * @returns The number of gaps stored after the refresh.
     */
    async refreshKnowledgeGaps(): Promise<{ gapCount: number }> {
        return await apiClient.fetch<{ gapCount: number }>(
            '/api/v1/insights/knowledge-gaps/refresh',
            { method: 'POST' }
        );
    },

    /**
     * Returns the users currently assigned as owners of a component.
     */
    async getComponentOwners(component: string): Promise<KnowledgeGapOwner[]> {
        return await apiClient.fetch<KnowledgeGapOwner[]>(
            `/api/v1/insights/knowledge-gaps/component-owners?component=${encodeURIComponent(component)}`
        );
    },

    /**
     * Replaces the owners of a component and returns the resolved owners.
     */
    async setComponentOwners(
        component: string,
        userIds: string[]
    ): Promise<KnowledgeGapOwner[]> {
        return await apiClient.fetch<KnowledgeGapOwner[]>(
            '/api/v1/insights/knowledge-gaps/component-owners',
            {
                method: 'PUT',
                body: JSON.stringify({ component, userIds }),
            }
        );
    },
};
