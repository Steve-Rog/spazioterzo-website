/** Ripulisce le voci digitate a mano prima che finiscano nello schema: il server rifiuta vuoti e testi troppo lunghi. */
export function sanitiseTags(values: string[], { maxItems, maxLength }: { maxItems: number; maxLength: number }): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const value of values) {
    const tag = value.trim().slice(0, maxLength).trim();
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === maxItems) break;
  }
  return tags;
}
