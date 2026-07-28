import { Database, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";

type DataIngestionHeaderProps = {
  isLoading: boolean;
  onRefresh: () => void;
  onAddSource: () => void;
};

/**
 * Page header for the data ingestion view.
 *
 * The project is chosen globally in the sidebar switcher, so this header no
 * longer carries its own project selector. Its actions are the primary
 * "Add sources" button and a refresh control.
 */
export function DataIngestionHeader({
  isLoading,
  onRefresh,
  onAddSource,
}: DataIngestionHeaderProps) {
  return (
    <header className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
      <div className="app-page-frame py-6">
        <PageHeader
          icon={Database}
          title="Data Ingestion"
          subtitle="Manage connected sources, indexed artifacts and ingestion runs."
          actions={
            <>
              <button
                type="button"
                onClick={onAddSource}
                className="flex items-center justify-center gap-2 rounded-xl bg-app-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-app-brand-hover"
              >
                <Plus size={16} />
                Add sources
              </button>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Refresh"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-app-border bg-app-surface text-app-text-muted transition hover:bg-app-surface-hover hover:text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>
            </>
          }
        />
      </div>
    </header>
  );
}
