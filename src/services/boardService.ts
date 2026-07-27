import { apiClient } from './apiClient';
import type { AuthoredCardRequest, Board, BoardCard } from '../features/board/types';

const BASE = '/api/v1/onboarding';

export const boardService = {
    /**
     * The caller's own board on a project, cards hydrated.
     *
     * Every card's content is read live on the server from the same services the buddy's tools
     * read, so a card and the tool behind it cannot say different things. The board is created on
     * first read, holding the cards relevant to the caller's track — so a hire on their first day
     * gets a board, not an empty state.
     *
     * @param projectId The project the board belongs to.
     * @throws ApiError 404 when the caller is not a member of that project.
     */
    async fetchBoard(projectId: string): Promise<Board> {
        return await apiClient.fetch<Board>(
            `${BASE}/me/board?projectId=${encodeURIComponent(projectId)}`,
        );
    },

    /**
     * Takes a card off the caller's board, for good.
     *
     * The buddy will not put it back — the backend keeps the dismissed row precisely so that both
     * the baseline and the mentor consult it before adding anything. Dismissing is a decision, not
     * a gesture the next page load undoes, which is why the affordance says "remove" rather than
     * "hide".
     *
     * @param cardId The card to remove.
     * @throws ApiError 404 when it is not a card on a board of theirs.
     */
    async dismissCard(cardId: string): Promise<void> {
        await apiClient.fetch<void>(`${BASE}/me/board/cards/${encodeURIComponent(cardId)}`, {
            method: 'DELETE',
        });
    },

    /**
     * Puts a card of the hire's own on their board.
     *
     * It is theirs: they can edit it, the buddy never touches it, and a board holds as many as they
     * like — unlike the live cards, of which there is one each.
     *
     * @throws ApiError 400 when the card would say nothing (an empty note, a link with no address).
     */
    async addCard(projectId: string, request: AuthoredCardRequest): Promise<BoardCard> {
        return await apiClient.fetch<BoardCard>(
            `${BASE}/me/board/cards?projectId=${encodeURIComponent(projectId)}`,
            { method: 'POST', body: JSON.stringify(request) },
        );
    },

    /**
     * Replaces what one of the hire's own cards says — ticking a checklist item included.
     *
     * Replaces rather than patches: these are small and are read and written whole. Items keep
     * their ids across the round trip, which is what makes a tick an edit to that line rather than
     * to a position.
     *
     * @throws ApiError 404 when it is not a card of theirs.
     */
    async editCard(cardId: string, request: AuthoredCardRequest): Promise<BoardCard> {
        return await apiClient.fetch<BoardCard>(
            `${BASE}/me/board/cards/${encodeURIComponent(cardId)}`,
            { method: 'PATCH', body: JSON.stringify(request) },
        );
    },

    /**
     * Sets the order of the hire's cards.
     *
     * Sends the whole order rather than one move: a drag is a statement about the board, and
     * reconstructing that from a single move is how two clients end up disagreeing.
     */
    async reorder(projectId: string, cardIds: string[]): Promise<void> {
        await apiClient.fetch<void>(
            `${BASE}/me/board/order?projectId=${encodeURIComponent(projectId)}`,
            { method: 'PUT', body: JSON.stringify({ cardIds }) },
        );
    },
};
