import { useCallback, useEffect, useRef, useState } from "react";
import { getMessages, performAction, streamMessage } from "../../../services/buddyService";
import type { BuddyMessageView, ProposedAction } from "../types";

/**
 * The conversation core behind every buddy surface: the message list, the optimistic
 * send-and-stream loop, and the "which tool is it running" signal. Deliberately knows
 * nothing about *where* it is shown -- the floating widget ([useBuddy]) and the
 * full-page `/buddy` home both build on it, so a hire's one buddy session behaves the
 * same in either place.
 *
 * @param autoLoad When true, loads the conversation history on mount (the page). The
 *   widget leaves it false and calls [loadHistory] itself the first time it opens, so
 *   an unopened widget makes no request.
 */
export function useBuddyConversation({ autoLoad = false }: { autoLoad?: boolean } = {}) {
    const [messages, setMessages] = useState<BuddyMessageView[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    // The tool the buddy is running right now, if any -- drives "Checking your progress…"
    // in place of a generic spinner. Cleared as soon as the answer starts streaming.
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [draft, setDraft] = useState("");

    const bottomRef = useRef<HTMLDivElement>(null);
    const loadedRef = useRef(false);

    /**
     * Loads the conversation so far, at most once. Idempotent so both the widget's
     * open handler and the page's mount effect can call it without double-fetching.
     */
    const loadHistory = useCallback(async () => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        const history = await getMessages();
        setMessages(history.map(message => ({ ...message, id: crypto.randomUUID() })));
    }, []);

    useEffect(() => {
        if (autoLoad) void loadHistory();
    }, [autoLoad, loadHistory]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setIsThinking(true);
        setActiveTool(null);

        try {
            await streamMessage(text, {
                onToolUse: name => {
                    setActiveTool(name);
                },

                onToken: token => {
                    setIsStreaming(true);
                    setIsThinking(false);
                    setActiveTool(null);

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

                onActionProposal: proposal => {
                    // The buddy is offering to do something — attach it to this reply as a pending
                    // action. Nothing has changed yet; the hire confirms it below. The confirm
                    // payloads ride along so the action runs against what the buddy proposed.
                    setIsThinking(false);
                    setActiveTool(null);
                    const action: ProposedAction = {
                        id: crypto.randomUUID(),
                        action: proposal.action,
                        label: proposal.label,
                        question: proposal.question,
                        taskId: proposal.taskId,
                        moduleId: proposal.moduleId,
                        answer: proposal.answer,
                        status: "idle",
                    };
                    setMessages(prev => prev.map(m =>
                        m.id === assistantId
                            ? { ...m, actions: [...(m.actions ?? []), action] }
                            : m
                    ));
                },

                onDone: () => {
                    setIsStreaming(false);
                    setActiveTool(null);
                },

                onError: err => {
                    console.error(err);
                    setIsStreaming(false);
                    setIsThinking(false);
                    setActiveTool(null);
                },
            });
        } catch (e) {
            console.error(e);
            setIsStreaming(false);
            setIsThinking(false);
            setActiveTool(null);
        }
    }, []);

    /** Patches one proposed action in place, keyed by its message and action id. */
    const patchAction = useCallback(
        (messageId: string, actionId: string, patch: Partial<ProposedAction>) => {
            setMessages(prev => prev.map(m =>
                m.id === messageId
                    ? { ...m, actions: m.actions?.map(a => (a.id === actionId ? { ...a, ...patch } : a)) }
                    : m
            ));
        },
        []
    );

    /**
     * Confirms a proposed action: the one call that mutates. Reflects the outcome inline — a
     * legible line whether it changed something (`ok`) or legibly couldn't, or a retryable error
     * if the request itself failed.
     */
    const confirmAction = useCallback(
        (messageId: string, action: ProposedAction) => {
            patchAction(messageId, action.id, { status: "confirming" });
            // Fire-and-forget: the outcome lands back in message state, so the handler stays a plain
            // void callback (no Promise handed to a JSX prop).
            void (async () => {
                try {
                    const result = await performAction(action.action, {
                        question: action.question,
                        taskId: action.taskId,
                        moduleId: action.moduleId,
                        answer: action.answer,
                    });
                    patchAction(messageId, action.id, {
                        status: "resolved",
                        ok: result.ok,
                        outcome: result.message,
                    });
                } catch (e) {
                    console.error(e);
                    patchAction(messageId, action.id, { status: "error" });
                }
            })();
        },
        [patchAction]
    );

    /** Declines a proposed action — nothing changes; the conversation simply continues. */
    const dismissAction = useCallback(
        (messageId: string, actionId: string) => {
            patchAction(messageId, actionId, { status: "dismissed" });
        },
        [patchAction]
    );

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
        activeTool,

        draft,
        setDraft,
        sendMessage,
        handleSubmit,
        confirmAction,
        dismissAction,

        loadHistory,
        bottomRef,
    };
}
