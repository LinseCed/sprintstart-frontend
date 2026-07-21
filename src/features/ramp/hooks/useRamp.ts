import { useCallback, useEffect, useState } from 'react';
import { rampService } from '../../../services/rampService';
import type { MyRamp } from '../types';

type UseRampResult = {
    ramp: MyRamp | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
};

/**
 * Where a hire stands on the ramp, for one project.
 *
 * @param projectId The selected project, or empty string when none is chosen.
 */
export function useRamp(projectId: string): UseRampResult {
    const [ramp, setRamp] = useState<MyRamp | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (signal?: { cancelled: boolean }) => {
            if (!projectId) {
                setRamp(null);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const result = await rampService.fetchMyRamp(projectId);
                if (signal?.cancelled) return;
                setRamp(result);
            } catch (err) {
                if (signal?.cancelled) return;
                setError(err instanceof Error ? err.message : 'Could not load where you are.');
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

    return { ramp, isLoading, error, reload: () => load() };
}
