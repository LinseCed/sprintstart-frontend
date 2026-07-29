import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bot, Loader2, MessageSquareText } from 'lucide-react';
import type { ChatMessage } from '../../../../features/chatbot/types';
import type { Chat } from '../../../../features/chatbot/types';
import type { SelectedCitation } from '../../../../context/ChatContext';
import { formatRelativeDate } from '../../../../features/chatbot/format';
import { MessageRow } from '../../../../features/chatbot/components/MessageRow';
import { getChatsAdmin, getChatMessagesAdmin } from '../../../../services/chatService';

type MemberChatHistoryProps = {
    /** The team member whose AI conversations to display. */
    userId: string;
    /** Display name of the member, for the read-only user-side avatar. */
    memberName: string;
};

/**
 * Admin-only section on the team-member detail page that lists a member's AI
 * chat conversations and renders the selected conversation read-only.
 *
 * Fetches all chats via the admin endpoint and filters client-side by
 * `userId` (small-team assumption — no backend filtering). Message rendering
 * reuses {@link MessageRow} with streaming/thinking props disabled so the
 * thread looks exactly like a live chat minus the input bar. There is no
 * prompt/streaming UI: admins can read another user's history but cannot
 * interact as them.
 */
export function MemberChatHistory({ userId, memberName }: MemberChatHistoryProps) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        void (async () => {
            setLoadingChats(true);
            setError('');
            try {
                const data = await getChatsAdmin();
                if (!active) return;
                setChats(data.chats.filter((chat) => chat.userId === userId));
            } catch (e) {
                if (!active) return;
                setError(e instanceof Error ? e.message : 'Could not load chat history.');
            } finally {
                if (active) setLoadingChats(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [userId]);

    useEffect(() => {
        if (!selectedChatId) {
            return;
        }

        let active = true;
        void (async () => {
            setLoadingMessages(true);
            try {
                const data = await getChatMessagesAdmin(selectedChatId);
                if (!active) return;
                setMessages(data.messages);
            } catch (e) {
                if (!active) return;
                setError(e instanceof Error ? e.message : 'Could not load messages.');
            } finally {
                if (active) setLoadingMessages(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [selectedChatId]);

    const sortedChats = useMemo(
        () =>
            [...chats].sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            ),
        [chats],
    );

    const noopCitationHandler = (_citation: SelectedCitation) => {
        /* read-only: citation popover not wired in the admin view */
    };

    const noopArtifactHandler = (_data: {
        artifactId: string;
        filename: string;
        sourceUrl?: string;
        lines: number[];
    }) => {
        /* read-only: artifact opening not wired in the admin view */
    };

    return (
        <section
            aria-label="AI chat history"
            className="rounded-3xl border border-app-border bg-app-surface p-6"
        >
            <div className="mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-app-brand" />
                <h2 className="text-lg font-semibold text-app-text">
                    AI Conversations
                </h2>
                {sortedChats.length > 0 && (
                    <span className="rounded-full bg-app-surface-muted px-2.5 py-1 text-xs font-medium text-app-text-muted">
                        {sortedChats.length}
                    </span>
                )}
            </div>

            {error && (
                <p className="mb-3 text-xs text-app-danger-text">{error}</p>
            )}

            {loadingChats ? (
                <div className="flex min-h-32 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-app-brand" />
                </div>
            ) : sortedChats.length === 0 ? (
                <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-app-surface-muted ring-1 ring-app-border">
                        <MessageSquareText size={20} className="text-app-text-muted" />
                    </div>
                    <p className="text-sm text-app-text-muted">
                        No AI conversations yet.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
                    {/* Chat list */}
                    <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
                        {sortedChats.map((chat) => {
                            const isSelected = chat.id === selectedChatId;
                            return (
                                <button
                                    key={chat.id}
                                    type="button"
                                    onClick={() => setSelectedChatId(chat.id)}
                                    aria-pressed={isSelected}
                                    className={`flex flex-col gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus ${
                                        isSelected
                                            ? 'bg-app-brand text-white shadow-lg font-semibold'
                                            : 'text-app-text-muted hover:bg-app-surface-hover hover:text-app-text'
                                    }`}
                                >
                                    <span className="truncate">
                                        {chat.title || 'Untitled chat'}
                                    </span>
                                    <span
                                        className={`text-[10px] ${isSelected ? 'opacity-80' : 'opacity-70'}`}
                                    >
                                        {formatRelativeDate(chat.createdAt)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Message thread (read-only) */}
                    <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
                        {!selectedChatId ? (
                            <div className="flex min-h-32 items-center justify-center text-center">
                                <p className="text-sm text-app-text-muted">
                                    Select a conversation to read it.
                                </p>
                            </div>
                        ) : loadingMessages ? (
                            <div className="flex min-h-32 items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-app-brand" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
                                <AlertCircle className="h-5 w-5 text-app-text-muted" />
                                <p className="text-sm text-app-text-muted">
                                    This conversation has no messages.
                                </p>
                            </div>
                        ) : (
                            messages.map((message, index) => {
                                const prev = messages[index - 1];
                                const showDivider =
                                    !!prev && prev.role !== message.role;
                                return (
                                    <MessageRow
                                        key={message.id}
                                        message={message}
                                        showDivider={showDivider}
                                        isThinking={false}
                                        isStreaming={false}
                                        streamingMessageId={null}
                                        showThoughtProcess={false}
                                        profileFallbackName={memberName}
                                        onCitationClick={noopCitationHandler}
                                        onOpenArtifact={noopArtifactHandler}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
