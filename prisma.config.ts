import { defineConfig } from "prisma/config";
import { existsSync } from "fs";

// Prisma 7 CLI không tự load .env — dùng Node built-in (>= 20.12)
if (existsSync(".env")) process.loadEnvFile(".env");

const url = process.env.DATABASE_URL;
// Shadow DB riêng cho migrate dev (supabase_admin có CREATEDB, tự tạo schema shadow)
function shadow(url?: string) {
  if (!url) return undefined;
  const m = url.match(/\/([^/?]+)(\?|$)/);
  if (!m) return undefined;
  const dbName = m[1];
  return url.replace(`/${dbName}`, `/${dbName}_shadow`);
}
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url,
    shadowDatabaseUrl: shadow(url),
  },
});
