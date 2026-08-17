// Sentry error tracking — chỉ khởi động khi DSN cấu hình trong env.
// Không DSN → no-op, app chạy bình thường.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  }
}