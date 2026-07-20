import { useCallback, useEffect, useState } from 'react';
import { humanLoopService } from '../../../services/humanLoopService';
import type { MyBuddy, MyTimeline } from '../types';

type UseMyBuddyResult = {
    buddy: MyBuddy | null;
    timeline: MyTimeline | null;
    isLoading: boolean;
    error: string | null;
    /** True while a just-logged contact is being saved and the buddy re-fetched. */
    isLogging: boolean;
    /** Logs "we talked just now" and refreshes so last-spoke/overdue update immediately. */
    logContact: () => Promise<void>;
};

/**
 * Loads the authenticated hire's buddy and their own onboarding timeline for one
 * project, and lets them log a conversation.
 *
 * Buddy and timeline are independent: a hire can have a waiting pull request with
 * no buddy assigned, or a buddy with nothing open. A missing buddy is `null`, not
 * an error; a timeline 404 (not a member) also degrades to `null` rather than
 * failing the whole card. Only an unexpected failure surfaces as `error`.
 *
 * @param projectId The selected project, or empty string when none is chosen yet.
 */
export function useMyBuddy(projectId: string): UseMyBuddyResult {
    const [buddy, setBuddy] = useState<MyBuddy | null>(null);
    const [timeline, setTimeline] = useState<MyTimeline | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLogging, setIsLogging] = useState(false);

    const load = useCallback(
        async (signal?: { cancelled: boolean }) => {
            if (!projectId) {
                setBuddy(null);
                setTimeline(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                // The timeline can 404 (not a member) while the buddy read is fine,
                // so each is resolved independently and a 404 timeline is just "none".
                const [buddyResult, timelineResult] = await Promise.all([
                    humanLoopService.fetchMyBuddy(projectId),
                    humanLoopService.fetchMyTimeline(projectId).catch(() => null)
                ]);
                if (signal?.cancelled) return;
                setBuddy(buddyResult);
                setTimeline(timelineResult);
            } catch (err) {
                if (signal?.cancelled) return;
                setError(err instanceof Error ? err.message : 'Could not load your buddy.');
            } finally {
                if (!signal?.cancelled) setIsLoading(false);
            }
        },
        [projectId]
    );

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

    const logContact = useCallback(async () => {
        if (!projectId) return;
        setIsLogging(true);
        try {
            await humanLoopService.logContact(projectId);
            // Re-fetch so daysSinceContact/overdue reflect the conversation at once.
            setBuddy(await humanLoopService.fetchMyBuddy(projectId));
        } finally {
            setIsLogging(false);
        }
    }, [projectId]);

    return { buddy, timeline, isLoading, error, isLogging, logContact };
}
