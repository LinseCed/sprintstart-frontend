import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { GENERATION_META, type GenerationKind } from '../types';

/**
 * The generate button and its honest in-flight state. A generator is a blocking ~minute-long call,
 * and the failure that started this whole rework was that a silent minute read as "nothing
 * happened". So while it runs this shows what it is doing and a live elapsed count — real progress,
 * never a fabricated bar. New proposals stream into the list beneath it as they commit.
 */
export function GenerateControl({
    kind,
    working,
    onGenerate,
}: {
    kind: GenerationKind;
    working: boolean;
    onGenerate: (kind: GenerationKind) => void;
}) {
    const meta = GENERATION_META[kind];

    if (working) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-app-brand-border bg-app-brand-soft px-3 py-2 text-sm text-app-brand-text">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                <span>{meta.workingLabel}…</span>
                <Elapsed />
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onGenerate(kind)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-app-brand px-3.5 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
        >
            <Sparkles className="h-4 w-4" />
            {meta.generateLabel}
        </button>
    );
}

/** A live "0:12" counter so the wait never looks stuck. Reduced-motion users still get the number. */
function Elapsed() {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const started = Date.now();
        const tick = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
        return () => clearInterval(tick);
    }, []);
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return (
        <span className="ml-auto font-mono text-xs tabular-nums text-app-brand-text">
            {minutes}:{rest.toString().padStart(2, '0')}
        </span>
    );
}
