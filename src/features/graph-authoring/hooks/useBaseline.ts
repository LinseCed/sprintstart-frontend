import { useCallback, useEffect, useState } from 'react';
import { baselineService } from '../../../services/baselineService';
import type { BaselineEntry, SetBaselineEntryInput } from '../types';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export interface UseBaseline {
    /** The entry for a competency, or null when it is not on this project's baseline. */
    entryFor: (competencyKey: string) => BaselineEntry | null;
    setExpected: (competencyKey: string, input: SetBaselineEntryInput) => Promise<void>;
    remove: (competencyKey: string) => Promise<void>;
    isBusy: boolean;
    error: string | null;
}

/**
 * A project's baseline, loaded once per project so the studio can show and edit whether each node is
 * expected there. Mutations write through the API and reload — the list is small, and reloading
 * keeps the resolved bar (which the server computes) honest rather than guessing it locally.
 *
 * Disabled (no project, or the caller can't author) yields an empty baseline and no requests.
 */
export function useBaseline(projectId: string, enabled: boolean): UseBaseline {
    const [entries, setEntries] = useState<BaselineEntry[]>([]);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!enabled || !projectId) {
            setEntries([]);
            return;
        }
        try {
            const { entries: loaded } = await baselineService.fetchBaseline(projectId);
            setEntries(loaded);
            setError(null);
        } catch (err) {
            setError(toMessage(err, 'Could not load the baseline.'));
        }
    }, [projectId, enabled]);

    useEffect(() => {
        // React 19 rejects a synchronous first setState in an effect body; defer to a microtask.
        void (async () => {
            await load();
        })();
    }, [load]);

    const entryFor = useCallback(
        (competencyKey: string) => entries.find((entry) => entry.competencyKey === competencyKey) ?? null,
        [entries],
    );

    const mutate = useCallback(
        async (run: () => Promise<unknown>, fallback: string) => {
            setIsBusy(true);
            setError(null);
            try {
                await run();
                await load();
            } catch (err) {
                setError(toMessage(err, fallback));
            } finally {
                setIsBusy(false);
            }
        },
        [load],
    );

    const setExpected = useCallback(
        (competencyKey: string, input: SetBaselineEntryInput) =>
            mutate(
                () => baselineService.setEntry(projectId, competencyKey, input),
                'Could not update the baseline.',
            ),
        [mutate, projectId],
    );

    const remove = useCallback(
        (competencyKey: string) =>
            mutate(
                () => baselineService.removeEntry(projectId, competencyKey),
                'Could not remove this from the baseline.',
            ),
        [mutate, projectId],
    );

    return { entryFor, setExpected, remove, isBusy, error };
}
