import { NodeStatusChip } from './NodeStatusChip';
import type { PathNode, PathView } from '../types';

type AssessmentPathViewProps = {
    path: PathView;
};

/**
 * Orders nodes so every prerequisite renders before what it unlocks, and maps
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

export function AssessmentPathView({ path }: AssessmentPathViewProps) {
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

                    return (
                        <li
                            key={node.key}
                            className="flex items-center justify-between gap-4 rounded-xl border border-app-border bg-app-surface p-4"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-app-text">{node.label}</p>
                                <p className="text-xs text-app-text-subtle">{node.kind}</p>
                                {prereqs.length > 0 && (
                                    <p className="mt-1 text-xs text-app-text-muted">
                                        after: {prereqs.map(key => labelByKey.get(key) ?? key).join(', ')}
                                    </p>
                                )}
                            </div>

                            <NodeStatusChip state={node.state} className="shrink-0" />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
