import pino from "pino";

// Structured logging — pino. Dev dùng pino-pretty, prod JSON thô.
// NODE_ENV=development hoặc unset → pretty; production → JSON.
const isDev = process.env.NODE_ENV !== "production";
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  transport: isDev
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
    : undefined,
});
