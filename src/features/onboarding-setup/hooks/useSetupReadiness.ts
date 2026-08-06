import { useFetch } from '../../../hooks/useFetch';
import { setupService } from '../../../services/setupService';
import { getIngestionSourceStatuses } from '../../../services/ingestionService';
import { createSourceFromInstance } from '../../data-ingestion/data';
import { buildLadder, deriveCorpusRung } from '../ladder';
import type { SetupLadder } from '../types';

/**
 * Loads a project's setup readiness: the backend's four onboarding rungs plus the corpus rung
 * composed from the same ingestion data the Data Ingestion page uses. Returns one assembled ladder.
 *
 * Passing an empty `projectId` yields `null` without a request — the caller shows a "pick a project"
 * state instead. The two reads run in parallel; if either fails, `error` is set (the corpus half is
 * treated as best-effort so a healthy backend still renders).
 */
export function useSetupReadiness(projectId: string): {
    ladder: SetupLadder | null;
    loading: boolean;
    error: boolean;
} {
    const { data, loading, error } = useFetch<SetupLadder | null>(async () => {
        if (!projectId) {
            return null;
        }
        const [readiness, sources] = await Promise.all([
            setupService.fetchReadiness(projectId),
            fetchCorpusSources(projectId),
        ]);
        return buildLadder(readiness, deriveCorpusRung(sources));
    }, [projectId]);

    return { ladder: data, loading, error };
}

/**
 * The corpus signal is advisory, so a failed ingestion read degrades to "no sources" rather than
 * failing the page.
 *
 * ⚠️ Scoped to the project the ladder is about, via the per-source-instance status endpoint. The
 * cross-project aggregate would count another team's artifacts towards this project's readiness.
 */
async function fetchCorpusSources(projectId: string) {
    try {
        const instances = await getIngestionSourceStatuses(projectId);
        return instances.map(createSourceFromInstance);
    } catch {
        return [];
    }
}
