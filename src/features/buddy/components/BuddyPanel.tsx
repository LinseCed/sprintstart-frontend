import { Bot, Send, X } from 'lucide-react';
import { AutoResizeTextarea } from '../../../components/ui/AutoResizeTextarea';
import { UserAvatar } from '../../../components/common/UserAvatar';
import type { useBuddy } from '../hooks/useBuddy';
import { BuddyActionProposals } from './BuddyActionProposals';

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
 * SkillAssessmentChat/ChatPage so every chat surface in the app feels consistent.
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

            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-4 px-4 py-4">
                    {messages.map(message => {
                        const isUser = message.role === 'USER';

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

                                <div className={`flex max-w-[80%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                            isUser
                                                ? 'rounded-tr-none bg-app-brand text-white'
                                                : 'rounded-tl-none bg-app-surface-muted text-app-text'
                                        }`}
                                    >
                                        {message.content}
                                    </div>

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
