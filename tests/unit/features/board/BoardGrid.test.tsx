import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BoardGrid } from '../../../../src/features/board/components/BoardGrid';
import type {
    Board,
    BoardCard,
    OpenPullRequestsContent,
    PathToFirstContributionContent,
} from '../../../../src/features/board/types';

const engineering: Board['vocabulary'] = {
    trackLabel: 'Engineering',
    contributionNoun: 'change',
    contributionNounPlural: 'changes',
    contributionVerbPast: 'merged',
};

const scrumMaster: Board['vocabulary'] = {
    trackLabel: 'Scrum Master',
    contributionNoun: 'ceremony',
    contributionNounPlural: 'ceremonies',
    contributionVerbPast: 'facilitated',
};

const pathContent = (
    over: Partial<PathToFirstContributionContent> = {},
): PathToFirstContributionContent => ({
    kind: 'PATH_TO_FIRST_CONTRIBUTION',
    moments: [
        { key: 'JOINED', reachedAt: '2026-07-20T09:00:00Z' },
        { key: 'TASK_CLAIMED', reachedAt: null },
        { key: 'WORK_SUBMITTED', reachedAt: null },
        { key: 'FIRST_RESPONSE', reachedAt: null },
        { key: 'WORK_ACCEPTED', reachedAt: null },
    ],
    acceptedCount: 0,
    autonomyReachedAt: null,
    stalledReason: null,
    ...over,
});

const pullRequestContent = (
    over: Partial<OpenPullRequestsContent> = {},
): OpenPullRequestsContent => ({
    kind: 'OPEN_PULL_REQUESTS',
    pullRequests: [],
    attributionMissing: false,
    ...over,
});

function board(cards: BoardCard['content'][], vocabulary = engineering): Board {
    return {
        boardId: 'b1',
        projectId: 'p1',
        vocabulary,
        cards: cards.map((content, index) => ({
            id: `c${index}`,
            kind: content.kind,
            owner: 'AI',
            position: index,
            content,
        })),
    };
}

describe('BoardGrid', () => {
    it('names the work in the hire own track words', () => {
        render(<BoardGrid board={board([pathContent()], scrumMaster)} />);

        expect(screen.getByText('First ceremony submitted')).toBeInTheDocument();
        expect(screen.getByText('First ceremony facilitated')).toBeInTheDocument();
        // The engineering wording must not leak through for a track that never merges anything.
        expect(screen.queryByText(/change/i)).not.toBeInTheDocument();
    });

    it('shows an unreached moment as a dash, never as a zero', () => {
        render(<BoardGrid board={board([pathContent()])} />);

        // Four moments unreached, one (joined) reached.
        expect(screen.getAllByText('—')).toHaveLength(4);
    });

    it('says nothing has been merged yet without making it sound like a failure', () => {
        render(<BoardGrid board={board([pathContent()])} />);

        expect(screen.getByText(/normal early on/i)).toBeInTheDocument();
    });

    it('counts accepted work with the plural the track supplies', () => {
        render(<BoardGrid board={board([pathContent({ acceptedCount: 2 })], scrumMaster)} />);

        expect(screen.getByText('2 ceremonies facilitated')).toBeInTheDocument();
    });

    it('tells the hire about their own stall, and points at a person', () => {
        render(
            <BoardGrid
                board={board([pathContent({ stalledReason: 'no response in 5 days' })])}
            />,
        );

        expect(screen.getByText(/no response in 5 days/)).toBeInTheDocument();
        expect(screen.getByText(/ask your buddy/i)).toBeInTheDocument();
    });

    it('dates the end of onboarding rather than scoring it', () => {
        render(
            <BoardGrid
                board={board([pathContent({ autonomyReachedAt: '2026-07-25T09:00:00Z' })])}
            />,
        );

        expect(screen.getByText(/worked unsupervised here/i)).toBeInTheDocument();
    });

    it('flags a long wait as the review being outstanding, not the hire being slow', () => {
        render(
            <BoardGrid
                board={board([
                    pullRequestContent({
                        pullRequests: [
                            {
                                artifactId: 'a1',
                                number: 12,
                                title: 'Add a health endpoint',
                                url: 'https://example.test/pr/12',
                                waitingHours: 72,
                            },
                        ],
                    }),
                ])}
            />,
        );

        expect(screen.getByText(/waiting 3d for a first review/i)).toBeInTheDocument();
        expect(screen.getByText(/worth a nudge/i)).toBeInTheDocument();
    });

    it('says nothing about waiting once somebody has responded', () => {
        render(
            <BoardGrid
                board={board([
                    pullRequestContent({
                        pullRequests: [
                            {
                                artifactId: 'a1',
                                number: 12,
                                title: 'Add a health endpoint',
                                url: null,
                                waitingHours: null,
                            },
                        ],
                    }),
                ])}
            />,
        );

        expect(screen.queryByText(/waiting/i)).not.toBeInTheDocument();
    });

    it('separates "nothing open" from "I cannot tell what is yours"', () => {
        const { rerender } = render(<BoardGrid board={board([pullRequestContent()])} />);
        expect(screen.getByText(/nothing open right now/i)).toBeInTheDocument();

        rerender(
            <BoardGrid board={board([pullRequestContent({ attributionMissing: true })])} />,
        );
        expect(screen.getByText(/no github username on your profile/i)).toBeInTheDocument();
    });

    it('renders an unknown card kind visibly rather than dropping it', () => {
        const unknown = { kind: 'SOMETHING_NEWER' } as unknown as BoardCard['content'];

        render(<BoardGrid board={board([unknown])} />);

        // A card that silently vanishes is indistinguishable from one never placed.
        expect(screen.getByText(/needs a newer version/i)).toBeInTheDocument();
    });
});
