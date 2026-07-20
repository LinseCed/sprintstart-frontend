import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
    formatDateTime,
    formatNumber,
    formatRunFinishedAt,
    getEffectiveRunStatus,
    getSourceLabel,
} from "../data.ts";
import type { IngestionRun } from "../types.ts";

type RunHistoryProps = {
    runs: IngestionRun[];
};

/**
 * Displays a historical log of all recent ingestion runs.
 * Useful for tracking when syncs occurred and their overall success or failure status.
 */
export function RunHistory({ runs }: RunHistoryProps) {
    if (runs.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center">
                <h3 className="text-lg font-semibold text-app-text">
                    No ingestion runs found
                </h3>

                <p className="mt-2 text-sm text-app-text-muted">
                    The backend did not return any ingestion runs yet.
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
                {runs.map((run) => (
                    <article
                        key={run.runId}
                        className="grid gap-4 bg-app-surface px-5 py-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] lg:items-center"
                    >
                        <div>
                            <p className="text-sm font-semibold text-app-text">
                                {getSourceLabel(run.sourceSystem)}
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
                    </article>
                ))}
            </div>
        </div>
    );
}

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
