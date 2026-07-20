import type { PathView } from '../skill-assessment/types';

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