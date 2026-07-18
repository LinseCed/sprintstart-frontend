import type { Citation } from '../chatbot/types';

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
};
