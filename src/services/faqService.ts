import { apiClient } from './apiClient';
import type {
    FAQOverview,
    FAQDetail,
} from '../features/faq/types';
import faqMock  from '../mocks/faqMock.json';
import faqDetailMock  from '../mocks/faqDetailMock.json';

export const insightsService = {

    /**
     * Fetches all recurring question groups sorted by frequency.
     */
    async fetchFAQGroups(): Promise<FAQOverview> {
        try {
            return await apiClient.fetch<FAQOverview>(
                '/api/v1/insights/faq'
            );
        } catch (_error) {
            return faqMock;
        }
    },

    /**
     * Fetches detailed information about a specific FAQ group.
     */
    async fetchFAQGroup(groupId: string): Promise<FAQDetail> {
        try {
            return await apiClient.fetch<FAQDetail>(
                `/api/v1/insights/faq/${groupId}`
            );
        } catch (error) {
            console.error(`Error fetching FAQ group with ID ${groupId}:`, error);
            return faqDetailMock;
        }
    },
};
