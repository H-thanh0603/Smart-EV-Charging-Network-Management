// Web Push helper using web-push library
// VAPID keys generated once via: npx web-push generate-vapid-keys
// Private key KHÔNG có fallback hardcode — đọc từ .env ngay lúc gửi.
export const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC || "";
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@evcharge.com";

export async function sendPush(subscription: any, payload: any) {
  try {
    const privateKey = process.env.VAPID_PRIVATE;
    if (!privateKey) throw new Error("VAPID_PRIVATE chưa cấu hình trong .env");
    const webpush = await import("web-push");
    webpush.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, privateKey);
    await webpush.default.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (e: any) {
    console.error("Push failed:", e?.message);
    return false;
  }
}
