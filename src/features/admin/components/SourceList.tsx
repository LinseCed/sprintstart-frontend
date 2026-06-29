import { FileText } from "lucide-react";
import type { ProjectSource } from "../types";
import { SourceStatusBadge } from "./Badges";

type SourceListProps = {
    sources: ProjectSource[];
};

export function SourceList({ sources }: SourceListProps) {
    if (sources.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-app-border bg-app-surface-muted px-4 py-6 text-center">
                <FileText className="mx-auto mb-2 h-5 w-5 text-app-text-disabled" />
                <p className="text-sm text-app-text-muted">No sources connected yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sources.map((source) => (
                <div
                    key={source.id}
                    className="flex min-h-36 flex-col rounded-xl border border-app-border bg-app-surface-muted p-4 transition hover:border-app-border-strong hover:bg-app-surface-hover"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-app-border bg-app-surface">
                            <FileText className="h-5 w-5 text-app-text-muted" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-semibold leading-5 text-app-text">
                                {source.name}
                            </p>

                            <p className="mt-1 font-mono text-xs text-app-text-muted">
                                {source.type}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-4">
                        <SourceStatusBadge status={source.status} />
                    </div>
                </div>
            ))}
        </div>
    );
}