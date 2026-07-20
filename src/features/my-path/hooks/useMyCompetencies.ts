import { useCallback, useEffect, useState } from 'react';
import { myCompetencyService } from '../../../services/myCompetencyService';
import type { MyCompetency } from '../types';

/**
 * Loads the authenticated user's global competency ledger for the skills rail.
 *
 * Deliberately independent of the per-project path load: the ledger is global,
 * so switching projects must not refetch it, and a ledger failure must not take
 * the graph down with it (the rail degrades to an inline message instead).
 */
export function useMyCompetencies() {
    const [competencies, setCompetencies] = useState<MyCompetency[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            setCompetencies(await myCompetencyService.fetchMyCompetencies());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load your skills.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Deferred a microtask so the initial fetch reads as the side-effect it is,
    // rather than a setState cascade inside the effect body.
    useEffect(() => {
        void Promise.resolve().then(() => load());
    }, [load]);

    return { competencies, isLoading, error, reload: load };
}
