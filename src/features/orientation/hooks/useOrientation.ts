import { useCallback, useEffect, useState } from 'react';
import { orientationService } from '../../../services/orientationService';
import type { MyOrientation } from '../types';

type UseOrientationResult = {
    orientation: MyOrientation | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
};

/**
 * Loads orientation for a hire's current task on one project.
 *
 * Kept separate from `useFirstWeek` on purpose: orientation is help, never a
 * gate, so a slow or failed assembly must not hold up the environment and Task 0
 * reads that the first week actually depends on.
 *
 * @param projectId The selected project, or empty string when none is chosen.
 */
export function useOrientation(projectId: string): UseOrientationResult {
    const [orientation, setOrientation] = useState<MyOrientation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (signal?: { cancelled: boolean }) => {
            if (!projectId) {
                setOrientation(null);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const result = await orientationService.fetchMyOrientation(projectId);
                if (signal?.cancelled) return;
                setOrientation(result);
            } catch (err) {
                if (signal?.cancelled) return;
                // A failed load is reported as a failed load. There is no cached
                // or placeholder packet to fall back to, by design.
                setError(err instanceof Error ? err.message : 'Could not load your orientation.');
            } finally {
                if (!signal?.cancelled) setIsLoading(false);
            }
        },
        [projectId]
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

    return { orientation, isLoading, error, reload: () => load() };
}
