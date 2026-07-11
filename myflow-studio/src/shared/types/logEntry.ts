export type LogLevel = "info" | "warning" | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  createdAt: number;
  /** Free-form key/value context for grouping — e.g. { role: "promptBox" } or { requestId }. */
  context?: Record<string, string> | undefined;
}
