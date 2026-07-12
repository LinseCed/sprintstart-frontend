// ============================================================
// FaqWidget.tsx
// Dashboard widget — zeigt Top-5 FAQ-Gruppen, klick navigiert
// zur Detailpage /insights/faq/:groupId
// ============================================================

import { useNavigate } from "react-router-dom";
import type { FAQGroup } from "../types";
import { insightsService } from "../../../services/faqService";
import { useFetch } from "../../../hooks/useFetch";
import { ClickableCard } from "../../../components/common/ClickableCard";

import {
  TrendingUp,
  FileText,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// COMPONENT: FaqWidget
// ─────────────────────────────────────────────────────────────

export function FaqWidget() {
  const navigate = useNavigate();
  const {
    data: overview,
    loading,
    error,
  } = useFetch(() => insightsService.fetchFAQGroups(), []);

  // ── LOADING ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-2xl border border-app-border bg-app-surface p-6 flex items-center justify-center min-h-48">
        <Loader2 className="w-5 h-5 animate-spin text-app-brand" />
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────

  if (error || !overview || overview.groups.length === 0) {
    return (
      <div className="rounded-2xl border border-app-border bg-app-surface p-6 flex flex-col items-center justify-center gap-2 min-h-48 text-center">
        <AlertCircle className="w-5 h-5 text-app-text-muted" />
        <p className="text-sm text-app-text-muted">Could not load FAQ data.</p>
      </div>
    );
  }

  // Sort by count descending, take top 5
  const sorted = [...overview.groups]
    .sort((a, b) => b.count - a.count);

  const sliced = sorted.slice(0,5);


  const [hero, ...rest] = sliced;

  const goToDetail = (group: FAQGroup) =>
    void navigate(`/insights/faq/${group.groupId}`);

  // ── RENDER ───────────────────────────────────────────────

  return (
    <ClickableCard
      onClick={() => void navigate("/insights/faq")}
      interactive={false}
      className="rounded-2xl border border-app-border bg-app-surface p-5 cursor-pointer transition-colors hover:border-app-brand-border-strong hover:bg-app-surface-hover has-[button:hover]:!border-app-border has-[button:hover]:!bg-app-surface"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* <Messages className="w-4 h-4 text-app-brand" /> */}
          <span className="text-sm font-semibold text-app-text">
            Recurring questions
          </span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void navigate("/insights/faq");
          }}
          className="flex items-center gap-1 rounded-lg text-xs text-app-text-muted transition-colors hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
        >
          See all ({sorted.length})
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hero card — most asked */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          goToDetail(hero);
        }}
        className="w-full text-left rounded-2xl border border-app-border bg-app-surface hover:border-app-border-strong transition-colors p-4 mb-3 relative overflow-hidden"
      >
        {/* Big count in the corner */}
        <span className="absolute top-4 right-4 text-3xl font-semibold text-app-brand">
          {hero.count}
        </span>

        <div className="inline-flex items-center gap-1.5 bg-app-success-bg text-app-success-text text-xs font-medium px-2.5 py-1 rounded-full mb-3">
          <TrendingUp className="w-3 h-3" />
          Most asked
        </div>

        <p className="text-sm font-semibold text-app-text leading-snug mb-3 pr-12">
          {hero.question}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {hero.topDocuments.map((doc) => (
            <span
              key={doc.id}
              className="flex items-center gap-1 text-xs text-app-text-muted bg-app-surface-muted border border-app-border rounded-full px-2 py-0.5"
            >
              <FileText className="w-3 h-3" />
              {doc.title}
            </span>
          ))}
        </div>
      </button>

      {/* 2x2 grid for the next four */}
      <div className="grid grid-cols-2 gap-2">
        {rest.map((group) => (
          <button
            key={group.groupId}
            onClick={(event) => {
              event.stopPropagation();
              goToDetail(group);
            }}
            className="text-left rounded-xl border border-app-border bg-app-surface hover:border-app-border-strong transition-colors p-3"
          >
            <div className="text-xl font-semibold text-app-brand mb-1">
              {group.count}
            </div>
            <p className="text-xs text-app-text leading-snug line-clamp-2 mb-2">
              {group.question}
            </p>
            {group.topDocuments[0] && (
              <div className="flex items-center gap-1 text-xs text-app-text-muted overflow-hidden">
                <FileText className="w-3 h-3 shrink-0" />
                <span className="truncate">{group.topDocuments[0].title}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </ClickableCard>
  );
}