import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  migrate: {
    adapter: async () => {
      const { PrismaLibSql } = await import("@prisma/adapter-libsql");
      return new PrismaLibSql({ url: "file:D:/ev-charging/prisma/dev.db" });
    },
  },
  datasource: {
    url: "file:D:/ev-charging/prisma/dev.db",
  },
});
