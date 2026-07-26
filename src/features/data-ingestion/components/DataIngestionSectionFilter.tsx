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
 * Section navigation for the overview-first Data Ingestion page: `All` is the
 * dashboard (overview + sources + runs), the rest narrow to a single section.
 * Rendered as a group of toggle buttons (state via fill + weight + aria-pressed).
 */
export function DataIngestionSectionFilter({
  active,
  onChange,
  sourceCount,
  runCount,
}: DataIngestionSectionFilterProps) {
  const options: SectionOption[] = [
    { key: "all", label: "All" },
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
            {option.label}
            {typeof option.count === "number" && (
              <span
                className={`text-xs font-bold tabular-nums ${
                  isActive ? "text-white/75" : "text-app-text-subtle"
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
