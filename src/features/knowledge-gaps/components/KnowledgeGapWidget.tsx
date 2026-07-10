// ============================================================
// KnowledgeGapWidget.tsx
// Dashboard widget — zeigt Knowledge Gaps sortiert nach Severity
// On click navigiert zu /insights/knowledge-gaps/:gapId
// ============================================================

import { useNavigate } from "react-router-dom";
import { knowledgeGapService } from "../../../services/knowledgeGapService";
import { useFetch } from "../../../hooks/useFetch";
import { formatRelativeDate } from "../format";
import { SEVERITY_ORDER, SEVERITY_STYLES } from "../severity";
import { SeverityBar, SeveritySummaryBar } from "./SeverityIndicators";
import { ClickableCard } from "../../../components/common/ClickableCard";

import {
  ShieldAlert,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// COMPONENT: KnowledgeGapWidget
// ─────────────────────────────────────────────────────────────

export function KnowledgeGapWidget() {
  const navigate = useNavigate();
  const {
    data: overview,
    loading,
    error,
  } = useFetch(() => knowledgeGapService.fetchKnowledgeGaps(), []);

  // ── LOADING ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-2xl border border-app-border bg-app-surface p-6 flex items-center justify-center min-h-48">
        <Loader2 className="w-5 h-5 animate-spin text-app-brand" />
      </div>
    );
  }

  // ── ERROR / EMPTY ──────────────────────────────────────

  if (error || !overview || overview.gaps.length === 0) {
    return (
      <div className="rounded-2xl border border-app-border bg-app-surface p-6 flex flex-col items-center justify-center gap-2 min-h-48 text-center">
        <AlertCircle className="w-5 h-5 text-app-text-muted" />
        <p className="text-sm text-app-text-muted">No knowledge gaps found.</p>
      </div>
    );
  }

  const sorted = [...overview.gaps].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  // Show top in widget
  const preview = sorted.slice(0, 4);

  const gapCount = sorted.length;

  // ── RENDER ─────────────────────────────────────────────

  return (
    <ClickableCard
      onClick={() => void navigate("/insights/knowledge-gaps")}
      aria-label="View all knowledge gaps"
      className="rounded-2xl border border-app-border bg-app-surface p-5 cursor-pointer transition-colors hover:border-app-brand-border-strong hover:bg-app-surface-hover has-[button:hover]:!border-app-border has-[button:hover]:!bg-app-surface"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-app-brand" />
          <span className="text-sm font-semibold text-app-text">
            Knowledge gaps
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-app-text-muted">
          See all ({gapCount})
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Stacked severity overview bar */}
      <SeveritySummaryBar gaps={overview.gaps} className="mb-4" />

      {/* Gap list */}
      <div className="space-y-2">
        {preview.map((gap) => {
          const { badge, label } = SEVERITY_STYLES[gap.severity];
          return (
            <button
              key={gap.id}
              onClick={(event) => {
                event.stopPropagation();
                void navigate(`/insights/knowledge-gaps/${gap.id}`);
              }}
              className="w-full text-left flex items-stretch gap-3 rounded-xl border border-app-border bg-app-surface hover:border-app-border-strong transition-colors p-3"
            >
              <SeverityBar severity={gap.severity} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-app-text truncate">
                    {gap.component}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge}`}
                  >
                    {label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-app-text-muted">
                  {/* Missing types as small chips */}
                  <div className="flex gap-1 flex-wrap">
                    {gap.missingTypes.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="bg-app-surface-muted border border-app-border rounded px-1.5 py-0.5"
                      >
                        {t}
                      </span>
                    ))}
                    {gap.missingTypes.length > 2 && (
                      <span className="bg-app-surface-muted border border-app-border rounded px-1.5 py-0.5">
                        +{gap.missingTypes.length - 2}
                      </span>
                    )}
                  </div>

                  <span className="ml-auto flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatRelativeDate(gap.lastUpdated)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ClickableCard>
  );
}