import { useCallback, useEffect, useState } from 'react';
import { firstWeekService } from '../../../services/firstWeekService';
import type { MyEnvironment, MyTaskZero } from '../types';

type UseFirstWeekResult = {
    environment: MyEnvironment | null;
    taskZero: MyTaskZero | null;
    isLoading: boolean;
    error: string | null;
    /** Re-reads readiness and Task 0 — readiness arrives on its own, so this is how the hire checks. */
    refresh: () => Promise<void>;
};

/**
 * Loads a hire's first-week state — environment readiness and Task 0 — for one
 * project. The two are read together because Task 0 unlocks on readiness, and
 * reading Task 0 is also what auto-assigns it once the environment is up.
 *
 * Readiness is never self-declared: there is no "I'm ready" action. `refresh`
 * re-reads so a hire who just ran the setup command (which reports on their
 * behalf) sees it land.
 *
 * @param projectId The selected project, or empty string when none is chosen.
 */
export function useFirstWeek(projectId: string): UseFirstWeekResult {
    const [environment, setEnvironment] = useState<MyEnvironment | null>(null);
    const [taskZero, setTaskZero] = useState<MyTaskZero | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (signal?: { cancelled: boolean }) => {
            if (!projectId) {
                setEnvironment(null);
                setTaskZero(null);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const [env, task] = await Promise.all([
                    firstWeekService.fetchEnvironment(projectId),
                    firstWeekService.fetchTaskZero(projectId)
                ]);
                if (signal?.cancelled) return;
                setEnvironment(env);
                setTaskZero(task);
            } catch (err) {
                if (signal?.cancelled) return;
                setError(err instanceof Error ? err.message : 'Could not load your first week.');
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

    return { environment, taskZero, isLoading, error, refresh: () => load() };
}
