/**
 * Speed scales randomized delay bands and retry policy together, not just
 * a single fixed sleep — that reads more human to Flow's own page-state
 * transitions and reduces false-failure races (see the roadmap's product
 * analysis on respectful automation as a reliability feature, not just UX).
 */
export interface SpeedProfile {
  id: string;
  label: string;
  description: string;
  delayBetweenPromptsMs: { min: number; max: number };
  retryBackoffMs: { min: number; max: number };
  maxRetries: number;
}

export const SPEED_PROFILES: readonly SpeedProfile[] = [
  {
    id: "fast",
    label: "Fast",
    description: "Minimal delay between prompts. Best on a stable connection.",
    delayBetweenPromptsMs: { min: 1500, max: 3000 },
    retryBackoffMs: { min: 2000, max: 4000 },
    maxRetries: 2,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "A safe default pace for most connections.",
    delayBetweenPromptsMs: { min: 4000, max: 8000 },
    retryBackoffMs: { min: 4000, max: 8000 },
    maxRetries: 3,
  },
  {
    id: "slow",
    label: "Slow",
    description: "Longer, more human-like pauses. Most tolerant of a slow connection.",
    delayBetweenPromptsMs: { min: 8000, max: 15000 },
    retryBackoffMs: { min: 8000, max: 15000 },
    maxRetries: 4,
  },
];

export const DEFAULT_SPEED_PROFILE_ID = "balanced";

export function getSpeedProfile(id: string): SpeedProfile | undefined {
  return SPEED_PROFILES.find((profile) => profile.id === id);
}
