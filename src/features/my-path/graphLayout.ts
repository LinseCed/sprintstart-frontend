import dagre from 'dagre';
import type { PathView } from '../skill-assessment/types';

/**
 * Fixed node box used both for the dagre layout and the rendered card, so the
 * computed positions and the DOM agree (React Flow measures after paint, but
 * dagre needs the size up front).
 */
export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 84;

export type NodePosition = { x: number; y: number };

/**
 * Lays the competency graph out as a layered DAG: every node sits to the right
 * of all of its prerequisites, so "what unlocks what" reads left-to-right.
 *
 * Dagre owns the layering because a hand-rolled topological ordering can place
 * a node before an edge it depends on once the graph has more than one root --
 * and the projection is a real DAG (the backend rejects cycles), so dagre's
 * assumptions hold. Edges pointing at nodes outside the projection are skipped
 * rather than implicitly creating a phantom node.
 *
 * @returns Position by competency key; nodes dagre could not place (shouldn't
 * happen, but a missing entry would otherwise crash the render) fall back to the
 * origin.
 */
export function layoutPath(path: PathView): Map<string, NodePosition> {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: 'LR', ranksep: 96, nodesep: 28, marginx: 24, marginy: 24 });
    graph.setDefaultEdgeLabel(() => ({}));

    const keys = new Set(path.nodes.map(node => node.key));
    for (const node of path.nodes) {
        graph.setNode(node.key, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
    for (const edge of path.edges) {
        if (keys.has(edge.from) && keys.has(edge.to)) {
            graph.setEdge(edge.from, edge.to);
        }
    }

    dagre.layout(graph);

    const positions = new Map<string, NodePosition>();
    for (const node of path.nodes) {
        const laidOut = graph.node(node.key) as { x?: number; y?: number } | undefined;
        // Dagre centers nodes; React Flow positions them by their top-left corner.
        positions.set(node.key, {
            x: (laidOut?.x ?? NODE_WIDTH / 2) - NODE_WIDTH / 2,
            y: (laidOut?.y ?? NODE_HEIGHT / 2) - NODE_HEIGHT / 2
        });
    }

    return positions;
}

/** Direct prerequisite keys per node key, for "why is this locked" explanations. */
export function prerequisitesByKey(path: PathView): Map<string, string[]> {
    const prereqs = new Map<string, string[]>();
    for (const edge of path.edges) {
        prereqs.set(edge.to, [...(prereqs.get(edge.to) ?? []), edge.from]);
    }
    return prereqs;
}
