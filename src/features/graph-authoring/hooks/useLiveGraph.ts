import { useCallback, useEffect, useState } from 'react';
import { competencyGraphService } from '../../../services/competencyGraphService';
import type { LiveGraph } from '../types';

const EMPTY_GRAPH: LiveGraph = { competencies: [] };

/**
 * Loads the whole live competency vocabulary — the thing a PM authors.
 *
 * `reload` is handed to every write path, so the list re-reads after an edit rather than each
 * component keeping its own copy that would drift.
 */
export function useLiveGraph() {
    const [graph, setGraph] = useState<LiveGraph>(EMPTY_GRAPH);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            setGraph(await competencyGraphService.fetchGraph());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load the competencies.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(() => load());
    }, [load]);

    return { graph, isLoading, error, reload: load };
}
