export function ArtifactTable() {
    return (
        <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center">
            <h3 className="text-lg font-semibold text-app-text">
                Artifacts overview
            </h3>

            <p className="mx-auto mt-2 max-w-2xl text-sm text-app-text-muted">
                The current ingestion service does not expose a list of indexed
                artifacts yet. It only provides aggregated ingestion status values.
            </p>
        </div>
    );
}
