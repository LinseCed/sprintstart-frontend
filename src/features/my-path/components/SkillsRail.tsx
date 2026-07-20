import { AlertCircle, BadgeCheck, Globe2, Sparkles } from 'lucide-react';
import type { CompetencySource } from '../../competency-dashboard/types';
import type { MyCompetency } from '../types';

type SkillsRailProps = {
    competencies: MyCompetency[];
    isLoading: boolean;
    error: string | null;
    /** Keys present on the currently selected project's graph. */
    graphKeys: Set<string>;
    /** Focuses the matching graph node; only offered for on-graph skills. */
    onFocusKey: (key: string) => void;
};

const SOURCE_LABELS: Record<CompetencySource, string> = {
    VERIFIED: 'Verified',
    ASSESSED: 'Assessed',
    DECLARED: 'Declared'
};

function SkillRow({
    competency,
    onFocusKey
}: {
    competency: MyCompetency;
    onFocusKey?: (key: string) => void;
}) {
    const body = (
        <>
            <span className="min-w-0 flex-1 truncate">{competency.label}</span>
            <span className="shrink-0 text-xs text-app-text-subtle">
                L{competency.level} · {SOURCE_LABELS[competency.source]}
            </span>
        </>
    );

    const className =
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-app-text';

    return (
        <li>
            {onFocusKey ? (
                <button
                    type="button"
                    onClick={() => onFocusKey(competency.competencyKey)}
                    className={`${className} transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus`}
                >
                    {body}
                </button>
            ) : (
                <div className={className}>{body}</div>
            )}
        </li>
    );
}

/**
 * The user's global competency ledger alongside the project's graph.
 *
 * Split deliberately in two: what they hold that this project's graph also
 * covers, and what they proved **elsewhere**. The second group is the visible
 * payoff of a global ledger -- a competency earned on one project is never
 * re-earned on the next -- and it has no node to point at here, so only the
 * on-graph group is clickable.
 */
export function SkillsRail({ competencies, isLoading, error, graphKeys, onFocusKey }: SkillsRailProps) {
    const held = competencies.filter(competency => competency.level > 0);
    const onGraph = held.filter(competency => graphKeys.has(competency.competencyKey));
    const transferable = held.filter(competency => !graphKeys.has(competency.competencyKey));

    return (
        <aside
            aria-label="Your skills"
            data-testid="skills-rail"
            className="w-full shrink-0 overflow-y-auto border-app-border bg-app-surface p-4 lg:w-72 lg:border-r"
        >
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-app-text">
                <BadgeCheck className="h-4 w-4 text-app-brand-text" aria-hidden="true" />
                Your skills
            </h2>

            {isLoading && <p className="text-sm text-app-text-muted">Loading your skills...</p>}

            {error && (
                <p className="flex items-start gap-2 text-sm text-app-text-muted">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-app-danger-solid" aria-hidden="true" />
                    {error}
                </p>
            )}

            {!isLoading && !error && held.length === 0 && (
                <p className="text-sm text-app-text-muted">
                    Nothing on your ledger yet. Passing a check adds your first entry.
                </p>
            )}

            {onGraph.length > 0 && (
                <section className="mb-5">
                    <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        On this project
                    </h3>
                    <ul className="space-y-0.5">
                        {onGraph.map(competency => (
                            <SkillRow
                                key={competency.competencyKey}
                                competency={competency}
                                onFocusKey={onFocusKey}
                            />
                        ))}
                    </ul>
                </section>
            )}

            {transferable.length > 0 && (
                <section>
                    <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                        <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Transferable -- proven elsewhere
                    </h3>
                    <ul className="space-y-0.5">
                        {transferable.map(competency => (
                            <SkillRow key={competency.competencyKey} competency={competency} />
                        ))}
                    </ul>
                </section>
            )}
        </aside>
    );
}
