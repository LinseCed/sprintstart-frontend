import { Info } from 'lucide-react';

/**
 * Chat generation UX section of the settings page.
 *
 * The streaming indicator and cancel button already exist in the chat page
 * (see `useChat` / `ChatContext`), so this section is informational: it
 * documents the current behaviour so the chat feels transparent instead of
 * frozen, matching the story's motivation. No new controls are surfaced here.
 *
 * Known states (icon + text label, not colour alone — AGENTS.md §7):
 *  - Thinking → "Retrieving sources" / "Synthesising answer" / "Searching"
 *  - Streaming → tokens stream into the answer bubble
 *  - Stop button → aborts the stream, partial answer stays visible
 *  - Error → message bubble surfaces the failure
 */
export function ChatSection() {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-app-border bg-app-bg p-4 text-sm text-app-text-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-app-brand-text" aria-hidden />
            <div className="space-y-2">
                <p>
                    While the assistant is working you&apos;ll see a status indicator
                    (Retrieving sources / Synthesising answer / Searching) and a
                    <span className="font-medium text-app-text"> Stop </span>
                    button to cancel the response at any time. The partial answer
                    stays visible after stopping.
                </p>
                <p>
                    These controls live in the chat view itself — nothing to configure here.
                </p>
            </div>
        </div>
    );
}
