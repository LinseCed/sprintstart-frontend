// Stand-in for sprintstart-ai in the end-to-end stack (AI_RULES R19): answers the backend's calls with
// fixed, contract-shaped responses, so a journey never depends on a model. The stream events follow
// sprintstart-ai's `contracts/agent-stream-events.schema.json`. Anything not listed here answers 503
// and is logged — the journey then shows how the product copes with the AI being unavailable.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8000);

// Shared with the journeys, which check that exactly these words reach the page.
const { answer: ANSWER, greeting: GREETING } = JSON.parse(
  readFileSync(new URL("./answers.json", import.meta.url), "utf8"),
);

const sse = (events) => events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");

const agentTurn = () =>
  sse([
    { type: "tool_use", name: "search_docs", arguments: { query: "deploy" } },
    { type: "token", content: ANSWER },
    {
      type: "result",
      final: true,
      text: ANSWER,
      messages: [{ role: "assistant", content: ANSWER, tool_calls: [], tool_call_id: null }],
      pending_tool_calls: [],
      citations: [],
      reasoning: [],
    },
  ]);

const opening = () =>
  sse([
    { type: "token", content: GREETING },
    {
      type: "done",
      greeting: GREETING,
      action: { label: "Find me a task", question: "What should I work on first?" },
    },
  ]);

const routes = {
  "/api/v1/onboarding/buddy/agent/stream": () => ({ stream: agentTurn() }),
  "/api/v1/onboarding/buddy/open/stream": () => ({ stream: opening() }),
  "/api/v1/generate-title": () => ({ json: { title: "Deploying a release" } }),
  "/api/v1/onboarding/buddy/compact": () => ({ json: { summary: "", summarized_count: 0 } }),
  "/api/v1/artifacts/projects/sync": () => ({ json: {} }),
};

createServer((request, response) => {
  const path = (request.url ?? "").split("?")[0];
  const memberships = /^\/api\/v1\/projects\/[^/]+\/memberships$/.test(path);
  const route = routes[path] ?? (memberships ? () => ({ json: {} }) : undefined);
  request.resume();
  request.on("end", () => {
    if (!route) {
      console.log(`[ai-stub] 503 ${request.method} ${path}`);
      response.writeHead(503, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ detail: "not stubbed for end-to-end tests" }));
      return;
    }
    const { stream, json } = route();
    console.log(`[ai-stub] 200 ${request.method} ${path}`);
    response.writeHead(200, { "Content-Type": stream ? "text/event-stream" : "application/json" });
    response.end(stream ?? JSON.stringify(json));
  });
}).listen(PORT, () => console.log(`[ai-stub] listening on ${PORT}`));
