import { OpenPullRequestsCard } from './OpenPullRequestsCard';
import { PathToFirstContributionCard } from './PathToFirstContributionCard';
import type { Board, BoardCard } from '../types';

type BoardGridProps = {
    board: Board;
};

/**
 * Renders one card by its kind.
 *
 * The catalog is closed, so this switch is exhaustive by construction — but an unknown kind still
 * renders something visible rather than nothing: a card that silently disappears because the client
 * is a version behind is indistinguishable from the mentor never having placed it.
 */
function BoardCardView({ card, board }: { card: BoardCard; board: Board }) {
    switch (card.content.kind) {
        case 'PATH_TO_FIRST_CONTRIBUTION':
            return (
                <PathToFirstContributionCard
                    content={card.content}
                    vocabulary={board.vocabulary}
                    owner={card.owner}
                />
            );
        case 'OPEN_PULL_REQUESTS':
            return <OpenPullRequestsCard content={card.content} owner={card.owner} />;
        default:
            return (
                <section className="rounded-2xl border border-dashed border-app-border p-4">
                    <p className="text-sm text-app-text-muted">
                        This card needs a newer version of the app to show.
                    </p>
                </section>
            );
    }
}

/**
 * The board's layout: a responsive grid, in board order.
 *
 * A grid rather than a free x/y canvas — each card can still contain a graph or a diagram, and a
 * canvas does not survive a phone screen. Drag-reorder is the hire's half of the board and arrives
 * with the cards they author.
 */
export function BoardGrid({ board }: BoardGridProps) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {board.cards.map((card) => (
                <BoardCardView key={card.id} card={card} board={board} />
            ))}
        </div>
    );
}
