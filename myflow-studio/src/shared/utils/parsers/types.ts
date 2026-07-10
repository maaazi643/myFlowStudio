export interface ParsedPrompt {
  text: string;
  variables?: Record<string, string> | undefined;
}
