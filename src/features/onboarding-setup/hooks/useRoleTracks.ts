import { useCallback, useState } from 'react';
import { useFetch } from '../../../hooks/useFetch';
import { trackService } from '../../../services/trackService';
import type { OnboardingTrack, ProjectRoleWithTrack } from '../types';

interface RoleTracksData {
    tracks: OnboardingTrack[];
    roles: ProjectRoleWithTrack[];
}

export interface UseRoleTracksResult {
    tracks: OnboardingTrack[];
    roles: ProjectRoleWithTrack[];
    loading: boolean;
    error: boolean;
    /** The role currently being saved, so only its own row shows a pending state. */
    savingRoleId: string | null;
    saveError: string | null;
    setTrack: (roleId: string, trackKey: string | null) => Promise<void>;
}

/**
 * The project's roles and the tracks they can point at, plus the write that changes one.
 *
 * Roles are global rather than per project, so this takes no project id: a PM editing "Scrum
 * Master" is deciding what that role means everywhere, and pretending otherwise by scoping the
 * control to the selected project would imply a per-project override that does not exist.
 *
 * The saved role is patched into local state from the response rather than triggering a refetch.
 * Two reasons: the response is the authoritative new row, and re-reading would flash the whole
 * list back to a loading state for a change that affects exactly one line.
 */
export function useRoleTracks(): UseRoleTracksResult {
    const { data, loading, error } = useFetch<RoleTracksData>(async () => {
        const [tracks, roles] = await Promise.all([
            trackService.fetchTracks(),
            trackService.fetchRoles(),
        ]);
        return { tracks, roles };
    }, []);

    const [overrides, setOverrides] = useState<Record<string, string | null>>({});
    const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const setTrack = useCallback(async (roleId: string, trackKey: string | null) => {
        setSavingRoleId(roleId);
        setSaveError(null);
        try {
            const updated = await trackService.setRoleTrack(roleId, trackKey);
            setOverrides((current) => ({
                ...current,
                [roleId]: updated.onboardingTrackKey ?? null,
            }));
        } catch {
            // Left un-applied on purpose: the row keeps showing what the backend actually holds,
            // so a failed save can never look like it worked.
            setSaveError('Could not save that change. Try again in a moment.');
        } finally {
            setSavingRoleId(null);
        }
    }, []);

    const roles = (data?.roles ?? []).map((role) =>
        role.id in overrides ? { ...role, onboardingTrackKey: overrides[role.id] } : role,
    );

    return {
        tracks: data?.tracks ?? [],
        roles,
        loading,
        error,
        savingRoleId,
        saveError,
        setTrack,
    };
}
