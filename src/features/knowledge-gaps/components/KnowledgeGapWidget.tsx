// ============================================================
// KnowledgeGapWidget.tsx
// Dashboard widget — zeigt Knowledge Gaps sortiert nach Severity
// On click navigiert zu /insights/knowledge-gaps/:gapId
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type {
  KnowledgeGapOverview,
  KnowledgeGap,
  KnowledgeGapSeverity,
} from "../../../features/knowledge-gaps/types";
import { knowledgeGapService } from "../../../services/knowledgeGapService";

import {
  ShieldAlert,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<KnowledgeGapSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const SEVERITY_STYLES: Record<
  KnowledgeGapSeverity,
  { bar: string; badge: string; label: string }
> = {
  high: {
    bar: "bg-red-400",
    badge: "bg-red-100 text-red-700",
    label: "High",
  },
  medium: {
    bar: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
    label: "Medium",
  },
  low: {
    bar: "bg-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Low",
  },
};

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENT: SeverityBar
// Visual severity indicator — thin colored left border + bar
// ─────────────────────────────────────────────────────────────

function SeverityBar({ severity }: { severity: KnowledgeGapSeverity }) {
  const { bar } = SEVERITY_STYLES[severity];
  return (
    <div className="w-1 self-stretch rounded-full shrink-0 bg-app-border">
      <div className={`w-full rounded-full ${bar}`} style={{ height: "100%" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENT: SeveritySummaryBar
// Stacked bar showing ratio of high / medium / low
// ─────────────────────────────────────────────────────────────

function SeveritySummaryBar({ gaps }: { gaps: KnowledgeGap[] }) {
  const total = gaps.length;
  if (total === 0) return null;

  const counts = {
    high: gaps.filter((g) => g.severity === "high").length,
    medium: gaps.filter((g) => g.severity === "medium").length,
    low: gaps.filter((g) => g.severity === "low").length,
  };

  return (
    <div className="mb-4">
      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-2">
        {counts.high > 0 && (
          <div
            className="bg-red-400 rounded-full"
            style={{ width: `${(counts.high / total) * 100}%` }}
          />
        )}
        {counts.medium > 0 && (
          <div
            className="bg-amber-400 rounded-full"
            style={{ width: `${(counts.medium / total) * 100}%` }}
          />
        )}
        {counts.low > 0 && (
          <div
            className="bg-emerald-400 rounded-full"
            style={{ width: `${(counts.low / total) * 100}%` }}
          />
        )}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3">
        {(["high", "medium", "low"] as KnowledgeGapSeverity[]).map((s) =>
          counts[s] > 0 ? (
            <span key={s} className="flex items-center gap-1 text-xs text-app-text-muted">
              <span
                className={`inline-block w-2 h-2 rounded-full ${SEVERITY_STYLES[s].bar}`}
              />
              {counts[s]} {SEVERITY_STYLES[s].label}
            </span>
          ) : null,
        )}
        <span className="ml-auto text-xs text-app-text-muted">{total} total</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: KnowledgeGapWidget
// ─────────────────────────────────────────────────────────────

export function KnowledgeGapWidget() {
  const [overview, setOverview] = useState<KnowledgeGapOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await knowledgeGapService.fetchKnowledgeGaps();
        setOverview(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

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
    <div className="rounded-2xl border border-app-border bg-app-surface p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-app-brand" />
          <span className="text-sm font-semibold text-app-text">
            Knowledge gaps
          </span>
        </div>
        <button
          onClick={() => void navigate("/insights/knowledge-gaps")}
          className="flex items-center gap-1 text-xs text-app-text-muted hover:text-app-text transition-colors"
        >
          See all ({gapCount})
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stacked severity overview bar */}
      <SeveritySummaryBar gaps={overview.gaps} />

      {/* Gap list */}
      <div className="space-y-2">
        {preview.map((gap) => {
          const { badge, label } = SEVERITY_STYLES[gap.severity];
          return (
            <button
              key={gap.id}
              onClick={() => void navigate(`/insights/knowledge-gaps/${gap.id}`)}
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
    </div>
  );
}