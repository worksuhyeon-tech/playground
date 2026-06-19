// 매일 실행되는 알림 발송 Edge Function (Supabase Scheduled Function / cron).
// 각 사용자의 목표(모드)와 예측에 따라 다른 알림을 Web Push로 보낸다.
//
// 배포:
//   supabase functions deploy send-reminders
// 스케줄(예: 매일 09:00 KST = 00:00 UTC) 은 Supabase 대시보드의 cron 또는
//   pg_cron + pg_net 으로 이 함수를 호출하도록 설정한다.
//
// 환경변수(Function Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";
const CRON_SECRET = Deno.env.get("CRON_SECRET");

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const LUTEAL = 14;
const OUTLIER = 45;

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86400000
  );
}
function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function mean(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendTo(subs: PushSub[], title: string, body: string, url = "/") {
  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body, url })
      )
    )
  );
}

Deno.serve(async (req) => {
  // cron 호출 보호
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return new Response("unauthorized", { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  const { data: profiles } = await supabase.from("profiles").select("*");
  let sent = 0;

  for (const profile of profiles ?? []) {
    const userId = profile.id as string;

    const { data: prefs } = await supabase
      .from("notification_prefs")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prefs) continue;

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("user_id", userId);
    if (!subs || subs.length === 0) continue;

    // ── 임신 중 모드 ──
    if (profile.goal === "pregnant") {
      const { data: preg } = await supabase
        .from("pregnancies")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();
      if (preg) {
        const days = daysBetween(preg.lmp_date, today);
        if (days % 7 === 0 && days > 0) {
          const weeks = days / 7;
          await sendTo(subs, "임신 주차 변경 🤰", `오늘부터 임신 ${weeks}주차예요.`);
          sent++;
        }
      }
      continue;
    }

    // ── 생리/임신 준비 모드: 예측 계산 ──
    const { data: periods } = await supabase
      .from("periods")
      .select("start_date")
      .eq("user_id", userId)
      .order("start_date", { ascending: true });
    if (!periods || periods.length === 0) continue;

    const starts = periods.map((p) => p.start_date as string);
    const lengths: number[] = [];
    for (let i = 1; i < starts.length; i++) {
      const len = daysBetween(starts[i - 1], starts[i]);
      if (len > 0 && len <= OUTLIER) lengths.push(len);
    }
    const recent = lengths.slice(-6);
    const avgCycle =
      recent.length > 0
        ? Math.round(mean(recent))
        : profile.avg_cycle_length ?? 28;

    const lastStart = starts[starts.length - 1];
    const nextPeriod = addDays(lastStart, avgCycle);
    const ovulation = addDays(nextPeriod, -LUTEAL);
    const fertileStart = addDays(ovulation, -5);

    const dToPeriod = daysBetween(today, nextPeriod);
    const dToOvulation = daysBetween(today, ovulation);

    // 생리 예정일 D-2
    if (prefs.period_reminder && dToPeriod === 2) {
      await sendTo(subs, "생리 예정일이 다가와요 🩸", "이틀 후 생리 예정일이에요.");
      sent++;
    }
    // 배란일 당일
    if (prefs.ovulation_reminder && dToOvulation === 0) {
      const body =
        profile.goal === "ttc"
          ? "오늘이 배란 예상일이에요. 임신 가능성이 가장 높은 날! 💚"
          : "오늘이 배란 예상일이에요.";
      await sendTo(subs, "배란 예상일 🥚", body);
      sent++;
    }
    // 가임기 시작
    if (prefs.fertile_window_reminder && today === fertileStart) {
      await sendTo(subs, "가임기가 시작됐어요 💚", "오늘부터 가임기예요.");
      sent++;
    }

    // ── 파트너에게 가임기/배란 알림 ──
    if (
      profile.goal === "ttc" &&
      prefs.partner_fertile_alert &&
      (dToOvulation === 0 || today === fertileStart)
    ) {
      const { data: links } = await supabase
        .from("partner_links")
        .select("partner_id")
        .eq("owner_id", userId)
        .eq("status", "accepted");
      for (const link of links ?? []) {
        if (!link.partner_id) continue;
        const { data: psubs } = await supabase
          .from("push_subscriptions")
          .select("endpoint,p256dh,auth")
          .eq("user_id", link.partner_id);
        if (psubs && psubs.length > 0) {
          const name = profile.display_name ?? "파트너";
          const body =
            dToOvulation === 0
              ? `오늘은 ${name}님의 배란 예상일이에요 💚`
              : `오늘부터 ${name}님의 가임기예요 💚`;
          await sendTo(psubs, "파트너 가임기 알림", body, "/partner");
          sent++;
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { "content-type": "application/json" },
  });
});
