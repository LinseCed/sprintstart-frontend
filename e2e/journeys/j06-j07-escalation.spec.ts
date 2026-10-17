/**
 * J06 — Confirm an action the buddy proposes; J07 — escalate an unanswered question to the PM, who
 * answers it (docs/testing/e2e-journeys.md).
 *
 * The hire's question mentions the PM, so e2e/ai-stub has the agent propose `flag_to_pm`. Nothing is
 * sent until the hire confirms; the PM then finds the question in the escalation inbox and publishes an
 * answer, which becomes a durable answer for everyone after.
 */
import { expect, test, type Browser, type Page } from "@playwright/test";
import answers from "../ai-stub/answers.json" with { type: "json" };
import { storageStateOf, type Role } from "../stack.ts";

async function pageAs(browser: Browser, role: Role): Promise<Page> {
  const context = await browser.newContext({ storageState: storageStateOf(role) });
  return context.newPage();
}

async function openEscalations(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("link", { name: /PM\s*Dashboard/ }).click();
  await page.getByRole("button", { name: /^Escalations/ }).click();
}

test("a question for the PM is flagged only after the hire confirms, and the PM answers it", async ({
  browser,
}) => {
  // The stack keeps its data between runs, so the question is unique to this run.
  const question = `Can you ask my PM when the code freeze starts? (${crypto.randomUUID().slice(0, 8)})`;
  const hire = await pageAs(browser, "hire");
  await hire.goto("/buddy");
  await hire.getByPlaceholder("Ask your buddy anything...").fill(question);
  await hire.keyboard.press("Enter");

  await expect(hire.getByText(answers.flagged).last()).toBeVisible();
  const pm = await pageAs(browser, "pm");
  await openEscalations(pm);
  await expect(pm.getByText(question)).toHaveCount(0);

  await hire.getByRole("button", { name: "Flag this to your PM" }).last().click();
  await expect(hire.getByText(/Flagged to your PM/).last()).toBeVisible();

  await openEscalations(pm);
  const request = pm.getByRole("listitem").filter({ hasText: question });
  await expect(request).toBeVisible();
  await expect(request.getByText("Hana E2E")).toBeVisible();

  const reply = `The freeze starts Thursday at 18:00 (${crypto.randomUUID().slice(0, 8)}).`;
  await request.getByRole("button", { name: "Answer", exact: true }).click();
  await request.getByPlaceholder("Answer it once, for everyone after.").fill(reply);
  await request.getByRole("button", { name: "Answer & publish" }).click();

  await expect(pm.getByText(question)).toHaveCount(0);
  await pm.getByRole("button", { name: /^Durable answers/ }).click();
  await expect(pm.getByText(reply)).toBeVisible();
});
