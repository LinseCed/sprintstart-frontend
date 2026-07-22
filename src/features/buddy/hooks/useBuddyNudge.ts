import { useEffect, useState } from 'react';
import { onboardingMetricsService } from '../../../services/onboardingMetricsService';
import { useProjectSelection } from '../../projects/useProjectSelection';
import { deriveBuddyNudge, type BuddyNudge } from '../nudge';

/**
 * Resolves the hire's selected project, reads their self-serve onboarding timeline, and derives
 * the one proactive nudge the buddy home should open with — or `null` when there is nothing worth
 * saying (or the caller isn't a member of the project, or the read fails). A nudge is help, never
 * a gate: any failure resolves to no nudge and never blocks the conversation.
 */
export function useBuddyNudge(): BuddyNudge | null {
    const { selectedProjectId } = useProjectSelection();
    const [nudge, setNudge] = useState<BuddyNudge | null>(null);

    useEffect(() => {
        let cancelled = false;

        // The async IIFE also defers the first setState past a microtask, which the repo's
        // React-19 lint requires (no synchronous setState in an effect body).
        void (async () => {
            if (!selectedProjectId) {
                if (!cancelled) setNudge(null);
                return;
            }
            try {
                const timeline = await onboardingMetricsService.fetchMyTimeline(selectedProjectId);
                if (!cancelled) setNudge(deriveBuddyNudge(timeline));
            } catch {
                if (!cancelled) setNudge(null);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectedProjectId]);

    return nudge;
}
