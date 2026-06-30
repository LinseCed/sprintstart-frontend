export function DataIngestionLoadingState() {
    return (
        <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />

            <h3 className="mt-4 text-lg font-semibold text-app-text">
                Loading ingestion data
            </h3>

            <p className="mt-2 text-sm text-app-text-muted">
                Fetching source statuses and recent ingestion runs from the backend.
            </p>
        </div>
    );
}
