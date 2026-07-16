import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { assessmentService, getLastSeenGraphVersion, markGraphVersionSeen } from '../../../services/assessmentService';
import type { PathView } from '../types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Loads the authenticated user's competency path and flags whether the graph
 * changed since they last saw it (`pathUpdated`), so the page can show a
 * reconciliation notice. The "last seen" version is recorded right after the
 * comparison, so the notice shows once per actual version change.
 */
export function useCompetencyPath() {
    const { profile } = useAuth();
    const profileId = profile?.id;
    const [path, setPath] = useState<PathView | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pathUpdated, setPathUpdated] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await assessmentService.fetchPath();
            setPath(result);

            if (profileId) {
                const lastSeen = getLastSeenGraphVersion(profileId);
                setPathUpdated(lastSeen !== null && lastSeen !== result.graphVersion);
                markGraphVersionSeen(profileId, result.graphVersion);
            }
        } catch (err) {
            setError(toMessage(err, 'Could not load your path.'));
        } finally {
            setIsLoading(false);
        }
    }, [profileId]);

    useEffect(() => {
        void (async () => {
            await load();
        })();
    }, [load]);

    return { path, isLoading, error, pathUpdated, retry: load };
}
