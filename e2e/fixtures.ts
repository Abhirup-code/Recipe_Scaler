import { test as base, expect } from "@playwright/test";

/** Every test starts in variant A of the cook button A/B test, so labels are predictable. */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("recipe-scaler:exp:cook_button_label", JSON.stringify("A"));
    });
    await provide(page);
  },
});

export { expect };
