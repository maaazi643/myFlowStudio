/**
 * A plain-data description of one DOM element, collected by the content
 * script from the real page. Kept as a DOM-free interface (no Element
 * reference) so the candidate-selector logic that consumes it is pure and
 * unit-testable without a browser.
 */
export interface ElementSnapshot {
  tagName: string;
  id?: string | undefined;
  classNames: string[];
  /** Only the attributes selectorBuilder cares about (data-testid, aria-label, name, role, placeholder, type). */
  attributes: Record<string, string>;
  /** 1-based position among this element's siblings — used for the positional fallback selector. */
  nthChild: number;
}
