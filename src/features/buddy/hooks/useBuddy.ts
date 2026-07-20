import { useCallback, useEffect, useRef, useState } from "react";
import { getMessages, streamMessage } from "../../../services/buddyService";
import { onOpenAiBuddy } from "../aiBuddyBus";
import type { BuddyMessageView } from "../types";

/**
 * Manages the state and business logic for the persistent buddy chat surface.
 * Loads the user's ongoing conversation once on mount and streams replies from
 * the AI-backed buddy via the backend, mirroring useChat's optimistic-update
 * and streaming pattern but for a single, session-less conversation (no chat
 * switching -- the backend resolves one buddy session per user transparently).
 */
export function useBuddy() {
    const [messages, setMessages] = useState<BuddyMessageView[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState("");

    const bottomRef = useRef<HTMLDivElement>(null);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (!isOpen || loadedRef.current) return;
        loadedRef.current = true;

        /**
         * Loads the conversation so far the first time the panel is opened.
         */
        void (async () => {
            const history = await getMessages();
            setMessages(history.map(message => ({ ...message, id: crypto.randomUUID() })));
        })();
    }, [isOpen]);

    useEffect(() => {
        /**
         * Automatically scrolls to the bottom of the conversation as it grows.
         */
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const toggleOpen = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    useEffect(() => {
        /**
         * Lets other surfaces (e.g. the human buddy card) open the AI buddy and
         * hand it a draft to help the hire word their question to a person.
         */
        return onOpenAiBuddy(({ draft: seed }) => {
            setIsOpen(true);
            if (seed) setDraft(seed);
        });
    }, []);

    /**
     * Sends a new message and streams the buddy's reply into the conversation.
     */
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMessage: BuddyMessageView = {
            id: crypto.randomUUID(),
            role: "USER",
            content: text,
            createdAt: new Date().toISOString(),
        };

        const assistantId = crypto.randomUUID();
        const assistantMessage: BuddyMessageView = {
            id: assistantId,
            role: "ASSISTANT",
            content: "",
            createdAt: new Date().toISOString(),
            citations: [],
        };

        // optimistic update
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setIsThinking(true);

        try {
            await streamMessage(text, {
                onToken: token => {
                    setIsStreaming(true);
                    setIsThinking(false);

                    setMessages(prev => prev.map(m =>
                        m.id === assistantId ? { ...m, content: m.content + token } : m
                    ));
                },

                onCitation: citation => {
                    setMessages(prev => prev.map(m =>
                        m.id === assistantId
                            ? { ...m, citations: [...(m.citations ?? []), citation] }
                            : m
                    ));
                },

                onDone: () => {
                    setIsStreaming(false);
                },

                onError: err => {
                    console.error(err);
                    setIsStreaming(false);
                    setIsThinking(false);
                },
            });
        } catch (e) {
            console.error(e);
            setIsStreaming(false);
            setIsThinking(false);
        }
    }, []);

    const handleSubmit = useCallback((event: React.FormEvent) => {
        event.preventDefault();

        const text = draft;
        if (!text.trim()) return;

        setDraft("");
        void sendMessage(text);
    }, [draft, sendMessage]);

    return {
        messages,
        isThinking,
        isStreaming,

        isOpen,
        toggleOpen,

        draft,
        setDraft,
        handleSubmit,

        bottomRef,
    };
}
