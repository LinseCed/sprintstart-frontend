// ============================================================
// IngestionStatusWidget.tsx
// Dashboard widget — surfaces ingestion sync health (last run,
// ingested/updated/failed counts, per-source errors) using the
// same `/api/v1/ingestion-status` + `/api/v1/ingestion-runs`
// endpoints and merge logic as the Data Ingestion page, so the
// PM Dashboard never re-implements ingestion status handling.
// ============================================================

import { ArrowRight, Database, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { buildDataSources, INGESTION_RUN_LIMIT } from "../data.ts";
import { getIngestionRuns, getIngestionStatus } from "../../../services/ingestionService.ts";
import { useFetch } from "../../../hooks/useFetch.ts";
import { IngestionMetrics } from "./IngestionMetrics.tsx";

async function fetchIngestionSources() {
    const [statusData, runData] = await Promise.all([
        getIngestionStatus(),
        getIngestionRuns(INGESTION_RUN_LIMIT),
    ]);

    return buildDataSources(statusData, runData);
}

/**
 * PM Dashboard widget showing ingestion sync health at a glance.
 * Reuses {@link IngestionMetrics} (the same 4 summary cards shown at the
 * top of the Data Ingestion page) so the dashboard and the ingestion page
 * always render identical numbers computed from the same source data.
 */
export function IngestionStatusWidget() {
    const navigate = useNavigate();
    const { data: sources, loading, error } = useFetch(
        () => fetchIngestionSources(),
        [],
    );

    // ── LOADING ──────────────────────────────────────────────

    if (loading) {
        return (
            <div className="rounded-2xl border border-app-border bg-app-surface p-6 flex items-center justify-center min-h-48">
                <Loader2 className="w-5 h-5 animate-spin text-app-brand" />
            </div>
        );
    }

    // ── ERROR ────────────────────────────────────────────────

    if (error || !sources) {
        return (
            <div className="rounded-2xl border border-app-border bg-app-surface p-6 flex flex-col items-center justify-center gap-2 min-h-48 text-center">
                <Database className="w-5 h-5 text-app-text-muted" />
                <p className="text-sm text-app-text-muted">
                    Could not load ingestion status.
                </p>
            </div>
        );
    }

    // ── RENDER ───────────────────────────────────────────────

    return (
        <div className="rounded-2xl border border-app-border bg-app-surface p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-app-brand" />
                    <span className="text-sm font-semibold text-app-text">
                        Data ingestion
                    </span>
                </div>
                <button
                    onClick={() => void navigate("/data-ingestion")}
                    className="flex items-center gap-1 text-xs text-app-text-muted hover:text-app-text transition-colors"
                >
                    View details
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <IngestionMetrics sources={sources} />
        </div>
    );
}
