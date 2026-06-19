import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

// 임신 기간(Naegele 규칙): 마지막 생리 시작일(LMP) + 280일 = 출산예정일(EDD)
export const GESTATION_DAYS = 280;

/** LMP로부터 출산예정일(EDD) 계산 */
export function dueDateFromLmp(lmpDate: string): string {
  return format(addDays(parseISO(lmpDate), GESTATION_DAYS), "yyyy-MM-dd");
}

export interface PregnancyProgress {
  /** 임신 경과일 (LMP 기준) */
  days: number;
  /** 임신 주수 */
  weeks: number;
  /** 주차 내 일수 (0-6) */
  daysIntoWeek: number;
  /** "N주 M일" 라벨 */
  label: string;
  /** 출산예정일까지 남은 일수 */
  daysUntilDue: number;
  /** 삼분기 (1/2/3) */
  trimester: 1 | 2 | 3;
}

/** 오늘(또는 기준일) 기준 임신 진행 상황 */
export function pregnancyProgress(
  lmpDate: string,
  today: Date = new Date()
): PregnancyProgress {
  const lmp = parseISO(lmpDate);
  const days = Math.max(0, differenceInCalendarDays(today, lmp));
  const weeks = Math.floor(days / 7);
  const daysIntoWeek = days % 7;
  const due = addDays(lmp, GESTATION_DAYS);
  const daysUntilDue = differenceInCalendarDays(due, today);
  const trimester: 1 | 2 | 3 = weeks < 13 ? 1 : weeks < 28 ? 2 : 3;
  return {
    days,
    weeks,
    daysIntoWeek,
    label: `${weeks}주 ${daysIntoWeek}일`,
    daysUntilDue,
    trimester,
  };
}

// 주차별 간단 안내 (주요 마일스톤 중심)
const WEEK_NOTES: Record<number, string> = {
  4: "착상이 진행되는 시기예요. 임신 테스트로 확인할 수 있어요.",
  6: "아기의 심장이 뛰기 시작해요. 첫 산전 진료를 예약해보세요.",
  8: "주요 장기가 형성되는 중요한 시기예요.",
  12: "1분기가 끝나갑니다. 입덧이 점차 가라앉을 수 있어요.",
  16: "성별 확인이 가능해지는 시기에 가까워져요.",
  20: "정밀 초음파(중기 정밀검사) 시기예요.",
  24: "아기가 소리에 반응하기 시작해요.",
  28: "3분기 시작! 산전 진료 간격이 짧아져요.",
  32: "아기의 움직임을 더 자주 느낄 수 있어요.",
  36: "막달이 가까워졌어요. 출산 준비물을 점검하세요.",
  40: "출산예정일이에요. 곧 만나게 될 거예요!",
};

export function weekNote(weeks: number): string | null {
  // 해당 주차 이하의 가장 가까운 안내를 반환
  for (let w = weeks; w >= 4; w--) {
    if (WEEK_NOTES[w]) return WEEK_NOTES[w];
  }
  return null;
}
