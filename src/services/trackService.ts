import { apiClient } from './apiClient';
import type { OnboardingTrack, ProjectRoleWithTrack } from '../features/onboarding-setup/types';

/**
 * Onboarding tracks, and which one each project role puts its people on.
 *
 * A track decides what onboarding *means* for a role: what counts as that person's work, and what
 * to call it. Reading tracks is an onboarding concern; writing one onto a role belongs with the
 * role, which is why the two calls sit on different backend paths.
 */
export const trackService = {
    /**
     * Every track a role can be pointed at, with its vocabulary and the evidence kinds it admits.
     *
     * `evidenceKinds` being empty is a real answer, not missing data: nothing that role does can be
     * observed by anything connected today. PM/HR/ADMIN only.
     */
    async fetchTracks(): Promise<OnboardingTrack[]> {
        return await apiClient.fetch<OnboardingTrack[]>('/api/v1/onboarding/tracks');
    },

    /** Every project role, each carrying the track it currently points at (or none). */
    async fetchRoles(): Promise<ProjectRoleWithTrack[]> {
        return await apiClient.fetch<ProjectRoleWithTrack[]>('/api/v1/projectRoles');
    },

    /**
     * Points a role at a track, or clears it.
     *
     * Passing `null` clears the role's track, which resolves to the default rather than breaking
     * anything — "not decided" is a real state. PM/ADMIN only (HR can read but not set).
     *
     * @throws ApiError 400 when the key is not a live track.
     */
    async setRoleTrack(roleId: string, trackKey: string | null): Promise<ProjectRoleWithTrack> {
        return await apiClient.fetch<ProjectRoleWithTrack>(
            `/api/v1/projectRoles/${encodeURIComponent(roleId)}/onboarding-track`,
            {
                method: 'PUT',
                body: JSON.stringify({ onboardingTrackKey: trackKey }),
            },
        );
    },
};
