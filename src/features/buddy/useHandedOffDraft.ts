import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** What the panel puts in history state when it hands a conversation over to `/buddy`. */
export type BuddyHandoffState = { draft?: string };

/**
 * Applies a draft handed over from the floating panel, exactly once.
 *
 * ### Why the draft travels at all
 *
 * The panel and the page share one buddy *session* but not one composer — they are separate hooks
 * with separate local state. So a control that opens the page without carrying the draft is a
 * control that silently throws away whatever somebody was part-way through typing, which is worse
 * than not offering it.
 *
 * ### Why it is cleared
 *
 * History state outlives the navigation: without `replace`, going back and forward again — or a
 * reload — would re-seed a draft the hire has since sent or deleted, overwriting whatever is in the
 * box. The state is consumed, then removed, so the hand-off happens once and leaves no trace.
 *
 * A blank or absent draft does nothing at all: there is nothing to carry, and writing an empty
 * string over a composer the page has already put something in would be a regression of its own.
 *
 * ⚠️ **Call this from exactly one place per route.** Two consumers on one page both read the same
 * payload, and the parent's effect runs after the child has already cleared it — so the second one
 * fires with a stale value and navigates again. Harmless, but it is redundant work that reads like
 * a bug. Today only the mentor conversation seeds from it; the placement interview does not, which
 * means a draft typed into the panel *during intake* is not carried. That case is marginal enough
 * to leave, and covering it means extracting the intake branch into its own component first.
 *
 * @param setDraft The composer setter of whichever conversation is mounted.
 */
export function useHandedOffDraft(setDraft: (draft: string) => void): void {
    const location = useLocation();
    const navigate = useNavigate();
    const handed = (location.state as BuddyHandoffState | null)?.draft;

    // ⚠️ Clearing the state is not enough on its own to make this fire once. Applying the draft
    // re-renders the caller, and a caller whose `setDraft` is not referentially stable gives the
    // effect a new dependency on that render — so it runs again *before* the navigation has taken
    // the payload off the location, and applies the same draft twice. A test caught exactly that.
    // The guard makes the hook independent of how the caller happens to define its setter.
    const applied = useRef<string | null>(null);

    useEffect(() => {
        if (!handed?.trim() || applied.current === handed) return;

        applied.current = handed;
        setDraft(handed);
        // Replace rather than push: this is the same page, with the one-shot payload taken off it.
        void navigate(location.pathname + location.search, { replace: true, state: null });
    }, [handed, setDraft, navigate, location.pathname, location.search]);
}
