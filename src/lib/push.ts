// Web Push helper using web-push library
// VAPID keys generated once via: npx web-push generate-vapid-keys
export const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC || "BMqNMvVxfA0ESe9XdYSNSlH2NyJaJN6yOmSt9OWdHK6YlA0FZkrBkCKPFkR8UO_tQlMgmH6MDEcq9ZFFV1HzGb8";
export const VAPID_PRIVATE = process.env.VAPID_PRIVATE || "uTXbWb3-bJfLF5Zpsj6bV8L_JJQU_TswBO4LIWqpAxA";
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@evcharge.com";

export async function sendPush(subscription: any, payload: any) {
  try {
    const webpush = await import("web-push");
    webpush.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
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
