// ============================================================
// FaqDetailPage.tsx
// Route: /insights/faq/:groupId
// Zeigt alle Infos zu einer FAQ-Gruppe inkl. PM-Detail
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type {
  FAQDetail,
  FAQQuestion,
  FAQAskedBy,
  FAQDocument,
} from "../../../features/faq/types";
import { insightsService } from "../../../services/faqService";

import {
  ArrowLeft,
  ShieldAlert,
  FileText,
  ExternalLink,
  User,
  Loader2,
  AlertCircle,
  MessageSquareMore,
  BookOpen,
  ArrowUp,
} from "lucide-react";

//import { features } from "process";
// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: FaqDetailPage
// ─────────────────────────────────────────────────────────────

export function FaqDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<FAQDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const load = async () => {
      try {
        const data = await insightsService.fetchFAQGroup(groupId);
        setDetail(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [groupId]);

  // ── LOADING ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-app-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-app-brand" />
          <p className="text-sm">Loading group details...</p>
        </div>
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-app-danger-solid mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-app-text mb-2">
            Could not load group
          </h2>
          <p className="text-sm text-app-text-muted mb-6">
            This FAQ group may no longer exist.
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

  // ── RENDER ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-app-bg">
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => void navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-app-text-muted hover:text-app-text transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold text-app-text leading-snug">
              FAQ group detail
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-medium px-3 py-1.5 rounded-full shrink-0">
              <ArrowUp className="w-3 h-3" />
              {detail.count} times asked
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-6">

        {/* PM detail section */}
        <div className="rounded-2xl border border-app-border bg-app-surface p-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 uppercase tracking-widest mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            PM detail
          </div>

          {/* Individual questions */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-app-text-muted mb-3">
            <MessageSquareMore className="w-3.5 h-3.5" />
            Individual questions ({detail.questions.length})
          </div>
          <div className="space-y-2 mb-6">
            {detail.questions.map((q: FAQQuestion) => (
              <div
                key={q.id}
                className="bg-app-surface-muted rounded-xl p-4"
              >
                <p className="text-sm text-app-text leading-snug mb-3">
                  {q.text}
                </p>
                <div className="flex flex-wrap gap-1.5">
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

          {/* Answering documents */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-app-text-muted mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Answering documents
          </div>
          <div className="divide-y divide-app-border">
            {detail.answeringDocuments.map((doc: FAQDocument) => (
              <div key={doc.id} className="flex items-center gap-3 py-3">
                <FileText className="w-4 h-4 text-app-text-disabled shrink-0" />
                <span className="text-sm text-app-text flex-1 min-w-0 truncate">
                  {doc.title}
                </span>
                <span className="text-xs text-app-text-muted bg-app-surface-muted px-2 py-0.5 rounded shrink-0">
                  {doc.source}
                </span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}