import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Database,
    type LucideIcon,
} from "lucide-react";
import { formatNumber } from "../data.ts";
import type { DataSource } from "../types.ts";

type IngestionMetricsProps = {
    sources: DataSource[];
};

export function IngestionMetrics({ sources }: IngestionMetricsProps) {
    const syncedSources = sources.filter((source) => source.lastRunAt !== null).length;
    const latestIngestedArtifacts = sources.reduce(
        (sum, source) => sum + source.latestIngestedCount,
        0,
    );
    const totalErrors = sources.reduce((sum, source) => sum + source.errors, 0);

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                title="Synced Sources"
                value={`${syncedSources}/${sources.length}`}
                subtitle="sources with at least one ingestion run"
                icon={CheckCircle2}
                iconColor="text-app-success-text"
            />

            <MetricCard
                title="Latest Ingested"
                value={formatNumber(latestIngestedArtifacts)}
                subtitle="from latest source statuses"
                icon={Database}
                iconColor="text-app-brand"
            />

            <MetricCard
                title="Sync Errors"
                value={formatNumber(totalErrors)}
                subtitle="failed items from latest statuses"
                icon={AlertTriangle}
                iconColor="text-app-warning-solid"
            />

            <MetricCard
                title="Stale Artifacts"
                value="N/A"
                subtitle="not provided by current service"
                icon={Clock3}
                iconColor="text-app-warning-solid"
            />
        </div>
    );
}

function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    iconColor: string;
}) {
    return (
        <div className="rounded-3xl border border-app-border bg-app-surface p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm text-app-text-muted">{title}</p>

                    <h3 className="mt-3 text-4xl font-bold text-app-text">
                        {value}
                    </h3>

                    <p className="mt-2 text-sm text-app-text-muted">{subtitle}</p>
                </div>

                <Icon size={22} className={`shrink-0 ${iconColor}`} />
            </div>
        </div>
    );
}
