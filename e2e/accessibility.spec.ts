import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

for (const path of ["/", "/recipes/kolkata-masoor-dal/", "/shopping-list/", "/saved/", "/offline/"]) {
  test(`no accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test("no accessibility violations in cook mode", async ({ page }) => {
  await page.goto("/recipes/kolkata-masoor-dal/");
  await page.getByRole("button", { name: "Start cook mode" }).click();
  const results = await new AxeBuilder({ page }).include(".cook-mode").analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
