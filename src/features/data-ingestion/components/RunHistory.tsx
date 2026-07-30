import {
    formatDateTime,
    formatNumber,
    formatRunFinishedAt,
    getEffectiveRunStatus,
    getRunSourceLabel,
} from "../data.ts";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Loader2,
} from "lucide-react";
import type { IngestionRun } from "../types.ts";

type RunHistoryProps = {
    runs: IngestionRun[];
    selectedRunId?: string | null;
    onSelectRun?: (run: IngestionRun) => void;
    /** Maps a run to its repository label; falls back to the source-system label. */
    sourceLabelByRunId?: Map<string, string>;
    /** Shown in the empty state when the emptiness is caused by active filters. */
    isFiltered?: boolean;
};

/**
 * Displays a historical log of all recent ingestion runs.
 * Useful for tracking when syncs occurred and their overall success or failure status.
 */
const TONE_STYLES = {
    success: {
        icon: CheckCircle2,
        className:
            "border border-app-success-border bg-app-success-bg text-app-success-text",
    },
    running: {
        icon: Loader2,
        className: "border border-transparent bg-app-brand-soft text-app-brand-text",
    },
    warning: {
        icon: AlertTriangle,
        className:
            "border border-app-warning-border bg-app-warning-bg text-app-warning-text",
    },
} as const;

/**
 * One run's overall status: a single badge whose verdict already accounts for
 * both the local fetch and the AI indexing phase (see `getEffectiveRunStatus`),
 * with the per-phase detail as supporting text.
 *
 * Previously the two phases were two equal side-by-side badges, so an indexing
 * failure sat next to a green "Success" and read as a footnote. Only one badge
 * is prominent now, and it is never green unless the run is genuinely done.
 */
function RunStatusCell({ run }: { run: IngestionRun }) {
    const { label, tone, detail } = getEffectiveRunStatus(run);
    const { icon: Icon, className } = TONE_STYLES[tone];

    return (
        <div data-testid={`run-status-${run.runId}`}>
            <span
                // The run-level failure reason on hover; the full text is in the drawer.
                title={run.failureReason ?? undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className}`}
            >
                <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${tone === "running" ? "animate-spin" : ""}`}
                    aria-hidden="true"
                />
                {label}
            </span>

            {detail && (
                <p className="mt-1 text-xs text-app-text-subtle">{detail}</p>
            )}

            {run.aiSyncStatus === "FAILED" && run.aiSyncFailureReason && (
                <p className="mt-1 break-words text-xs text-app-warning-text">
                    {run.aiSyncFailureReason}
                </p>
            )}
        </div>
    );
}

export function RunHistory({
    runs,
    selectedRunId = null,
    onSelectRun,
    sourceLabelByRunId,
    isFiltered = false,
}: RunHistoryProps) {
    if (runs.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center">
                <h3 className="text-lg font-semibold text-app-text">
                    {isFiltered
                        ? 'No runs match these filters'
                        : 'No ingestion runs found'}
                </h3>

                <p className="mt-2 text-sm text-app-text-muted">
                    {isFiltered
                        ? 'Try a different status or repository, or reset the filters.'
                        : 'The backend did not return any ingestion runs yet.'}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-app-border">
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-app-border bg-app-bg-soft px-5 py-3 text-xs font-semibold uppercase tracking-wide text-app-text-subtle lg:grid">
                <span>Source</span>
                <span>Status</span>
                <span>Started</span>
                <span>Finished</span>
                <span>Counts</span>
            </div>

            <div className="divide-y divide-app-border">
                {runs.map((run) => {
                    const isSelected = selectedRunId === run.runId;

                    return (
                        <button
                            key={run.runId}
                            type="button"
                            onClick={() => onSelectRun?.(run)}
                            aria-pressed={isSelected}
                            className={`grid w-full gap-4 px-5 py-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-app-focus lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] lg:items-center ${
                                isSelected
                                    ? "bg-app-brand-soft"
                                    : "bg-app-surface hover:bg-app-surface-hover"
                            }`}
                        >
                            <div>
                                <p className="text-sm font-semibold text-app-text">
                                    {getRunSourceLabel(run, sourceLabelByRunId)}
                                </p>

                                <p className="mt-1 break-all text-xs text-app-text-subtle">
                                    {run.runId}
                                </p>
                            </div>

                            <RunStatusCell run={run} />

                            <div>
                                <p className="text-xs uppercase tracking-wide text-app-text-subtle lg:hidden">
                                    Started
                                </p>

                                <p className="mt-1 text-sm text-app-text">
                                    {formatDateTime(run.startedAt)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wide text-app-text-subtle lg:hidden">
                                    Finished
                                </p>

                                <p className="mt-1 text-sm text-app-text">
                                    {formatRunFinishedAt(
                                        run.finishedAt,
                                        run.status,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wide text-app-text-subtle lg:hidden">
                                    Counts
                                </p>

                                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full bg-app-bg-soft px-2.5 py-1 text-app-text-muted">
                                        Ingested: {formatNumber(run.ingestedCount)}
                                    </span>

                                    <span className="rounded-full bg-app-bg-soft px-2.5 py-1 text-app-text-muted">
                                        Updated: {formatNumber(run.updatedCount)}
                                    </span>

                                    {run.deletedCount > 0 && (
                                        <span className="rounded-full bg-app-bg-soft px-2.5 py-1 text-app-text-muted">
                                            Deleted: {formatNumber(run.deletedCount)}
                                        </span>
                                    )}

                                    <span
                                        className={`rounded-full px-2.5 py-1 ${
                                            run.failedCount > 0
                                                ? "bg-app-warning-bg text-app-warning-text"
                                                : "bg-app-bg-soft text-app-text-muted"
                                        }`}
                                    >
                                        Failed: {formatNumber(run.failedCount)}
                                    </span>
                                </div>
                            </div>

                            <ChevronRight
                                className={`hidden h-5 w-5 justify-self-end text-app-text-disabled transition group-hover:translate-x-1 lg:block ${
                                    isSelected ? "text-app-brand" : ""
                                }`}
                            />
                        </button>
                    );
                })}
            </div>

        </div>
    );
}


