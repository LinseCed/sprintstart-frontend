import { Database, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";

type DataIngestionHeaderProps = {
  isLoading: boolean;
  onRefresh: () => void;
  onAddSource: () => void;
  /** Total connected sources, drives the health summary tile. */
  sourceCount: number;
  /** Sources currently syncing/indexing. */
  syncingCount: number;
  /** Sources that need attention (errors, out of date, never synced). */
  attentionCount: number;
};

/**
 * Page header for the data ingestion view.
 *
 * The project is chosen globally in the sidebar switcher, so this header no
 * longer carries its own project selector. It surfaces an at-a-glance health
 * summary tile (mirroring the onboarding page's progress tile) and the primary
 * "Add sources" action next to a refresh control.
 */
export function DataIngestionHeader({
  isLoading,
  onRefresh,
  onAddSource,
  sourceCount,
  syncingCount,
  attentionCount,
}: DataIngestionHeaderProps) {
  const healthLabel =
    sourceCount === 0
      ? "no sources yet"
      : attentionCount > 0
        ? `${attentionCount} need${attentionCount === 1 ? "s" : ""} attention`
        : syncingCount > 0
          ? `${syncingCount} syncing`
          : "all synced";

  const healthTone =
    sourceCount === 0
      ? "border-app-border bg-app-surface text-app-text-muted"
      : attentionCount > 0
        ? "border-app-warning-border bg-app-warning-bg text-app-warning-text"
        : syncingCount > 0
          ? "border-app-brand-border bg-app-brand-soft text-app-brand-text"
          : "border-app-success-border bg-app-success-bg text-app-success-text";

  return (
    <header className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
      <div className="app-page-frame py-6">
        <PageHeader
          icon={Database}
          title="Data Ingestion"
          subtitle="Manage connected sources, indexed artifacts and ingestion runs."
          actions={
            <>
              <div
                className={`rounded-2xl border px-4 py-2 text-right ${healthTone}`}
              >
                <div className="text-2xl font-bold leading-none">
                  {sourceCount}
                </div>
                <div className="mt-1 text-xs font-medium">{healthLabel}</div>
              </div>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Refresh"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-app-border bg-app-surface text-app-text-muted transition hover:bg-app-surface-hover hover:text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>

              <button
                type="button"
                onClick={onAddSource}
                className="flex items-center justify-center gap-2 rounded-xl bg-app-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-app-brand-hover"
              >
                <Plus size={16} />
                Add sources
              </button>
            </>
          }
        />
      </div>
    </header>
  );
}
