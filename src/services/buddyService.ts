import { apiClient } from "./apiClient";
import keycloak from "../config/keycloak";
import type { StreamHandlers } from "../features/chatbot/types";
import type { BuddyMessage } from "../features/buddy/types";

/**
 * Retrieves the authenticated user's buddy conversation so far, oldest first.
 */
export async function getMessages(): Promise<BuddyMessage[]> {
    return await apiClient.fetch<BuddyMessage[]>(`/api/v1/onboarding/me/buddy/messages`);
}

/**
 * Generic stream event returned by the backend when sending a buddy message. Mirrors
 * chatService's ChatEvent -- the backend's BuddyStreamEvent uses the identical shape
 * and wire field names as the chat module's AiStreamMessage.
 */
interface BuddyStreamChunk {
    type: "tool_use" | "token" | "citation" | "action_proposal" | "done" | "error";
    content?: string;
    message?: string;
    name?: string;
    artifact_id?: string;
    filename?: string;
    source_url?: string;
    start_line?: number;
    start_page?: number;
    // Set only on an action_proposal chunk: the buddy is offering to do something, gated on confirm.
    action?: string;
    label?: string;
    question?: string;
    // Confirm payloads of the goal-claim and verification actions — echoed back verbatim
    // on confirm (as camelCase), so the target is the one the buddy proposed.
    task_id?: string;
    module_id?: string;
    answer?: string;
}

/** The outcome of confirming a buddy-proposed action — a single line to relay in the thread. */
export interface BuddyActionResult {
    ok: boolean;
    message: string;
}

/**
 * Confirms a buddy-proposed action. This is the only call that mutates — the proposal itself
 * changed nothing. The project is re-resolved server-side from the caller, so only the action name
 * and the proposal's own confirm payloads are sent: `question` for flag-to-PM, `taskId` for a
 * goal claim, `moduleId` + `answer` for a verification submission.
 */
export async function performAction(
    action: string,
    extras: { question?: string; taskId?: string; moduleId?: string; answer?: string } = {},
): Promise<BuddyActionResult> {
    return await apiClient.fetch<BuddyActionResult>(`/api/v1/onboarding/me/buddy/actions`, {
        method: "POST",
        body: JSON.stringify({
            action,
            question: extras.question,
            taskId: extras.taskId,
            moduleId: extras.moduleId,
            answer: extras.answer,
        }),
    });
}

/**
 * Sends a message to the user's persistent buddy and streams the grounded reply.
 *
 * @param content The message to send.
 * @param handlers Helper operations handling the output of the buddy's response.
 */
export async function streamMessage(content: string, handlers: StreamHandlers): Promise<void> {
    // Ensure the token is up to date (refresh if it expires in < 30s)
    try {
        if (keycloak.authenticated) {
            await keycloak.updateToken(30);
        }
    } catch (error) {
        console.error('Failed to refresh Keycloak token for buddy stream', error);
        void keycloak.login();
        return;
    }

    const res = await fetch(`/api/v1/onboarding/me/buddy/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keycloak.token}`
        },
        body: JSON.stringify({ content })
    });

    if (!res.ok) {
        handlers.onError?.(`HTTP error! status: ${res.status}`);
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
            ) as BuddyStreamChunk;

            switch (event.type) {
                case "tool_use":
                    if (event.name) {
                        handlers.onToolUse?.(event.name);
                    }
                    break;

                case "token":
                    if (event.content !== undefined) {
                        handlers.onToken(event.content);
                    }
                    break;

                case "citation":
                    if (event.artifact_id && event.filename) {
                        handlers.onCitation({
                            artifactId: event.artifact_id,
                            filename: event.filename,
                            sourceUrl: event.source_url,
                            startLine: event.start_line,
                            startPage: event.start_page
                        });
                    }
                    break;

                case "action_proposal":
                    if (event.action && event.label) {
                        handlers.onActionProposal?.({
                            action: event.action,
                            label: event.label,
                            question: event.question,
                            taskId: event.task_id,
                            moduleId: event.module_id,
                            answer: event.answer
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
