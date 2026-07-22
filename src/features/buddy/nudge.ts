import type { HireTimeline } from '../onboarding-metrics/types';

/**
 * A proactive note the buddy shows on load, derived from the hire's own onboarding state.
 *
 * The buddy is a mentor, not a chatbox: it should notice a pull request left waiting or a
 * stall and say so first, rather than waiting to be asked. `action`, when present, seeds the
 * conversation with the question the nudge invites — one click turns "your PR is waiting" into
 * a real exchange.
 */
export type BuddyNudgeTone = 'positive' | 'attention' | 'info';

export type BuddyNudge = {
    id: string;
    tone: BuddyNudgeTone;
    message: string;
    action?: { label: string; question: string };
};

// Below this a review wait is normal churn, not something to reassure a newcomer about.
const WAIT_HOURS_THRESHOLD = 24;

function formatWait(hours: number): string {
    if (hours >= 48) {
        return `${Math.round(hours / 24)} days`;
    }
    return `${hours} hour${hours === 1 ? '' : 's'}`;
}

/**
 * Picks the single most useful thing to tell the hire right now, or nothing.
 *
 * Ordered by urgency: a stall outranks a waiting review, which outranks "no PR yet", which
 * outranks a plain congratulation. One nudge at a time — a wall of notices is noise, and the
 * buddy's job is to point at the next thing, not to dashboard.
 */
export function deriveBuddyNudge(timeline: HireTimeline): BuddyNudge | null {
    if (timeline.stalled) {
        return {
            id: 'stalled',
            tone: 'attention',
            message: timeline.stalledReason
                ? `Things look stalled: ${timeline.stalledReason}.`
                : 'Things look a little stalled.',
            action: {
                label: 'How do I get unblocked?',
                question: 'I seem to be stalled. How do I get unblocked?',
            },
        };
    }

    if (timeline.longestOpenWaitHours !== null && timeline.longestOpenWaitHours >= WAIT_HOURS_THRESHOLD) {
        return {
            id: 'pr-waiting',
            tone: 'info',
            message: `Your pull request has been waiting about ${formatWait(
                timeline.longestOpenWaitHours,
            )} for a review — that's on the reviewer, not you.`,
            action: {
                label: 'What can I do meanwhile?',
                question: 'My pull request is waiting on a review. What can I do in the meantime?',
            },
        };
    }

    if (timeline.firstPullRequestOpenedAt === null) {
        return {
            id: 'no-pr-yet',
            tone: 'info',
            message: "You haven't opened your first pull request yet. Want to find a good first task?",
            action: { label: 'Find me a task', question: 'What should I work on next?' },
        };
    }

    if (timeline.mergedPullRequestCount > 0) {
        return {
            id: 'merged',
            tone: 'positive',
            message: `You've merged ${timeline.mergedPullRequestCount} pull request${
                timeline.mergedPullRequestCount === 1 ? '' : 's'
            } — nice work.`,
            action: {
                label: "What's next?",
                question: "I've merged a pull request. What should I take on next?",
            },
        };
    }

    return null;
}
