/**
 * J05 — Ask the buddy a question and read the answer (docs/testing/e2e-journeys.md).
 *
 * The whole way runs for real — frontend, backend, its agent loop and persistence — up to the AI, which
 * e2e/ai-stub answers with contract-shaped events. A citation is not checked here: it needs an ingested
 * artifact, which the stack does not seed yet.
 */
import { expect, test } from "@playwright/test";
import answers from "../ai-stub/answers.json" with { type: "json" };
import { storageStateOf } from "../stack.ts";

const { answer: ANSWER, greeting: GREETING } = answers;

test.use({ storageState: storageStateOf("hire") });

test("the buddy greets the hire when they open it", async ({ page }) => {
  await page.goto("/buddy");

  await expect(page.getByText(GREETING)).toBeVisible();
});

test("a question is answered and stays in the conversation after a reload", async ({ page }) => {
  await page.goto("/buddy");
  await expect(page.getByText(GREETING)).toBeVisible();

  // The stack keeps its data between runs, so the question is unique to this run.
  const question = `How do we deploy? (${crypto.randomUUID().slice(0, 8)})`;
  await page.getByPlaceholder("Ask your buddy anything...").fill(question);
  await page.keyboard.press("Enter");

  await expect(page.getByText(ANSWER).last()).toBeVisible();
  await page.reload();
  await expect(page.getByText(question)).toBeVisible();
  await expect(page.getByText(ANSWER).last()).toBeVisible();
});
