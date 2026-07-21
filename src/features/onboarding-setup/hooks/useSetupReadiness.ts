import { useFetch } from '../../../hooks/useFetch';
import { setupService } from '../../../services/setupService';
import { getIngestionRuns, getIngestionStatus } from '../../../services/ingestionService';
import { buildDataSources, INGESTION_RUN_LIMIT } from '../../data-ingestion/data';
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
            fetchCorpusSources(),
        ]);
        return buildLadder(readiness, deriveCorpusRung(sources));
    }, [projectId]);

    return { ladder: data, loading, error };
}

/** The corpus signal is advisory, so a failed ingestion read degrades to "no sources" rather than failing the page. */
async function fetchCorpusSources() {
    try {
        const [status, runs] = await Promise.all([
            getIngestionStatus(),
            getIngestionRuns(INGESTION_RUN_LIMIT),
        ]);
        return buildDataSources(status, runs);
    } catch {
        return [];
    }
}
