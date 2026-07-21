import { describe, expect, it } from 'vitest';
import { chainFor } from '../../../../src/features/competency-graph/layout';
import { liveEdgeIds } from '../../../../src/features/my-path/pathGraph';
import type { NodeState, PathNode, PathView } from '../../../../src/features/skill-assessment/types';

function node(key: string, state: NodeState = 'AVAILABLE'): PathNode {
    return { key, label: key, kind: 'SKILL', state };
}

function path(nodes: PathNode[], edges: { from: string; to: string }[]): PathView {
    return { nodes, edges, graphVersion: 1 };
}

describe('chainFor', () => {
    it('includes everything the node depends on and everything depending on it', () => {
        const view = path(
            [node('a'), node('b'), node('c'), node('d')],
            [
                { from: 'a', to: 'b' },
                { from: 'b', to: 'c' }
            ]
        );

        // `d` is unrelated, so it must stay outside the chain -- that is what
        // makes the dimming mean something.
        expect(chainFor(view, 'b')).toEqual(new Set(['a', 'b', 'c']));
    });

    it('walks transitively in both directions, not just to direct neighbours', () => {
        const view = path(
            [node('root'), node('mid'), node('leaf')],
            [
                { from: 'root', to: 'mid' },
                { from: 'mid', to: 'leaf' }
            ]
        );

        expect(chainFor(view, 'leaf')).toEqual(new Set(['root', 'mid', 'leaf']));
    });

    it('terminates on a cycle instead of hanging the render', () => {
        const view = path(
            [node('a'), node('b')],
            [
                { from: 'a', to: 'b' },
                { from: 'b', to: 'a' }
            ]
        );

        expect(chainFor(view, 'a')).toEqual(new Set(['a', 'b']));
    });

    it('returns just the node itself when it is connected to nothing', () => {
        const view = path([node('lonely'), node('other')], []);

        expect(chainFor(view, 'lonely')).toEqual(new Set(['lonely']));
    });
});

describe('liveEdgeIds', () => {
    it('counts edges from a mastered node to any open one, and none from an unmastered source', () => {
        const view = path(
            [
                node('done', 'MASTERED'),
                node('next', 'AVAILABLE'),
                node('later', 'AVAILABLE'),
                node('other', 'AVAILABLE')
            ],
            [
                { from: 'done', to: 'next' },
                { from: 'done', to: 'later' },
                { from: 'other', to: 'later' }
            ]
        );

        // Both edges out of the mastered node are live; the edge from the unmastered
        // `other` is not. There is no locked target to withhold energy from anymore.
        expect(liveEdgeIds(view)).toEqual(new Set(['done->next', 'done->later']));
    });

    it('is empty when nothing has been mastered yet', () => {
        const view = path(
            [node('a', 'AVAILABLE'), node('b', 'AVAILABLE')],
            [{ from: 'a', to: 'b' }]
        );

        expect(liveEdgeIds(view)).toEqual(new Set());
    });
});
