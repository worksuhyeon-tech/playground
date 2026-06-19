import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import PredictionCard, { UpcomingCycles } from "@/components/PredictionCard";
import PregnancyCard from "@/components/PregnancyCard";
import {
  getActivePregnancy,
  getCurrentUser,
  getPeriods,
  getProfile,
} from "@/lib/data";
import { predict } from "@/lib/predictions";
import { krShortDate, todayIso } from "@/lib/dates";

export const dynamic = "force-dynamic";

const goalLabel: Record<string, string> = {
  tracking: "🌙 생리 추적",
  ttc: "🌱 임신 준비",
  pregnant: "🤰 임신 중",
};

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) return null; // 미들웨어가 /login 으로 보냄

  const [profile, periods] = await Promise.all([
    getProfile(user.id),
    getPeriods(user.id),
  ]);
  const goal = profile?.goal ?? "ttc";
  const pregnancy = goal === "pregnant" ? await getActivePregnancy(user.id) : null;

  const prediction = predict(periods, {
    fallbackCycle: profile?.avg_cycle_length,
    fallbackPeriod: profile?.avg_period_length,
    cycles: 3,
  });

  return (
    <main className="app-shell px-4 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            안녕하세요, {profile?.display_name ?? "수현"}님 🌸
          </p>
          <h1 className="text-xl font-bold text-gray-800">
            {goalLabel[goal]}
          </h1>
        </div>
        <Link
          href="/log"
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
        >
          + 오늘 기록
        </Link>
      </header>

      {goal === "pregnant" && pregnancy ? (
        <PregnancyCard pregnancy={pregnancy} />
      ) : (
        <>
          <PredictionCard prediction={prediction} goal={goal} />
          <div className="mt-3">
            <UpcomingCycles prediction={prediction} />
          </div>
        </>
      )}

      {prediction.lastPeriodStart && goal !== "pregnant" && (
        <p className="mt-3 px-1 text-xs text-gray-400">
          마지막 생리 시작일: {krShortDate(prediction.lastPeriodStart)}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/calendar" className="btn-ghost">
          📅 달력 보기
        </Link>
        <Link href="/partner" className="btn-ghost">
          💞 파트너와 공유
        </Link>
      </div>

      <p className="mt-6 px-1 text-center text-[11px] leading-relaxed text-gray-400">
        본 예측은 통계 기반 참고용이며 의학적 조언이 아니에요. 정확한 진단은
        전문의와 상담하세요.
      </p>

      <BottomNav />
    </main>
  );
}
