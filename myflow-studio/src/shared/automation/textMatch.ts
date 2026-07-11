/** Lowercases, strips punctuation, and collapses whitespace so keyword matching ignores casing/formatting noise. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Whole-word containment: pads both sides with spaces before checking
 * substring inclusion, so a keyword like "generate" doesn't false-positive
 * match inside an unrelated word like "generated" or "regenerate-icon".
 */
export function matchesKeywords(text: string, keywords: readonly string[]): boolean {
  const normalized = normalizeForMatch(text);
  if (!normalized) {
    return false;
  }
  const padded = ` ${normalized} `;
  return keywords.some((keyword) => padded.includes(` ${normalizeForMatch(keyword)} `));
}
