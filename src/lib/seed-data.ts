// 기존 "내 캘린더" PDF에서 추출한 생리 주기 기록 (2021-07 ~ 2026-06, 55개 주기).
// 연도 생략 항목은 PDF의 연도 표기 변경점을 기준으로 역산해 채웠다.
// 가장 최근(2026-06-19)은 진행 중이라 종료일을 null로 둔다.

export interface SeedPeriod {
  start_date: string;
  end_date: string | null;
}

// 오름차순(과거 → 최근)
export const SEED_PERIODS: SeedPeriod[] = [
  { start_date: "2021-07-06", end_date: "2021-08-02" },
  { start_date: "2021-08-03", end_date: "2021-09-04" },
  { start_date: "2021-09-05", end_date: "2021-10-03" },
  { start_date: "2021-10-04", end_date: "2021-10-31" },
  { start_date: "2021-11-01", end_date: "2021-12-01" },
  { start_date: "2021-12-02", end_date: "2022-01-06" },
  { start_date: "2022-01-07", end_date: "2022-02-06" },
  { start_date: "2022-02-07", end_date: "2022-03-13" },
  { start_date: "2022-03-14", end_date: "2022-04-18" },
  { start_date: "2022-04-19", end_date: "2022-05-17" },
  { start_date: "2022-05-18", end_date: "2022-06-22" },
  { start_date: "2022-06-23", end_date: "2022-07-22" },
  { start_date: "2022-07-23", end_date: "2022-08-19" },
  { start_date: "2022-08-20", end_date: "2022-09-15" },
  { start_date: "2022-09-16", end_date: "2022-10-17" },
  { start_date: "2022-10-18", end_date: "2022-12-17" }, // 61일 (누락 가능성)
  { start_date: "2022-12-18", end_date: "2023-01-17" },
  { start_date: "2023-01-18", end_date: "2023-02-19" },
  { start_date: "2023-02-20", end_date: "2023-04-20" }, // 60일 (누락 가능성)
  { start_date: "2023-04-21", end_date: "2023-05-19" },
  { start_date: "2023-05-20", end_date: "2023-06-19" },
  { start_date: "2023-06-20", end_date: "2023-07-18" },
  { start_date: "2023-07-19", end_date: "2023-08-19" },
  { start_date: "2023-08-20", end_date: "2023-09-19" },
  { start_date: "2023-09-20", end_date: "2023-10-20" },
  { start_date: "2023-10-21", end_date: "2023-12-22" }, // 63일 (누락 가능성)
  { start_date: "2023-12-23", end_date: "2024-02-22" }, // 62일 (누락 가능성)
  { start_date: "2024-02-23", end_date: "2024-03-26" },
  { start_date: "2024-03-27", end_date: "2024-04-23" },
  { start_date: "2024-04-24", end_date: "2024-05-24" },
  { start_date: "2024-05-25", end_date: "2024-06-24" },
  { start_date: "2024-06-25", end_date: "2024-07-26" },
  { start_date: "2024-07-27", end_date: "2024-08-25" },
  { start_date: "2024-08-26", end_date: "2024-09-22" },
  { start_date: "2024-09-23", end_date: "2024-10-26" },
  { start_date: "2024-10-27", end_date: "2024-11-29" },
  { start_date: "2024-11-30", end_date: "2025-01-02" },
  { start_date: "2025-01-03", end_date: "2025-02-06" },
  { start_date: "2025-02-07", end_date: "2025-03-08" },
  { start_date: "2025-03-09", end_date: "2025-04-11" },
  { start_date: "2025-04-12", end_date: "2025-05-11" },
  { start_date: "2025-05-12", end_date: "2025-06-11" },
  { start_date: "2025-06-12", end_date: "2025-07-15" },
  { start_date: "2025-07-16", end_date: "2025-08-16" },
  { start_date: "2025-08-17", end_date: "2025-09-15" },
  { start_date: "2025-09-16", end_date: "2025-10-14" },
  { start_date: "2025-10-15", end_date: "2025-11-15" },
  { start_date: "2025-11-16", end_date: "2025-12-15" },
  { start_date: "2025-12-16", end_date: "2026-01-17" },
  { start_date: "2026-01-18", end_date: "2026-02-16" },
  { start_date: "2026-02-17", end_date: "2026-03-17" },
  { start_date: "2026-03-18", end_date: "2026-04-18" },
  { start_date: "2026-04-19", end_date: "2026-05-21" },
  { start_date: "2026-05-22", end_date: "2026-06-18" },
  { start_date: "2026-06-19", end_date: null }, // 진행 중
];
