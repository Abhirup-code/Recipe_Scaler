import { expect, test } from "./fixtures";

test("back up imported recipes and restore them in a fresh browser", async ({ page, browser }) => {
  await page.goto("/import/");
  await page.getByRole("button", { name: "Try an example" }).click();
  await page.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Easy Banana Bread");

  await page.goto("/my-recipes/");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^recipe-scaler-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();

  // A brand-new browser profile has none of your recipes...
  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  await other.goto("/my-recipes/");
  await expect(other.getByText(/Nothing here yet/)).toBeVisible();

  // ...until you restore the backup.
  await other.getByLabel("Restore from backup").setInputFiles(path);
  await expect(other.getByRole("status")).toHaveText("Restored 1 recipe.");
  await other.getByRole("link", { name: "Easy Banana Bread" }).click();
  await expect(other.getByRole("heading", { level: 1 })).toHaveText("Easy Banana Bread");
  await fresh.close();
});
