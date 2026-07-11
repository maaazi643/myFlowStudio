/**
 * Google Flow origin the extension is allowed to touch.
 *
 * Best-effort pattern, not a confirmed one — nothing in this codebase has
 * browsed the real product. Widened to the whole labs.google domain (rather
 * than a guessed sub-path) so a wrong path doesn't silently break
 * discovery; if the content script never loads there, the automation
 * status banner surfaces a clear "waiting for Google Flow" state rather
 * than failing silently, and this is the one line to fix once the real
 * URL is confirmed.
 *
 * http://localhost/* is separate: it's only there so the discovery engine
 * can be verified end-to-end against a local test fixture in Playwright,
 * without touching Google's real site. It never matters for real
 * automation.
 */
export const FLOW_HOST_PERMISSIONS: readonly string[] = [
  "https://labs.google/*",
  "http://localhost:*/*",
];

export const FLOW_CONTENT_SCRIPT_MATCHES: readonly string[] = [
  "https://labs.google/*",
  "http://localhost:*/*",
];
