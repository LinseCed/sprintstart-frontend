import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { assessmentService, getLastSeenGraphVersion, markGraphVersionSeen } from '../../../services/assessmentService';
import type { NodeState, PathView } from '../types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Loads the authenticated user's competency path for the selected project and
 * flags whether the graph changed since they last saw it (`pathUpdated`), so the
 * page can show a reconciliation notice. The "last seen" version is recorded
 * right after the comparison, so the notice shows once per actual version change.
 *
 * Also tracks each node's state across loads to compute `justChangedKeys` --
 * nodes that flipped state since the previous load (e.g. locked -> available
 * after a passing submission) -- so the path view can play a one-shot unlock
 * animation for exactly those nodes rather than the whole list. Empty on the
 * very first load, since there's no prior state to diff against.
 *
 * Onboarding is per-project: pass the selected `projectId`. Changing it reloads
 * the path for that project, resetting the state diff (a different project is a
 * different graph, so cross-project state changes must not animate).
 *
 * There is nothing to generate. The path is derived on every read from the
 * competency graph, the project's baseline and the user's ledger, so an empty
 * path is a real answer -- the project's baseline selects nothing visible yet --
 * rather than a 404 to recover from.
 *
 * @param projectId The project whose path to load, or `undefined`/empty when no
 *   project is selected yet (the hook then stays idle instead of fetching).
 */
export function useCompetencyPath(projectId: string | undefined) {
    const { profile } = useAuth();
    const profileId = profile?.id;
    const [path, setPath] = useState<PathView | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pathUpdated, setPathUpdated] = useState(false);
    const [justChangedKeys, setJustChangedKeys] = useState<Set<string>>(new Set());
    const previousStatesRef = useRef<Map<string, NodeState> | null>(null);

    const load = useCallback(async () => {
        if (!projectId) {
            setPath(null);
            setError(null);
                setIsLoading(false);
            return;
        }

        setError(null);
        setIsLoading(true);
        try {
            const result = await assessmentService.fetchPath(projectId);

            const previousStates = previousStatesRef.current;
            const changed = new Set<string>();
            if (previousStates) {
                for (const node of result.nodes) {
                    const previousState = previousStates.get(node.key);
                    if (previousState && previousState !== node.state) {
                        changed.add(node.key);
                    }
                }
            }
            previousStatesRef.current = new Map(result.nodes.map(node => [node.key, node.state]));
            setJustChangedKeys(changed);
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
    }, [projectId, profileId]);

    // Switching projects loads a different graph, so the prior per-node state
    // must not leak into the next project's unlock animation.
    useEffect(() => {
        previousStatesRef.current = null;
    }, [projectId]);

    useEffect(() => {
        void (async () => {
            await load();
        })();
    }, [load]);

    return { path, isLoading, error, pathUpdated, justChangedKeys, retry: load };
}
