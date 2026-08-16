import { defineConfig } from "prisma/config";
import { existsSync } from "fs";

// Prisma 7 CLI không tự load .env — dùng Node built-in (>= 20.12)
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
