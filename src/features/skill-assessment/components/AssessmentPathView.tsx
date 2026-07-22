import { motion, useReducedMotion } from 'framer-motion';
import { Flag, GitPullRequest } from 'lucide-react';
import { NodeStatusChip } from './NodeStatusChip';
import type { PathNode, PathView } from '../types';

type AssessmentPathViewProps = {
    path: PathView;
    /**
     * Called when a node with a configured module is opened. Nodes with no
     * `moduleId` (no published module yet) are not clickable and never trigger
     * this.
     */
    onSelectNode?: (node: PathNode) => void;
    /**
     * Keys of nodes whose state just changed (e.g. newly shown) since the
     * previous load. Drives a one-shot pulse on
     * exactly those nodes rather than the whole list; empty by default.
     */
    justChangedKeys?: Set<string>;
};

/**
 * Orders nodes so every prerequisite renders before what builds on it, and maps
 * each node to its direct prerequisite keys. A simple ordered list -- not a
 * drawn graph -- per the issue's own guidance that a readable layout beats a
 * force-directed graph at this stage.
 */
function orderByPrerequisites(path: PathView): { ordered: PathNode[]; prereqsByKey: Map<string, string[]> } {
    const nodesByKey = new Map(path.nodes.map(node => [node.key, node]));
    const prereqsByKey = new Map<string, string[]>();
    for (const edge of path.edges) {
        const prereqs = prereqsByKey.get(edge.to) ?? [];
        prereqs.push(edge.from);
        prereqsByKey.set(edge.to, prereqs);
    }

    const visited = new Set<string>();
    const ordered: PathNode[] = [];

    function visit(key: string) {
        if (visited.has(key)) return;
        visited.add(key);
        for (const prereq of prereqsByKey.get(key) ?? []) {
            visit(prereq);
        }
        const node = nodesByKey.get(key);
        if (node) ordered.push(node);
    }

    for (const node of path.nodes) visit(node.key);

    return { ordered, prereqsByKey };
}

export function AssessmentPathView({ path, onSelectNode, justChangedKeys }: AssessmentPathViewProps) {
    const reduceMotion = useReducedMotion();

    if (path.nodes.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
                <p className="text-sm text-app-text-muted">
                    No competencies in your path yet. Check back once your baseline is ready.
                </p>
            </div>
        );
    }

    const { ordered, prereqsByKey } = orderByPrerequisites(path);
    const labelByKey = new Map(path.nodes.map(node => [node.key, node.label]));

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
            <ul className="flex flex-col gap-3">
                {ordered.map(node => {
                    const prereqs = prereqsByKey.get(node.key) ?? [];
                    const isOpenable = Boolean(node.moduleId) && onSelectNode;
                    const isGoal = node.kind === 'CONTRIBUTION';
                    const isArtifactCheck = node.verificationType === 'ARTIFACT';
                    const justChanged = !reduceMotion && (justChangedKeys?.has(node.key) ?? false);

                    const content = (
                        <>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    {isGoal && (
                                        <Flag
                                            className="h-3.5 w-3.5 shrink-0 text-app-brand-text"
                                            aria-hidden="true"
                                        />
                                    )}
                                    <p className="truncate text-sm font-medium text-app-text">{node.label}</p>
                                    {isArtifactCheck && (
                                        <>
                                            <GitPullRequest
                                                className="h-3.5 w-3.5 shrink-0 text-app-text-subtle"
                                                aria-hidden="true"
                                            />
                                            <span className="sr-only">Verified via pull request</span>
                                        </>
                                    )}
                                </div>
                                {/* CONTRIBUTION's "goal" meaning is already conveyed in text via `node.kind` below --
                                    the Flag icon above is decorative reinforcement, not the only signal. */}
                                <p className="text-xs text-app-text-subtle">{node.kind}</p>
                                {prereqs.length > 0 && (
                                    <p className="mt-1 text-xs text-app-text-muted">
                                        after: {prereqs.map(key => labelByKey.get(key) ?? key).join(', ')}
                                    </p>
                                )}
                            </div>

                            <NodeStatusChip state={node.state} className="shrink-0" />
                        </>
                    );

                    const wrapperClassName = `flex w-full items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                        isGoal
                            ? 'border-app-brand-border-strong bg-gradient-to-br from-app-brand-soft to-app-surface'
                            : 'border-app-border bg-app-surface'
                    }`;

                    return (
                        <motion.li
                            key={node.key}
                            layout={!reduceMotion}
                            animate={justChanged ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            {isOpenable ? (
                                <button
                                    type="button"
                                    onClick={() => onSelectNode(node)}
                                    className={`${wrapperClassName} text-left hover:border-app-border-strong hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus`}
                                >
                                    {content}
                                </button>
                            ) : (
                                <div className={wrapperClassName}>{content}</div>
                            )}
                        </motion.li>
                    );
                })}
            </ul>
        </div>
    );
}
