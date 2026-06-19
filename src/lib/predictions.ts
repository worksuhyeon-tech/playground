import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import type { Period } from "@/types";

// 길이가 이보다 긴 주기는 생리 기록 누락으로 보고 평균 계산에서 제외한다.
// (PDF 데이터에 60~63일짜리 비정상 주기가 존재)
export const OUTLIER_CYCLE_DAYS = 45;
export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;
// 황체기는 비교적 일정(약 14일)하다는 가정으로 배란일을 역산한다.
export const LUTEAL_PHASE_DAYS = 14;
// 최근 몇 개 주기를 평균에 사용할지
const RECENT_CYCLES = 6;

export type Confidence = "low" | "medium" | "high";

export interface PredictedCycle {
  /** 예측 생리 시작일 */
  periodStart: string;
  /** 예측 생리 종료일 */
  periodEnd: string;
  /** 예측 배란일 */
  ovulationDate: string;
  /** 가임기 시작/종료 */
  fertileStart: string;
  fertileEnd: string;
}

export interface Prediction {
  avgCycleLength: number;
  avgPeriodLength: number;
  /** 가장 최근 생리 시작일 (없으면 null) */
  lastPeriodStart: string | null;
  /** 다음 주기들 (요청한 개수만큼) */
  cycles: PredictedCycle[];
  confidence: Confidence;
  /** 평균 계산에 사용된 주기 수 */
  usedCycleCount: number;
}

function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function mean(nums: number[]): number {
  if (nums.length === 0) return NaN;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  return Math.sqrt(mean(nums.map((n) => (n - m) ** 2)));
}

/** 연속된 생리 시작일 간격(주기 길이) 목록. 이상치는 제외. */
export function cycleLengths(periods: Period[]): number[] {
  const starts = periods
    .map((p) => p.start_date)
    .filter(Boolean)
    .sort();
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const len = differenceInCalendarDays(
      parseISO(starts[i]),
      parseISO(starts[i - 1])
    );
    if (len > 0 && len <= OUTLIER_CYCLE_DAYS) lengths.push(len);
  }
  return lengths;
}

/** 생리 지속일 목록 (종료일이 있는 기록만) */
export function periodLengths(periods: Period[]): number[] {
  return periods
    .filter((p) => p.start_date && p.end_date)
    .map(
      (p) =>
        differenceInCalendarDays(parseISO(p.end_date!), parseISO(p.start_date)) +
        1
    )
    .filter((n) => n > 0 && n <= 14);
}

function computeConfidence(usedCycles: number, variability: number): Confidence {
  if (usedCycles < 2) return "low";
  // 주기 변동(표준편차)이 크면 신뢰도 하락
  if (usedCycles >= 4 && variability <= 4) return "high";
  if (variability <= 7) return "medium";
  return "low";
}

/**
 * 생리 기록으로부터 다음 주기들과 배란일/가임기를 예측한다.
 * 아내·남편 화면 모두 이 함수를 사용 (남편은 RLS로 받은 periods 사용).
 */
export function predict(
  periods: Period[],
  opts: { fallbackCycle?: number; fallbackPeriod?: number; cycles?: number } = {}
): Prediction {
  const fallbackCycle = opts.fallbackCycle ?? DEFAULT_CYCLE_LENGTH;
  const fallbackPeriod = opts.fallbackPeriod ?? DEFAULT_PERIOD_LENGTH;
  const cyclesToPredict = opts.cycles ?? 3;

  const sorted = [...periods]
    .filter((p) => p.start_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  const lastPeriodStart =
    sorted.length > 0 ? sorted[sorted.length - 1].start_date : null;

  const allCycleLengths = cycleLengths(sorted);
  const recent = allCycleLengths.slice(-RECENT_CYCLES);
  const usedCycleCount = recent.length;

  const avgCycleLength =
    recent.length > 0 ? Math.round(mean(recent)) : fallbackCycle;

  const pLengths = periodLengths(sorted).slice(-RECENT_CYCLES);
  const avgPeriodLength =
    pLengths.length > 0 ? Math.round(mean(pLengths)) : fallbackPeriod;

  const variability = stdev(recent);
  const confidence = computeConfidence(usedCycleCount, variability);

  const cyclesOut: PredictedCycle[] = [];
  if (lastPeriodStart) {
    let anchor = parseISO(lastPeriodStart);
    for (let i = 0; i < cyclesToPredict; i++) {
      const periodStart = addDays(anchor, avgCycleLength);
      const periodEnd = addDays(periodStart, Math.max(0, avgPeriodLength - 1));
      // 다음 생리 예정일에서 황체기만큼 역산한 날이 배란일
      const nextPeriodAfter = addDays(periodStart, avgCycleLength);
      const ovulationDate = addDays(nextPeriodAfter, -LUTEAL_PHASE_DAYS);
      const fertileStart = addDays(ovulationDate, -5);
      const fertileEnd = addDays(ovulationDate, 1);
      cyclesOut.push({
        periodStart: iso(periodStart),
        periodEnd: iso(periodEnd),
        ovulationDate: iso(ovulationDate),
        fertileStart: iso(fertileStart),
        fertileEnd: iso(fertileEnd),
      });
      anchor = periodStart;
    }
  }

  return {
    avgCycleLength,
    avgPeriodLength,
    lastPeriodStart,
    cycles: cyclesOut,
    confidence,
    usedCycleCount,
  };
}

/** 현재 진행 중인(또는 다가오는) 주기의 배란일/가임기를 계산한다. */
export function currentCycleFertility(
  periods: Period[],
  opts: { fallbackCycle?: number } = {}
): { ovulationDate: string; fertileStart: string; fertileEnd: string } | null {
  const fallbackCycle = opts.fallbackCycle ?? DEFAULT_CYCLE_LENGTH;
  const sorted = [...periods]
    .filter((p) => p.start_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (sorted.length === 0) return null;

  const recent = cycleLengths(sorted).slice(-RECENT_CYCLES);
  const avgCycle = recent.length > 0 ? Math.round(mean(recent)) : fallbackCycle;
  const lastStart = parseISO(sorted[sorted.length - 1].start_date);

  // 이번 주기의 다음 생리 예정일 - 황체기 = 배란일
  const nextPeriod = addDays(lastStart, avgCycle);
  const ovulationDate = addDays(nextPeriod, -LUTEAL_PHASE_DAYS);
  return {
    ovulationDate: iso(ovulationDate),
    fertileStart: iso(addDays(ovulationDate, -5)),
    fertileEnd: iso(addDays(ovulationDate, 1)),
  };
}
