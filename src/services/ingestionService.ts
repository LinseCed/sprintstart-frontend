import type {
    ArtifactType,
    FailedArtifact,
    IngestionRun,
    IngestionRunStatus,
    SourceIngestionStatus,
    SourceSystem,
} from "../features/data-ingestion/types.ts";
import { apiClient } from "./apiClient.ts";

type CanonicalFailedArtifact = {
    sourceId: string | null;
    artifactType: ArtifactType;
    sourceUrl: string | null;
    reason: string;
};

type CanonicalIngestionRunResponse = {
    runId: string;
    sourceSystem: SourceSystem;
    startedAt: string;
    finishedAt: string | null;
    ingestedCount?: number;
    updatedCount?: number;
    failedCount?: number;
    failedItems?: CanonicalFailedArtifact[];
};

type CanonicalSourceIngestionStatusResponse = {
    sourceSystem: SourceSystem;
    lastRunTime: string | null;
    ingestedCount?: number;
    updatedCount?: number;
    failedCount?: number;
    failedItems?: CanonicalFailedArtifact[];
};

const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

function clampLimit(limit: number) {
    return Math.min(Math.max(Math.trunc(limit), MIN_LIMIT), MAX_LIMIT);
}

function mapFailedArtifact(item: CanonicalFailedArtifact): FailedArtifact {
    const sourceReference =
        item.sourceId ?? item.sourceUrl ?? "Unknown artifact";

    return {
        artifactIdentifier: `${item.artifactType}: ${sourceReference}`,
        reason: item.reason,
    };
}

function getRunStatus(run: CanonicalIngestionRunResponse): IngestionRunStatus {
    if (!run.finishedAt) return "RUNNING";

    const failedCount = run.failedCount ?? 0;
    const failedItemCount = run.failedItems?.length ?? 0;

    return failedCount > 0 || failedItemCount > 0 ? "FAILED" : "SUCCESS";
}

function mapIngestionRun(run: CanonicalIngestionRunResponse): IngestionRun {
    const failedItems = run.failedItems ?? [];

    return {
        runId: run.runId,
        sourceSystem: run.sourceSystem,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        ingestedCount: run.ingestedCount ?? 0,
        updatedCount: run.updatedCount ?? 0,
        failedCount: run.failedCount ?? failedItems.length,
        status: getRunStatus(run),
        failedItems: failedItems.map(mapFailedArtifact),
    };
}

function mapIngestionStatus(
    status: CanonicalSourceIngestionStatusResponse,
): SourceIngestionStatus {
    const failedItems = (status.failedItems ?? []).map(mapFailedArtifact);

    return {
        sourceSystem: status.sourceSystem,
        lastRunTime: status.lastRunTime,
        ingestedCount: status.ingestedCount ?? 0,
        updatedCount: status.updatedCount ?? 0,
        failedCount: status.failedCount ?? failedItems.length,
        failedItems,
    };
}

/**
 * Fetches the most recent ingestion runs.
 *
 * @param limit - Maximum number of ingestion runs to fetch. Must be between 1 and 100.
 * @returns A promise resolving to an array of IngestionRun objects.
 * @throws Error if the backend request fails.
 */
export async function getIngestionRuns(limit = 50): Promise<IngestionRun[]> {
    const safeLimit = clampLimit(limit);
    const data = await apiClient.fetch<CanonicalIngestionRunResponse[]>(
        `/api/v1/ingestion-runs?limit=${safeLimit}`,
    );

    return data.map(mapIngestionRun);
}

/**
 * Fetches the latest ingestion status for all available source systems.
 *
 * @returns A promise resolving to an array of SourceIngestionStatus objects.
 * @throws Error if the backend request fails.
 */
export async function getIngestionStatus(): Promise<SourceIngestionStatus[]> {
    const data = await apiClient.fetch<
        CanonicalSourceIngestionStatusResponse[]
    >("/api/v1/ingestion-status");

    return data.map(mapIngestionStatus);
}
