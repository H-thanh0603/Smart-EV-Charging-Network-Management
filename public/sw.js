self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data.json(); } catch { data = { title: "EV Charge", body: event.data?.text() || "Bạn có thông báo mới" }; }

  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/badge-72.png",
    data: { url: data.url || "/notifications" },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(data.title || "EV Charge", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const c of list) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
