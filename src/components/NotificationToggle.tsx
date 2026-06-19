"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/app/actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function NotificationToggle() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok && Notification.permission === "granted") setEnabled(true);
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("VAPID 공개키가 설정되지 않았어요.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error("알림 권한이 거부되었어요.");

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
        }));

      const json = sub.toJSON();
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      if (res.error) throw new Error(res.error);

      setEnabled(true);
      setMsg("알림이 켜졌어요 🔔");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "오류가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-gray-400">
        이 기기/브라우저는 푸시 알림을 지원하지 않아요. iPhone은 “홈 화면에
        추가”로 설치한 뒤 다시 시도해 주세요.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={enable}
        disabled={busy || enabled}
        className={enabled ? "btn-ghost w-full" : "btn-primary w-full"}
      >
        {enabled ? "🔔 알림이 켜져 있어요" : busy ? "설정 중..." : "알림 켜기"}
      </button>
      {msg && <p className="mt-2 text-center text-xs text-brand-600">{msg}</p>}
      <p className="mt-2 text-xs text-gray-400">
        iPhone은 Safari에서 “홈 화면에 추가”로 설치한 경우에만 알림을 받을 수
        있어요. 갤럭시(Chrome)는 바로 가능해요.
      </p>
    </div>
  );
}
