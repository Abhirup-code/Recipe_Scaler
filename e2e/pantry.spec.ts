import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test("tick what you have, find what you can cook, and shop for the rest", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "What can I cook with what I have?" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What can I cook?");

  for (const item of ["olive oil", "onion", "red bell pepper", "garlic", "smoked paprika", "ground cumin", "canned tomatoes", "eggs"]) {
    await page.getByRole("checkbox", { name: item, exact: true }).check();
  }
  const first = page.locator(".match").first();
  await expect(first).toContainText("Simple Shakshuka");
  await expect(first).toContainText("Missing 1 · have 8: feta cheese");

  await page.getByRole("button", { name: "Add to list: Simple Shakshuka" }).click();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Shopping list" }).click();
  await expect(page.getByRole("heading", { name: "To buy (1)" })).toBeVisible();
  await expect(page.locator(".checklist").first()).toContainText("feta cheese");
  await expect(page.getByText("Already in your kitchen (9)")).toBeVisible();

  // The pantry is remembered after a reload.
  await page.goto("/pantry/");
  await expect(page.getByRole("checkbox", { name: "garlic", exact: true })).toBeChecked();
});

test("no accessibility violations with a filled pantry, in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/pantry/");
  await page.getByRole("checkbox", { name: "eggs", exact: true }).check();
  await page.getByRole("checkbox", { name: "garlic", exact: true }).check();
  await expect(page.locator(".match").first()).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
