import { useCallback, useState } from 'react';
import { useFetch } from '../../../hooks/useFetch';
import { boardService } from '../../../services/boardService';
import type { Board } from '../types';

type UseBoardResult = {
    board: Board | null;
    loading: boolean;
    error: boolean;
    /** Re-reads every card. Live cards are only as current as their last read. */
    refresh: () => void;
    /** Removes a card for good. Resolves once the board has been re-read. */
    dismiss: (cardId: string) => Promise<void>;
    /** The card currently being removed, so its own control can show it is working. */
    dismissingId: string | null;
    dismissError: boolean;
};

/**
 * Loads the hire's board for a project.
 *
 * Passing an empty `projectId` yields `null` without a request, so the caller can show a
 * pick-a-project state rather than an error.
 *
 * `refresh` exists because every card here is a live read: a pull request that got answered while
 * the page was open is answered, and the board has no way to know until it asks again. Out-of-band
 * push — a card changing the instant something happens — needs notification infrastructure these
 * services do not have, so an explicit refresh is the honest version of it.
 */
export function useBoard(projectId: string): UseBoardResult {
    const [reloadKey, setReloadKey] = useState(0);
    const [dismissingId, setDismissingId] = useState<string | null>(null);
    const [dismissError, setDismissError] = useState(false);

    const { data, loading, error } = useFetch<Board | null>(
        async () => (projectId ? await boardService.fetchBoard(projectId) : null),
        [projectId, reloadKey],
    );

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    const dismiss = useCallback(async (cardId: string) => {
        setDismissingId(cardId);
        setDismissError(false);
        try {
            await boardService.dismissCard(cardId);
            // Re-read rather than dropping the card locally: removing one is exactly the moment the
            // board's contents change underneath us, and the server is the one that knows what is
            // left.
            setReloadKey((key) => key + 1);
        } catch {
            // A card that looks gone but is not is worse than one that visibly refused to go, so
            // the failure is surfaced and the card stays.
            setDismissError(true);
        } finally {
            setDismissingId(null);
        }
    }, []);

    return { board: data, loading, error, refresh, dismiss, dismissingId, dismissError };
}
