import { Database, RefreshCw } from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";

type DataIngestionHeaderProps = {
    isLoading: boolean;
    onRefresh: () => void;
};

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
                        <>
                        <select
                            disabled
                            title="Project selection is currently not provided by the ingestion service."
                            className="w-full cursor-not-allowed rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm text-app-text-muted outline-none opacity-70 sm:w-auto"
                        >
                            <option>Current Project</option>
                        </select>

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
                        </>
                    }
                />
            </div>
        </header>
    );
}
