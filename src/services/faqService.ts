import { apiClient } from './apiClient';
import type {
    FAQOverview,
    FAQDetail,
} from '../features/faq/types';
export const insightsService = {

    /**
     * Fetches all recurring question groups sorted by frequency.
     */
    async fetchFAQGroups(): Promise<FAQOverview> {
        // No mock fallback: the page has a real empty/error state, and returning a fixture on
        // failure would show fabricated FAQ groups as if the AI had produced them.
        return await apiClient.fetch<FAQOverview>('/api/v1/insights/faq');
    },

    /**
     * Fetches detailed information about a specific FAQ group.
     */
    async fetchFAQGroup(groupId: string): Promise<FAQDetail> {
        return await apiClient.fetch<FAQDetail>(`/api/v1/insights/faq/${groupId}`);
    },

    /**
     * Triggers the backend to (re)build the FAQ groups via the AI service.
     *
     * Unlike the fetch methods, this does not fall back to mock data: the caller
     * needs to know whether the refresh actually succeeded, so errors propagate.
     *
     * @returns The number of groups stored after the refresh.
     */
    async refreshFAQGroups(): Promise<{ groupCount: number }> {
        return await apiClient.fetch<{ groupCount: number }>(
            '/api/v1/insights/faq/refresh',
            { method: 'POST' }
        );
    },
};
