/** Add a recipe to the saved list, or remove it if it is already saved. Newest first. */
export function toggleSaved(saved: string[], slug: string): string[] {
  return saved.includes(slug) ? saved.filter((s) => s !== slug) : [slug, ...saved];
}
