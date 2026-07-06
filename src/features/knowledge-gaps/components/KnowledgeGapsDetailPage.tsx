// ============================================================
// KnowledgeGapsDetailPage.tsx
// Route: /insights/knowledge-gaps/:gapId
// ============================================================

import { useParams, useNavigate } from "react-router-dom";
import { knowledgeGapService } from "../../../services/knowledgeGapService";
import { useFetch } from "../../../hooks/useFetch";
import { formatDate } from "../format";
import { SEVERITY_STYLES } from "../severity";

import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  User,
  MessageCircleQuestion,
  ShieldAlert,
  Wrench,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// COMPONENT: KnowledgeGapsDetailPage
// ─────────────────────────────────────────────────────────────

export function KnowledgeGapsDetailPage() {
  const { gapId } = useParams<{ gapId: string }>();
  const navigate = useNavigate();

  const {
    data: gap,
    loading,
    error,
  } = useFetch(
    () => knowledgeGapService.fetchKnowledgeGap(gapId ?? ""),
    [gapId],
  );

  // ── LOADING ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-app-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-app-brand" />
          <p className="text-sm">Loading gap details...</p>
        </div>
      </div>
    );
  }

  // ── ERROR ──────────────────────────────────────────────

  if (error || !gap) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-app-danger-solid mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-app-text mb-2">
            Could not load gap
          </h2>
          <p className="text-sm text-app-text-muted mb-6">
            This knowledge gap may no longer exist.
          </p>
          <button
            onClick={() => void navigate(-1)}
            className="px-5 py-2.5 rounded-xl bg-app-brand hover:bg-app-brand-hover text-white text-sm font-medium transition-all"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const { badge, bar, longLabel, ring } = SEVERITY_STYLES[gap.severity];

  // ── RENDER ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-app-bg">
      {/* ── HEADER ──────────────────────────────────────── */}
      <div className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
        <div className="app-page-content py-4">
          <button
            onClick={() => void navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-app-text-muted hover:text-app-text transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-app-text mb-1">
                {gap.component}
              </h1>
              <div className="flex items-center gap-2 text-xs text-app-text-muted">
                <Clock className="w-3.5 h-3.5" />
                Last updated {formatDate(gap.lastUpdated)}
              </div>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${badge}`}>
              {longLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <main className="app-page-content py-8 pb-24 space-y-4">

        {/* Severity + stats hero */}
        <div className={`rounded-2xl border bg-app-surface p-5 ${ring}`}>
          {/* Severity bar full width */}
          <div className="h-1.5 rounded-full bg-app-border mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full ${bar}`}
              style={{
                width:
                  gap.severity === "high"
                    ? "100%"
                    : gap.severity === "medium"
                      ? "60%"
                      : "30%",
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-app-surface-muted rounded-xl p-3">
              <div className="text-xs text-app-text-muted mb-1 flex items-center gap-1">
                <MessageCircleQuestion className="w-3.5 h-3.5" />
                Related questions
              </div>
              <div className="text-2xl font-semibold text-app-text">
                {gap.relatedQuestions}
              </div>
            </div>
            <div className="bg-app-surface-muted rounded-xl p-3">
              <div className="text-xs text-app-text-muted mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5" />
                Missing doc types
              </div>
              <div className="text-2xl font-semibold text-app-text">
                {gap.missingTypes.length}
              </div>
            </div>
          </div>
        </div>

        {/* Missing types */}
        <div className="rounded-2xl border border-app-border bg-app-surface p-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            Missing documentation types
          </div>
          <div className="flex flex-wrap gap-2">
            {gap.missingTypes.map((t) => (
              <span
                key={t}
                className="text-sm text-app-text bg-app-surface-muted border border-app-border rounded-lg px-3 py-1.5"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Owners */}
        <div className="rounded-2xl border border-app-border bg-app-surface p-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-3">
            <User className="w-3.5 h-3.5" />
            Owners ({gap.owners.length})
          </div>
          <div className="space-y-2">
            {gap.owners.map((owner) => (
              <div
                key={owner.id}
                className="flex items-center gap-3 bg-app-surface-muted rounded-xl p-3"
              >
                {/* Avatar initials */}
                <div className="w-8 h-8 rounded-full bg-app-brand-soft flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-app-brand-text">
                    {owner.firstname[0]}{owner.lastname[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-app-text">
                    {owner.firstname} {owner.lastname}
                  </div>
                  <div className="text-xs text-app-text-muted">
                    @{owner.username} · {owner.workingArea}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
