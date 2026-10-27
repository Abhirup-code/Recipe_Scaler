import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

// Real microphones are not available in CI, so this stands in for the browser's speech
// recognizer: the test "says" a phrase and the page receives it exactly as Chrome delivers it.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    const instances: FakeRecognition[] = [];
    class FakeRecognition {
      running = false;
      lang = "";
      continuous = false;
      interimResults = true;
      onstart: (() => void) | null = null;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      constructor() {
        instances.push(this);
      }
      start() {
        this.running = true;
        setTimeout(() => this.onstart?.(), 0);
      }
      abort() {
        this.running = false;
      }
    }
    Object.assign(window, {
      SpeechRecognition: FakeRecognition,
      webkitSpeechRecognition: FakeRecognition,
      __spoken: spoken,
      __say: (transcript: string) =>
        instances.filter((r) => r.running).forEach((r) => r.onresult?.({ results: [[{ transcript }]] })),
    });
    const synth = window.speechSynthesis;
    if (synth) {
      synth.speak = (u: SpeechSynthesisUtterance) => {
        spoken.push(u.text);
      };
    }
  });
});

const say = (page: import("@playwright/test").Page, text: string) =>
  page.evaluate((t) => (window as unknown as { __say(t: string): void }).__say(t), text);

test("cook hands-free: navigate, repeat, run the timer, and exit by voice", async ({ page }) => {
  await page.goto("/recipes/simple-shakshuka/");
  await page.getByRole("button", { name: "Start cook mode" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Hands-free" }).click();
  await expect(dialog.getByRole("status")).toContainText("Listening.");

  await say(page, "next");
  await expect(dialog).toContainText("Step 2 of 5");
  await say(page, "go back");
  await expect(dialog).toContainText("Step 1 of 5");

  await say(page, "start the timer");
  await expect(dialog.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(dialog.getByRole("timer")).not.toHaveText("8:00");
  await say(page, "pause timer");
  await expect(dialog.getByRole("button", { name: "Resume" })).toBeVisible();

  await say(page, "repeat");
  const spoken = await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
  expect(spoken.length).toBeGreaterThanOrEqual(3);

  await say(page, "stop cooking");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Start cook mode" })).toBeFocused();
});

test("no accessibility violations with hands-free on, in light and dark mode", async ({ page }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto("/recipes/simple-shakshuka/");
    await page.getByRole("button", { name: "Start cook mode" }).click();
    await page.getByRole("button", { name: "Hands-free" }).click();
    await say(page, "next");
    await expect(page.getByRole("dialog").getByRole("status")).toContainText("Heard:");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${colorScheme} ${v.id}: ${v.help}`)).toEqual([]);
  }
});
