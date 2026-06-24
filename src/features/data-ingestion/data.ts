import { Database, FileText, GitBranch } from "lucide-react";
import type {
    DataSource,
    SourceIngestionStatus,
    SourceMeta,
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

    return {
        sourceSystem,
        name: meta.name,
        type: meta.type,
        icon: meta.icon,
        status: hasNeverSynced || hasErrors ? "warning" : "connected",
        statusLabel: getSourceStatusLabel(hasNeverSynced, hasErrors),
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

export function getSourceStatusLabel(
    hasNeverSynced: boolean,
    hasErrors: boolean,
) {
    if (hasNeverSynced) return "Not synced";
    if (hasErrors) return "Warning";
    return "Connected";
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

export function formatNumber(value: number) {
    return new Intl.NumberFormat(undefined).format(value);
}
