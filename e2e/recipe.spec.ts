import { expect, test } from "./fixtures";

const firstIngredient = (page: import("@playwright/test").Page) => page.locator(".ingredients li").first();

test("find a recipe, scale it, switch units, and see a substitute", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search recipes" }).fill("buttermilk");
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByRole("link", { name: /Fluffy Buttermilk Pancakes/ }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fluffy Buttermilk Pancakes");
  await expect(firstIngredient(page)).toContainText("2 cups all-purpose flour");

  await page.getByRole("button", { name: "More servings" }).click();
  await page.getByRole("button", { name: "More servings" }).click();
  await expect(firstIngredient(page)).toContainText("3 cups all-purpose flour");

  await page.getByRole("button", { name: "Metric" }).click();
  await expect(firstIngredient(page)).toContainText("375 g all-purpose flour");

  const buttermilk = page.locator(".ingredients li", { hasText: "buttermilk" });
  await buttermilk.getByRole("button", { name: "Out of it?" }).click();
  await expect(buttermilk).toContainText("lemon juice or vinegar");
});

test("the unit choice is remembered across pages and reloads", async ({ page }) => {
  await page.goto("/recipes/one-pan-chicken-curry/");
  await page.getByRole("button", { name: "Metric" }).click();
  await page.goto("/recipes/simple-shakshuka/");
  await expect(page.getByRole("button", { name: "Metric" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Metric" })).toHaveAttribute("aria-pressed", "true");
});

test("cook mode walks through every step", async ({ page }) => {
  await page.goto("/recipes/simple-shakshuka/");
  await page.getByRole("button", { name: "Start cook mode" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Step 1 of 5");
  await expect(dialog.getByRole("timer")).toHaveText("8:00");
  await page.keyboard.press("ArrowRight");
  await expect(dialog).toContainText("Step 2 of 5");
  for (let i = 0; i < 3; i++) await dialog.getByRole("button", { name: "Next step" }).click();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
});

test("save recipes and build a combined shopping list", async ({ page }) => {
  await page.goto("/recipes/kolkata-masoor-dal/");
  await page.getByRole("button", { name: "Save Kolkata-Style Masoor Dal" }).click();
  await page.getByRole("button", { name: "Add to shopping list" }).click();
  await page.goto("/recipes/one-pan-chicken-curry/");
  await page.getByRole("button", { name: "Add to shopping list" }).click();

  await page.getByRole("link", { name: "Saved" }).click();
  await expect(page.getByRole("article")).toHaveCount(1);

  await page.getByRole("navigation").getByRole("link", { name: "Shopping list" }).click();
  const garlic = page.locator(".checklist li", { hasText: "cloves garlic" });
  await expect(garlic).toContainText("8 cloves garlic");
  await garlic.getByRole("checkbox").check();
  await page.reload();
  await expect(page.locator(".checklist li", { hasText: "cloves garlic" }).getByRole("checkbox")).toBeChecked();
});

test("recipe pages have structured data for search engines", async ({ page }) => {
  await page.goto("/recipes/kolkata-masoor-dal/");
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(json ?? "{}");
  expect(data["@type"]).toBe("Recipe");
  expect(data.recipeInstructions.length).toBeGreaterThan(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/recipes\/kolkata-masoor-dal\/$/);
});

test("the printed page shows the recipe without buttons", async ({ page }) => {
  await page.goto("/recipes/weeknight-tomato-pasta/");
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("heading", { name: "Steps" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to shopping list" })).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
});

test("an unknown recipe shows the not-found page", async ({ page }) => {
  const response = await page.goto("/recipes/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("couldn't find");
});
