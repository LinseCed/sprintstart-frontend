import { apiClient } from './apiClient';
import keycloak from '../config/keycloak';
import type {Chat, ChatMessage, Citation} from "../types/chatTypes.ts";

/**
 * Fetches all available chat conversations for the current session.
 */
export async function getChats() {
    return await apiClient.fetch<{ chats: Chat[] }>(`/api/v1/chats`);
}

/**
 * Creates a new chat conversation for a specific user.
 */
export async function createChat(userId: string) {
    return await apiClient.fetch<Chat>(`/api/v1/chats`, {
        method: "POST",
        body: JSON.stringify({
            userId
        })
    });
}

/**
 * Retrieves all messages for a specific chat conversation.
 */
export async function getMessages(chatId: string) {
    return await apiClient.fetch<{ messages: ChatMessage[] }>(`/api/v1/chats/${chatId}`);
}

/**
 * Handlers for processing real-time streaming events from the AI.
 */
export type StreamHandlers = {
    /** Called for every new text token received from the LLM. */
    onToken: (token: string) => void;
    /** Called when the LLM provides a source citation for its response. */
    onCitation: (citation: Citation) => void;
    /** Called when the stream has successfully finished. */
    onDone: () => void;
    /** Optional handler for stream-specific errors. */
    onError?: (message: string) => void;
};

interface ChatEvent {
    type: "token" | "citation" | "done" | "error";
    content?: string;
    message?: string;
    chunk_id?: string;
    filename?: string;
    section_path?: string;
}

/**
 * Sends a message to the AI and streams the response in real-time.
 */
export async function streamMessage(
    chatId: string,
    text: string,
    handlers: StreamHandlers
): Promise<void> {
    // Ensure token is fresh
    try {
        await keycloak.updateToken(30);
    } catch (error) {
        keycloak.login();
        return;
    }

    const res = await fetch(`/api/v1/chats/prompt`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keycloak.token}`
        },
        body: JSON.stringify({
            "chatId": chatId,
            "msg": text
        })
    });

    if (!res.ok) {
        handlers.onError?.(`Failed to establish stream: ${res.statusText}`);
        return;
    }

    const reader = res.body?.getReader();

    if (!reader) {
        throw new Error("No response stream");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            const event = JSON.parse(
                line.replace("data:", "").trim()
            ) as ChatEvent;

            switch (event.type) {
                case "token":
                    if (event.content !== undefined) {
                        handlers.onToken(event.content);
                    }
                    break;

                case "citation":
                    if (event.chunk_id && event.filename) {
                        handlers.onCitation({
                            chunk_id: event.chunk_id,
                            filename: event.filename,
                            section_path: event.section_path ?? ""
                        });
                    }
                    break;

                case "done":
                    handlers.onDone();
                    return;

                case "error":
                    handlers.onError?.(event.message ?? "Unknown error");
                    return;
            }
        }
    }

    handlers.onDone();
}
