/**
 * The set of Google Flow page elements the automation engine (M6) and
 * downloads (M8) need selectors for. Nothing here hardcodes what those
 * selectors actually are — Developer Mode captures them live, one at a
 * time, from whatever the user clicks on the real page.
 */
export type CapturableElementRole =
  | "promptBox"
  | "generateButton"
  | "downloadButton"
  | "referenceUpload"
  | "modelSelector"
  | "aspectRatioSelector"
  | "qualitySelector";

export interface RoleDefinition {
  role: CapturableElementRole;
  label: string;
  description: string;
  /** What kind of element we'd expect this to be — used for a soft, non-blocking validation warning, not a hard rule. */
  expectedKind: string;
}

export const CAPTURABLE_ROLES: readonly RoleDefinition[] = [
  {
    role: "promptBox",
    label: "Prompt box",
    description: "Where the prompt text gets typed in.",
    expectedKind: "a text input, textarea, or editable field",
  },
  {
    role: "generateButton",
    label: "Generate button",
    description: "Starts generating an image from the current prompt.",
    expectedKind: "a button",
  },
  {
    role: "downloadButton",
    label: "Download button",
    description: "Downloads the generated image.",
    expectedKind: "a button or link",
  },
  {
    role: "referenceUpload",
    label: "Reference upload",
    description: "Attaches a reference image to the prompt.",
    expectedKind: "a file input or upload button",
  },
  {
    role: "modelSelector",
    label: "Model selector",
    description: "Chooses which generation model to use.",
    expectedKind: "a dropdown or select control",
  },
  {
    role: "aspectRatioSelector",
    label: "Aspect ratio selector",
    description: "Chooses the output image's aspect ratio.",
    expectedKind: "a dropdown or select control",
  },
  {
    role: "qualitySelector",
    label: "Quality selector",
    description: "Chooses the output image's quality.",
    expectedKind: "a dropdown or select control",
  },
] as const;

export function getRoleDefinition(role: CapturableElementRole): RoleDefinition {
  const found = CAPTURABLE_ROLES.find((definition) => definition.role === role);
  if (!found) {
    throw new Error(`Unknown capturable element role "${role}".`);
  }
  return found;
}
