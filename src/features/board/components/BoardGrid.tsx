import { CurrentTaskCard } from './CurrentTaskCard';
import { OpenPullRequestsCard } from './OpenPullRequestsCard';
import { PathToFirstContributionCard } from './PathToFirstContributionCard';
import { SuggestedTasksCard } from './SuggestedTasksCard';
import type { Board, BoardCard } from '../types';

type BoardGridProps = {
    board: Board;
    onDismiss?: (cardId: string) => void;
    dismissingId?: string | null;
};

type BoardCardViewProps = {
    card: BoardCard;
    board: Board;
    onDismiss?: (cardId: string) => void;
    dismissing: boolean;
};

/**
 * Renders one card by its kind.
 *
 * The catalog is closed, so this switch is exhaustive by construction — but an unknown kind still
 * renders something visible rather than nothing: a card that silently disappears because the client
 * is a version behind is indistinguishable from the mentor never having placed it.
 */
function BoardCardView({ card, board, onDismiss, dismissing }: BoardCardViewProps) {
    const shared = { card, onDismiss, dismissing };
    switch (card.content.kind) {
        case 'PATH_TO_FIRST_CONTRIBUTION':
            return (
                <PathToFirstContributionCard
                    content={card.content}
                    vocabulary={board.vocabulary}
                    {...shared}
                />
            );
        case 'OPEN_PULL_REQUESTS':
            return <OpenPullRequestsCard content={card.content} {...shared} />;
        case 'CURRENT_TASK':
            return <CurrentTaskCard content={card.content} {...shared} />;
        case 'SUGGESTED_TASKS':
            return <SuggestedTasksCard content={card.content} {...shared} />;
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
export function BoardGrid({ board, onDismiss, dismissingId = null }: BoardGridProps) {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {board.cards.map((card) => (
                <BoardCardView
                    key={card.id}
                    card={card}
                    board={board}
                    onDismiss={onDismiss}
                    dismissing={dismissingId === card.id}
                />
            ))}
        </div>
    );
}
