import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("finishing cook mode puts the recipe in Cooked recently on the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Cooked recently" })).toHaveCount(0);

  for (let round = 1; round <= 2; round++) {
    await page.goto("/recipes/berry-overnight-oats/");
    await page.getByRole("button", { name: "Start cook mode" }).click();
    const dialog = page.getByRole("dialog");
    while (await dialog.getByRole("button", { name: "Next step" }).isVisible()) {
      await dialog.getByRole("button", { name: "Next step" }).click();
    }
    await dialog.getByRole("button", { name: "Done" }).click();
  }

  await page.goto("/");
  const recent = page.getByRole("region", { name: "Cooked recently" });
  await expect(recent.getByRole("article")).toHaveCount(1);
  await expect(recent).toContainText("Berry Overnight Oats");
  await expect(recent).toContainText("Cooked today · 2 times");

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  await recent.getByRole("link", { name: /Berry Overnight Oats/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Berry Overnight Oats");
});
