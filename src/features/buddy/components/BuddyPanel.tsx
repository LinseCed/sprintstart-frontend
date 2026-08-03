import { Bot, Send, X } from 'lucide-react';
import { AutoResizeTextarea } from '../../../components/ui/AutoResizeTextarea';
import { UserAvatar } from '../../../components/common/UserAvatar';
import type { useBuddy } from '../hooks/useBuddy';
import { BuddyActionProposals } from './BuddyActionProposals';
import { BuddyMarkdown } from './BuddyMarkdown';

type BuddyPanelProps = Pick<
    ReturnType<typeof useBuddy>,
    | 'messages'
    | 'isThinking'
    | 'draft'
    | 'setDraft'
    | 'handleSubmit'
    | 'confirmAction'
    | 'dismissAction'
    | 'bottomRef'
> & {
    onClose: () => void;
};

/**
 * The persistent buddy's floating conversation panel. Bubble styling mirrors
 * the full-page buddy conversation so every buddy surface feels consistent.
 *
 * ### It scrolls down, never sideways
 *
 * At 384 px a model's reply overflows easily — a package path, a URL, a fenced block — and the
 * panel used to answer that with a **horizontal scrollbar across the whole conversation**, which
 * is what the tutor reported. Two things caused it, and both are fixed at the source rather than
 * by widening the panel:
 *
 * 1. **`overflow-y: auto` computes `overflow-x` to `auto` too** (CSS makes the pair non-`visible`
 *    together), so the transcript grew a sideways scrollbar the moment anything overflowed. It is
 *    now pinned shut, which is safe *because* of the second fix.
 * 2. **A flex item's default `min-width: auto` refuses to shrink below its content**, so the
 *    bubble and its column simply grew to fit a wide code block and the `overflow-x-auto` on
 *    `pre` never engaged. `min-w-0` down the chain is what lets wide content scroll inside its
 *    own block, where it belongs.
 *
 * Vertical scrolling is intentional and stays.
 */
export function BuddyPanel({
    messages,
    isThinking,
    draft,
    setDraft,
    handleSubmit,
    confirmAction,
    dismissAction,
    bottomRef,
    onClose,
}: BuddyPanelProps) {
    return (
        <div
            role="dialog"
            aria-label="Onboarding buddy"
            className="fixed bottom-24 right-8 z-40 flex h-[32rem] max-h-[calc(100vh-8rem)] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-2xl"
        >
            <header className="flex items-center justify-between border-b border-app-border px-4 py-3">
                <div className="flex items-center gap-2">
                    <Bot size={18} className="text-app-brand-text" />
                    <span className="text-sm font-semibold text-app-text">Buddy</span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close buddy chat"
                    className="rounded-lg p-1 text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-app-text"
                >
                    <X size={18} />
                </button>
            </header>

            <div data-testid="buddy-panel-transcript" className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="flex min-w-0 flex-col gap-4 px-4 py-4">
                    {messages.map(message => {
                        const isUser = message.role === 'USER';
                        const hasText = message.content.trim().length > 0;
                        const hasActions = (message.actions?.length ?? 0) > 0;

                        // The empty assistant placeholder streams in later; the `isThinking`
                        // indicator already stands in for it, so skip it to avoid a second empty
                        // bubble while the buddy is thinking.
                        if (!isUser && !hasText && !hasActions) {
                            return null;
                        }

                        return (
                            <div
                                key={message.id}
                                className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                        isUser ? '' : 'bg-app-surface-muted'
                                    }`}
                                >
                                    {isUser ? (
                                        <UserAvatar fallbackName="You" size={28} />
                                    ) : (
                                        <Bot size={14} className="text-app-brand-text" />
                                    )}
                                </div>

                                <div className={`flex min-w-0 max-w-[80%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                    {hasText && (
                                        <div
                                            className={`min-w-0 max-w-full break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                                isUser
                                                    ? 'whitespace-pre-wrap rounded-tr-none bg-app-brand text-white'
                                                    : 'rounded-tl-none bg-app-surface-muted text-app-text'
                                            }`}
                                        >
                                            {isUser ? message.content : <BuddyMarkdown content={message.content} />}
                                        </div>
                                    )}

                                    {!isUser && message.actions && message.actions.length > 0 && (
                                        <BuddyActionProposals
                                            messageId={message.id}
                                            actions={message.actions}
                                            onConfirm={confirmAction}
                                            onDismiss={dismissAction}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isThinking && (
                        <div className="flex w-full gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-app-surface-muted">
                                <Bot size={14} className="text-app-brand-text" />
                            </div>

                            <div className="flex max-w-[80%] flex-col items-start">
                                <div className="rounded-2xl rounded-tl-none bg-app-surface-muted px-3 py-2">
                                    <div className="flex gap-1">
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-brand" />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-brand [animation-delay:150ms]" />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-brand [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>
            </div>

            <footer className="border-t border-app-border bg-app-bg p-3">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <AutoResizeTextarea
                        value={draft}
                        onChange={setDraft}
                        placeholder="Ask your buddy..."
                        minRows={1}
                        maxRows={6}
                        className="flex-1"
                    />

                    <button
                        type="submit"
                        aria-label="Send message"
                        disabled={!draft.trim()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-brand text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </footer>
        </div>
    );
}
