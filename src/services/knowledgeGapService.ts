import { apiClient } from './apiClient';
import { ApiError } from './apiClient';
import type {
    KnowledgeGapOverview,
    KnowledgeGap
} from '../features/knowledge-gaps/types';

import knowledgeGapMock from '../mocks/knowledgeGapsMock.json';
import knowledgeGapDetailMock from '../mocks/knowledgeGapsDetailMock.json';

export const knowledgeGapService = {

    async fetchKnowledgeGaps(): Promise<KnowledgeGapOverview> {
        try {
            return await apiClient.fetch<KnowledgeGapOverview>(
                '/api/v1/insights/knowledge-gaps'
            );
        } catch (error) {
            if (!(error instanceof ApiError && error.status === 404)) {
                console.error('Error fetching knowledge gaps:', error);
            }

            return knowledgeGapMock as KnowledgeGapOverview;
        }
    },

    async fetchKnowledgeGap(gapId: string): Promise<KnowledgeGap> {
        try {
            return await apiClient.fetch<KnowledgeGap>(
                `/api/v1/insights/knowledge-gaps/${gapId}`
            );
        } catch (error) {
            if (!(error instanceof ApiError && error.status === 404)) {
                console.error(
                    `Error fetching knowledge gap with ID ${gapId}:`,
                    error
                );
            }

            return knowledgeGapDetailMock as KnowledgeGap;
        }
    },
};
