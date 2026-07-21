import { useCallback, useEffect, useState } from 'react';
import { humanLoopService } from '../../../services/humanLoopService';
import type { Mentee } from '../types';

type UseMenteesResult = {
    mentees: Mentee[];
    isLoading: boolean;
    error: string | null;
    /** The hire whose contact is being logged right now, or null. */
    loggingHireId: string | null;
    /** Logs "we talked just now" for one mentee and refreshes so the list re-sorts. */
    logContact: (mentee: Mentee) => Promise<void>;
};

/**
 * Loads the hires the authenticated user is a buddy for — the buddy's own side of
 * the human loop — and lets them log a conversation with any of them.
 *
 * Not project-scoped: a person can mentor across several projects, and the surface
 * is "who is counting on me" wherever they are. An empty result is the common,
 * legitimate case (most people mentor nobody) and is not an error — the consuming
 * card simply renders nothing.
 */
export function useMentees(): UseMenteesResult {
    const [mentees, setMentees] = useState<Mentee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loggingHireId, setLoggingHireId] = useState<string | null>(null);

    const load = useCallback(async (signal?: { cancelled: boolean }) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await humanLoopService.fetchMyMentees();
            if (signal?.cancelled) return;
            setMentees(result);
        } catch (err) {
            if (signal?.cancelled) return;
            setError(err instanceof Error ? err.message : 'Could not load your mentees.');
        } finally {
            if (!signal?.cancelled) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const signal = { cancelled: false };
        // Deferred through a microtask so the first setState isn't synchronous in
        // the effect body (React 19 cascading-render guard).
        void (async () => {
            await load(signal);
        })();
        return () => {
            signal.cancelled = true;
        };
    }, [load]);

    const logContact = useCallback(
        async (mentee: Mentee) => {
            setLoggingHireId(mentee.hireId);
            try {
                await humanLoopService.logContact(mentee.projectId, { hireId: mentee.hireId });
                // Re-fetch so daysSinceContact/overdue and the ordering reflect the conversation.
                setMentees(await humanLoopService.fetchMyMentees());
            } finally {
                setLoggingHireId(null);
            }
        },
        []
    );

    return { mentees, isLoading, error, loggingHireId, logContact };
}
