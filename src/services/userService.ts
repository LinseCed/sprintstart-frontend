import { apiClient } from './apiClient';
import { WorkingArea, type UserProfile } from './types';

/**
 * Service managing user authentication, profile retrieval, and updates.
 * Now integrated with Keycloak via the central apiClient.
 */
export const userService = {
    /**
     * Legacy login method. In Keycloak mode, authentication is handled by the SSO flow.
     * This method is kept for type compatibility but should be bypassed by the AuthProvider.
     */
    login(): Promise<UserProfile> {
        throw new Error('Direct login is disabled. Please use the SSO flow.');
    },

    /**
     * Retrieves the profile of the currently authenticated user from the backend.
     * The backend resolves the user based on the JWT subject.
     * 
     * @returns Promise resolving to UserProfile.
     * @throws Error if the user is not found or unauthorized.
     */
    async getProfile(): Promise<UserProfile | null> {
        try {
            return await apiClient.fetch<UserProfile>('/api/v1/users/me');
        } catch (error) {
            console.error('Failed to retrieve profile', error);
            return null;
        }
    },

    /**
     * Updates specific fields of the user's profile on the backend.
     * 
     * @param profile - Partial profile object containing fields to update.
     * @returns Promise resolving to the updated UserProfile.
     */
    async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
        return await apiClient.fetch<UserProfile>('/api/v1/users/me', {
            method: 'PATCH',
            body: JSON.stringify(profile),
        });
    },

    /**
     * Resets the user's roles to their default 'NO_ROLE' state.
     * 
     * @returns Promise that resolves when the reset is complete.
     */
    async resetProfile(): Promise<void> {
        await this.updateProfile({
            workingArea: WorkingArea.NO_WORKING_AREA,
        });
    },

    /**
     * Legacy logout method. In Keycloak mode, use the Keycloak instance to logout.
     */
    logout(): Promise<void> {
        return Promise.resolve();
    }
};
