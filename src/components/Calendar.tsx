"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
} from "date-fns";
import type { PredictedCycle } from "@/lib/predictions";

export interface ActualPeriod {
  start: string;
  end: string | null;
}

type DayType = "period" | "predicted" | "ovulation" | "fertile" | null;

function classify(
  day: Date,
  actual: ActualPeriod[],
  predicted: PredictedCycle[]
): DayType {
  // 실제 생리일 (종료일 없으면 시작일 당일만)
  for (const p of actual) {
    const start = parseISO(p.start);
    const end = p.end ? parseISO(p.end) : start;
    if (isWithinInterval(day, { start, end })) return "period";
  }
  for (const c of predicted) {
    if (isSameDay(day, parseISO(c.ovulationDate))) return "ovulation";
  }
  for (const c of predicted) {
    if (
      isWithinInterval(day, {
        start: parseISO(c.periodStart),
        end: parseISO(c.periodEnd),
      })
    )
      return "predicted";
  }
  for (const c of predicted) {
    if (
      isWithinInterval(day, {
        start: parseISO(c.fertileStart),
        end: parseISO(c.fertileEnd),
      })
    )
      return "fertile";
  }
  return null;
}

const styles: Record<NonNullable<DayType>, string> = {
  period: "bg-period text-white",
  predicted: "bg-predicted/30 text-brand-700 ring-1 ring-predicted",
  ovulation: "bg-ovulation text-white",
  fertile: "bg-fertile/25 text-emerald-700",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function Calendar({
  actual,
  predicted,
}: {
  actual: ActualPeriod[];
  predicted: PredictedCycle[];
}) {
  const [cursor, setCursor] = useState(new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = new Date();

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setCursor(addMonths(cursor, -1))}
          className="px-3 py-1 text-gray-400"
        >
          ‹
        </button>
        <span className="font-semibold text-gray-700">
          {format(cursor, "yyyy년 M월")}
        </span>
        <button
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="px-3 py-1 text-gray-400"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const type = classify(day, actual, predicted);
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={`flex aspect-square items-center justify-center rounded-lg text-sm ${
                type ? styles[type] : "text-gray-600"
              } ${!inMonth ? "opacity-30" : ""} ${
                isToday && !type ? "ring-2 ring-brand-300" : ""
              }`}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <Legend className="bg-period" label="생리일" />
        <Legend className="bg-predicted/40" label="예측 생리일" />
        <Legend className="bg-ovulation" label="배란 예상일" />
        <Legend className="bg-fertile/40" label="가임기" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded ${className}`} />
      {label}
    </div>
  );
}
