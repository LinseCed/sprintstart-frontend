import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { KnowledgeGapSeverity } from "../types";

import { knowledgeGapService } from "../../../services/knowledgeGapService";
import { useFetch } from "../../../hooks/useFetch";
import { formatRelativeDate } from "../format";
import { SEVERITY_ORDER, SEVERITY_STYLES } from "../severity";
import { SeverityBar, SeveritySummaryBar } from "./SeverityIndicators";

import {
  ShieldAlert,
  Loader2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Filter,
  ArrowUpDown,
  X,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";

// ------------------------------------------------------------------
// PAGE
// ------------------------------------------------------------------

export function KnowledgeGapsPage() {
  const [severityFilter, setSeverityFilter] = useState<KnowledgeGapSeverity[]>([
    "high",
    "medium",
    "low",
  ]);
  const [sortBy, setSortBy] = useState<
    "severity" | "date" | "questions" | "component"
  >("severity");
  const [expandFilters, setExpandFilters] = useState(false);

  const navigate = useNavigate();

  const {
    data: overview,
    loading,
    error,
  } = useFetch(() => knowledgeGapService.fetchKnowledgeGaps(), []);

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

  // Filter by severity
  const filtered = overview.gaps.filter((gap) =>
    severityFilter.includes(gap.severity),
  );

  // Sort based on selected sort option
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "severity":
        return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      case "date":
        return (
          new Date(b.lastUpdated).getTime() -
          new Date(a.lastUpdated).getTime()
        );
      case "questions":
        return b.relatedQuestions - a.relatedQuestions;
      case "component":
        return a.component.localeCompare(b.component);
      default:
        return 0;
    }
  });

  const toggleSeverityFilter = (severity: KnowledgeGapSeverity) => {
    setSeverityFilter((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity],
    );
  };

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="border-b border-app-border bg-app-bg/90">
        <div className="app-page-content py-8">
          <button
            onClick={() => void navigate("/pm-dashboard")}
            className="inline-flex items-center gap-2 text-sm text-app-text-muted hover:text-app-text transition-all mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to PM-Dashboard
          </button>
          <PageHeader
            icon={ShieldAlert}
            title="Knowledge Gaps"
            subtitle="Documentation gaps identified across the organization and prioritized by impact."
            className="mb-6"
          />
          <SeveritySummaryBar gaps={overview.gaps} className="mb-6" />
        </div>
      </div>

      <main className="app-page-content py-8">
        {/* Filter & Sort Controls */}
        <div className="mb-6 rounded-lg border border-app-border bg-app-surface">
          {/* Header / Compact View */}
          <button
            onClick={() => setExpandFilters(!expandFilters)}
            className="w-full flex items-center justify-between p-4 hover:bg-app-surface-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-app-text-muted" />
              <span className="text-sm font-medium text-app-text">
                Filters & Sort
              </span>
              <span className="text-xs text-app-text-muted ml-2">
                ({filtered.length} of {overview.gaps.length})
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-app-text-muted transition-transform ${
                expandFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Expanded Content */}
          {expandFilters && (
            <>
              <div className="border-t border-app-border px-4 py-4 space-y-4">
                {/* Filters */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-app-text-muted" />
                    <span className="text-sm font-medium text-app-text">
                      Severity Filter
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(["high", "medium", "low"] as KnowledgeGapSeverity[]).map(
                      (severity) => {
                        const isSelected = severityFilter.includes(severity);
                        const { badge, label } = SEVERITY_STYLES[severity];

                        return (
                          <button
                            key={severity}
                            onClick={() => toggleSeverityFilter(severity)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                              isSelected
                                ? badge
                                : "bg-app-bg text-app-text-muted border border-app-border"
                            }`}
                          >
                            {label}
                            {isSelected && (
                              <span className="ml-1">✓</span>
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowUpDown className="w-4 h-4 text-app-text-muted" />
                    <span className="text-sm font-medium text-app-text">
                      Sort By
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "severity", label: "Severity" },
                        { value: "date", label: "Last Updated" },
                        { value: "questions", label: "Related Questions" },
                        { value: "component", label: "Component Name" },
                      ] as Array<{ value: typeof sortBy; label: string }>
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setSortBy(value)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                          sortBy === value
                            ? "bg-app-brand text-white"
                            : "bg-app-bg text-app-text-muted border border-app-border hover:border-app-border-strong"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                {(severityFilter.length < 3 || sortBy !== "severity") && (
                  <div className="flex justify-end pt-2 border-t border-app-border">
                    <button
                      onClick={() => {
                        setSeverityFilter(["high", "medium", "low"]);
                        setSortBy("severity");
                      }}
                      className="text-xs text-app-brand hover:text-app-brand/80 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          {filtered.map((gap) => {
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
