import { differenceInCalendarDays, format, parseISO } from "date-fns";

/** YYYY-MM-DD → "6월 19일" */
export function krShortDate(iso: string): string {
  const d = parseISO(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** YYYY-MM-DD → "2026년 6월 19일" */
export function krLongDate(iso: string): string {
  const d = parseISO(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** 오늘 기준 D-day 라벨. 양수면 "D-n", 0이면 "D-DAY", 음수면 "D+n" */
export function ddayLabel(iso: string, base: Date = new Date()): string {
  const diff = differenceInCalendarDays(parseISO(iso), base);
  if (diff === 0) return "D-DAY";
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
}

export function daysUntil(iso: string, base: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(iso), base);
}
