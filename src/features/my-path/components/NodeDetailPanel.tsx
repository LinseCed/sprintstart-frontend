import { useEffect, useState } from 'react';
import { ArrowRight, ExternalLink, Flag, GitPullRequest, Layers, X } from 'lucide-react';
import { NodeStatusChip } from '../../skill-assessment/components/NodeStatusChip';
import { competencyModuleService } from '../../../services/competencyModuleService';
import type { PathNode, PathView } from '../../skill-assessment/types';
import type { CompetencySource } from '../../competency-dashboard/types';

type NodeDetailPanelProps = {
    node: PathNode;
    path: PathView;
    /** The ledger source for this node, when the user holds it. */
    source?: CompetencySource | null;
    /** Opens the focused module route for this node's module. */
    onStartModule: (moduleId: string) => void;
    /** Jumps the graph selection to another node (used by the blocker links). */
    onSelectKey: (key: string) => void;
    onClose: () => void;
};

const SOURCE_LABELS: Record<CompetencySource, string> = {
    VERIFIED: 'verified by a passed check',
    ASSESSED: 'placed by your skill assessment',
    DECLARED: 'self-reported'
};

/**
 * The side panel for a selected graph node: what it is, where you stand, and what
 * it usually builds on -- as an ordering suggestion, never a gate. Nothing is
 * withheld until a prerequisite clears, so the panel points the way rather than
 * barring the door.
 *
 * The suggested prerequisites are rendered as buttons that move the graph
 * selection, so a hire can walk backwards from "I want this" to "a good place to
 * start" -- but they can also start the node itself whenever they like.
 *
 * Entirely a hire's view. Editing the competency, its prerequisites or its module
 * is a different job for a different audience and lives in the competency studio
 * (`/graph-studio`), against the whole graph rather than one person's path.
 */
export function NodeDetailPanel({
    node,
    path,
    source,
    onStartModule,
    onSelectKey,
    onClose
}: NodeDetailPanelProps) {
    const [pageCount, setPageCount] = useState<number | null>(null);

    // How many pages the module has lives on the module, not on the projected
    // node -- fetched lazily so opening the panel is the only cost.
    useEffect(() => {
        const moduleId = node.moduleId;
        let cancelled = false;

        // Deferred off the effect body so switching nodes doesn't cascade renders.
        void Promise.resolve().then(async () => {
            if (cancelled) return;
            if (!moduleId) {
                setPageCount(null);
                return;
            }
            try {
                const module = await competencyModuleService.fetchModule(moduleId);
                if (cancelled) return;
                setPageCount(module.pages.length);
            } catch {
                // A missing count is cosmetic; the panel still works without it.
                if (!cancelled) setPageCount(null);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [node.moduleId]);

    const prerequisites = path.edges
        .filter(edge => edge.to === node.key)
        .map(edge => path.nodes.find(candidate => candidate.key === edge.from))
        .filter((candidate): candidate is PathNode => candidate !== undefined);
    // Prerequisites the hire hasn't shown yet -- suggested ordering, not a barrier.
    const suggestedFirst = prerequisites.filter(prerequisite => prerequisite.state !== 'MASTERED');
    const leadsTo = path.edges
        .filter(edge => edge.from === node.key)
        .map(edge => path.nodes.find(candidate => candidate.key === edge.to)?.label ?? edge.to);

    // Named by the payload, never inferred from `kind`: a path can carry several
    // contribution nodes (a baseline may select some) and only this one is theirs.
    const goal = path.goal ?? null;
    const isGoal = goal?.competencyKey === node.key;
    const isContribution = node.kind === 'CONTRIBUTION';
    // A module opens whenever one is published -- no state gates it.
    const canStart = Boolean(node.moduleId);

    return (
        <aside
            aria-label={`Details for ${node.label}`}
            data-testid="node-detail-panel"
            className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-app-border bg-app-surface p-5 lg:w-80 lg:border-l"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        {isGoal && <Flag className="h-4 w-4 shrink-0 text-app-brand-text" aria-hidden="true" />}
                        <h2 className="truncate text-base font-semibold text-app-text">{node.label}</h2>
                    </div>
                    <p className="text-xs text-app-text-subtle">
                        {isGoal
                            ? 'Your goal · contribution'
                            : isContribution
                              ? 'contribution'
                              : node.kind.toLowerCase()}
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="Close details"
                    onClick={onClose}
                    className="rounded-lg p-1 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <NodeStatusChip state={node.state} />
                {node.level !== undefined && node.level > 0 && (
                    <span className="text-xs text-app-text-muted">
                        Level {node.level}
                        {source ? ` · ${SOURCE_LABELS[source]}` : ''}
                    </span>
                )}
            </div>

            {/* Why this state */}
            <section>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                    Why
                </h3>
                {node.state === 'MASTERED' && (
                    <p className="text-sm text-app-text-muted">
                        You&apos;ve proven this one -- it stays yours across every project.
                    </p>
                )}
                {node.state === 'AVAILABLE' && (
                    <div className="space-y-2">
                        <p className="text-sm text-app-text-muted">
                            {prerequisites.length === 0
                                ? "This has no prerequisites -- it's a good place to start."
                                : suggestedFirst.length === 0
                                  ? 'Everything this builds on is already shown -- ready when you are.'
                                  : "Usually comes after these, but nothing stops you starting it now:"}
                        </p>
                        {suggestedFirst.length > 0 && (
                            <ul className="space-y-1">
                                {suggestedFirst.map(prerequisite => (
                                    <li key={prerequisite.key}>
                                        <button
                                            type="button"
                                            onClick={() => onSelectKey(prerequisite.key)}
                                            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm text-app-brand-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                        >
                                            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                            {prerequisite.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </section>

            {leadsTo.length > 0 && (
                <section>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                        Leads to
                    </h3>
                    <p className="text-sm text-app-text-muted">{leadsTo.join(', ')}</p>
                </section>
            )}

            {/* The goal node is the only one where the "module" is a real piece of work in a
                real repository, so it shows the actual task rather than lesson metadata. */}
            {isGoal && goal && (
                <section
                    data-testid="goal-task-detail"
                    className="space-y-2 rounded-2xl border border-app-brand-border bg-app-brand-soft p-3"
                >
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-app-brand-text">
                        The task
                    </h3>
                    {goal.summary && <p className="text-sm text-app-text">{goal.summary}</p>}
                    <p className="text-xs text-app-text-muted">
                        {goal.isReachable
                            ? 'You have everything this needs. Ship it as a pull request — that is what gets checked.'
                            : `${goal.remainingCount} related ${
                                  goal.remainingCount === 1 ? 'competency' : 'competencies'
                              } still open — you can start whenever you're ready.`}
                    </p>
                    {goal.sourceUrl && (
                        <a
                            href={goal.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-app-brand-text hover:underline"
                        >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            Open the issue
                        </a>
                    )}
                </section>
            )}

            <section className="flex flex-wrap items-center gap-3 text-xs text-app-text-muted">
                {pageCount !== null && pageCount > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                        {pageCount} page{pageCount === 1 ? '' : 's'}
                    </span>
                )}
                {node.verificationType === 'ARTIFACT' && (
                    <span className="inline-flex items-center gap-1.5">
                        <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
                        Checked against your real pull request
                    </span>
                )}
            </section>

            {/* A module is an optional deep dive, not the path. The fastest way to learn a
                competency is on a real task (First Week) -- the module is background if you want
                it. The goal node is the exception: its "module" is the real contribution. */}
            {canStart ? (
                <section className="space-y-1.5">
                    {!isGoal && (
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                            Optional deep dive
                        </h3>
                    )}
                    {!isGoal && (
                        <p className="text-xs text-app-text-subtle">
                            You&apos;ll learn this fastest on a real task. Read this if you want the
                            background — nothing needs it first.
                        </p>
                    )}
                    <button
                        type="button"
                        data-testid="start-module"
                        onClick={() => onStartModule(node.moduleId as string)}
                        className="inline-flex items-center rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        {isGoal
                            ? 'Open the module'
                            : node.state === 'MASTERED'
                              ? 'Reread the deep dive'
                              : 'Read the deep dive'}
                    </button>
                </section>
            ) : (
                <p className="text-xs text-app-text-subtle">
                    No deep dive has been published for this competency — you don&apos;t need one to
                    work on it.
                </p>
            )}

        </aside>
    );
}
