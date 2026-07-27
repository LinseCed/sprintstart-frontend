import { apiClient } from './apiClient';
import type { Board } from '../features/board/types';

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
};
