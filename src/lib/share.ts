import { MAX_SERVINGS } from "./limits";
import type { UnitSystem } from "./types";

export interface SharedView {
  servings?: number;
  units?: UnitSystem;
}

/** A link to this recipe that opens at the same servings and units. */
export function shareUrl(pageUrl: string, servings: number, units: UnitSystem): string {
  const url = new URL(pageUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set("servings", String(Math.round(servings * 100) / 100));
  url.searchParams.set("units", units);
  return url.toString();
}

/** Read servings and units from a shared link, ignoring anything out of range or malformed. */
export function readSharedView(search: string): SharedView {
  const params = new URLSearchParams(search);
  const view: SharedView = {};
  const raw = params.get("servings");
  if (raw !== null && raw.trim() !== "") {
    const servings = Number(raw);
    if (Number.isFinite(servings) && servings >= 0.5 && servings <= MAX_SERVINGS) {
      view.servings = Math.round(servings * 100) / 100;
    }
  }
  const units = params.get("units");
  if (units === "us" || units === "metric") view.units = units;
  return view;
}
