export type AutomationRole =
  | "promptEditor"
  | "generateButton"
  | "downloadButton"
  | "referenceImageUpload"
  | "modelSelector"
  | "aspectRatioSelector"
  | "imageQualitySelector";

export type ElementKind = "editable" | "button" | "fileInput" | "dropdown";

export interface AutomationRoleDefinition {
  role: AutomationRole;
  label: string;
  description: string;
  expectedKind: ElementKind;
  /** Required roles block "Real" status when missing; optional roles are discovered and reported but never block a run. */
  required: boolean;
  /** Lowercased phrases used to match this role's element against attributes, ARIA labels, accessible names, and visible text. */
  keywords: readonly string[];
}

export const AUTOMATION_ROLE_DEFINITIONS: readonly AutomationRoleDefinition[] = [
  {
    role: "promptEditor",
    label: "Prompt editor",
    description: "The text field where the generation prompt is typed.",
    expectedKind: "editable",
    required: true,
    keywords: ["prompt", "describe", "imagine", "write a prompt", "enter a prompt", "describe an image"],
  },
  {
    role: "generateButton",
    label: "Generate button",
    description: "The button that starts image generation.",
    expectedKind: "button",
    required: true,
    keywords: ["generate", "create image", "create images", "run"],
  },
  {
    role: "downloadButton",
    label: "Download button",
    description: "The button that downloads a generated image.",
    expectedKind: "button",
    required: true,
    keywords: ["download", "save image", "save to device"],
  },
  {
    role: "referenceImageUpload",
    label: "Reference image upload",
    description: "The file input used to attach a reference image to the prompt.",
    expectedKind: "fileInput",
    required: false,
    keywords: ["reference", "upload image", "add image", "attach image", "upload a photo"],
  },
  {
    role: "modelSelector",
    label: "Model selector",
    description: "The control that chooses which generation model to use.",
    expectedKind: "dropdown",
    required: false,
    keywords: ["model"],
  },
  {
    role: "aspectRatioSelector",
    label: "Aspect ratio selector",
    description: "The control that chooses the output image's aspect ratio.",
    expectedKind: "dropdown",
    required: false,
    keywords: ["aspect ratio", "ratio"],
  },
  {
    role: "imageQualitySelector",
    label: "Image quality selector",
    description: "The control that chooses output image quality/resolution.",
    expectedKind: "dropdown",
    required: false,
    keywords: ["quality", "resolution"],
  },
];

export function getRoleDefinition(role: AutomationRole): AutomationRoleDefinition {
  const definition = AUTOMATION_ROLE_DEFINITIONS.find((entry) => entry.role === role);
  if (!definition) {
    throw new Error(`Unknown automation role: ${role}`);
  }
  return definition;
}

export function requiredRoles(): AutomationRole[] {
  return AUTOMATION_ROLE_DEFINITIONS.filter((entry) => entry.required).map((entry) => entry.role);
}
