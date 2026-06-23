import { apiClient } from './apiClient';
import { Role, type UserProfile } from './types';
import userMock from '../mocks/userMock.json';

const LOCAL_MOCK_KEY = 'sprintstart_mock_profile';

function getLocalMockProfile(): Partial<UserProfile> {
    const data = sessionStorage.getItem(LOCAL_MOCK_KEY);
    return data ? (JSON.parse(data) as Partial<UserProfile>) : userMock;
}

function setLocalMockProfile(updates: Partial<UserProfile>) {
    const current = getLocalMockProfile();
    sessionStorage.setItem(LOCAL_MOCK_KEY, JSON.stringify({ ...current, ...updates }));
}

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
            const backendProfile = await apiClient.fetch<UserProfile>('/api/v1/users/me');
            const localMocks = getLocalMockProfile();
            return { ...backendProfile, ...localMocks };
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
        // Save frontend-only fields to sessionStorage so they persist during frontend-only development
        const frontendOnlyFields: Partial<UserProfile> = {};
        if (profile.profileIcon !== undefined) frontendOnlyFields.profileIcon = profile.profileIcon;
        if (profile.email !== undefined) frontendOnlyFields.email = profile.email;
        if (profile.firstname !== undefined) frontendOnlyFields.firstname = profile.firstname;
        if (profile.lastname !== undefined) frontendOnlyFields.lastname = profile.lastname;
        
        setLocalMockProfile(frontendOnlyFields);

        try {
            const backendProfile = await apiClient.fetch<UserProfile>('/api/v1/users/me', {
                method: 'PATCH',
                body: JSON.stringify(profile),
            });
            return { ...backendProfile, ...getLocalMockProfile() };
        } catch (e) {
            console.warn("Backend PATCH failed, using local mock merged with current local profile.");
            const currentProfile = await this.getProfile();
            if (!currentProfile) throw e;
            return { ...currentProfile, ...getLocalMockProfile() };
        }
    },

    /**
     * Resets the user's roles to their default 'NO_ROLE' state.
     * 
     * @returns Promise that resolves when the reset is complete.
     */
    async resetProfile(): Promise<void> {
        await this.updateProfile({
            primaryRole: Role.NO_ROLE,
            secondaryRole: Role.NO_ROLE
        });
    },

    /**
     * Legacy logout method. In Keycloak mode, use the Keycloak instance to logout.
     */
    logout(): Promise<void> {
        return Promise.resolve();
    }
};
