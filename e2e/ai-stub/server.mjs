// Stand-in for sprintstart-ai in the end-to-end stack (AI_RULES R19): answers the backend's calls with
// fixed, contract-shaped responses, so a journey never depends on a model. The stream events follow
// sprintstart-ai's `contracts/agent-stream-events.schema.json`. Anything not listed here answers 503
// and is logged — the journey then shows how the product copes with the AI being unavailable.
//
// Agent turns follow the hire's last message:
// - it mentions the PM: the turn asks the backend to propose `flag_to_pm` (a pending tool call);
// - the backend answered that tool call: the turn closes with `flagged`;
// - anything else: the turn answers with `answer`.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8000);

// Shared with the journeys, which check that exactly these words reach the page.
const TEXT = JSON.parse(readFileSync(new URL("./answers.json", import.meta.url), "utf8"));

const sse = (events) => events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");

const message = (role, content, toolCalls = []) => ({
  role,
  content,
  tool_calls: toolCalls,
  tool_call_id: null,
});

const result = (final, text, messages, pendingToolCalls = []) => ({
  type: "result",
  final,
  text,
  messages,
  pending_tool_calls: pendingToolCalls,
  citations: [],
  reasoning: [],
});

const answerEvents = (messages, text) => [
  { type: "token", content: text },
  result(true, text, [...messages, message("assistant", text)]),
];

const proposeFlag = (messages, question) => {
  const call = { id: "call_flag_1", name: "flag_to_pm", arguments: { question } };
  return sse([result(false, "", [...messages, message("assistant", "", [call])], [call])]);
};

function agentTurn(body) {
  const messages = body.messages ?? [];
  const last = messages.at(-1) ?? {};
  if (last.role === "tool") return sse(answerEvents(messages, TEXT.flagged));
  if (last.role === "user" && /\bPM\b/.test(last.content ?? "")) {
    return proposeFlag(messages, last.content);
  }
  const search = { type: "tool_use", name: "search_docs", arguments: { query: "deploy" } };
  return sse([search, ...answerEvents(messages, TEXT.answer)]);
}

const opening = () =>
  sse([
    { type: "token", content: TEXT.greeting },
    {
      type: "done",
      greeting: TEXT.greeting,
      action: { label: "Find me a task", question: "What should I work on first?" },
    },
  ]);

const routes = {
  "/api/v1/onboarding/buddy/agent/stream": (body) => ({ stream: agentTurn(body) }),
  "/api/v1/onboarding/buddy/open/stream": () => ({ stream: opening() }),
  "/api/v1/generate-title": () => ({ json: { title: "Deploying a release" } }),
  "/api/v1/onboarding/buddy/compact": () => ({ json: { summary: "", summarized_count: 0 } }),
  "/api/v1/artifacts/projects/sync": () => ({ json: {} }),
};

function routeFor(path) {
  if (/^\/api\/v1\/projects\/[^/]+\/memberships$/.test(path)) return () => ({ json: {} });
  return routes[path];
}

function parse(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

createServer((request, response) => {
  const path = (request.url ?? "").split("?")[0];
  const route = routeFor(path);
  let raw = "";
  request.on("data", (chunk) => (raw += chunk));
  request.on("end", () => {
    if (!route) {
      console.log(`[ai-stub] 503 ${request.method} ${path}`);
      response.writeHead(503, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ detail: "not stubbed for end-to-end tests" }));
      return;
    }
    const { stream, json } = route(parse(raw));
    console.log(`[ai-stub] 200 ${request.method} ${path}`);
    response.writeHead(200, { "Content-Type": stream ? "text/event-stream" : "application/json" });
    response.end(stream ?? JSON.stringify(json));
  });
}).listen(PORT, () => console.log(`[ai-stub] listening on ${PORT}`));
