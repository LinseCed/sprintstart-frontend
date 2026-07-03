import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { FAQOverview, FAQGroup } from "../types";
import { insightsService } from "../../../services/faqService";

import {
  TrendingUp,
  FileText,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Users,
  MessageSquareMore,
} from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";

export function FaqPage() {
  const [overview, setOverview] = useState<FAQOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await insightsService.fetchFAQGroups();
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

  if (error || !overview || overview.groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20">
        <AlertCircle className="w-5 h-5 text-app-text-muted" />
        <p className="text-app-text-muted">Could not load FAQ data.</p>
      </div>
    );
  }

  const sorted = [...overview.groups].sort(
    (a, b) => b.count - a.count,
  );

  const [hero, ...rest] = sorted;

  const totalGroups = overview.groups.length;

  const totalQuestions = overview.groups.reduce(
    (sum, group) => sum + group.count,
    0,
  );

  const mostAskedCount = hero?.count ?? 0;

  const totalDocuments = new Set(
    overview.groups.flatMap((group) =>
      group.topDocuments.map((doc) => doc.id),
    ),
  ).size;

  const goToDetail = (group: FAQGroup) =>
    void navigate(`/insights/faq/${group.groupId}`);

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
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
            icon={MessageSquareMore}
            title="Recurring Questions"
            subtitle="Frequently asked questions grouped by topic and ranked by frequency."
            className="mb-6"
          />

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-app-border bg-app-surface p-3">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-sky-700" />
                <div>
                  <div className="text-2xl font-semibold text-sky-700">
                    {totalGroups}
                  </div>
                  <div className="text-xs text-app-text-muted">
                    Question groups
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-app-border bg-app-surface p-3">
              <div className="flex items-center gap-3">
                <MessageSquareMore className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-2xl font-semibold text-emerald-600">
                    {totalQuestions}
                  </div>
                  <div className="text-xs text-app-text-muted">
                    Total questions
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-app-border bg-app-surface p-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-rose-600" />
                <div>
                  <div className="text-2xl font-semibold text-rose-600">
                    {mostAskedCount}
                  </div>
                  <div className="text-xs text-app-text-muted">
                    Top frequency
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-app-border bg-app-surface p-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-2xl font-semibold text-amber-600">
                    {totalDocuments}
                  </div>
                  <div className="text-xs text-app-text-muted">
                    Linked documents
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="app-page-content py-8">
        {/* Hero Card */}
        <div className="mb-4">
          <button
            onClick={() => goToDetail(hero)}
            className="w-full text-left rounded-2xl border border-app-border bg-app-surface transition-colors p-5 mb-2 relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 flex items-center gap-2 text-app-text-muted">
              <TrendingUp className="w-5 h-5 text-app-brand" />
              <span className="text-2xl font-semibold text-app-brand">{hero.count}</span>
            </div>

            <p className="text-lg font-semibold text-app-text leading-snug mb-4 pr-16">
              {hero.question}
            </p>

            <div className="flex flex-wrap gap-2">
              {hero.topDocuments.map((doc) => (
                <span
                  key={doc.id}
                  className="flex items-center gap-1 text-xs text-app-text-muted bg-app-surface-muted border border-app-border rounded-full px-2 py-1"
                >
                  <FileText className="w-3 h-3" />
                  {doc.title}
                </span>
              ))}
            </div>
          </button>

        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {rest.map((group) => (
            <button
              key={group.groupId}
              onClick={() => goToDetail(group)}
              className="w-full text-left rounded-xl border border-app-border bg-app-surface hover:border-app-border-strong transition-colors p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-sm font-medium text-app-text">
                  {group.question}
                </p>

                <span className="text-lg font-semibold text-app-brand shrink-0">
                  {group.count}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {group.topDocuments.map((doc) => (
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
          ))}
        </div>
      </main>
    </div>
  );
}
