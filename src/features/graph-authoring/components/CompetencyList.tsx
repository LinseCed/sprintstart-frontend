import { BookOpen } from 'lucide-react';
import type { CompetencyGroup } from '../grouping';
import type { LiveCompetency } from '../types';

type CompetencyListProps = {
    groups: CompetencyGroup[];
    /** Which keys have a module written against the selected project. */
    keysWithModule: Set<string>;
    selectedKey: string | null;
    onSelect: (key: string) => void;
};

/**
 * The vocabulary, grouped by area.
 *
 * Every row answers the one question that survived the graph's retirement: **is anything written to
 * teach this?** The rest of a row is identification — what it is called, what kind of thing it is,
 * and how far somebody has to get for it to count.
 *
 * Areas are headings rather than collapsible sections, deliberately. A vocabulary is read to find
 * the row that is wrong, and a heading that hides its contents makes finding it a second step; the
 * search box above does the narrowing that collapsing would otherwise be for.
 */
export function CompetencyList({
    groups,
    keysWithModule,
    selectedKey,
    onSelect,
}: CompetencyListProps) {
    return (
        <div data-testid="competency-list" className="space-y-6">
            {groups.map((group) => (
                <section key={group.area ?? '__ungrouped__'} className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-app-text-muted">
                        {group.area ?? 'Not grouped yet'}
                        <span className="ml-2 font-normal normal-case tracking-normal text-app-text-subtle">
                            {group.competencies.length}
                        </span>
                    </h2>

                    <ul className="space-y-2">
                        {group.competencies.map((competency) => (
                            <li key={competency.key}>
                                <CompetencyRow
                                    competency={competency}
                                    hasModule={keysWithModule.has(competency.key)}
                                    isSelected={competency.key === selectedKey}
                                    onSelect={() => onSelect(competency.key)}
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

function CompetencyRow({
    competency,
    hasModule,
    isSelected,
    onSelect,
}: {
    competency: LiveCompetency;
    hasModule: boolean;
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            aria-current={isSelected}
            onClick={onSelect}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus ${
                isSelected
                    ? 'border-app-brand-border bg-app-brand-soft'
                    : 'border-app-border bg-app-surface hover:bg-app-surface-hover'
            }`}
        >
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-app-text">{competency.label}</span>
                <span className="rounded-full bg-app-surface-hover px-2 py-0.5 text-xs text-app-text-muted">
                    {competency.kind.toLowerCase()}
                </span>
                <span className="text-xs text-app-text-subtle">L{competency.targetLevel}</span>
                {/* The one thing that decides whether a hire gets anything out of this competency. */}
                {hasModule && (
                    <span className="inline-flex items-center gap-1 text-xs text-app-text-muted">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        module
                    </span>
                )}
            </div>
            {competency.description && (
                <p className="mt-1 line-clamp-2 text-xs text-app-text-muted">
                    {competency.description}
                </p>
            )}
        </button>
    );
}
