import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("scale a recipe to the lentils you have, in grams", async ({ page }) => {
  await page.goto("/recipes/kolkata-masoor-dal/");
  await page.getByText("Scale to what you have").click();
  await page.getByLabel("Ingredient", { exact: true }).selectOption("red lentils");
  await page.getByLabel("You have", { exact: true }).fill("285");
  await page.getByLabel("Unit", { exact: true }).selectOption("g");
  await page.getByRole("button", { name: "Scale recipe" }).click();

  await expect(page.getByRole("group", { name: "Servings" })).toContainText("6 servings");
  await expect(page.locator(".ingredients li", { hasText: "red lentils" })).toContainText("1½ cups red lentils");
  await expect(page.getByText("Scaled to your 285 g red lentils.")).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

  await page.getByRole("button", { name: "Back to 4 servings" }).click();
  await expect(page.getByRole("group", { name: "Servings" })).toContainText("4 servings");
});

test("explains an amount it cannot use, accessibly, in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/recipes/simple-shakshuka/");
  await page.getByText("Scale to what you have").click();
  await page.getByRole("button", { name: "Scale recipe" }).click();
  await expect(page.locator(".scale-by").getByRole("alert")).toContainText("number above zero");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
