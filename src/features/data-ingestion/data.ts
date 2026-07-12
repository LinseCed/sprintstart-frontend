import { Database, FileText, GitBranch } from "lucide-react";
import type {
  BackendProjectSourceStatus,
  DataSource,
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
    artifacts: latestIngestedCount,
    lastSync: formatDateTime(lastRunAt),
    nextSync: "Not available",
    errors: failedCount,
    description: meta.description,
    lastRunAt,
    latestIngestedCount,
    latestUpdatedCount,
    failedItems: status?.failedItems ?? [],
  };
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
