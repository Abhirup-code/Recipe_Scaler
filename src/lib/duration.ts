/** ISO 8601 duration for schema.org, e.g. 75 -> "PT1H15M". */
export function isoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `PT${h ? `${h}H` : ""}${m || !h ? `${m}M` : ""}`;
}

/** Human-friendly duration, e.g. 75 -> "1 hr 15 min". */
export function humanDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
