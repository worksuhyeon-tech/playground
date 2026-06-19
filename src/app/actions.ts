"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dueDateFromLmp } from "@/lib/pregnancy";
import { SEED_PERIODS } from "@/lib/seed-data";
import type { Flow, Goal, Intercourse } from "@/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  return { supabase, user };
}

// ── 생리 기록 ────────────────────────────────────────────
export async function upsertPeriod(input: {
  start_date: string;
  end_date?: string | null;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("periods").upsert(
    {
      user_id: user.id,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
    },
    { onConflict: "user_id,start_date" }
  );
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/calendar");
  return { ok: true };
}

// 가장 최근 생리의 종료일을 설정 (종료일 미입력 우선)
export async function setLatestPeriodEnd(end_date: string) {
  const { supabase, user } = await requireUser();
  const { data: periods } = await supabase
    .from("periods")
    .select("*")
    .eq("user_id", user.id)
    .lte("start_date", end_date)
    .order("start_date", { ascending: false })
    .limit(1);
  const latest = periods?.[0];
  if (!latest) return { error: "먼저 생리 시작일을 기록해 주세요." };
  const { error } = await supabase
    .from("periods")
    .update({ end_date })
    .eq("id", latest.id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/calendar");
  return { ok: true };
}

export async function deletePeriod(start_date: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("periods")
    .delete()
    .eq("user_id", user.id)
    .eq("start_date", start_date);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/calendar");
  return { ok: true };
}

// ── 기존 PDF 데이터 가져오기 ─────────────────────────────
export async function importSeedPeriods() {
  const { supabase, user } = await requireUser();
  const rows = SEED_PERIODS.map((p) => ({
    user_id: user.id,
    start_date: p.start_date,
    end_date: p.end_date,
  }));
  const { error } = await supabase
    .from("periods")
    .upsert(rows, { onConflict: "user_id,start_date" });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/calendar");
  return { ok: true, count: rows.length };
}

// ── 일일 기록 (증상/몸상태) ───────────────────────────────
export async function saveDailyLog(input: {
  log_date: string;
  flow: Flow;
  intercourse: Intercourse;
  symptoms: string[];
  mood?: string | null;
  note?: string | null;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      log_date: input.log_date,
      flow: input.flow,
      intercourse: input.intercourse,
      symptoms: input.symptoms,
      mood: input.mood ?? null,
      note: input.note ?? null,
    },
    { onConflict: "user_id,log_date" }
  );
  if (error) return { error: error.message };

  // 생리 양이 기록되면 해당 날짜를 생리 기록에도 반영(시작일 보정은 사용자 몫)
  revalidatePath("/log");
  revalidatePath("/");
  revalidatePath("/calendar");
  return { ok: true };
}

// ── 목표(모드) 변경 ───────────────────────────────────────
export async function setGoal(goal: Goal) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ goal })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateProfile(input: {
  display_name?: string;
  avg_cycle_length?: number;
  avg_period_length?: number;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

// ── 알림 설정 ─────────────────────────────────────────────
export async function updateNotificationPrefs(input: Record<string, unknown>) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notification_prefs")
    .update(input)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

// ── 임신 모드 ─────────────────────────────────────────────
export async function startPregnancy(lmp_date: string) {
  const { supabase, user } = await requireUser();
  const due_date = dueDateFromLmp(lmp_date);
  const { error } = await supabase.from("pregnancies").insert({
    user_id: user.id,
    lmp_date,
    due_date,
    status: "active",
  });
  if (error) return { error: error.message };
  await supabase.from("profiles").update({ goal: "pregnant" }).eq("id", user.id);
  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true };
}

export async function endPregnancy(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("pregnancies")
    .update({ status: "ended" })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true };
}

// ── 파트너 연결 ───────────────────────────────────────────
function genCode(): string {
  // 사람이 읽기 쉬운 6자리 코드
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createInvite() {
  const { supabase, user } = await requireUser();
  const invite_code = genCode();
  const { error } = await supabase.from("partner_links").insert({
    owner_id: user.id,
    invite_code,
    status: "pending",
  });
  if (error) return { error: error.message };
  revalidatePath("/partner");
  return { ok: true, invite_code };
}

export async function acceptInvite(code: string) {
  const { supabase, user } = await requireUser();
  const trimmed = code.trim().toUpperCase();
  const { data: link, error: findErr } = await supabase
    .from("partner_links")
    .select("*")
    .eq("invite_code", trimmed)
    .maybeSingle();
  if (findErr) return { error: findErr.message };
  if (!link) return { error: "유효하지 않은 초대 코드예요." };
  if (link.owner_id === user.id)
    return { error: "본인이 만든 코드는 사용할 수 없어요." };

  const { error } = await supabase
    .from("partner_links")
    .update({ partner_id: user.id, status: "accepted" })
    .eq("id", link.id);
  if (error) return { error: error.message };
  revalidatePath("/partner");
  revalidatePath("/");
  return { ok: true };
}

export async function removeLink(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("partner_links")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/partner");
  return { ok: true };
}

// ── 푸시 구독 저장 ────────────────────────────────────────
export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) return { error: error.message };
  return { ok: true };
}

// ── 로그아웃 ──────────────────────────────────────────────
export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/login");
}
