import { existsSync } from "fs";
import { cronTick } from "../src/lib/cron";
import { logger } from "../src/lib/logger";

// tsx không tự load .env — nạp thủ công cho skript chạy ngoài CLI.
if (existsSync(".env")) process.loadEnvFile(".env");

const INTERVAL_MS = (() => {
  const n = parseInt(process.env.CRON_INTERVAL_MS ?? "-1", 10);
  return n > 0 ? n : 60_000;
})();

async function runTick() {
  try {
    const r = await cronTick();
    logger.info({ cancelled: r.cancelled, reminded15: r.reminded15, reminded5: r.reminded5 }, "cron tick");
  } catch (e) {
    logger.error(e, "cron tick failed");
  }
}

async function main() {
  await runTick();
  setInterval(runTick, INTERVAL_MS);
  logger.info({ intervalMs: INTERVAL_MS }, "cron daemon started. Ctrl+C to stop.");
}

main().catch((e) => { logger.error(e, "cron daemon fatal"); process.exit(1); });