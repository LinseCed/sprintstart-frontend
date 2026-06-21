// ============================================================
// FaqPage.tsx
// ============================================================

import { useState, useEffect } from "react";
import type {
    FAQOverview,
    FAQDetail,
    FAQGroup,
    FAQQuestion,
    FAQAskedBy,
    FAQDocument,
    FAQDocumentPreview,
} from '../../features/faq/types';
import { insightsService } from "../../services/faqService.ts";

import {
  MessageCircleQuestion,
  ShieldAlert,
  ChevronDown,
  FileText,
  ExternalLink,
  User,
  Loader2,
  AlertCircle,
  MessageSquareMore,
  BookOpen,
} from "lucide-react";

type LoadingState = "idle" | "loading" | "success" | "error";

// ─────────────────────────────────────────────────────────────
// HELPER: format ISO date string to readable date
// ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────
// HELPER COMPONENT: RankBadge
// ─────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: "bg-amber-100 text-amber-800",
    2: "bg-gray-100 text-gray-600",
    3: "bg-orange-100 text-orange-800",
  };
  const style = styles[rank] ?? "bg-app-surface-muted text-app-text-muted";

  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5 ${style}`}
    >
      {rank}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPER COMPONENT: StatCard
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  small?: boolean;
}

function StatCard({ label, value, small = false }: StatCardProps) {
  return (
    <div className="bg-app-surface-muted rounded-xl p-4">
      <div className="text-xs text-app-text-muted mb-1">{label}</div>
      <div
        className={`font-semibold text-app-text ${small ? "text-base leading-snug" : "text-2xl"}`}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPER COMPONENT: FAQDetailPanel
// ─────────────────────────────────────────────────────────────

interface FAQDetailPanelProps {
  groupId: string;
}

function FAQDetailPanel({ groupId }: FAQDetailPanelProps) {
  const [detail, setDetail] = useState<FAQDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await insightsService.fetchFAQGroup(groupId);
      setDetail(data);
      setLoading(false);
    };
    void load();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-app-text-muted text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading details...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-4 text-sm text-app-text-muted">
        No details available.
      </div>
    );
  }

  return (
    <div className="px-5 pb-5 pt-3 border-t border-app-border">
      {/* Sensitive info header */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 uppercase tracking-widest mb-4">
        <ShieldAlert className="w-3.5 h-3.5" />
        Sensitive — PM only
      </div>

      {/* Individual questions */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-app-text-muted mb-2">
          <MessageSquareMore className="w-3.5 h-3.5" />
          Individual questions asked ({detail.questions.length})
        </div>
        <div className="space-y-2">
          {detail.questions.map((q: FAQQuestion) => (
            <div
              key={q.id}
              className="bg-app-surface-muted rounded-xl p-3"
            >
              <p className="text-sm text-app-text mb-2 leading-snug">
                {q.text}
              </p>
              <div className="flex flex-wrap gap-2">
                {q.askedBy.map((a: FAQAskedBy) => (
                  <span
                    key={a.userId}
                    className="flex items-center gap-1 text-xs text-app-text-muted bg-app-surface border border-app-border rounded-full px-2 py-0.5"
                  >
                    <User className="w-3 h-3" />
                    {a.name} · {formatDate(a.askedAt)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answering documents */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-app-text-muted mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          Answering documents
        </div>
        <div className="divide-y divide-app-border">
          {detail.answeringDocuments.map((doc: FAQDocument) => (
            <div key={doc.id} className="flex items-center gap-2 py-2">
              <FileText className="w-3.5 h-3.5 text-app-text-disabled shrink-0" />
              <span className="text-sm text-app-text flex-1 min-w-0 truncate">
                {doc.title}
              </span>
              <span className="text-xs text-app-text-muted bg-app-surface-muted px-1.5 py-0.5 rounded shrink-0">
                {doc.source}
              </span>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPER COMPONENT: FAQCard
// ─────────────────────────────────────────────────────────────

interface FAQCardProps {
  group: FAQGroup;
  rank: number;
  sensitiveVisible: boolean;
  onRevealRequest: () => void;
}

function FAQCard({
  group,
  rank,
  sensitiveVisible,
  onRevealRequest,
}: FAQCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    if (!expanded && !sensitiveVisible) {
      // Ask parent to enable PM view first, then expand
      onRevealRequest();
      return;
    }
    setExpanded((prev) => !prev);
  };

  return (
    <div
      className={`rounded-2xl border bg-app-surface transition-all ${
        expanded && sensitiveVisible
          ? "border-app-border-strong"
          : "border-app-border hover:border-app-border-strong"
      }`}
    >
      {/* Main row */}
      <button
        onClick={handleToggle}
        className="w-full text-left p-5 flex items-start gap-3"
        aria-expanded={expanded}
      >
        <RankBadge rank={rank} />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-app-text leading-snug mb-2">
            {group.question}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.topDocuments.map((doc: FAQDocumentPreview) => (
              <span
                key={doc.id}
                className="flex items-center gap-1 text-xs text-app-text-muted bg-app-surface-muted border border-app-border rounded-full px-2 py-0.5"
              >
                <FileText className="w-3 h-3" />
                {doc.title}
              </span>
            ))}
          </div>
        </div>

        {/* Right side: count + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
            ↑ {group.count}
          </span>
          <div
            className={`border border-app-border rounded-xl p-1 text-app-text-muted transition-transform duration-200 ${
              expanded && sensitiveVisible ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Detail panel — only mounts when expanded and sensitiveVisible */}
      {expanded && sensitiveVisible && <FAQDetailPanel groupId={group.groupId} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: FaqPage
// ─────────────────────────────────────────────────────────────

// Set this to true to enable the PM toggle (e.g. based on user role).
// Replace with your auth logic: const isPM = useAuth().profile?.role === 'PM'
const IS_PM = true;

export function FaqPage() {
  const [overview, setOverview] = useState<FAQOverview | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sensitiveVisible, setSensitiveVisible] = useState<boolean>(false);

  // ── DATA FETCHING ──────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoadingState("loading");
      try {
        const data = await insightsService.fetchFAQGroups();
        setOverview(data);
        setLoadingState("success");
      } catch (err) {
        setLoadingState("error");
        setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      }
    };
    void load();
  }, []);

  // ── DERIVED DATA ───────────────────────────────────────────

  const totalQuestions =
    overview?.groups.reduce((sum: number, g: FAQGroup) => sum + g.count, 0) ?? 0;

  const topQuestion = overview?.groups[0]?.question ?? "—";

  // ── RENDER: LOADING / IDLE ─────────────────────────────────

  if (loadingState === "loading" || loadingState === "idle") {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-app-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-app-brand" />
          <p className="text-sm">Loading FAQ insights...</p>
        </div>
      </div>
    );
  }

  // ── RENDER: ERROR ──────────────────────────────────────────

  if (loadingState === "error") {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-app-danger-solid mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-app-text mb-2">
            FAQ insights could not be loaded
          </h2>
          <p className="text-sm text-app-text-muted mb-6">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-app-brand hover:bg-app-brand-hover text-white text-sm font-medium transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: EMPTY ──────────────────────────────────────────

  if (!overview || overview.groups.length === 0) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <p className="text-app-text-muted text-sm">No FAQ groups found yet.</p>
      </div>
    );
  }

  // ── RENDER: SUCCESS ────────────────────────────────────────

  return (
    <div className="min-h-screen bg-app-bg">
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircleQuestion className="w-5 h-5 text-app-brand" />
            <h1 className="text-2xl font-bold text-app-text">FAQ Insights</h1>
          </div>
          <p className="text-sm text-app-text-muted">
            Frequently asked questions grouped by topic — automatically detected
            from AI chat history.
          </p>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Question groups" value={overview.groups.length} />
          <StatCard label="Total questions asked" value={totalQuestions} />
          <StatCard
            label="Top topic"
            value={
              topQuestion.length > 32
                ? topQuestion.slice(0, 32) + "…"
                : topQuestion
            }
            small
          />
        </div>

        {/* PM toggle banner — only visible when IS_PM is true */}
        {IS_PM && (
          <div className="flex items-center justify-between bg-app-surface border border-app-border rounded-xl px-4 py-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-app-text-muted">
              <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
              PM view — expand any card to see who asked what.
            </div>
            <button
              onClick={() => setSensitiveVisible((v) => !v)}
              className="flex items-center gap-2 text-sm text-app-text-muted"
              aria-pressed={sensitiveVisible}
            >
              {/* Toggle track */}
              <span
                className={`relative inline-flex w-9 h-5 rounded-full border transition-colors duration-200 ${
                  sensitiveVisible
                    ? "bg-emerald-500 border-emerald-600"
                    : "bg-app-surface-muted border-app-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    sensitiveVisible ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
              <span className="whitespace-nowrap">
                {sensitiveVisible ? "Hide sensitive info" : "Show sensitive info"}
              </span>
            </button>
          </div>
        )}

        {/* FAQ list */}
        <div className="text-xs font-semibold text-app-text-muted uppercase tracking-wider mb-3">
          Recurring questions
        </div>
        <div className="space-y-3">
          {overview.groups.map((group: FAQGroup, index: number) => (
            <FAQCard
              key={group.groupId}
              group={group}
              rank={index + 1}
              sensitiveVisible={sensitiveVisible}
              onRevealRequest={() => setSensitiveVisible(true)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}