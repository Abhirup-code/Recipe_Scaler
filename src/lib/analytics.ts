/**
 * Google Analytics 4 events. Nothing is loaded or sent unless NEXT_PUBLIC_GA_ID is set at
 * build time, and visitors with Do Not Track or Global Privacy Control turned on are never
 * tracked. Calls never throw, so analytics can never break the page.
 */
export type AnalyticsEvent =
  | "change_servings"
  | "change_units"
  | "start_cook_mode"
  | "finish_cook_mode"
  | "add_to_list"
  | "view_substitutes"
  | "save_recipe"
  | "print_recipe"
  | "experiment_exposure";

type Params = Record<string, string | number>;
type Gtag = (command: "event" | "config" | "js", target: string | Date, params?: Params) => void;

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export function trackingAllowed(): boolean {
  if (!GA_ID || typeof window === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack !== "1" && nav.globalPrivacyControl !== true;
}

export function track(event: AnalyticsEvent, params: Params = {}): void {
  try {
    if (!trackingAllowed()) return;
    const gtag = (window as Window & { gtag?: Gtag }).gtag;
    gtag?.("event", event, params);
  } catch {
    // Analytics must never break the app.
  }
}
