import { useEffect, useState } from "react";
import { getSuggestions, type BuddySuggestion } from "../../../services/buddyService";

/**
 * The chips this hire could usefully ask, for whichever buddy surface is showing.
 *
 * ### Why these come from the server
 *
 * A chip is only honest if the buddy can actually answer it, and what it can answer differs per
 * hire — the pull-request chip exists only for a track that produces pull requests. The backend
 * derives the list from the very tools it mounts for that hire, so the chips and the mentor cannot
 * disagree. Deriving it here from a role would be a second opinion about the same question, and the
 * hardcoded list this replaced offered *"Is my PR stuck?"* to every hire including a Scrum Master.
 *
 * ### Failure is silence
 *
 * A chip row is an invitation, not information. If the call fails the hire simply sees no chips and
 * the composer still works — an error message about a failed suggestion fetch would be noise about
 * a thing they never asked for.
 *
 * @param enabled Fetch only once the surface is actually showing (the widget defers until the panel
 *   is first opened, so an unopened widget makes no request).
 */
export function useBuddySuggestions(enabled = true): BuddySuggestion[] {
    const [suggestions, setSuggestions] = useState<BuddySuggestion[]>([]);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        // Deferred to a microtask (the repo's React-19 pattern) so the first setState never runs
        // synchronously in the effect body.
        void (async () => {
            try {
                const loaded = await getSuggestions();
                if (!cancelled) setSuggestions(loaded);
            } catch (e) {
                console.error(e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return suggestions;
}
