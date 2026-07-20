import { useEffect, useState } from 'react';
import { ArrowRight, Flag, GitPullRequest, Layers, Lock, Pencil, X } from 'lucide-react';
import { NodeStatusChip } from '../../skill-assessment/components/NodeStatusChip';
import { competencyModuleService } from '../../../services/competencyModuleService';
import { useAuth } from '../../../context/useAuth';
import { PermissionGroup } from '../../../services/types';
import type { PathNode, PathView } from '../../skill-assessment/types';
import type { CompetencySource } from '../../competency-dashboard/types';

type NodeDetailPanelProps = {
    node: PathNode;
    path: PathView;
    /** The ledger source for this node, when the user holds it. */
    source?: CompetencySource | null;
    /** Opens the focused module route for this node's module. */
    onStartModule: (moduleId: string) => void;
    /** Opens the authoring surface for this node's module (PM/admin only). */
    onEditModule: (moduleId: string) => void;
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
 * The side panel for a selected graph node: what it is, where you stand, and --
 * crucially -- *why* it is in that state, so a locked node is an explanation
 * with a way forward rather than a dead end.
 *
 * Blockers are rendered as buttons that move the graph selection to the blocking
 * prerequisite, so a hire can walk backwards from "I want this" to "start here".
 */
export function NodeDetailPanel({
    node,
    path,
    source,
    onStartModule,
    onEditModule,
    onSelectKey,
    onClose
}: NodeDetailPanelProps) {
    const { profile } = useAuth();
    const canAuthor =
        profile?.permissionGroup === PermissionGroup.PM ||
        profile?.permissionGroup === PermissionGroup.ADMIN;
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
    const blockers = prerequisites.filter(prerequisite => prerequisite.state !== 'MASTERED');
    const unlocks = path.edges
        .filter(edge => edge.from === node.key)
        .map(edge => path.nodes.find(candidate => candidate.key === edge.to)?.label ?? edge.to);

    const isGoal = node.kind === 'CONTRIBUTION';
    const canStart = Boolean(node.moduleId) && node.state !== 'LOCKED';

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
                        {isGoal ? 'Goal · contribution' : node.kind.toLowerCase()}
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
                    <p className="text-sm text-app-text-muted">
                        {prerequisites.length > 0
                            ? 'Every prerequisite is cleared, so this is ready to start.'
                            : "This has no prerequisites -- it's a starting point."}
                    </p>
                )}
                {node.state === 'LOCKED' && (
                    <div className="space-y-2">
                        <p className="flex items-center gap-1.5 text-sm text-app-text-muted">
                            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            Waiting on {blockers.length} prerequisite{blockers.length === 1 ? '' : 's'}:
                        </p>
                        <ul className="space-y-1">
                            {blockers.map(blocker => (
                                <li key={blocker.key}>
                                    <button
                                        type="button"
                                        onClick={() => onSelectKey(blocker.key)}
                                        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm text-app-brand-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                    >
                                        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                        {blocker.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {unlocks.length > 0 && (
                <section>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                        Unlocks
                    </h3>
                    <p className="text-sm text-app-text-muted">{unlocks.join(', ')}</p>
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

            {canStart ? (
                <button
                    type="button"
                    data-testid="start-module"
                    onClick={() => onStartModule(node.moduleId as string)}
                    className="rounded-xl bg-app-brand px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    {node.state === 'MASTERED' ? 'Review this module' : 'Start module'}
                </button>
            ) : (
                <p className="text-xs text-app-text-subtle">
                    {node.moduleId
                        ? 'Clear the prerequisites above to open this module.'
                        : 'Nothing has been published for this competency yet.'}
                </p>
            )}

            {canAuthor && node.moduleId && (
                <button
                    type="button"
                    data-testid="edit-module"
                    onClick={() => onEditModule(node.moduleId as string)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit this module
                </button>
            )}
        </aside>
    );
}
