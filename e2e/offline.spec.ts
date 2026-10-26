import { expect, test } from "./fixtures";

test("the service worker saves opened recipes for offline use", async ({ page }) => {
  await page.goto("/recipes/scallion-pancakes/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  const cached = await page.evaluate(async () => {
    const cache = await caches.open("recipe-scaler-v1");
    return (await cache.keys()).map((r) => new URL(r.url).pathname);
  });
  expect(cached).toContain("/recipes/scallion-pancakes/");
  expect(cached).toContain("/offline/");
  expect(cached).toContain("/saved/");
});

test("the site can be installed as an app", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifest = await (await request.get(href ?? "")).json();
  expect(manifest).toMatchObject({ name: "Recipe Scaler", display: "standalone", start_url: "/" });
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
});
