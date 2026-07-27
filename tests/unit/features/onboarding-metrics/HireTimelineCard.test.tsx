import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HireTimelineCard } from '../../../../src/features/onboarding-metrics/components/HireTimelineCard';
import type { HireTimeline } from '../../../../src/features/onboarding-metrics/types';

const engineering: HireTimeline['vocabulary'] = {
    trackLabel: 'Engineering',
    contributionNoun: 'change',
    contributionNounPlural: 'changes',
    contributionVerbPast: 'merged',
};

const scrumMaster: HireTimeline['vocabulary'] = {
    trackLabel: 'Scrum Master',
    contributionNoun: 'ceremony',
    contributionNounPlural: 'ceremonies',
    contributionVerbPast: 'facilitated',
};

const hire = (over: Partial<HireTimeline> = {}): HireTimeline => ({
    userId: 'h1',
    displayName: 'Ada',
    githubLogin: 'ada',
    joinedAt: '2026-07-01T09:00:00Z',
    firstTaskClaimedAt: '2026-07-02T09:00:00Z',
    firstPullRequestOpenedAt: '2026-07-03T09:00:00Z',
    firstResponseAt: '2026-07-03T15:00:00Z',
    firstPullRequestMergedAt: '2026-07-04T09:00:00Z',
    hoursToFirstMergedPullRequest: 72,
    hoursToFirstResponse: 6,
    mergedPullRequestCount: 2,
    openPullRequestCount: 0,
    longestOpenWaitHours: null,
    stalled: false,
    stalledReason: null,
    vocabulary: engineering,
    ...over,
});

describe('HireTimelineCard', () => {
    it('names the moments in the words of the hire, not of a developer', () => {
        // The invisible-hire problem in its mildest form: a Scrum Master reading "PR opened" over
        // their own ceremonies learns nothing except that the tool was not built for them.
        render(<HireTimelineCard hire={hire({ vocabulary: scrumMaster })} />);

        expect(screen.getByText('Ceremony started')).toBeInTheDocument();
        expect(screen.getByText('Facilitated')).toBeInTheDocument();
        expect(screen.queryByText('PR opened')).not.toBeInTheDocument();
        expect(screen.queryByText('Merged')).not.toBeInTheDocument();
    });

    it('still reads naturally for an engineer', () => {
        render(<HireTimelineCard hire={hire()} />);

        expect(screen.getByText('Change started')).toBeInTheDocument();
        expect(screen.getByText('Merged')).toBeInTheDocument();
    });

    it('counts accepted work in the hire’s own noun', () => {
        render(<HireTimelineCard hire={hire({ vocabulary: scrumMaster })} />);
        expect(screen.getByText(/2 ceremonies facilitated/)).toBeInTheDocument();
    });

    it('uses the singular for one', () => {
        render(
            <HireTimelineCard
                hire={hire({ vocabulary: scrumMaster, mergedPullRequestCount: 1 })}
            />,
        );
        expect(screen.getByText(/1 ceremony facilitated/)).toBeInTheDocument();
    });

    it('frames a wait as owed by somebody else, whatever the work is', () => {
        render(
            <HireTimelineCard
                hire={hire({
                    vocabulary: scrumMaster,
                    firstResponseAt: null,
                    firstPullRequestMergedAt: null,
                    openPullRequestCount: 1,
                    longestOpenWaitHours: 72,
                })}
            />,
        );

        // "Receiving a response" is the barrier the research names; the fix is a conversation with
        // whoever owes it, so the card must not read as the hire being slow.
        expect(screen.getByText(/Waiting .* on a response/)).toBeInTheDocument();
    });

    it('shows the stall reason the server worded', () => {
        render(
            <HireTimelineCard
                hire={hire({
                    vocabulary: scrumMaster,
                    stalled: true,
                    stalledReason: 'No ceremony started in 20 days since joining',
                })}
            />,
        );

        expect(
            screen.getByText('No ceremony started in 20 days since joining'),
        ).toBeInTheDocument();
    });

    it('says work cannot be attributed when there is no GitHub login', () => {
        render(<HireTimelineCard hire={hire({ githubLogin: null })} />);

        expect(screen.getByText(/can't be attributed/)).toBeInTheDocument();
    });
});
