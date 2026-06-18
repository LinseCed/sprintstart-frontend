import { apiClient } from './apiClient';
import type { Skill } from './types';
import skillsMock from '../mocks/skillsMock.json';

/**
 * Service managing skill list retrieval.
 */
export const skillsService = {
    /**
     * Fetch the global, PM-configured list of all available skills.
     * Falls back to mock data if the backend endpoint is not yet available.
     * 
     * @returns Promise resolving to an array of Skills.
     */
    async getAvailableSkills(): Promise<Skill[]> {
        try {
            return await apiClient.fetch<Skill[]>('/api/v1/skills');
        } catch (error) {
            console.warn('Backend /api/v1/skills unavailable, falling back to mock data.', error);
            return skillsMock;
        }
    }
};
