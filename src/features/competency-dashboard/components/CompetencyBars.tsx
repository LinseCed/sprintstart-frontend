// Presentational stacked-proportion bars for one competency's aggregate signal.
// Same technique as knowledge-gaps' SeverityBar/SeveritySummaryBar: a flex row
// of width-percentage divs plus a small legend, no chart library.

import type { CompetencySourceCounts } from '../types';

const LEVEL_LABELS: Record<number, string> = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Expert'
};

// Single-hue intensity ramp -- level is an ordinal "how far along," not a
// good/bad category, so it deliberately doesn't reuse the danger/warning/
// success palette the way source below does.
const LEVEL_COLORS: Record<number, string> = {
    1: 'bg-app-brand/25',
    2: 'bg-app-brand/50',
    3: 'bg-app-brand/75',
    4: 'bg-app-brand'
};

type CompetencyLevelBarProps = {
    levelCounts: Record<number, number>;
    className?: string;
};

/** Stacked bar + legend showing how engaged users are distributed across proficiency levels. */
export function CompetencyLevelBar({ levelCounts, className = '' }: CompetencyLevelBarProps) {
    const total = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);
    if (total === 0) {
        return <p className={`text-xs text-app-text-muted ${className}`.trim()}>No one has this yet.</p>;
    }

    return (
        <div className={className}>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                {[1, 2, 3, 4].map(level => {
                    const count = levelCounts[level] ?? 0;
                    if (count === 0) return null;
                    return (
                        <div
                            key={level}
                            className={`rounded-full ${LEVEL_COLORS[level]}`}
                            style={{ width: `${(count / total) * 100}%` }}
                        />
                    );
                })}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {[1, 2, 3, 4].map(level => {
                    const count = levelCounts[level] ?? 0;
                    if (count === 0) return null;
                    return (
                        <span key={level} className="flex items-center gap-1 text-xs text-app-text-muted">
                            <span className={`inline-block h-2 w-2 rounded-full ${LEVEL_COLORS[level]}`} />
                            {count} {LEVEL_LABELS[level]}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

const SOURCE_COLORS = {
    declared: 'bg-app-text-subtle',
    assessed: 'bg-app-warning-solid',
    verified: 'bg-app-success-solid'
} as const;

const SOURCE_LABELS = {
    declared: 'Declared',
    assessed: 'Assessed',
    verified: 'Verified'
} as const;

type CompetencySourceBarProps = {
    sourceCounts: CompetencySourceCounts;
    className?: string;
};

/**
 * Stacked bar + legend showing how many users' evidence for a competency comes
 * from self-declaration vs. an AI assessment vs. a real verification check --
 * the whole point of this dashboard over the legacy "marked done" view.
 */
export function CompetencySourceBar({ sourceCounts, className = '' }: CompetencySourceBarProps) {
    const total = sourceCounts.assessed + sourceCounts.verified + sourceCounts.declared;
    if (total === 0) {
        return null;
    }

    const entries: Array<{ key: keyof typeof SOURCE_COLORS; count: number }> = [
        { key: 'verified', count: sourceCounts.verified },
        { key: 'assessed', count: sourceCounts.assessed },
        { key: 'declared', count: sourceCounts.declared }
    ];

    return (
        <div className={className}>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
                {entries.map(
                    ({ key, count }) =>
                        count > 0 && (
                            <div
                                key={key}
                                className={`rounded-full ${SOURCE_COLORS[key]}`}
                                style={{ width: `${(count / total) * 100}%` }}
                            />
                        )
                )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {entries.map(
                    ({ key, count }) =>
                        count > 0 && (
                            <span key={key} className="flex items-center gap-1 text-xs text-app-text-muted">
                                <span className={`inline-block h-2 w-2 rounded-full ${SOURCE_COLORS[key]}`} />
                                {count} {SOURCE_LABELS[key]}
                            </span>
                        )
                )}
            </div>
        </div>
    );
}
