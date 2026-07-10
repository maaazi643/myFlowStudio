import type { ParsedPrompt } from "./types";

/**
 * Minimal RFC4180-style tokenizer: quoted fields, "" as an escaped quote,
 * commas/newlines inside quotes. Handles the CSVs a spreadsheet export
 * actually produces without pulling in a parsing library.
 */
function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    if (char === undefined) {
      break;
    }

    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += char;
        i += 1;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
    } else if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
    } else if (char === "\r") {
      i += 1;
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
    } else {
      field += char;
      i += 1;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => !(cells.length === 1 && cells[0] === ""));
}

const HEADER_TEXT_COLUMN_NAMES = new Set(["prompt", "text"]);

/**
 * First column is always the prompt text. If the first row's first cell
 * reads "prompt" or "text", it's treated as a header and every other
 * header name becomes a per-row variable — otherwise every row (including
 * the first) is data with no variables. No guessing beyond that rule.
 */
export function parsePromptsFromCsv(content: string): ParsedPrompt[] {
  const rows = parseCsvRows(content);
  if (rows.length === 0) {
    return [];
  }

  const [firstRow, ...rest] = rows;
  const firstCell = (firstRow?.[0] ?? "").trim().toLowerCase();
  const isHeader = HEADER_TEXT_COLUMN_NAMES.has(firstCell);

  if (!isHeader) {
    return rows
      .map((cells) => (cells[0] ?? "").trim())
      .filter((text) => text.length > 0)
      .map((text) => ({ text }));
  }

  const variableNames = (firstRow ?? []).slice(1).map((header) => header.trim());

  const parsed: ParsedPrompt[] = [];
  for (const cells of rest) {
    const text = (cells[0] ?? "").trim();
    if (!text) {
      continue;
    }
    const variables: Record<string, string> = {};
    variableNames.forEach((name, index) => {
      const value = cells[index + 1];
      if (name && value) {
        variables[name] = value.trim();
      }
    });
    parsed.push({
      text,
      variables: Object.keys(variables).length > 0 ? variables : undefined,
    });
  }
  return parsed;
}
