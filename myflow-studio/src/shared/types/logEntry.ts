export type LogLevel = "info" | "warning" | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  createdAt: number;
}
