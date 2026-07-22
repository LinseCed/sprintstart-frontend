import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Database,
  FileText,
  GitBranch,
  Loader2,
} from "lucide-react";
import type {
  AiSyncStatus,
  BackendProjectSourceStatus,
  DataSource,
  IngestionRun,
  IngestionRunStatus,
  SourceIngestionStatus,
  SourceMeta,
  SourceStatus,
  SourceStatusPresentation,
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
    statusView: deriveSourceStatus({
      runStatus: status?.status,
      hasErrors,
      hasNeverSynced,
    }),
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
        const status = getSourceStatus(false, hasErrors, latestRun.status);

        return {
            ...source,
            status,
            statusLabel: getSourceStatusLabel(
                false,
                hasErrors,
                latestRun.status,
            ),
            statusView: deriveSourceStatus({
                runStatus: latestRun.status,
                aiSyncStatus: latestRun.aiSyncStatus,
                hasErrors,
                hasNeverSynced: false,
            }),
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

export function getSourceStatus(
  hasNeverSynced: boolean,
  hasErrors: boolean,
  runStatus?: IngestionRunStatus | null,
): SourceStatus {
  if (hasNeverSynced) return "warning";
  if (isRunInProgress(runStatus)) return "running";
  if (runStatus === "FAILED" || runStatus === "PARTIAL") return "warning";
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

type DeriveSourceStatusInput = {
  backendStatus?: BackendProjectSourceStatus;
  runStatus?: IngestionRunStatus | null;
  aiSyncStatus?: AiSyncStatus | null;
  hasErrors: boolean;
  hasNeverSynced: boolean;
};

/**
 * Collapses the backend source status, the ingestion-run status and the AI-sync
 * status into the single {@link SourceStatusPresentation} the UI renders.
 *
 * This is the one place the three overlapping status concepts are reconciled, so
 * the list and the details drawer always agree and never show two competing
 * badges. Priority is deliberate: an explicitly disabled source wins over any
 * run state; an in-flight sync (backend UPDATING/INDEXING, a running run, or a
 * pending AI index) wins over "needs attention"; failures / out-of-date /
 * never-synced fall to `attention`; everything else is `connected`.
 */
export function deriveSourceStatus({
  backendStatus,
  runStatus,
  aiSyncStatus,
  hasErrors,
  hasNeverSynced,
}: DeriveSourceStatusInput): SourceStatusPresentation {
  if (backendStatus === "DISABLED") {
    return {
      state: "disabled",
      label: "Disabled",
      icon: CircleSlash,
      tone: "neutral",
      spinning: false,
    };
  }

  // "Syncing" must reflect work that is actually in flight. A finished run whose
  // AI-index status is still reported as PENDING (a stale/never-resolved value)
  // must NOT count as syncing, otherwise the source (and the "Syncing now" KPI)
  // reads as busy while nothing is running.
  const isSyncing =
    backendStatus === "UPDATING" ||
    backendStatus === "INDEXING" ||
    isRunInProgress(runStatus);

  if (isSyncing) {
    return {
      state: "syncing",
      label: backendStatus === "INDEXING" ? "Indexing" : "Syncing",
      icon: Loader2,
      tone: "brand",
      spinning: true,
    };
  }

  const needsAttention =
    hasNeverSynced ||
    hasErrors ||
    aiSyncStatus === "FAILED" ||
    runStatus === "FAILED" ||
    runStatus === "PARTIAL" ||
    backendStatus === "OUT_OF_DATE" ||
    backendStatus === "FAILED" ||
    backendStatus === "ERROR" ||
    backendStatus === "DISCONNECTED";

  if (needsAttention) {
    return {
      state: "attention",
      label: hasNeverSynced ? "Not synced" : "Needs attention",
      icon: AlertTriangle,
      tone: "warning",
      spinning: false,
    };
  }

  return {
    state: "connected",
    label: "Connected",
    icon: CheckCircle2,
    tone: "success",
    spinning: false,
  };
}

export function getSourceStatusLabel(
  hasNeverSynced: boolean,
  hasErrors: boolean,
  runStatus?: IngestionRunStatus | null,
) {
  if (hasNeverSynced) return "Not synced";
  if (isRunInProgress(runStatus)) return "Running";
  if (runStatus === "FAILED") return "Failed";
  if (runStatus === "PARTIAL") return "Partial";
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
