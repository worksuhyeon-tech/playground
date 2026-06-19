import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SettingsForm from "@/components/SettingsForm";
import NotificationToggle from "@/components/NotificationToggle";
import {
  getActivePregnancy,
  getCurrentUser,
  getNotificationPrefs,
  getProfile,
} from "@/lib/data";
import type { NotificationPrefs, Profile } from "@/types";

export const dynamic = "force-dynamic";

const defaultPrefs = (userId: string): NotificationPrefs => ({
  user_id: userId,
  period_reminder: true,
  ovulation_reminder: true,
  fertile_window_reminder: true,
  log_reminder: false,
  partner_fertile_alert: true,
  reminder_hour: 9,
});

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, prefs, pregnancy] = await Promise.all([
    getProfile(user.id),
    getNotificationPrefs(user.id),
    getActivePregnancy(user.id),
  ]);

  const safeProfile: Profile = profile ?? {
    id: user.id,
    display_name: null,
    goal: "ttc",
    avg_cycle_length: 28,
    avg_period_length: 5,
    created_at: new Date().toISOString(),
  };

  return (
    <main className="app-shell px-4 pt-6">
      <h1 className="mb-4 text-xl font-bold text-gray-800">⚙️ 설정</h1>

      <section className="card mb-3">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">푸시 알림</h2>
        <NotificationToggle />
      </section>

      <SettingsForm
        profile={safeProfile}
        prefs={prefs ?? defaultPrefs(user.id)}
        pregnancy={pregnancy}
      />

      <div className="mt-3 text-center">
        <Link href="/import" className="text-sm text-gray-400 underline">
          기존 데이터 가져오기
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
