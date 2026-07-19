import type { KnowledgeGap } from '../../../knowledge-gaps/types';
import type {
    CompetencySource,
    UserCompetencyState,
} from '../../../competency-dashboard/types';

type MemberGapsPanelProps = {
    competencies: UserCompetencyState[];
    competencyGaps: UserCompetencyState[];
    knowledgeGaps: KnowledgeGap[];
    onOpenKnowledgeGap: (gapId: string) => void;
};

const LEVEL_NAMES: Record<number, string> = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced',
    4: 'expert',
};

const SOURCE_LABELS: Record<CompetencySource, string> = {
    VERIFIED: 'Verified',
    ASSESSED: 'Assessed',
    DECLARED: 'Declared',
};

const SOURCE_ORDER: CompetencySource[] = ['VERIFIED', 'ASSESSED', 'DECLARED'];

/**
 * Sidebar panel showing a member's competency ledger and their gaps.
 *
 * Competencies come from the durable ledger (`GET /dashboard/users/{userId}`),
 * grouped by how each entry was earned -- a VERIFIED competency (passed check)
 * is a materially stronger signal than an ASSESSED (chat placement) or
 * DECLARED one. Level-0 entries (not yet placed) are hidden from the ledger
 * list, and gaps are the level 1..2 entries the page computes.
 */
export function MemberGapsPanel({
    competencies,
    competencyGaps,
    knowledgeGaps,
    onOpenKnowledgeGap,
}: MemberGapsPanelProps) {
    const placedCompetencies = competencies.filter(
        (competency) => competency.level > 0,
    );
    const competenciesBySource = placedCompetencies.reduce<
        Partial<Record<CompetencySource, UserCompetencyState[]>>
    >((acc, competency) => {
        (acc[competency.source] ??= []).push(competency);
        return acc;
    }, {});

    return (
        <>
            <div className="rounded-3xl border border-app-border bg-app-surface p-6">
                <h2 className="text-lg font-semibold text-app-text">
                    Competencies
                </h2>

                {placedCompetencies.length === 0 ? (
                    <p className="mt-3 text-sm text-app-text-muted">
                        No placed competencies yet.
                    </p>
                ) : (
                    <div className="mt-4 space-y-4">
                        {SOURCE_ORDER.filter(
                            (source) => competenciesBySource[source]?.length,
                        ).map((source) => (
                            <div key={source}>
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-app-text-muted">
                                    {SOURCE_LABELS[source]}
                                </p>

                                <div className="space-y-1">
                                    {competenciesBySource[source]?.map((competency) => (
                                        <CompetencyRow
                                            key={competency.competencyKey}
                                            competency={competency}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-3xl border border-app-border bg-app-surface p-6">
                <h2 className="text-lg font-semibold text-app-text">
                    Gaps
                </h2>

                <div className="mt-4 space-y-4">
                    <CompetencyGapsSection competencyGaps={competencyGaps} />

                    <KnowledgeGapsSection
                        knowledgeGaps={knowledgeGaps}
                        onOpenKnowledgeGap={onOpenKnowledgeGap}
                    />
                </div>
            </div>
        </>
    );
}

function CompetencyRow({ competency }: { competency: UserCompetencyState }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-app-border bg-app-surface-muted px-3 py-2">
            <span className="text-sm font-medium text-app-text">
                {competency.label}
            </span>

            <div className="flex shrink-0 items-center gap-2">
                <div className="flex gap-1">
                    {Array.from({ length: 4 }, (_, index) => (
                        <div
                            key={index}
                            className={`h-2 w-2 rounded-full ${
                                index < competency.level ? 'bg-app-brand' : 'bg-app-border'
                            }`}
                        />
                    ))}
                </div>

                <span className="w-24 text-right text-xs text-app-text-muted capitalize">
                    {LEVEL_NAMES[competency.level] ?? 'unknown'}
                </span>
            </div>
        </div>
    );
}

function CompetencyGapsSection({
    competencyGaps,
}: {
    competencyGaps: UserCompetencyState[];
}) {
    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-app-text">
                    Competency gaps
                </p>
                <GapCountBadge count={competencyGaps.length} />
            </div>

            <div className="mt-2 space-y-2">
                {competencyGaps.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                        No low-rated competencies found.
                    </p>
                ) : (
                    competencyGaps.slice(0, 3).map((competency) => (
                        <div
                            key={competency.competencyKey}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-app-text">
                                    {competency.label}
                                </p>
                                <p className="mt-0.5 text-xs text-app-text-muted">
                                    {SOURCE_LABELS[competency.source]}
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-app-warning-bg px-2 py-0.5 text-xs font-medium text-app-warning-text capitalize">
                                {LEVEL_NAMES[competency.level] ?? 'unknown'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function KnowledgeGapsSection({
    knowledgeGaps,
    onOpenKnowledgeGap,
}: {
    knowledgeGaps: KnowledgeGap[];
    onOpenKnowledgeGap: (gapId: string) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-app-text">
                    Knowledge gaps
                </p>
                <GapCountBadge count={knowledgeGaps.length} />
            </div>

            <div className="mt-2 space-y-2">
                {knowledgeGaps.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                        No knowledge gaps found.
                    </p>
                ) : (
                    knowledgeGaps.map((gap) => (
                        <button
                            key={gap.id}
                            type="button"
                            onClick={() => onOpenKnowledgeGap(gap.id)}
                            className="w-full rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3 text-left transition-colors hover:border-app-brand"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <p className="min-w-0 text-sm font-medium text-app-text">
                                    {gap.component}
                                </p>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                    gap.severity === 'high'
                                        ? 'bg-app-danger-bg text-app-danger-text'
                                        : gap.severity === 'medium'
                                          ? 'bg-app-warning-bg text-app-warning-text'
                                          : 'bg-app-surface text-app-text-muted'
                                }`}>
                                    {gap.severity}
                                </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-app-text-muted">
                                {gap.missingTypes.join(', ')}
                            </p>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

function GapCountBadge({ count }: { count: number }) {
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            count > 0
                ? 'bg-app-warning-bg text-app-warning-text'
                : 'bg-app-success-bg text-app-success-text'
        }`}>
            {count}
        </span>
    );
}
