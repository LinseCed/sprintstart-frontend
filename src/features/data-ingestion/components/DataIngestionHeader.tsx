import { Database, RefreshCw } from "lucide-react";

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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-app-brand-soft p-2">
                                <Database className="h-5 w-5 text-app-brand-text" />
                            </div>

                            <h1 className="font-heading text-2xl font-bold text-app-text">
                                Data Ingestion
                            </h1>
                        </div>

                        <p className="mt-2 text-sm text-app-text-muted">
                            Manage connected sources, indexed artifacts and ingestion runs.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                    </div>
                </div>
            </div>
        </header>
    );
}
