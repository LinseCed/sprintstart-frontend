import type { SectionKey } from "../types.ts";

type SectionOption = {
  key: SectionKey;
  label: string;
  count?: number;
};

type DataIngestionSectionFilterProps = {
  active: SectionKey;
  onChange: (section: SectionKey) => void;
  sourceCount: number;
  runCount: number;
};

/**
 * Section navigation for the overview-first Data Ingestion page: `Overview` is
 * the dashboard and shows everything (overview + sources + runs); the other two
 * narrow to a single section. Rendered as a group of toggle buttons (state via
 * fill + weight + aria-pressed).
 */
export function DataIngestionSectionFilter({
  active,
  onChange,
  sourceCount,
  runCount,
}: DataIngestionSectionFilterProps) {
  const options: SectionOption[] = [
    { key: "overview", label: "Overview" },
    { key: "sources", label: "Sources", count: sourceCount },
    { key: "runs", label: "Runs", count: runCount },
  ];

  return (
    <div
      role="group"
      aria-label="Filter sections"
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-app-border bg-app-bg-soft p-1"
    >
      {options.map((option) => {
        const isActive = active === option.key;

        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.key)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus ${
              isActive
                ? "bg-app-brand text-white"
                : "text-app-text-muted hover:text-app-text"
            }`}
          >
            <span className="leading-none">{option.label}</span>
            {typeof option.count === "number" && (
              // `leading-none` on both the label and the count is what actually
              // centres them: the count's smaller font otherwise brings a
              // smaller line box, so flex centring lands them on different lines.
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-app-surface text-app-text-subtle"
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
