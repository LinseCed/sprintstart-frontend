import type { Citation } from '../chatbot/types';

/**
 * An action the buddy has *proposed* — the hire must confirm it before anything changes. Carried on
 * the assistant message it was proposed in, so the confirm button renders inline in the thread.
 *
 * `status` tracks the one round-trip: `idle` (awaiting the hire) → `confirming` → `resolved` (the
 * backend ran it; `ok` says whether it changed anything, `outcome` is the line to show) or `error`
 * (the request itself failed, retryable). `dismissed` when the hire chose not to.
 */
export type ProposedActionStatus = 'idle' | 'confirming' | 'resolved' | 'error' | 'dismissed';

/**
 * The backend's `open_orientation` action. Once confirmed, its payoff is not the outcome line
 * but the orientation packet itself, rendered in the thread (see `BuddyOrientationCard`) — the
 * conversation is the surface now, so confirming must not navigate anywhere.
 */
export const BUDDY_ACTION_OPEN_ORIENTATION = 'open_orientation';

export type ProposedAction = {
    /** Local id for keying and targeting the confirm — the backend doesn't assign one. */
    id: string;
    /** The action's tool name, sent back verbatim to confirm it (e.g. "claim_task_zero"). */
    action: string;
    /** The button text ("Start Task 0"). */
    label: string;
    /** Carried through only for flag-to-PM: the question the buddy composed. */
    question?: string;
    status: ProposedActionStatus;
    /** Whether a resolved action actually changed something (false = a handled "couldn't"). */
    ok?: boolean;
    /** The outcome line to show once resolved. */
    outcome?: string;
};

/**
 * A single turn in the user's persistent buddy conversation, as returned by the backend.
 */
export type BuddyMessage = {
    role: 'USER' | 'ASSISTANT';

    /**
     * Text content of the message.
     */
    content: string;

    /**
     * When the message was sent.
     */
    createdAt: string;
};

/**
 * A buddy message as tracked in hook state: adds a locally-synthesized id (the backend
 * doesn't assign one) and in-memory citations for the current session's streamed replies.
 */
export type BuddyMessageView = BuddyMessage & {
    id: string;
    citations?: Citation[];
    /** Actions the buddy proposed in this turn, each awaiting the hire's confirmation. */
    actions?: ProposedAction[];
};
