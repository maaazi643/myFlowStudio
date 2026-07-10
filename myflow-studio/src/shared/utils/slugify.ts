const DEFAULT_MAX_LENGTH = 40;

/** Turns arbitrary prompt text into a filesystem-safe fragment. */
export function slugify(text: string, maxLength: number = DEFAULT_MAX_LENGTH): string {
  const slug = text
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug.slice(0, maxLength) || "untitled";
}
