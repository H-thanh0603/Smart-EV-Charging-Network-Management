import { cronTick } from "../src/lib/cron";

const INTERVAL_MS = (() => {
  const n = parseInt(process.env.CRON_INTERVAL_MS ?? "-1", 10);
  return n > 0 ? n : 60_000;
})();

async function main() {
  await runTick();
  setInterval(runTick, INTERVAL_MS);
  console.log(`Cron daemon chạy, tick mỗi ${Math.round(INTERVAL_MS / 1000)}s. Ctrl+C để dừng.`);
}

async function runTick() {
  try {
    const r = await cronTick();
    console.log(`[${new Date().toISOString()}] tick: cancelled ${r.cancelled}, reminded15 ${r.reminded15}, reminded5 ${r.reminded5}`);
  } catch (e) {
    console.error(e);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });