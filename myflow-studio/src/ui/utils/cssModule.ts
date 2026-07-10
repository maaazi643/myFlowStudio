/**
 * CSS Modules are typed via an index signature (`vite/client`), so under
 * `noUncheckedIndexedAccess` every class lookup is `string | undefined`
 * even for keys we know exist because we wrote the stylesheet. This just
 * asserts the obvious rather than switching that safety check off globally.
 */
export function cssClass(value: string | undefined): string {
  return value ?? "";
}
