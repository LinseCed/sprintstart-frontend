import {
  AlertTriangle,
  CheckCircle2,
  Database,
  GitBranch,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
  formatDateTime,
  formatNumber,
  getRunStatusLabel,
  getRunStatusTone,
  getSourceLabel,
} from "../data.ts";
import type { DataSource, IngestionRun } from "../types.ts";

type OverviewSectionProps = {
  sources: DataSource[];
  totalArtifactCount: number;
  runs: IngestionRun[];
};

/**
 * Overview band of the Data Ingestion page: at-a-glance health KPIs, a small
 * ingestion sparkline and the most recent run activity — all derived from the
 * same source/run data the rest of the page uses, so the summary can't drift
 * from the detail below it.
 */
export function OverviewSection({
  sources,
  totalArtifactCount,
  runs,
}: OverviewSectionProps) {
  const syncing = sources.filter(
    (source) => source.statusView.state === "syncing",
  ).length;
  const attention = sources.filter(
    (source) => source.statusView.state === "attention",
  ).length;

  const recentRuns = useMemo(
    () =>
      [...runs]
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        )
        .slice(0, 4),
    [runs],
  );

  const sparkPath = useMemo(() => buildSparkline(runs), [runs]);

  return (
    <section aria-label="Overview">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-app-text">
          Overview
        </h2>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Connected sources"
          value={formatNumber(sources.length)}
          foot="across GitHub"
          icon={GitBranch}
        />
        <Kpi
          label="Artifacts indexed"
          value={formatNumber(totalArtifactCount)}
          foot="stored for this project"
          icon={Database}
        />
        <Kpi
          label="Syncing now"
          value={formatNumber(syncing)}
          foot={syncing > 0 ? "indexing in progress" : "nothing running"}
          icon={Loader2}
          tone="brand"
        />
        <Kpi
          label="Needs attention"
          value={formatNumber(attention)}
          foot={attention > 0 ? "review these sources" : "all healthy"}
          icon={AlertTriangle}
          tone={attention > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-app-border bg-app-surface p-5">
          <h3 className="text-sm font-bold text-app-text">Ingestion activity</h3>
          <p className="mt-0.5 text-xs text-app-text-subtle">
            Artifacts ingested across recent runs
          </p>

          {sparkPath ? (
            <svg
              viewBox="0 0 560 120"
              preserveAspectRatio="none"
              role="img"
              aria-label="Artifacts ingested across recent runs"
              className="mt-4 h-28 w-full"
            >
              <defs>
                <linearGradient id="di-spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--brand)" stopOpacity="0.26" />
                  <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparkPath.area} fill="url(#di-spark)" />
              <path
                d={sparkPath.line}
                fill="none"
                stroke="var(--brand)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={sparkPath.lastX}
                cy={sparkPath.lastY}
                r="4"
                fill="var(--brand)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
            </svg>
          ) : (
            <p className="mt-8 text-center text-sm text-app-text-muted">
              Not enough runs yet to chart activity.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-app-border bg-app-surface p-5">
          <h3 className="text-sm font-bold text-app-text">Recent activity</h3>
          <p className="mt-0.5 text-xs text-app-text-subtle">
            Latest ingestion runs
          </p>

          {recentRuns.length > 0 ? (
            <ul className="mt-3">
              {recentRuns.map((run) => (
                <ActivityRow key={run.runId} run={run} />
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-center text-sm text-app-text-muted">
              No ingestion runs yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

const TONE_TILE: Record<string, string> = {
  brand: "text-app-brand-text",
  warning: "text-app-warning-solid",
  success: "text-app-success-text",
  neutral: "text-app-text-muted",
};

function Kpi({
  label,
  value,
  foot,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  foot: string;
  icon: LucideIcon;
  tone?: "brand" | "warning" | "success" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-surface p-4 sm:p-[18px]">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-app-text-muted">{label}</span>
        <Icon size={20} className={`shrink-0 ${TONE_TILE[tone]}`} />
      </div>
      <p className="mt-2.5 text-3xl font-bold tracking-tight tabular-nums text-app-text">
        {value}
      </p>
      <p className="mt-1 text-xs text-app-text-subtle">{foot}</p>
    </div>
  );
}

function ActivityRow({ run }: { run: IngestionRun }) {
  const tone = getRunStatusTone(run.status);
  const label = getRunStatusLabel(run.status);

  const toneClass =
    tone === "success"
      ? "bg-app-success-bg text-app-success-text"
      : tone === "running"
        ? "bg-app-brand-soft text-app-brand-text"
        : "bg-app-warning-bg text-app-warning-text";

  return (
    <li className="flex items-center gap-3 border-t border-app-border py-2 first:border-t-0">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
      >
        {tone === "success" ? (
          <CheckCircle2 size={15} />
        ) : tone === "running" ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <AlertTriangle size={15} />
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-app-text">
          {getSourceLabel(run.sourceSystem)} · {label.toLowerCase()}
        </p>
        <p className="text-[11.5px] text-app-text-subtle">
          {formatNumber(run.ingestedCount)} artifacts
        </p>
      </div>
      <span className="ml-auto whitespace-nowrap text-[11.5px] text-app-text-subtle">
        {formatDateTime(run.startedAt)}
      </span>
    </li>
  );
}

/**
 * Builds an area+line sparkline from the ingested counts of the most recent
 * runs (chronological). Returns null when there are fewer than two runs.
 */
function buildSparkline(runs: IngestionRun[]) {
  const series = [...runs]
    .sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    )
    .slice(-8)
    .map((run) => run.ingestedCount);

  if (series.length < 2) return null;

  const w = 560;
  const h = 120;
  const pad = 12;
  const max = Math.max(...series, 1);
  const stepX = w / (series.length - 1);

  const points = series.map((value, index) => {
    const x = index * stepX;
    const y = pad + (1 - value / max) * (h - pad * 2);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const [lastX, lastY] = points[points.length - 1];
  const area = `${line} L${w},${h} L0,${h} Z`;

  return { line, area, lastX, lastY };
}
