import { useEffect, useMemo, useState } from 'react';
import type { PathView } from '../../skill-assessment/types';

/**
 * Stages of the unlock payoff, in order.
 *
 * - `focus` — the camera eases to the node that was just passed
 * - `flip` — that node turns over into its mastered state
 * - `travel` — the charge runs outward along its edges
 * - `pop` — each newly reachable node lands
 * - `done` — steady state; nothing is animating
 */
export type UnlockStage = 'idle' | 'focus' | 'flip' | 'travel' | 'pop' | 'done';

const STAGE_DURATIONS: Partial<Record<UnlockStage, number>> = {
    focus: 650,
    flip: 550,
    travel: 700,
    pop: 750
};

const NEXT_STAGE: Partial<Record<UnlockStage, UnlockStage>> = {
    focus: 'flip',
    flip: 'travel',
    travel: 'pop',
    pop: 'done'
};

export type UnlockSequence = {
    stage: UnlockStage;
    /** The competency just earned, or null when no sequence is playing. */
    unlockedKey: string | null;
    /** Nodes this unlock made reachable; they land during `pop`. */
    dependentKeys: Set<string>;
};

/**
 * Drives the unlock payoff as a sequence rather than a single frame.
 *
 * This is the moment the whole design is built around -- a hire passed a check
 * and something opened up -- so it plays out in steps you can follow: the camera
 * finds the node, the node flips, the charge travels along its edges, and the
 * nodes it opened land one after another. A one-frame highlight reads as a
 * rendering artifact; a sequence reads as consequence.
 *
 * The map is unmounted while a module runs, so the passed key arrives in
 * navigation state rather than from a state diff across loads.
 *
 * With reduced motion the sequence resolves to `done` immediately: the graph
 * shows the new state, just without the show.
 *
 * @param unlockedKey Competency key handed back by a passed module, if any.
 * @param path The freshly loaded path, used to derive what the unlock opened.
 * @param enabled False for reduced motion.
 */
export function useUnlockSequence(
    unlockedKey: string | undefined,
    path: PathView | null,
    enabled: boolean
): UnlockSequence {
    const [run, setRun] = useState<{ key: string | null; stage: UnlockStage }>({
        key: null,
        stage: 'idle'
    });

    // `path` is null on the first render after navigating back, so the sequence
    // can only start once there is a graph to play it against. Adjusting state
    // during render (rather than in an effect) is what keeps the first painted
    // frame the pre-unlock one -- an effect would flash the finished state first.
    const activeKey = unlockedKey && path ? unlockedKey : null;
    if (run.key !== activeKey) {
        setRun({ key: activeKey, stage: activeKey ? (enabled ? 'focus' : 'done') : 'idle' });
    }
    const stage = run.key === activeKey ? run.stage : 'idle';

    const dependentKeys = useMemo(() => {
        if (!path || !unlockedKey) return new Set<string>();
        const keys = new Set<string>();
        for (const edge of path.edges) {
            if (edge.from !== unlockedKey) continue;
            const dependent = path.nodes.find(node => node.key === edge.to);
            if (dependent && dependent.state !== 'LOCKED') keys.add(dependent.key);
        }
        return keys;
    }, [path, unlockedKey]);

    useEffect(() => {
        const next = NEXT_STAGE[stage];
        const duration = STAGE_DURATIONS[stage];
        if (!next || duration === undefined) return;

        const timer = window.setTimeout(
            () => setRun(current => (current.stage === stage ? { ...current, stage: next } : current)),
            duration
        );
        return () => window.clearTimeout(timer);
    }, [stage]);

    return { stage, unlockedKey: unlockedKey ?? null, dependentKeys };
}
