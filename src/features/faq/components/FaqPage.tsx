import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { FAQOverview, FAQGroup } from "../types";
import { insightsService } from "../../../services/faqService";

import {
  TrendingUp,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";

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
        <p className="text-app-text-muted">
          Could not load FAQ data.
        </p>
      </div>
    );
  }

  const sorted = [...overview.groups].sort(
    (a, b) => b.count - a.count,
  );

  const [hero, ...rest] = sorted;

  const goToDetail = (group: FAQGroup) =>
    void navigate(`/insights/faq/${group.groupId}`);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Page Header */}

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-app-text">
          Recurring Questions
        </h1>
        <p className="text-sm text-app-text-muted">
          Frequently asked questions grouped by topic and ranked by usage.
        </p>
      </div>

      {/* Hero Card */}

      <button
        onClick={() => goToDetail(hero)}
        className="w-full text-left rounded-2xl border border-app-border bg-app-surface hover:border-app-border-strong transition-colors p-5 mb-6 relative overflow-hidden"
      >
        <span className="absolute top-5 right-5 text-4xl font-semibold text-app-border-strong">
          {hero.count}
        </span>

        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
          <TrendingUp className="w-3 h-3" />
          Most asked
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

      {/* All Remaining Questions */}

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
    </div>
  );
}