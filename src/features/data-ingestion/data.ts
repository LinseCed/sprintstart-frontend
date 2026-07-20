import { Database, FileText, GitBranch } from "lucide-react";
import type {
  AiSyncStatus,
  BackendProjectSourceStatus,
  DataSource,
  IngestionRun,
  IngestionRunStatus,
  SourceIngestionStatus,
  SourceMeta,
  SourceStatus,
  SourceSystem,
} from "./types.ts";

export const SOURCE_SYSTEMS: SourceSystem[] = ["GITHUB", "JIRA", "UPLOAD"];

export const SOURCE_META: Record<SourceSystem, SourceMeta> = {
  GITHUB: {
    name: "GitHub Repository",
    type: "GitHub",
    icon: GitBranch,
    description:
      "Indexes repositories, README files, pull requests, issues and source files.",
  },
  JIRA: {
    name: "Jira Project Board",
    type: "Jira",
    icon: Database,
    description:
      "Indexes Jira issues, tasks, epics, comments and project-related metadata.",
  },
  UPLOAD: {
    name: "Uploaded Documentation",
    type: "Upload",
    icon: FileText,
    description:
      "Indexes manually uploaded documentation, markdown files and project knowledge.",
  },
};

export const INGESTION_RUN_LIMIT = 50;
export const DETAILS_RUN_LIMIT = 10;

export function createDataSource(
  sourceSystem: SourceSystem,
  status?: SourceIngestionStatus,
): DataSource {
  const meta = SOURCE_META[sourceSystem];
  const latestIngestedCount = status?.ingestedCount ?? 0;
  const latestUpdatedCount = status?.updatedCount ?? 0;
  const failedCount = status?.failedCount ?? 0;
  const lastRunAt = status?.lastRunTime ?? null;

  const hasNeverSynced = lastRunAt === null;
  const hasErrors = failedCount > 0;
  const sourceStatus = getSourceStatus(
    hasNeverSynced,
    hasErrors,
    status?.status,
  );

  return {
    sourceId: sourceSystem,
    sourceSystem,
    name: meta.name,
    type: meta.type,
    icon: meta.icon,
    status: sourceStatus,
    statusLabel: getSourceStatusLabel(
      hasNeverSynced,
      hasErrors,
      status?.status,
    ),
    ingestionStatus: sourceStatus,
    ingestionStatusLabel: getSourceStatusLabel(
      hasNeverSynced,
      hasErrors,
      status?.status,
    ),
    artifacts: latestIngestedCount,
    lastSync: formatDateTime(lastRunAt),
    nextSync: "Not available",
    errors: failedCount,
    lastRunAt,
    latestIngestedCount,
    latestUpdatedCount,
    totalArtifactCount: latestIngestedCount,
    runIds: [],
    sharesSourceSystem: false,
    failedItems: status?.failedItems ?? [],
    githubRepository: null,
  };
}

/**
 * Merges the latest per-source ingestion status with the latest matching
 * ingestion run to build the `DataSource[]` list consumed by the data
 * ingestion page and by dashboard widgets that surface ingestion health
 * (e.g. {@link IngestionMetrics}). Kept here so every consumer of the
 * `/api/v1/ingestion-status` + `/api/v1/ingestion-runs` endpoints shares the
 * same merge logic instead of re-implementing it.
 *
 * A source is only included once it has run at least once (either a
 * recorded `lastRunTime` in its status, or a matching run in `runs`).
 */
export function buildDataSources(
    sourceStatuses: SourceIngestionStatus[],
    runs: IngestionRun[],
): DataSource[] {
    const statusBySource = new Map<SourceSystem, SourceIngestionStatus>();
    const latestRunBySource = new Map<SourceSystem, IngestionRun>();

    sourceStatuses.forEach((status) => {
        statusBySource.set(status.sourceSystem, status);
    });

    runs.forEach((run) => {
        if (!latestRunBySource.has(run.sourceSystem)) {
            latestRunBySource.set(run.sourceSystem, run);
        }
    });

    return SOURCE_SYSTEMS.filter((sourceSystem) => {
        const status = statusBySource.get(sourceSystem);
        return (
            (status?.lastRunTime !== null &&
                status?.lastRunTime !== undefined) ||
            latestRunBySource.has(sourceSystem)
        );
    }).map((sourceSystem) => {
        const source = createDataSource(
            sourceSystem,
            statusBySource.get(sourceSystem),
        );
        const latestRun = latestRunBySource.get(sourceSystem);

        if (!latestRun) return source;

        const hasErrors = latestRun.failedCount > 0;
        const status = getSourceStatus(
            false,
            hasErrors,
            latestRun.status,
            latestRun.aiSyncStatus,
        );

        return {
            ...source,
            status,
            statusLabel: getSourceStatusLabel(
                false,
                hasErrors,
                latestRun.status,
                latestRun.aiSyncStatus,
            ),
            artifacts: latestRun.ingestedCount,
            lastSync: formatDateTime(latestRun.startedAt),
            errors: latestRun.failedCount,
            lastRunAt: latestRun.startedAt,
            latestIngestedCount: latestRun.ingestedCount,
            latestUpdatedCount: latestRun.updatedCount,
            failedItems: latestRun.failedItems,
        };
    });
}

/**
 * @param aiSyncStatus The latest run's indexing status. A source whose artifacts
 *   never reached the AI index is not "connected and fine", so a failed index
 *   downgrades the card the same way a failed fetch does (see
 *   {@link getEffectiveRunStatus}).
 */
export function getSourceStatus(
  hasNeverSynced: boolean,
  hasErrors: boolean,
  runStatus?: IngestionRunStatus | null,
  aiSyncStatus?: AiSyncStatus | null,
): SourceStatus {
  if (hasNeverSynced) return "warning";
  if (isRunInProgress(runStatus)) return "running";
  if (runStatus === "FAILED" || runStatus === "PARTIAL") return "warning";
  if (aiSyncStatus === "FAILED") return "warning";
  if (aiSyncStatus === "PENDING") return "running";
  if (hasErrors) return "warning";
  return "connected";
}

export function getSourceStatusFromBackend(
  backendStatus?: BackendProjectSourceStatus,
): SourceStatus {
  switch (backendStatus) {
    case "CONNECTED":
      return "connected";
    case "UPDATING":
    case "INDEXING":
      return "running";
    case "DISABLED":
      return "disabled";
    case "OUT_OF_DATE":
    case "FAILED":
    case "ERROR":
    case "DISCONNECTED":
    default:
      return "warning";
  }
}

/**
 * @param aiSyncStatus The latest run's indexing status -- a source is only
 *   labeled "Synced" once its artifacts are actually searchable.
 */
export function getSourceStatusLabel(
  hasNeverSynced: boolean,
  hasErrors: boolean,
  runStatus?: IngestionRunStatus | null,
  aiSyncStatus?: AiSyncStatus | null,
) {
  if (hasNeverSynced) return "Not synced";
  if (isRunInProgress(runStatus)) return "Running";
  if (runStatus === "FAILED") return "Failed";
  if (runStatus === "PARTIAL") return "Partial";
  if (aiSyncStatus === "FAILED") return "Indexing failed";
  if (aiSyncStatus === "PENDING") return "Indexing...";
  if (hasErrors) return "Warning";
  if (runStatus === "COMPLETED") return "Synced";
  return "Connected";
}

export function getBackendSourceStatusLabel(
  backendStatus?: BackendProjectSourceStatus,
) {
  switch (backendStatus) {
    case "CONNECTED":
      return "Connected";
    case "UPDATING":
    case "INDEXING":
      return "Updating";
    case "OUT_OF_DATE":
      return "Out of date";
    case "DISABLED":
      return "Disabled";
    case "FAILED":
    case "ERROR":
      return "Failed";
    case "DISCONNECTED":
      return "Disconnected";
    default:
      return "Connected";
  }
}

export function getRunStatusLabel(status: IngestionRunStatus) {
  switch (status) {
    case "CONNECTED":
    case "RUNNING":
      return "Running";
    case "COMPLETED":
      return "Success";
    case "PARTIAL":
      return "Partial";
    case "FAILED":
      return "Failed";
  }
}

export function getRunStatusTone(status: IngestionRunStatus) {
  if (status === "COMPLETED") return "success";
  if (isRunInProgress(status)) return "running";
  return "warning";
}

export function isRunInProgress(status?: IngestionRunStatus | null) {
  return status === "CONNECTED" || status === "RUNNING";
}

/**
 * Label for a run's AI sync stage, distinct from its (local) run status --
 * a run can read "Success" above while this still reads "Indexing...".
 * Returns null for NOT_APPLICABLE so callers can hide the badge entirely.
 */
export function getAiSyncStatusLabel(status: AiSyncStatus) {
  switch (status) {
    case "PENDING":
      return "Indexing...";
    case "SUCCEEDED":
      return "Indexed";
    case "FAILED":
      return "Indexing failed";
    case "NOT_APPLICABLE":
      return null;
  }
}

export function getAiSyncStatusTone(status: AiSyncStatus) {
  if (status === "SUCCEEDED") return "success";
  if (status === "PENDING") return "running";
  return "warning";
}

/**
 * A run's status as a user actually experiences it, folding the local
 * fetch-and-store phase (`status`) together with the AI indexing phase
 * (`aiSyncStatus`).
 *
 * These are two separate backend fields, and a run reports `COMPLETED` as soon as
 * it has fetched and stored artifacts locally -- even if indexing then failed and
 * *nothing is searchable*. Shown as two side-by-side badges, that read as "the run
 * succeeded" with the real failure demoted to a footnote. So a run is only ever
 * reported as a success here when both phases succeeded; the losing phase decides
 * the label and tone.
 *
 * @returns The label and tone for the single prominent badge, plus a `detail`
 * line naming both phases so the combined verdict is never ambiguous.
 */
export function getEffectiveRunStatus(run: {
  status: IngestionRunStatus;
  aiSyncStatus: AiSyncStatus;
}): {
  label: string;
  tone: "success" | "running" | "warning";
  detail: string | null;
} {
  if (isRunInProgress(run.status)) {
    return { label: "Running", tone: "running", detail: "Fetching from source" };
  }

  if (run.status === "FAILED" || run.status === "PARTIAL") {
    return {
      label: getRunStatusLabel(run.status),
      tone: "warning",
      detail:
        run.aiSyncStatus === "SUCCEEDED"
          ? "Fetch incomplete; what was fetched is indexed"
          : "Fetch incomplete; not searchable",
    };
  }

  switch (run.aiSyncStatus) {
    case "FAILED":
      return {
        label: "Indexing failed",
        tone: "warning",
        detail: "Fetched, but nothing reached the search index",
      };
    case "PENDING":
      return {
        label: "Indexing...",
        tone: "running",
        detail: "Fetched; not searchable until indexing finishes",
      };
    case "SUCCEEDED":
      return { label: "Success", tone: "success", detail: "Fetched and indexed" };
    case "NOT_APPLICABLE":
      return { label: "Success", tone: "success", detail: null };
  }
}

export function getSourceLabel(sourceSystem: SourceSystem) {
  return SOURCE_META[sourceSystem].type;
}

export function formatDateTime(value: string | null) {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRunFinishedAt(
  value: string | null,
  status: IngestionRunStatus,
) {
  if (value) return formatDateTime(value);
  if (isRunInProgress(status)) return "In progress";
  return "Not reported";
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined).format(value);
}
