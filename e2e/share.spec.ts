import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("a shared link opens at its servings and units, and shows a QR code", async ({ page }) => {
  await page.goto("/recipes/kolkata-masoor-dal/?servings=8&units=metric");
  await expect(page.getByRole("group", { name: "Servings" })).toContainText("8 servings");
  await expect(page.getByRole("button", { name: "Metric" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".ingredients li", { hasText: "red lentils" })).toContainText("380 g red lentils");

  await page.getByRole("button", { name: "QR code" }).click();
  await expect(page.getByRole("img", { name: /QR code linking to .* 8 servings/ })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  // Your own unit choice is untouched on other recipes.
  await page.goto("/recipes/simple-shakshuka/");
  await expect(page.getByRole("button", { name: "US" })).toHaveAttribute("aria-pressed", "true");
});
