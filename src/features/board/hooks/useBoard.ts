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

    const { data, loading, error } = useFetch<Board | null>(
        async () => (projectId ? await boardService.fetchBoard(projectId) : null),
        [projectId, reloadKey],
    );

    const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

    return { board: data, loading, error, refresh };
}
