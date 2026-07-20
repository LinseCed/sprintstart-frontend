import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useForceLayout } from '../../../../src/features/my-path/hooks/useForceLayout';
import { layoutPath } from '../../../../src/features/my-path/graphLayout';
import type { PathView } from '../../../../src/features/skill-assessment/types';

const path: PathView = {
    nodes: [
        { key: 'a', label: 'A', kind: 'SKILL', state: 'MASTERED' },
        { key: 'b', label: 'B', kind: 'SKILL', state: 'AVAILABLE' },
        { key: 'c', label: 'C', kind: 'CONTRIBUTION', state: 'LOCKED' }
    ],
    edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' }
    ],
    graphVersion: 1
};

describe('useForceLayout', () => {
    it('returns dagre positions untouched when disabled', () => {
        const { result } = renderHook(() => useForceLayout(path, false));

        expect(result.current.isLive).toBe(false);
        expect(result.current.positions).toEqual(layoutPath(path));
    });

    it('does not offer dragging when the simulation is off', () => {
        // Dragging is only meaningful with a simulation to spring back; without
        // one a dropped node would simply stay where it was left, silently
        // breaking the tier reading the layout is there to guarantee.
        const { result } = renderHook(() => useForceLayout(path, false));

        expect(result.current.isLive).toBe(false);
    });

    it('keeps every node in its dagre tier while simulating', () => {
        const { result } = renderHook(() => useForceLayout(path, true));
        const seeded = layoutPath(path);

        expect(result.current.isLive).toBe(true);
        // The simulation pins x hard, so the left-to-right prerequisite order
        // holds at every point in the settle -- including the first frame.
        expect(result.current.positions.get('a')!.x).toBeLessThan(
            result.current.positions.get('b')!.x
        );
        expect(result.current.positions.get('b')!.x).toBeLessThan(
            result.current.positions.get('c')!.x
        );
        expect(result.current.positions.size).toBe(seeded.size);
    });
});
