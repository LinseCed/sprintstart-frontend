import { Bot } from 'lucide-react';
import { useBuddyConversation } from '../features/buddy/hooks/useBuddyConversation';
import { useBuddyNudge } from '../features/buddy/hooks/useBuddyNudge';
import { BuddyConversation } from '../features/buddy/components/BuddyConversation';
import { BuddyNudgeCard } from '../features/buddy/components/BuddyNudgeCard';

/**
 * The buddy's home: the hire's onboarding front door as a full-page conversation.
 *
 * The buddy is the mentor a new hire would otherwise have to find a person for — it answers
 * from the docs *and* from the hire's own onboarding state (their pull requests, where they
 * stand, what to work on next). On an empty conversation it opens proactively with the
 * questions it can actually answer, so a hire never faces a blank box wondering what to ask.
 *
 * A co-equal front door, not a replacement: First Week and the competency map stay reachable.
 * The floating widget (mounted app-wide) shares the same one buddy session, so a hire can pick
 * up the conversation from anywhere.
 */
const SUGGESTIONS: { label: string; question: string }[] = [
    { label: 'Where do I stand?', question: 'Where do I stand right now?' },
    { label: 'What should I work on?', question: 'What should I work on next?' },
    { label: 'Is my PR stuck?', question: 'Is my pull request stuck or waiting on a review?' },
    { label: 'Show me around', question: 'Give me a quick tour of this codebase to get started.' },
];

export function BuddyPage() {
    const {
        messages,
        isThinking,
        activeTool,
        draft,
        setDraft,
        sendMessage,
        handleSubmit,
        bottomRef,
    } = useBuddyConversation({ autoLoad: true });

    const nudge = useBuddyNudge();

    const isEmpty = messages.length === 0 && !isThinking;

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col lg:h-screen">
            <header className="shrink-0 border-b border-app-border px-4 py-5">
                <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-brand/10">
                        <Bot className="h-5 w-5 text-app-brand-text" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight text-app-text">Buddy</h1>
                        <p className="text-sm text-app-text-muted">
                            Your always-on mentor — ask about the codebase, or about your own onboarding.
                        </p>
                    </div>
                </div>
            </header>

            {nudge && (
                <div className="shrink-0 px-4 pt-5">
                    <BuddyNudgeCard nudge={nudge} onAct={question => void sendMessage(question)} />
                </div>
            )}

            {isEmpty && (
                <div className="shrink-0 px-4 pt-5">
                    <div className="mx-auto w-full max-w-3xl">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-app-text-muted">
                            Not sure where to start? Try one of these
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS.map(suggestion => (
                                <button
                                    key={suggestion.label}
                                    type="button"
                                    onClick={() => void sendMessage(suggestion.question)}
                                    className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-sm text-app-text transition-colors hover:border-app-brand hover:text-app-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                >
                                    {suggestion.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <BuddyConversation
                messages={messages}
                isThinking={isThinking}
                activeTool={activeTool}
                draft={draft}
                setDraft={setDraft}
                handleSubmit={handleSubmit}
                bottomRef={bottomRef}
            />
        </div>
    );
}
