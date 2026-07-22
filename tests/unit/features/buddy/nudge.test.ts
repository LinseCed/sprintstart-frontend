import { describe, it, expect } from 'vitest';
import { deriveBuddyNudge } from '../../../../src/features/buddy/nudge';
import type { MyTimeline } from '../../../../src/features/human-loop/types';

function timeline(overrides: Partial<MyTimeline> = {}): MyTimeline {
    return {
        userId: 'u1',
        displayName: 'Sam',
        githubLogin: 'sam',
        firstPullRequestOpenedAt: '2026-07-20T00:00:00Z',
        firstResponseAt: null,
        firstPullRequestMergedAt: null,
        mergedPullRequestCount: 0,
        openPullRequestCount: 1,
        longestOpenWaitHours: null,
        stalled: false,
        stalledReason: null,
        ...overrides,
    };
}

describe('deriveBuddyNudge', () => {
    it('leads with a stall over everything else', () => {
        const nudge = deriveBuddyNudge(
            timeline({ stalled: true, stalledReason: 'no activity for a week', longestOpenWaitHours: 100 }),
        );
        expect(nudge?.id).toBe('stalled');
        expect(nudge?.message).toContain('no activity for a week');
        expect(nudge?.action?.question).toContain('unblocked');
    });

    it('reassures about a long-waiting review and pins the delay on the reviewer', () => {
        const nudge = deriveBuddyNudge(timeline({ longestOpenWaitHours: 52 }));
        expect(nudge?.id).toBe('pr-waiting');
        expect(nudge?.message).toContain('2 days');
        expect(nudge?.message).toContain('not you');
    });

    it('does not nag about a review that has barely waited', () => {
        const nudge = deriveBuddyNudge(timeline({ longestOpenWaitHours: 3 }));
        // 3h is below the threshold, and a PR is already open, so nothing to say.
        expect(nudge).toBeNull();
    });

    it('nudges toward a first task when no pull request exists yet', () => {
        const nudge = deriveBuddyNudge(timeline({ firstPullRequestOpenedAt: null }));
        expect(nudge?.id).toBe('no-pr-yet');
        expect(nudge?.action?.question).toBe('What should I work on next?');
    });

    it('congratulates a merge when nothing more urgent applies', () => {
        const nudge = deriveBuddyNudge(timeline({ mergedPullRequestCount: 2 }));
        expect(nudge?.id).toBe('merged');
        expect(nudge?.message).toContain('2 pull requests');
    });

    it('says nothing when there is nothing worth surfacing', () => {
        expect(deriveBuddyNudge(timeline())).toBeNull();
    });
});
