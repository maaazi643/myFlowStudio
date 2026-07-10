export const IMAGES_PER_PROMPT_OPTIONS = [1, 2, 3, 4] as const;

export type ImagesPerPrompt = (typeof IMAGES_PER_PROMPT_OPTIONS)[number];

export const DEFAULT_IMAGES_PER_PROMPT: ImagesPerPrompt = 1;

export function isImagesPerPrompt(value: number): value is ImagesPerPrompt {
  return (IMAGES_PER_PROMPT_OPTIONS as readonly number[]).includes(value);
}
