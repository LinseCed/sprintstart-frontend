import { describe, it, expect } from 'vitest';
import { layoutPath, prerequisitesByKey } from '../../../../src/features/competency-graph/layout';
import type { PathView } from '../../../../src/features/skill-assessment/types';

const path: PathView = {
    nodes: [
        { key: 'a', label: 'A', kind: 'SKILL', state: 'MASTERED' },
        { key: 'b', label: 'B', kind: 'SKILL', state: 'AVAILABLE' },
        { key: 'c', label: 'C', kind: 'CONTRIBUTION', state: 'LOCKED' },
    ],
    edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
    ],
    graphVersion: 1,
};

describe('layoutPath', () => {
    it('places every node to the right of its prerequisites', () => {
        const positions = layoutPath(path);

        expect(positions.size).toBe(3);
        expect(positions.get('a')!.x).toBeLessThan(positions.get('b')!.x);
        expect(positions.get('b')!.x).toBeLessThan(positions.get('c')!.x);
    });

    it('ignores edges pointing outside the projected node set', () => {
        const positions = layoutPath({
            ...path,
            edges: [...path.edges, { from: 'ghost', to: 'a' }],
        });

        expect(positions.has('ghost')).toBe(false);
        expect(positions.size).toBe(3);
    });
});

describe('prerequisitesByKey', () => {
    it('maps each node to its direct prerequisites', () => {
        const prereqs = prerequisitesByKey(path);

        expect(prereqs.get('b')).toEqual(['a']);
        expect(prereqs.get('c')).toEqual(['b']);
        expect(prereqs.has('a')).toBe(false);
    });
});
