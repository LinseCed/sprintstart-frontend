import { Database, RefreshCw } from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";

type DataIngestionHeaderProps = {
    isLoading: boolean;
    onRefresh: () => void;
};

/**
 * Page header for the data ingestion view.
 *
 * The project is chosen globally in the sidebar switcher, so this header no
 * longer carries its own project selector.
 */
export function DataIngestionHeader({
    isLoading,
    onRefresh,
}: DataIngestionHeaderProps) {
    return (
        <header className="border-b border-app-border bg-app-bg">
            <div className="app-page-frame py-6">
                <PageHeader
                    icon={Database}
                    title="Data Ingestion"
                    subtitle="Manage connected sources, indexed artifacts and ingestion runs."
                    actions={
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                size={16}
                                className={isLoading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    }
                />
            </div>
        </header>
    );
}
