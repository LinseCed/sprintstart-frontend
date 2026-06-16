import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    createChat,
    getChats,
    getMessages,
    streamMessage
} from "../services/chatService";

import type { Chat, ChatMessage, Citation } from "../types/chatTypes";

type MessagesByChat = Record<string, ChatMessage[]>;

export function useChat() {
    const { id: chatId } = useParams();
    const navigate = useNavigate();

    const [chats, setChats] = useState<Chat[]>([]);
    const [messagesByChat, setMessagesByChat] = useState<MessagesByChat>({});
    const [isThinking, setIsThinking] = useState(false);
    const [newRequest, setNewRequest] = useState("");
    const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        /**
         * Loads all chats created by the user.
         */
        void (async () => {
            const data = await getChats();
            setChats(data.chats);
        })();
    }, []);

    useEffect(() => {
        if (!chatId) return;

        if (messagesByChat[chatId]) return;

        /**
         * Loads all messages from the current chat.
         */
        void (async () => {
            const data = await getMessages(chatId);

            setMessagesByChat(prev => ({
                ...prev,
                [chatId]: data.messages
            }));
        })();
    }, [chatId, messagesByChat]);

    const messages = useMemo(() => {
        if (!chatId) return [];
        return messagesByChat[chatId] ?? [];
    }, [messagesByChat, chatId]);

    const refreshChats = async () => {
        const data = await getChats();
        setChats(data.chats);
    };

    /**
     * Adds a new user message and the corresponding response to the current conversation.
     */
    const addMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        let currentChatId = chatId;

        // create new chat if needed
        if (!currentChatId) {
            const newChat = await createChat("00000000-0000-0000-0000-000000000001");

            setChats(prev => [newChat, ...prev]);

            currentChatId = newChat.id;

            await navigate(`/chat/${newChat.id}`);
        }

        setMessagesByChat(prev => ({
            ...prev,
            [currentChatId]: prev[currentChatId] ?? []
        }));

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "USER",
            chat: chats.find(chat => chat.id === currentChatId),
            content: text
        };

        const assistantId = crypto.randomUUID();

        const assistantMessage: ChatMessage = {
            id: assistantId,
            role: "ASSISTANT",
            chat: chats.find(chat => chat.id === currentChatId),
            content: "",
            citations: [],
        };

        // optimistic update
        setMessagesByChat(prev => ({
            ...prev,
            [currentChatId]: [
                ...(prev[currentChatId] ?? []),
                userMessage,
                assistantMessage
            ]
        }));

        setIsThinking(true);

        try {
            await streamMessage(currentChatId, text, {

                // if the stream element is a normal text chunk, append it to the response message
                onToken: token => {
                    setMessagesByChat(prev => ({
                        ...prev,
                        [currentChatId]: (prev[currentChatId] ?? []).map(m =>
                            m.id === assistantId
                                ? { ...m, content: m.content + token }
                                : m
                        )
                    }));
                },

                // if the stream element is a citations, add it to the citations list of the response message
                onCitation: citation => {
                    setMessagesByChat(prev => ({
                        ...prev,
                        [currentChatId]: (prev[currentChatId] ?? []).map(m =>
                            m.id === assistantId
                                ? {
                                    ...m,
                                    citations: [...(m.citations ?? []), citation]
                                }
                                : m
                        )
                    }));
                },

                // if the stream element marks the end of the stream, finalize the message
                onDone: () => {
                    setIsThinking(false);

                    setMessagesByChat(prev => ({
                        ...prev,
                        [currentChatId]: (prev[currentChatId] ?? []).map(m =>
                            m.id === assistantId
                                ? { ...m, isStreaming: false }
                                : m
                        )
                    }));

                    void refreshChats();
                },

                // if the stream element is an error, abort
                onError: err => {
                    console.error(err);
                    setIsThinking(false);
                }
            });
        } catch (e) {
            console.error(e);
            setIsThinking(false);
        }
    }, [chatId, navigate, chats]);

    /**
     * Adds the newly created messages to the chat.
     */
    const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!newRequest.trim()) return;

        void addMessage(newRequest);
        setNewRequest("");
    }, [newRequest, addMessage]);

    /**
     * The chat currently used by the user.
     */
    const activeChat = useMemo(() => {
        if (!chatId) return null;
        return chats.find(c => c.id === chatId) ?? null;
    }, [chats, chatId]);

    return {
        chats,
        chatId,
        activeChat,

        messages,

        sidebarOpen,
        setSidebarOpen,

        handleSubmit,
        addMessage,

        newRequest,
        setNewRequest,

        isThinking,

        selectedCitation,
        setSelectedCitation
    };
}