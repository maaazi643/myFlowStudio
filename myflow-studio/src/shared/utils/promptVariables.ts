const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/** Names of every {{token}} in a prompt, in first-appearance order, deduped. */
export function extractVariableNames(text: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const name = match[1];
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

/** Substitutes {{token}} with its value; a token with no (or empty) value is left as-is. */
export function resolvePromptText(
  text: string,
  variables: Record<string, string> | undefined,
): string {
  if (!variables) {
    return text;
  }
  return text.replace(VARIABLE_PATTERN, (full, name: string) => {
    const value = variables[name];
    return value ? value : full;
  });
}
