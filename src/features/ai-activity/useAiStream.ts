import { useCallback, useRef, useState } from 'react';
import {
    streamAiProgress,
    type AiProgressEvent
} from '../../services/aiStreamService';

/** One line in the activity log: a running stage or a landed item. */
export type AiActivityEntry = {
    key: string;
    kind: 'stage' | 'item' | 'warning';
    label: string;
};

export type AiStreamPhase = 'idle' | 'streaming' | 'done' | 'error';

export type UseAiStreamResult = {
    phase: AiStreamPhase;
    entries: AiActivityEntry[];
    errorMessage: string | null;
    /**
     * Opens the stream at [endpoint]. Resolves when it ends (done or error); the resolved boolean is
     * `true` on a clean finish, `false` on failure, so a caller can decide whether to re-read.
     */
    start: (endpoint: string) => Promise<boolean>;
    reset: () => void;
};

/**
 * Consumes an AI progress stream into an activity log — the reusable "watch it happen" hook.
 *
 * Deliberately holds no artifact: it exposes what the AI *did* (stages, landed items), and the
 * caller re-reads its own endpoint for the settled result once [start] resolves `true`. The stream
 * is a view, so this hook never becomes a second source of truth for the packet/module itself.
 */
export function useAiStream(): UseAiStreamResult {
    const [phase, setPhase] = useState<AiStreamPhase>('idle');
    const [entries, setEntries] = useState<AiActivityEntry[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // A per-hook counter for stable list keys; only ever used for React keys.
    const seq = useRef(0);

    const reset = useCallback(() => {
        setPhase('idle');
        setEntries([]);
        setErrorMessage(null);
    }, []);

    const append = useCallback((event: AiProgressEvent) => {
        const kind = event.type;
        if (kind !== 'stage' && kind !== 'item' && kind !== 'warning') return;
        if (!event.label) return;
        const label = event.label;
        setEntries((current) => [...current, { key: `e${seq.current++}`, kind, label }]);
    }, []);

    const start = useCallback(
        (endpoint: string): Promise<boolean> => {
            setPhase('streaming');
            setEntries([]);
            setErrorMessage(null);
            return new Promise<boolean>((resolve) => {
                void streamAiProgress(endpoint, {
                    onEvent: append,
                    onDone: () => {
                        setPhase('done');
                        resolve(true);
                    },
                    onError: (message) => {
                        setErrorMessage(message);
                        setPhase('error');
                        resolve(false);
                    }
                });
            });
        },
        [append]
    );

    return { phase, entries, errorMessage, start, reset };
}
