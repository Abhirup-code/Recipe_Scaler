import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const axe = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

test("import a pasted recipe, then scale it, shop for it, and find it again after a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Import your own recipe" }).click();
  await page.getByLabel("Recipe text").fill(
    [
      "Garlic Butter Rice",
      "Serves 2",
      "",
      "Ingredients",
      "- 1 cup rice",
      "- 2 tbsp butter",
      "- 3 cloves garlic, minced",
      "- Salt, to taste",
      "",
      "Instructions",
      "1. Melt the butter and fry the garlic for 1 minute.",
      "2. Add the rice and 2 cups of water. Simmer for 15 minutes.",
    ].join("\n"),
  );
  await expect(page.getByRole("heading", { name: "Ingredients (4)" })).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Garlic Butter Rice");
  expect((await axe(page)).violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  await page.getByRole("button", { name: "Save recipe" }).click();
  await expect(page).toHaveURL(/\/my-recipes\/\?id=[a-z0-9]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Garlic Butter Rice");

  await page.getByRole("button", { name: "More servings" }).click();
  await page.getByRole("button", { name: "More servings" }).click();
  await expect(page.locator(".ingredients li", { hasText: "rice" }).first()).toContainText("2 cups rice");
  await expect(page.locator(".ingredients li", { hasText: "garlic" })).toContainText("6 cloves garlic");
  await expect(page.getByRole("button", { name: "Share" })).toHaveCount(0);
  expect((await axe(page)).violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  await page.getByRole("button", { name: "Add to shopping list" }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Shopping list" }).click();
  await expect(page.getByRole("link", { name: "Garlic Butter Rice" })).toBeVisible();
  await page.getByRole("link", { name: "Garlic Butter Rice" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Garlic Butter Rice");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Garlic Butter Rice");
  await page.getByRole("link", { name: "Your recipes" }).click();
  await expect(page.getByRole("link", { name: "Garlic Butter Rice" })).toBeVisible();
});
