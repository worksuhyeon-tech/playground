import BottomNav from "@/components/BottomNav";
import Calendar from "@/components/Calendar";
import { getCurrentUser, getPeriods, getProfile } from "@/lib/data";
import { predict } from "@/lib/predictions";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, periods] = await Promise.all([
    getProfile(user.id),
    getPeriods(user.id),
  ]);

  const prediction = predict(periods, {
    fallbackCycle: profile?.avg_cycle_length,
    fallbackPeriod: profile?.avg_period_length,
    cycles: 3,
  });

  const actual = periods.map((p) => ({ start: p.start_date, end: p.end_date }));

  return (
    <main className="app-shell px-4 pt-6">
      <h1 className="mb-4 text-xl font-bold text-gray-800">📅 달력</h1>
      <Calendar actual={actual} predicted={prediction.cycles} />
      <p className="mt-4 px-1 text-center text-[11px] text-gray-400">
        예측은 참고용입니다. 기록이 쌓일수록 정확해져요.
      </p>
      <BottomNav />
    </main>
  );
}
