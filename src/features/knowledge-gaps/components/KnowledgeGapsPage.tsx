import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type {
  KnowledgeGap,
  KnowledgeGapOverview,
  KnowledgeGapSeverity,
} from "../types";

import { knowledgeGapService } from "../../../services/knowledgeGapService";

import {
  ShieldAlert,
  Loader2,
  AlertCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";

// ------------------------------------------------------------------
// Helpers (gleich wie im Widget)
// ------------------------------------------------------------------

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

function SeverityBar({ severity }: { severity: KnowledgeGapSeverity }) {
  const { bar } = SEVERITY_STYLES[severity];

  return (
    <div className="w-1 self-stretch rounded-full shrink-0 bg-app-border">
      <div className={`w-full rounded-full ${bar}`} style={{ height: "100%" }} />
    </div>
  );
}

function SeveritySummaryBar({ gaps }: { gaps: KnowledgeGap[] }) {
  const total = gaps.length;

  if (total === 0) return null;

  const counts = {
    high: gaps.filter((g) => g.severity === "high").length,
    medium: gaps.filter((g) => g.severity === "medium").length,
    low: gaps.filter((g) => g.severity === "low").length,
  };

  return (
    <div className="mb-6">
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

      <div className="flex items-center gap-3">
        {(["high", "medium", "low"] as KnowledgeGapSeverity[]).map((s) =>
          counts[s] > 0 ? (
            <span
              key={s}
              className="flex items-center gap-1 text-xs text-app-text-muted"
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${SEVERITY_STYLES[s].bar}`}
              />
              {counts[s]} {SEVERITY_STYLES[s].label}
            </span>
          ) : null,
        )}

        <span className="ml-auto text-xs text-app-text-muted">
          {total} total
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// PAGE
// ------------------------------------------------------------------

export function KnowledgeGapsPage() {
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-app-brand" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex flex-col items-center gap-2 py-20">
        <AlertCircle className="w-5 h-5 text-app-text-muted" />
        <p className="text-app-text-muted">
          Could not load knowledge gaps.
        </p>
      </div>
    );
  }

  const sorted = [...overview.gaps].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="border-b border-app-border bg-app-bg/90">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button
            onClick={() => void navigate("/pm-dashboard")}
            className="inline-flex items-center gap-2 text-sm text-app-text-muted hover:text-app-text transition-all mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to PM-Dashboard
          </button>
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="w-6 h-6 text-app-brand" />
            <div>
              <h1 className="text-2xl font-semibold text-app-text">
                Knowledge Gaps
              </h1>
              <p className="text-sm text-app-text-muted">
                Documentation gaps identified across the organization.
              </p>
            </div>
          </div>
          <SeveritySummaryBar gaps={sorted} />
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">

        <div className="space-y-3">
          {sorted.map((gap) => {
            const { badge, label } = SEVERITY_STYLES[gap.severity];

            return (
              <button
                key={gap.id}
                onClick={() =>
                  void navigate(`/insights/knowledge-gaps/${gap.id}`)
                }
                className="w-full text-left flex items-stretch gap-3 rounded-xl border border-app-border bg-app-surface hover:border-app-border-strong transition-colors p-4"
              >
                <SeverityBar severity={gap.severity} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-base font-medium text-app-text">
                      {gap.component}
                    </span>

                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${badge}`}
                    >
                      {label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {gap.missingTypes.map((type) => (
                      <span
                        key={type}
                        className="bg-app-surface-muted border border-app-border rounded px-2 py-1 text-xs"
                      >
                        {type}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-app-text-muted">
                    <span>{gap.relatedQuestions} related questions</span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeDate(gap.lastUpdated)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}