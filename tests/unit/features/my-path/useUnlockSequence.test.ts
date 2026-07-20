import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnlockSequence } from '../../../../src/features/my-path/hooks/useUnlockSequence';
import type { PathView } from '../../../../src/features/skill-assessment/types';

const path: PathView = {
    nodes: [
        { key: 'earned', label: 'Earned', kind: 'SKILL', state: 'MASTERED' },
        { key: 'opened', label: 'Opened', kind: 'SKILL', state: 'AVAILABLE' },
        { key: 'still-locked', label: 'Still locked', kind: 'SKILL', state: 'LOCKED' }
    ],
    edges: [
        { from: 'earned', to: 'opened' },
        { from: 'earned', to: 'still-locked' }
    ],
    graphVersion: 1
};

describe('useUnlockSequence', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('plays the stages in order rather than flashing the end state', () => {
        const { result } = renderHook(() => useUnlockSequence('earned', path, true));

        expect(result.current.stage).toBe('focus');

        act(() => void vi.advanceTimersByTime(650));
        expect(result.current.stage).toBe('flip');

        act(() => void vi.advanceTimersByTime(550));
        expect(result.current.stage).toBe('travel');

        act(() => void vi.advanceTimersByTime(700));
        expect(result.current.stage).toBe('pop');

        act(() => void vi.advanceTimersByTime(750));
        expect(result.current.stage).toBe('done');

        // Terminal: nothing schedules another transition.
        act(() => void vi.advanceTimersByTime(5000));
        expect(result.current.stage).toBe('done');
    });

    it('resolves straight to done under reduced motion', () => {
        const { result } = renderHook(() => useUnlockSequence('earned', path, false));

        expect(result.current.stage).toBe('done');
    });

    it('stays idle when no module was just passed', () => {
        const { result } = renderHook(() => useUnlockSequence(undefined, path, true));

        expect(result.current.stage).toBe('idle');
        expect(result.current.unlockedKey).toBeNull();
    });

    it('waits for the path before starting, since the map remounts on return', () => {
        const { result, rerender } = renderHook(
            ({ view }: { view: PathView | null }) => useUnlockSequence('earned', view, true),
            { initialProps: { view: null as PathView | null } }
        );

        expect(result.current.stage).toBe('idle');

        rerender({ view: path });
        expect(result.current.stage).toBe('focus');
    });

    it('counts only the dependents the unlock actually opened', () => {
        const { result } = renderHook(() => useUnlockSequence('earned', path, true));

        // `still-locked` has another unmet prerequisite, so it is not part of
        // the payoff -- popping it would promise something that didn't happen.
        expect(result.current.dependentKeys).toEqual(new Set(['opened']));
    });
});
