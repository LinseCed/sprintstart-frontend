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

/**
 * Every node connected to `key` by a chain of prerequisites, in either
 * direction: everything it transitively depends on, and everything that
 * transitively depends on it. `key` itself is included.
 *
 * This is what a node *costs* and what it *buys*, which is the thing a static
 * DAG drawing hides -- with the chain lit and everything else dimmed, the graph
 * reads as a tree of consequence instead of a picture of boxes.
 *
 * Walks iteratively and tracks visited keys, so a cycle the backend somehow let
 * through can't hang the render.
 */
export function chainFor(path: PathView, key: string): Set<string> {
    const forward = new Map<string, string[]>();
    const backward = new Map<string, string[]>();
    for (const edge of path.edges) {
        forward.set(edge.from, [...(forward.get(edge.from) ?? []), edge.to]);
        backward.set(edge.to, [...(backward.get(edge.to) ?? []), edge.from]);
    }

    const chain = new Set<string>([key]);
    for (const adjacency of [forward, backward]) {
        const stack = [key];
        while (stack.length > 0) {
            const current = stack.pop() as string;
            for (const next of adjacency.get(current) ?? []) {
                if (chain.has(next)) continue;
                chain.add(next);
                stack.push(next);
            }
        }
    }
    return chain;
}

/**
 * Edges along which "power" is currently flowing: a mastered competency feeding
 * one that is now available to start.
 *
 * Deliberately narrow. Animating every edge would be ambient noise; animating
 * only these makes the motion mean "this is reaching the next thing you can do".
 *
 * @returns Edge ids in the `from->to` form the graph uses.
 */
export function liveEdgeIds(path: PathView): Set<string> {
    const stateByKey = new Map(path.nodes.map(node => [node.key, node.state]));
    const live = new Set<string>();
    for (const edge of path.edges) {
        if (stateByKey.get(edge.from) === 'MASTERED' && stateByKey.get(edge.to) === 'AVAILABLE') {
            live.add(`${edge.from}->${edge.to}`);
        }
    }
    return live;
}
