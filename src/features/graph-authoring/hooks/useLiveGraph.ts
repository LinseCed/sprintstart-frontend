import { useCallback, useEffect, useState } from 'react';
import { competencyGraphService } from '../../../services/competencyGraphService';
import type { LiveGraph } from '../types';

const EMPTY_GRAPH: LiveGraph = { competencies: [], edges: [], graphVersion: 0 };

/**
 * Loads the whole live competency graph — the thing a PM authors.
 *
 * Deliberately not `useCompetencyPath`. That loads one hire's projection: scoped to a project's
 * approved baseline, carrying per-user node state, resolved at that hire's pinned version. A PM
 * needs the graph as it actually is, which is global and unfiltered.
 *
 * `reload` is handed to every write path, so the canvas re-reads after an edit rather than each
 * component keeping its own copy of a graph that would drift.
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
            setError(err instanceof Error ? err.message : 'Could not load the competency graph.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void Promise.resolve().then(() => load());
    }, [load]);

    return { graph, isLoading, error, reload: load };
}
