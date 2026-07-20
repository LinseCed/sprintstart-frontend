import { useCallback, useEffect, useState } from 'react';
import { humanLoopService } from '../../../services/humanLoopService';
import type { ProjectAttention } from '../types';

type UseAttentionResult = {
    attention: ProjectAttention | null;
    isLoading: boolean;
    error: string | null;
    /** The hire id currently being logged, so only its row shows a spinner. */
    loggingHireId: string | null;
    /** Logs a contact on a hire's behalf, then refreshes the list. */
    logContactFor: (hireId: string) => Promise<void>;
    reload: () => Promise<void>;
};

/**
 * Loads a project's attention list — who needs a human today — for the PM/HR/ADMIN
 * surface, and lets a PM log a contact on a hire's behalf in one click.
 *
 * The list is composed from slice 0's metrics on the backend (waiting-on-review,
 * drifting), so it stays consistent with the hire's own view. Logging a contact
 * re-fetches because a fresh conversation can clear an item from the list.
 *
 * @param projectId The selected project, or empty string when none is chosen.
 */
export function useAttention(projectId: string): UseAttentionResult {
    const [attention, setAttention] = useState<ProjectAttention | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loggingHireId, setLoggingHireId] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!projectId) {
            setAttention(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            setAttention(await humanLoopService.fetchAttention(projectId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load the attention list.');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        // Deferred through a microtask so the first setState isn't synchronous in
        // the effect body (React 19 cascading-render guard).
        void (async () => {
            await reload();
        })();
    }, [reload]);

    const logContactFor = useCallback(
        async (hireId: string) => {
            if (!projectId) return;
            setLoggingHireId(hireId);
            try {
                await humanLoopService.logContact(projectId, { hireId });
                await reload();
            } finally {
                setLoggingHireId(null);
            }
        },
        [projectId, reload]
    );

    return { attention, isLoading, error, loggingHireId, logContactFor, reload };
}
