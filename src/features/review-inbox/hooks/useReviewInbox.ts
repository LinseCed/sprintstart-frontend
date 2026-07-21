import { useCallback, useEffect, useRef, useState } from 'react';
import { competencyGraphService } from '../../../services/competencyGraphService';
import { blueprintService } from '../../../services/blueprintService';
import { starterWorkService } from '../../../services/starterWorkService';
import type { ProposedGraph } from '../../graph-authoring/types';
import type { ProposedBlueprints } from '../../blueprint-authoring/types';
import type { ProposedStarterWork } from '../../starter-work/types';
import { normalizeInbox } from '../normalize';
import type { GenerationKind, ReviewItemView } from '../types';

const EMPTY_GRAPH: ProposedGraph = { competencies: [], edges: [] };
const EMPTY_BASELINE: ProposedBlueprints = { blueprints: [] };
const EMPTY_TASKS: ProposedStarterWork = { tasks: [] };

/** While a generator runs, re-read the queues on this cadence so proposals appear as they commit. */
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
    /** Notes from the last run of each generator (e.g. "12 competencies proposed"). */
    notes: Partial<Record<GenerationKind, string[]>>;
    generate: (kind: GenerationKind) => Promise<void>;
    approve: (item: ReviewItemView) => Promise<void>;
    reject: (item: ReviewItemView, reason?: string) => Promise<void>;
    /** Approves every proposed competency and edge as one graph version, so nodes arrive wired. */
    approveSkillMap: () => Promise<void>;
    reload: () => Promise<void>;
}

/**
 * One queue for the three proposal generators (skill map, baseline, starter tasks). Reads all three
 * `/proposed` endpoints, normalizes them into uniform cards, and routes approve/reject to the right
 * service by kind — so a PM reviews everything the AI proposed in one place with one pattern.
 *
 * A generator is a blocking call that can take ~a minute. `working` exposes which are running so the
 * UI can show real progress instead of a silent wait; while one runs the queues are re-polled, so a
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
        // A failing queue degrades to empty rather than blanking the other two.
        const [graph, baseline, tasks] = await Promise.all([
            competencyGraphService.fetchProposed().catch((): ProposedGraph => EMPTY_GRAPH),
            blueprintService.fetchProposed().catch((): ProposedBlueprints => EMPTY_BASELINE),
            starterWorkService.fetchProposed().catch((): ProposedStarterWork => EMPTY_TASKS),
        ]);
        setItems(normalizeInbox({ graph, baseline, tasks }));
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

    const runGenerator = useCallback(async (kind: GenerationKind): Promise<string[]> => {
        switch (kind) {
            case 'skill-map': {
                const result = await competencyGraphService.generate();
                return result.notes;
            }
            case 'baseline': {
                const result = await blueprintService.generate();
                return result.outcomes.map((outcome) =>
                    [`${outcome.scope}: ${outcome.status}`, outcome.message].filter(Boolean).join(' — '),
                );
            }
            case 'starter-tasks': {
                const result = await starterWorkService.generate();
                return result.notes;
            }
        }
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
                const runNotes = await runGenerator(kind);
                setNotes((current) => ({ ...current, [kind]: runNotes }));
            } catch (err) {
                setError(toMessage(err, 'Could not generate proposals.'));
            } finally {
                clearInterval(poll);
                timers.current.delete(kind);
                await loadProposed();
                setBusy(kind, false);
            }
        },
        [loadProposed, runGenerator, setBusy],
    );

    const approve = useCallback(
        async (item: ReviewItemView) => {
            setError(null);
            try {
                switch (item.kind) {
                    case 'competency':
                        await competencyGraphService.approveCompetency(item.id);
                        break;
                    case 'edge':
                        await competencyGraphService.approveEdge(item.id);
                        break;
                    case 'baseline':
                        await blueprintService.approveCompetency(item.id);
                        break;
                    case 'task':
                        await starterWorkService.approve(item.id);
                        break;
                }
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
                switch (item.kind) {
                    case 'competency':
                        await competencyGraphService.rejectCompetency(item.id, reason);
                        break;
                    case 'edge':
                        await competencyGraphService.rejectEdge(item.id, reason);
                        break;
                    case 'baseline':
                        await blueprintService.rejectCompetency(item.id, reason);
                        break;
                    case 'task':
                        await starterWorkService.reject(item.id, reason);
                        break;
                }
                await loadProposed();
            } catch (err) {
                setError(toMessage(err, 'Could not reject this proposal.'));
            }
        },
        [loadProposed],
    );

    const approveSkillMap = useCallback(async () => {
        const competencyIds = items.filter((item) => item.kind === 'competency').map((item) => item.id);
        const edgeIds = items.filter((item) => item.kind === 'edge').map((item) => item.id);
        if (competencyIds.length === 0 && edgeIds.length === 0) {
            return;
        }
        setError(null);
        try {
            await competencyGraphService.approveBatch(competencyIds, edgeIds);
            await loadProposed();
        } catch (err) {
            setError(toMessage(err, 'Could not approve the skill map.'));
        }
    }, [items, loadProposed]);

    return {
        items,
        loading,
        error,
        working,
        notes,
        generate,
        approve,
        reject,
        approveSkillMap,
        reload,
    };
}
