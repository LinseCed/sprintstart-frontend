import { FileText } from "lucide-react";
import type { ProjectSource } from "../types";
import { SourceStatusBadge } from "./Badges";

type SourceListProps = {
    sources: ProjectSource[];
};

export function SourceList({ sources }: SourceListProps) {
    if (sources.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-app-border px-4 py-6 text-center">
                <FileText className="mx-auto mb-2 h-5 w-5 text-app-text-disabled" />
                <p className="text-sm text-app-text-muted">No sources connected yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {sources.map((source) => (
                <div
                    key={source.id}
                    className="rounded-xl border border-app-border bg-app-surface-muted p-4"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-app-text">
                                {source.name}
                            </p>
                            <p className="mt-1 font-mono text-xs text-app-text-muted">
                                {source.type}
                            </p>
                        </div>

                        <SourceStatusBadge status={source.status} />
                    </div>
                </div>
            ))}
        </div>
    );
}
