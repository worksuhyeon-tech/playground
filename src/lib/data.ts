import { createClient } from "@/lib/supabase/server";
import type {
  DailyLog,
  NotificationPrefs,
  PartnerLink,
  Period,
  Pregnancy,
  Profile,
} from "@/types";

// 서버 컴포넌트용 데이터 조회 헬퍼

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data as Profile | null;
}

export async function getPeriods(userId: string): Promise<Period[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("periods")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: true });
  return (data ?? []) as Period[];
}

export async function getDailyLog(
  userId: string,
  date: string
): Promise<DailyLog | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", date)
    .maybeSingle();
  return data as DailyLog | null;
}

export async function getRecentLogs(
  userId: string,
  limit = 60
): Promise<DailyLog[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(limit);
  return (data ?? []) as DailyLog[];
}

export async function getActivePregnancy(
  userId: string
): Promise<Pregnancy | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("pregnancies")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .maybeSingle();
  return data as Pregnancy | null;
}

export async function getNotificationPrefs(
  userId: string
): Promise<NotificationPrefs | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("notification_prefs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as NotificationPrefs | null;
}

// 내가 owner인 링크 (남편을 초대한 경우)
export async function getOwnedLinks(userId: string): Promise<PartnerLink[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("partner_links")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PartnerLink[];
}

// 내가 partner인 링크 (내가 누군가의 데이터를 보는 경우)
export async function getPartneredLinks(
  userId: string
): Promise<PartnerLink[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("partner_links")
    .select("*")
    .eq("partner_id", userId)
    .eq("status", "accepted");
  return (data ?? []) as PartnerLink[];
}
