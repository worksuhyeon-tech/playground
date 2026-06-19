// 커스텀 서비스워커 — next-pwa가 생성하는 SW에 합쳐진다.
// 푸시 수신 및 알림 클릭 처리.
// (서비스워커 전역 타입은 앱 tsconfig(dom)에 없으므로 최소한으로 느슨하게 둔다.)

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const self: any;

self.addEventListener("push", (event: any) => {
  let data: { title?: string; body?: string; url?: string } = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() };
  }

  const title = data.title ?? "달거리";
  const options = {
    body: data.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url ?? "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients: any[]) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});

export {};
