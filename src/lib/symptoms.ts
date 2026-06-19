import type { Flow, Intercourse } from "@/types";

// 기존 "내 캘린더" PDF의 항목과 동일하게 맞춰, 기록 연속성을 유지한다.

export const FLOW_OPTIONS: { value: Flow; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "light", label: "가벼움" },
  { value: "medium", label: "중간" },
  { value: "heavy", label: "많음" },
  { value: "very_heavy", label: "매우 심함" },
];

export const INTERCOURSE_OPTIONS: { value: Intercourse; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "protected", label: "피임함" },
  { value: "unprotected", label: "피임 안 함" },
];

// 가임 신호(임신 준비 모드에서 강조)
export const FERTILITY_SIGNS = ["흰자 같음", "배란 통증"] as const;

// 몸상태 태그 — PDF에서 등장한 항목 전체
export const SYMPTOM_TAGS: string[] = [
  "흰자 같음", // 배란기 점액 (가임 신호)
  "배란 통증", // (가임 신호)
  "옅은 피",
  "설사",
  "요통",
  "골반통",
  "가스 많음",
  "소화불량",
  "더부룩함",
  "배고픔",
  "식탐",
  "유방의 민감도",
  "유방이 결림",
  "체중증가",
];

export const MOOD_OPTIONS = ["좋음", "보통", "예민함", "우울함", "불안함", "피곤함"];

export function isFertilitySign(tag: string): boolean {
  return (FERTILITY_SIGNS as readonly string[]).includes(tag);
}

export function flowLabel(flow: Flow): string {
  return FLOW_OPTIONS.find((o) => o.value === flow)?.label ?? "없음";
}

export function intercourseLabel(value: Intercourse): string {
  return INTERCOURSE_OPTIONS.find((o) => o.value === value)?.label ?? "없음";
}
