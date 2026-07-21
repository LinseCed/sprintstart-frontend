import { useEffect, useState } from 'react';
import { humanLoopService } from '../../../services/humanLoopService';

/**
 * How many of the caller's mentees currently need their move — a review kept
 * waiting, a cadence gone quiet, a stall. Drives the nav badge, so a buddy
 * notices someone is waiting without having to open the dashboard first.
 *
 * The delivery half of the human loop: the signal already existed, this is what
 * pushes it at the one person who acts on it. Deliberately lightweight — one read
 * when the app loads, errors swallowed to zero (a badge is not worth surfacing an
 * error over), and nothing for the common case of mentoring nobody. Mild
 * staleness after the buddy logs a contact is fine: the "Counting on you" card on
 * the dashboard is the accurate source, this is only the nudge to go look.
 *
 * @param enabled Gate on the caller being authenticated, so it never fires before
 * there is a session to read against.
 */
export function useMenteeAlertCount(enabled: boolean): number {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const signal = { cancelled: false };
        // Everything runs inside the deferred microtask, including the disabled reset,
        // so the first setState is never synchronous in the effect body (React 19
        // cascading-render guard, `react-hooks/set-state-in-effect`).
        void (async () => {
            if (!enabled) {
                if (!signal.cancelled) setCount(0);
                return;
            }
            try {
                const mentees = await humanLoopService.fetchMyMentees();
                if (signal.cancelled) return;
                setCount(mentees.filter((mentee) => mentee.alerts.length > 0).length);
            } catch {
                if (!signal.cancelled) setCount(0);
            }
        })();
        return () => {
            signal.cancelled = true;
        };
    }, [enabled]);

    return count;
}
