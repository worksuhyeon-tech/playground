import type { Goal } from "@/types";
import type { Prediction } from "@/lib/predictions";
import { krShortDate, ddayLabel, daysUntil } from "@/lib/dates";

const confidenceLabel: Record<string, string> = {
  low: "예측 정확도 낮음 (기록이 더 쌓이면 정확해져요)",
  medium: "예측 정확도 보통",
  high: "예측 정확도 높음",
};

export default function PredictionCard({
  prediction,
  goal,
}: {
  prediction: Prediction;
  goal: Goal;
}) {
  const next = prediction.cycles[0];
  if (!next) {
    return (
      <div className="card">
        <p className="text-sm text-gray-500">
          아직 예측할 생리 기록이 없어요. 첫 생리 시작일을 기록해 주세요.
        </p>
      </div>
    );
  }

  const ttc = goal === "ttc";

  return (
    <div className="space-y-3">
      {/* 임신 준비 모드는 가임기/배란일을 가장 크게 강조 */}
      {ttc ? (
        <div className="card bg-gradient-to-br from-fertile/10 to-brand-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-700">
              🥚 다음 배란 예상일
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
              {ddayLabel(next.ovulationDate)}
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            {krShortDate(next.ovulationDate)}
          </p>
          <p className="mt-2 text-sm text-emerald-700">
            가임기 {krShortDate(next.fertileStart)} ~{" "}
            {krShortDate(next.fertileEnd)}
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            이 기간에 임신 가능성이 가장 높아요 💚
          </p>
        </div>
      ) : null}

      <div className="card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-700">
            🩸 다음 생리 예정일
          </span>
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
            {ddayLabel(next.periodStart)}
          </span>
        </div>
        <p className="mt-1 text-2xl font-bold text-brand-700">
          {krShortDate(next.periodStart)}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {next.periodStart === next.periodEnd
            ? null
            : `${krShortDate(next.periodStart)} ~ ${krShortDate(next.periodEnd)} (약 ${prediction.avgPeriodLength}일)`}
        </p>
      </div>

      {!ttc && (
        <div className="card">
          <span className="text-sm font-semibold text-emerald-700">
            🥚 배란 예상일
          </span>
          <p className="mt-1 text-lg font-bold text-emerald-800">
            {krShortDate(next.ovulationDate)}{" "}
            <span className="text-sm font-normal text-gray-400">
              ({ddayLabel(next.ovulationDate)})
            </span>
          </p>
          <p className="mt-1 text-sm text-gray-500">
            가임기 {krShortDate(next.fertileStart)} ~{" "}
            {krShortDate(next.fertileEnd)}
          </p>
        </div>
      )}

      <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-400">
        평균 주기 {prediction.avgCycleLength}일 · {confidenceLabel[prediction.confidence]}
      </div>
    </div>
  );
}

export function UpcomingCycles({ prediction }: { prediction: Prediction }) {
  if (prediction.cycles.length <= 1) return null;
  return (
    <div className="card">
      <h3 className="mb-2 text-sm font-semibold text-gray-600">이후 예측</h3>
      <ul className="space-y-2 text-sm">
        {prediction.cycles.slice(1).map((c) => (
          <li key={c.periodStart} className="flex justify-between text-gray-500">
            <span>🩸 {krShortDate(c.periodStart)}</span>
            <span>🥚 {krShortDate(c.ovulationDate)}</span>
            <span className="text-gray-400">{daysUntil(c.periodStart)}일 후</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
