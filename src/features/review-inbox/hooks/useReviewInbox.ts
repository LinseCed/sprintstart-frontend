import { useCallback, useEffect, useRef, useState } from 'react';
import { starterWorkService } from '../../../services/starterWorkService';
import type { ProposedStarterWork } from '../../starter-work/types';
import { normalizeInbox } from '../normalize';
import type { GenerationKind, ReviewItemView } from '../types';

const EMPTY_TASKS: ProposedStarterWork = { tasks: [] };

/** While a generator runs, re-read the queue on this cadence so proposals appear as they commit. */
const POLL_INTERVAL_MS = 3000;

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export interface UseReviewInbox {
    items: ReviewItemView[];
    loading: boolean;
    error: string | null;
    /** Which generators are currently running — drives the shared "AI is working" state. */
    working: Set<GenerationKind>;
    /** Notes from the last run of each generator (e.g. "9 tasks mined"). */
    notes: Partial<Record<GenerationKind, string[]>>;
    generate: (kind: GenerationKind) => Promise<void>;
    approve: (item: ReviewItemView) => Promise<void>;
    reject: (item: ReviewItemView, reason?: string) => Promise<void>;
    reload: () => Promise<void>;
}

/**
 * The proposal queue: mined starter tasks, normalized into uniform cards with one generate control
 * and one approve/reject pattern.
 *
 * It was built for two generators. The skill map was the other one, and competencies have no
 * proposal lifecycle any more — they are authored directly in the studio. The grouping stays
 * because it is what a Setup rung deep-links into.
 *
 * A generator is a blocking call that can take ~a minute. `working` exposes which are running so the
 * UI can show real progress instead of a silent wait; while one runs the queue is re-polled, so a
 * proposal shows up the moment it is committed rather than only when the whole run returns.
 */
export function useReviewInbox(): UseReviewInbox {
    const [items, setItems] = useState<ReviewItemView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState<Set<GenerationKind>>(new Set());
    const [notes, setNotes] = useState<Partial<Record<GenerationKind, string[]>>>({});

    const timers = useRef<Map<GenerationKind, ReturnType<typeof setInterval>>>(new Map());

    const loadProposed = useCallback(async () => {
        const tasks = await starterWorkService
            .fetchProposed()
            .catch((): ProposedStarterWork => EMPTY_TASKS);
        setItems(normalizeInbox({ tasks }));
    }, []);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await loadProposed();
        } catch (err) {
            setError(toMessage(err, 'Could not load proposals.'));
        } finally {
            setLoading(false);
        }
    }, [loadProposed]);

    useEffect(() => {
        // React 19 rejects a synchronous first setState in an effect body; defer to a microtask.
        void (async () => {
            await reload();
        })();
        const active = timers.current;
        return () => {
            for (const timer of active.values()) {
                clearInterval(timer);
            }
            active.clear();
        };
    }, [reload]);

    const setBusy = useCallback((kind: GenerationKind, busy: boolean) => {
        setWorking((current) => {
            const next = new Set(current);
            if (busy) {
                next.add(kind);
            } else {
                next.delete(kind);
            }
            return next;
        });
    }, []);

    const generate = useCallback(
        async (kind: GenerationKind) => {
            setError(null);
            setBusy(kind, true);
            const poll = setInterval(() => {
                void loadProposed();
            }, POLL_INTERVAL_MS);
            timers.current.set(kind, poll);
            try {
                const result = await starterWorkService.generate();
                setNotes((current) => ({ ...current, [kind]: result.notes }));
            } catch (err) {
                setError(toMessage(err, 'Could not generate proposals.'));
            } finally {
                clearInterval(poll);
                timers.current.delete(kind);
                await loadProposed();
                setBusy(kind, false);
            }
        },
        [loadProposed, setBusy],
    );

    const approve = useCallback(
        async (item: ReviewItemView) => {
            setError(null);
            try {
                await starterWorkService.approve(item.id);
                await loadProposed();
            } catch (err) {
                setError(toMessage(err, 'Could not approve this proposal.'));
            }
        },
        [loadProposed],
    );

    const reject = useCallback(
        async (item: ReviewItemView, reason?: string) => {
            setError(null);
            try {
                await starterWorkService.reject(item.id, reason);
                await loadProposed();
            } catch (err) {
                setError(toMessage(err, 'Could not reject this proposal.'));
            }
        },
        [loadProposed],
    );

    return {
        items,
        loading,
        error,
        working,
        notes,
        generate,
        approve,
        reject,
        reload,
    };
}
