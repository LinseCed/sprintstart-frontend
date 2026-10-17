/**
 * J12 — Read FAQ, knowledge gaps and onboarding insights (docs/testing/e2e-journeys.md): the FAQ.
 *
 * Every question a hire asks the buddy is classified by the AI service and filed into the project's
 * FAQ (`/insights/faq/classify`, answered by e2e/ai-stub with an entry titled after the question).
 * The PM then reads it under Questions. Filing runs after the answer, so the page is reloaded until
 * the entry is there.
 */
import { expect, test } from "@playwright/test";
import { storageStateOf } from "../stack.ts";

test("a hire's question shows up in the PM's FAQ", async ({ browser }) => {
  // The stack keeps its data between runs, so the question is unique to this run.
  const question = `How do I get access to the staging database? (${crypto.randomUUID().slice(0, 8)})`;
  const hire = await (await browser.newContext({ storageState: storageStateOf("hire") })).newPage();
  await hire.goto("/buddy");
  await hire.getByPlaceholder("Ask your buddy anything...").fill(question);
  await hire.keyboard.press("Enter");
  await expect(hire.getByText(question)).toBeVisible();

  const pm = await (await browser.newContext({ storageState: storageStateOf("pm") })).newPage();
  await expect(async () => {
    await pm.goto("/");
    await pm.getByRole("link", { name: /PM\s*Dashboard/ }).click();
    await pm.getByRole("button", { name: /^Questions/ }).click();
    await expect(pm.getByText(question)).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
});
