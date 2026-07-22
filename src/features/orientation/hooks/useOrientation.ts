import { useCallback, useEffect } from 'react';
import { orientationService } from '../../../services/orientationService';
import { useAiStream, type AiActivityEntry } from '../../ai-activity/useAiStream';
import type { MyOrientation } from '../types';
import { useState } from 'react';

type UseOrientationResult = {
    orientation: MyOrientation | null;
    isLoading: boolean;
    error: string | null;
    /** The live assembly log, populated while the packet streams; empty once settled. */
    activity: AiActivityEntry[];
    isStreaming: boolean;
    reload: () => Promise<void>;
};

/**
 * Loads orientation for a hire's current task on one project, streaming the assembly so the hire
 * watches it happen instead of waiting on a spinner.
 *
 * The stream is a *view*: it drives the activity log, and the authoritative packet always comes from
 * the ordinary `GET /me/orientation` read once the stream ends — which returns the packet the stream
 * just cached (the backend persists on `done`). If the stream drops, the same read is the fallback,
 * so a flaky stream never costs the hire their orientation.
 *
 * Kept separate from `useFirstWeek`: orientation is help, never a gate, so a slow or failed assembly
 * must not hold up the environment and Task 0 reads the first week depends on.
 *
 * @param projectId The selected project, or empty string when none is chosen.
 */
export function useOrientation(projectId: string): UseOrientationResult {
    const [orientation, setOrientation] = useState<MyOrientation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { phase, entries, start, reset } = useAiStream();

    const load = useCallback(
        async (signal?: { cancelled: boolean }) => {
            if (!projectId) {
                setOrientation(null);
                setIsLoading(false);
                reset();
                return;
            }
            setIsLoading(true);
            setError(null);
            // Watch the assembly. We ignore the boolean: whether it finished cleanly or dropped, the
            // authoritative packet is the read below — a dropped stream degrades to a plain fetch.
            const endpoint = `/api/v1/onboarding/me/orientation/stream?projectId=${encodeURIComponent(
                projectId
            )}`;
            await start(endpoint);
            if (signal?.cancelled) return;
            try {
                const result = await orientationService.fetchMyOrientation(projectId);
                if (signal?.cancelled) return;
                setOrientation(result);
            } catch (err) {
                if (signal?.cancelled) return;
                // A failed load is reported as a failed load. There is no cached or placeholder
                // packet to fall back to, by design.
                setError(err instanceof Error ? err.message : 'Could not load your orientation.');
            } finally {
                if (!signal?.cancelled) {
                    setIsLoading(false);
                    reset();
                }
            }
        },
        [projectId, start, reset]
    );

    useEffect(() => {
        const signal = { cancelled: false };
        // Deferred so the first setState isn't synchronous in the effect body.
        void (async () => {
            await load(signal);
        })();
        return () => {
            signal.cancelled = true;
        };
    }, [load]);

    return {
        orientation,
        isLoading,
        error,
        activity: entries,
        isStreaming: phase === 'streaming',
        reload: () => load()
    };
}
