import { describe, expect, it } from "vitest";
import {
  cycleLengths,
  periodLengths,
  predict,
  currentCycleFertility,
  OUTLIER_CYCLE_DAYS,
} from "./predictions";
import type { Period } from "@/types";

function p(start: string, end: string | null = null): Period {
  return {
    id: start,
    user_id: "u",
    start_date: start,
    end_date: end,
    created_at: start,
  };
}

describe("cycleLengths", () => {
  it("연속 시작일 간격을 계산한다", () => {
    const periods = [p("2026-01-01"), p("2026-01-29"), p("2026-02-28")];
    expect(cycleLengths(periods)).toEqual([28, 30]);
  });

  it("45일 초과 이상치는 제외한다", () => {
    const periods = [
      p("2023-10-21"),
      p("2023-12-22"), // 62일 → 제외
      p("2024-01-20"), // 29일 → 포함
    ];
    const lengths = cycleLengths(periods);
    expect(lengths.every((l) => l <= OUTLIER_CYCLE_DAYS)).toBe(true);
    expect(lengths).toEqual([29]);
  });

  it("정렬되지 않은 입력도 처리한다", () => {
    const periods = [p("2026-02-28"), p("2026-01-01"), p("2026-01-29")];
    expect(cycleLengths(periods)).toEqual([28, 30]);
  });
});

describe("periodLengths", () => {
  it("종료일이 있는 기록만 지속일을 계산한다 (포함 계산)", () => {
    const periods = [p("2026-01-01", "2026-01-05"), p("2026-01-29", null)];
    expect(periodLengths(periods)).toEqual([5]);
  });
});

describe("predict", () => {
  it("데이터가 없으면 fallback과 low 신뢰도", () => {
    const result = predict([], { fallbackCycle: 30 });
    expect(result.lastPeriodStart).toBeNull();
    expect(result.cycles).toHaveLength(0);
    expect(result.confidence).toBe("low");
    expect(result.avgCycleLength).toBe(30);
  });

  it("규칙적인 주기는 평균과 다음 생리 예정일을 정확히 예측한다", () => {
    const periods = [
      p("2026-01-01", "2026-01-05"),
      p("2026-01-29", "2026-02-02"),
      p("2026-02-26", "2026-03-02"),
      p("2026-03-26", "2026-03-30"),
      p("2026-04-23", "2026-04-27"),
    ];
    const result = predict(periods, { cycles: 3 });
    expect(result.avgCycleLength).toBe(28);
    expect(result.avgPeriodLength).toBe(5);
    expect(result.lastPeriodStart).toBe("2026-04-23");
    // 다음 생리: 4-23 + 28 = 5-21
    expect(result.cycles[0].periodStart).toBe("2026-05-21");
    expect(result.cycles).toHaveLength(3);
    expect(result.confidence).toBe("high");
  });

  it("배란일은 다음 생리 예정일 - 14일", () => {
    const periods = [
      p("2026-01-01"),
      p("2026-01-29"),
      p("2026-02-26"),
    ];
    const result = predict(periods, { cycles: 1 });
    // 첫 예측 생리: 2-26 + 28 = 3-26, 그다음 생리 4-23, 배란 = 4-23 - 14 = 4-09
    expect(result.cycles[0].periodStart).toBe("2026-03-26");
    expect(result.cycles[0].ovulationDate).toBe("2026-04-09");
    // 가임기: 배란 -5 ~ +1
    expect(result.cycles[0].fertileStart).toBe("2026-04-04");
    expect(result.cycles[0].fertileEnd).toBe("2026-04-10");
  });

  it("이상치 주기는 평균에서 제외된다", () => {
    const periods = [
      p("2026-01-01"),
      p("2026-03-15"), // 73일 이상치 → 제외
      p("2026-04-14"), // 30일
      p("2026-05-14"), // 30일
    ];
    const result = predict(periods);
    expect(result.avgCycleLength).toBe(30);
  });
});

describe("currentCycleFertility", () => {
  it("최근 생리 기준 배란일/가임기를 계산한다", () => {
    const periods = [p("2026-05-01"), p("2026-05-29")]; // 28일 주기
    const f = currentCycleFertility(periods);
    // 다음 생리 = 5-29 + 28 = 6-26, 배란 = 6-26 - 14 = 6-12
    expect(f?.ovulationDate).toBe("2026-06-12");
    expect(f?.fertileStart).toBe("2026-06-07");
    expect(f?.fertileEnd).toBe("2026-06-13");
  });

  it("기록이 없으면 null", () => {
    expect(currentCycleFertility([])).toBeNull();
  });
});
