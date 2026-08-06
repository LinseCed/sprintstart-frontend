import type { BuddySuggestion } from '../../../services/buddyService';

type BuddySuggestionChipsProps = {
    suggestions: BuddySuggestion[];
    /** Puts the chip's question in the composer. Never sends it — see below. */
    onPick: (question: string) => void;
    /** Small print above the row. Omitted where the surrounding copy already says it. */
    heading?: string;
};

/**
 * The row of things this hire could usefully ask.
 *
 * ### Why it exists
 *
 * The buddy's most useful capabilities were reachable only by knowing what to type. The tutor put
 * it exactly: *"wenn der User einen Befehl nicht weiß oder nicht mal weiß, dass es überhaupt über
 * den Chat geht, dann wird es kaum verwendet werden."* That is a person looking at an empty
 * composer, so the answer has to be next to the composer.
 *
 * ### It fills the composer and does not send
 *
 * Clicking writes the question into the box; the hire presses send. One extra tap, and the words
 * stay theirs — `AskTheBuddy`'s rule, applied here for the same reason: a control that speaks for
 * somebody is a control they stop trusting. It also leaves them free to edit the question first,
 * which is how a hire learns they *can*.
 *
 * ⚠️ **This does not weaken the confirm gate.** A chip asks a question. If an action follows, the
 * mentor proposes it and the hire confirms it, exactly as before — nothing here calls a tool. A
 * control that ran an action directly is still the one shape the board's design has rejected.
 *
 * ### The list is not written here
 *
 * `useBuddySuggestions` reads it from the backend, which builds it from the tools mounted for this
 * hire. The hardcoded list this replaced offered *"Is my PR stuck?"* to everybody — including roles
 * that will never open one.
 */
export function BuddySuggestionChips({ suggestions, onPick, heading }: BuddySuggestionChipsProps) {
    if (suggestions.length === 0) return null;

    return (
        <div data-testid="buddy-suggestions">
            {heading && (
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-app-text-muted">{heading}</p>
            )}
            <div className="flex flex-wrap gap-2">
                {suggestions.map(suggestion => (
                    <button
                        key={suggestion.label}
                        type="button"
                        onClick={() => onPick(suggestion.question)}
                        className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-sm text-app-text transition-colors hover:border-app-brand hover:text-app-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        {suggestion.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
