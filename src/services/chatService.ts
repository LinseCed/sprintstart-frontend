import type {Chat, ChatMessage, StreamHandlers} from "../types/chatTypes.ts";

/**
 * Retrieves all created chats.
 *
 * @throws Error if the backend request fails
 */
export async function getChats() {
    const res = await fetch(`/api/v1/chats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to load chats");
    return res.json() as Promise<{ chats: Chat[] }>;
}

/**
 * Creates a new chat for a specific user.
 *
 * @param userId The user starting the conversation.
 */
export async function createChat(userId: string) {
    const res = await fetch(`/api/v1/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId
        })
    });
    return res.json() as Promise<Chat>;
}

/**
 * Retrieves all messages from a specific chat.
 *
 * @param chatId The chat the messages belong to.
 */
export async function getMessages(chatId: string) {
    const res = await fetch(`/api/v1/chats/${chatId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    })
    return res.json() as Promise<{ messages: ChatMessage[] }>
}

/**
 * Generic stream event returned by the backend when sending a prompt.
 */
interface ChatEvent {
    type: "token" | "citation" | "done" | "error";
    content?: string;
    message?: string;
    chunk_id?: string;
    filename?: string;
    section_path?: string;
}

/**
 * Creates a new prompt and handles the chat response.
 *
 * @param chatId The chat the prompt is created in
 * @param text The content of the prompt
 * @param handlers Helper operations handling the output of the chat response
 */
export async function streamMessage(
    chatId: string,
    text: string,
    handlers: StreamHandlers
): Promise<void> {
    const res = await fetch(`/api/v1/chats/prompt`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "chatId": chatId,
            "msg": text
        })
    });

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

    // Fallback: Ensure onDone is called when the stream ends naturally
    handlers.onDone();
}