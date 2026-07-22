import { useCallback, useEffect, useState } from 'react';
import { firstWeekService } from '../../../services/firstWeekService';
import type { MyTaskZero } from '../types';

type UseFirstWeekResult = {
    taskZero: MyTaskZero | null;
    isLoading: boolean;
    error: string | null;
    /** Re-reads Task 0 — reading it is also what auto-assigns one on the first read. */
    refresh: () => Promise<void>;
};

/**
 * Loads a hire's first-week state — just Task 0 — for one project.
 *
 * There is no environment-readiness read: Task 0 is available from day one, and
 * reading it is what auto-assigns one. Getting the project running is part of the
 * task, not a gate in front of it.
 *
 * @param projectId The selected project, or empty string when none is chosen.
 */
export function useFirstWeek(projectId: string): UseFirstWeekResult {
    const [taskZero, setTaskZero] = useState<MyTaskZero | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(
        async (signal?: { cancelled: boolean }) => {
            if (!projectId) {
                setTaskZero(null);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const task = await firstWeekService.fetchTaskZero(projectId);
                if (signal?.cancelled) return;
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

    return { taskZero, isLoading, error, refresh: () => load() };
}
