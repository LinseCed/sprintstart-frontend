import { AlertCircle, Bot, Loader2 } from 'lucide-react';
import { useBuddyConversation } from '../features/buddy/hooks/useBuddyConversation';
import { useBuddyIntake } from '../features/buddy/hooks/useBuddyIntake';
import { useBuddyNudge } from '../features/buddy/hooks/useBuddyNudge';
import { BuddyConversation } from '../features/buddy/components/BuddyConversation';
import { BuddyNudgeCard } from '../features/buddy/components/BuddyNudgeCard';
import { FlagToPmButton } from '../features/knowledge-request/components/FlagToPmButton';

/**
 * The buddy's home: the hire's onboarding front door as a full-page conversation.
 *
 * The buddy is not a feature of the onboarding — it *is* the onboarding. For a hire
 * with no placement yet that starts with calibration: the placement interview runs
 * right here as the buddy's first conversation (same thread, same composer — the
 * standalone assessment page is retired), against the unchanged assessment engine.
 * Once the placement is written the surface flips to the mentor, which answers from
 * the docs *and* from the hire's own state — now including the ledger the interview
 * just wrote — and renders what it opens (like a task's orientation packet) in the
 * thread.
 *
 * The floating widget (mounted app-wide) shares the same one buddy session, so a hire
 * can pick up the conversation from anywhere.
 */
const SUGGESTIONS: { label: string; question: string }[] = [
    { label: 'Where do I stand?', question: 'Where do I stand right now?' },
    { label: 'What should I work on?', question: 'What should I work on next?' },
    { label: 'Is my PR stuck?', question: 'Is my pull request stuck or waiting on a review?' },
    { label: 'Show me around', question: 'Give me a quick tour of this codebase to get started.' },
];

function BuddyHeader({ subtitle }: { subtitle: string }) {
    return (
        <header className="shrink-0 border-b border-app-border px-4 py-5">
            <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-brand/10">
                    <Bot className="h-5 w-5 text-app-brand-text" />
                </div>
                <div>
                    <h1 className="text-lg font-bold leading-tight text-app-text">Buddy</h1>
                    <p className="text-sm text-app-text-muted">{subtitle}</p>
                </div>
            </div>
        </header>
    );
}

/**
 * The mentor buddy: nudges, suggestions, escalation, and the persistent conversation.
 * Its hooks load the hire's buddy history — deliberately mounted only once the hire
 * is placed, so an intake thread and the mentor transcript never mix.
 */
function BuddyMentorHome() {
    const {
        messages,
        isThinking,
        activeTool,
        draft,
        setDraft,
        sendMessage,
        handleSubmit,
        confirmAction,
        dismissAction,
        bottomRef,
    } = useBuddyConversation({ autoLoad: true });

    const nudge = useBuddyNudge();

    const isEmpty = messages.length === 0 && !isThinking;
    const lastQuestion = [...messages].reverse().find(m => m.role === 'USER')?.content ?? '';

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col lg:h-screen">
            <BuddyHeader subtitle="Your always-on mentor — ask about the codebase, or about your own onboarding." />

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

            {messages.length > 0 && (
                <div className="shrink-0 px-4 pt-3">
                    <div className="mx-auto w-full max-w-3xl">
                        <FlagToPmButton defaultQuestion={lastQuestion} />
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
                confirmAction={confirmAction}
                dismissAction={dismissAction}
                bottomRef={bottomRef}
            />
        </div>
    );
}

export function BuddyPage() {
    const intake = useBuddyIntake();

    if (intake.mode === 'mentor') {
        return <BuddyMentorHome />;
    }

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col lg:h-screen">
            <BuddyHeader subtitle="First, a few quick questions so your buddy can tailor its help to what you already know." />

            {intake.mode === 'loading' && !intake.error && (
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-app-brand" aria-hidden="true" />
                </div>
            )}

            {intake.mode === 'loading' && intake.error && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                    <AlertCircle className="h-8 w-8 text-app-danger-solid" aria-hidden="true" />
                    <p className="text-sm text-app-text-muted">{intake.error}</p>
                    <button
                        type="button"
                        onClick={intake.retry}
                        className="rounded-xl bg-app-brand px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        Try again
                    </button>
                </div>
            )}

            {intake.mode === 'intake' && (
                <>
                    {intake.error && (
                        <div className="shrink-0 px-4 pt-3">
                            <div className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-xl border border-app-border bg-app-surface-muted px-4 py-2.5 text-sm text-app-danger-text">
                                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <p className="flex-1">{intake.error}</p>
                                <button
                                    type="button"
                                    onClick={intake.retry}
                                    className="shrink-0 font-medium text-app-brand-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}
                    {/* The interview proposes no actions — it is the one buddy
                        conversation with nothing to confirm. */}
                    <BuddyConversation
                        messages={intake.messages}
                        isThinking={intake.isThinking}
                        activeTool={null}
                        draft={intake.draft}
                        setDraft={intake.setDraft}
                        handleSubmit={intake.handleSubmit}
                        confirmAction={() => {}}
                        dismissAction={() => {}}
                        bottomRef={intake.bottomRef}
                        placeholder="Type your answer..."
                    />
                </>
            )}
        </div>
    );
}
