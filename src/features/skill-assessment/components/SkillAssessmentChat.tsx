import { useEffect, useRef, useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { AutoResizeTextarea } from '../../../components/ui/AutoResizeTextarea';
import { UserAvatar } from '../../../components/common/UserAvatar';
import type { AssessmentChatMessage } from '../types';

type SkillAssessmentChatProps = {
    messages: AssessmentChatMessage[];
    isThinking: boolean;
    onSubmitAnswer: (answer: string) => void;
};

/**
 * Turn-based skill-assessment chat: renders the transcript so far, a bouncing-
 * dots "thinking" bubble while waiting on the interviewer, and the answer
 * input. Bubble styling mirrors ChatPage.tsx so the two chat surfaces feel
 * consistent.
 */
export function SkillAssessmentChat({ messages, isThinking, onSubmitAnswer }: SkillAssessmentChatProps) {
    const [answer, setAnswer] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmed = answer.trim();
        if (!trimmed || isThinking) return;

        onSubmitAnswer(trimmed);
        setAnswer('');
    };

    return (
        <div className="flex flex-1 flex-col min-w-0">
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                    {messages.map(message => {
                        const isUser = message.role === 'user';

                        return (
                            <div
                                key={message.id}
                                className={`flex w-full gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                        isUser ? '' : 'bg-app-surface-muted'
                                    }`}
                                >
                                    {isUser ? (
                                        <UserAvatar fallbackName="You" size={32} />
                                    ) : (
                                        <Bot size={16} className="text-app-brand-text" />
                                    )}
                                </div>

                                <div className={`flex max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                            isUser
                                                ? 'rounded-tr-none bg-app-brand text-white'
                                                : 'rounded-tl-none bg-app-surface-muted text-app-text'
                                        }`}
                                    >
                                        {message.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {isThinking && (
                        <div className="flex w-full gap-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-surface-muted">
                                <Bot size={16} className="text-app-brand-text" />
                            </div>

                            <div className="flex max-w-[85%] flex-col items-start">
                                <div className="rounded-2xl rounded-tl-none bg-app-surface-muted px-4 py-2.5 text-app-text">
                                    <div className="flex gap-1">
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-app-brand" />
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-app-brand [animation-delay:150ms]" />
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-app-brand [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>
            </div>

            <footer className="border-t border-app-border bg-app-bg p-4">
                <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-3">
                    <AutoResizeTextarea
                        value={answer}
                        onChange={setAnswer}
                        placeholder="Type your answer..."
                        className="flex-1"
                    />

                    <button
                        type="submit"
                        aria-label="Send answer"
                        disabled={isThinking || !answer.trim()}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-app-brand text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </footer>
        </div>
    );
}
