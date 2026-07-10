/**
 * Google Flow origin the extension is allowed to touch.
 *
 * Placeholder pattern — confirm the exact path against the live product
 * during the automation feasibility spike (roadmap milestone SPIKE) and
 * narrow this as far as possible before shipping.
 */
export const FLOW_HOST_PERMISSIONS: readonly string[] = ["https://labs.google/*"];

export const FLOW_CONTENT_SCRIPT_MATCHES: readonly string[] = ["https://labs.google/fx/*"];
