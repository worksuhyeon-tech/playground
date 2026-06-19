import type { Pregnancy } from "@/types";
import { pregnancyProgress, weekNote } from "@/lib/pregnancy";
import { krLongDate } from "@/lib/dates";

export default function PregnancyCard({
  pregnancy,
}: {
  pregnancy: Pregnancy;
}) {
  const prog = pregnancyProgress(pregnancy.lmp_date);
  const note = weekNote(prog.weeks);

  return (
    <div className="space-y-3">
      <div className="card bg-gradient-to-br from-brand-100 to-brand-50 text-center">
        <p className="text-sm font-semibold text-brand-700">🤰 임신 {prog.trimester}분기</p>
        <p className="mt-1 text-4xl font-bold text-brand-700">{prog.label}</p>
        <p className="mt-2 text-sm text-brand-600">
          출산예정일까지 {Math.max(0, prog.daysUntilDue)}일
        </p>
      </div>

      <div className="card">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">출산예정일 (EDD)</span>
          <span className="font-semibold text-gray-700">
            {krLongDate(pregnancy.due_date)}
          </span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-gray-500">마지막 생리 시작일</span>
          <span className="font-semibold text-gray-700">
            {krLongDate(pregnancy.lmp_date)}
          </span>
        </div>
      </div>

      {note && (
        <div className="card bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-700">
            {prog.weeks}주차 안내
          </p>
          <p className="mt-1 text-sm text-emerald-700">{note}</p>
        </div>
      )}
    </div>
  );
}
