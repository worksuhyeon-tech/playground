"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";
import {
  saveDailyLog,
  upsertPeriod,
  setLatestPeriodEnd,
} from "@/app/actions";
import {
  FLOW_OPTIONS,
  INTERCOURSE_OPTIONS,
  SYMPTOM_TAGS,
  MOOD_OPTIONS,
  isFertilitySign,
} from "@/lib/symptoms";
import { krLongDate, todayIso } from "@/lib/dates";
import type { Flow, Intercourse } from "@/types";

export default function LogPage() {
  const supabase = createClient();
  const [date, setDate] = useState(todayIso());
  const [flow, setFlow] = useState<Flow>("none");
  const [intercourse, setIntercourse] = useState<Intercourse>("none");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 선택한 날짜의 기존 기록 불러오기
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("log_date", date)
        .maybeSingle();
      if (!active) return;
      setFlow((data?.flow as Flow) ?? "none");
      setIntercourse((data?.intercourse as Intercourse) ?? "none");
      setSymptoms(data?.symptoms ?? []);
      setMood(data?.mood ?? "");
      setNote(data?.note ?? "");
    })();
    return () => {
      active = false;
    };
  }, [date, supabase]);

  function toggleSymptom(tag: string) {
    setSymptoms((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    const res = await saveDailyLog({
      log_date: date,
      flow,
      intercourse,
      symptoms,
      mood: mood || null,
      note: note || null,
    });
    setStatus(res.error ? `오류: ${res.error}` : "저장됐어요 ✅");
    setSaving(false);
  }

  async function markStart() {
    const res = await upsertPeriod({ start_date: date });
    setStatus(res.error ? `오류: ${res.error}` : "생리 시작일로 기록했어요 🩸");
  }

  async function markEnd() {
    const res = await setLatestPeriodEnd(date);
    setStatus(res.error ? `오류: ${res.error}` : "생리 종료일로 기록했어요");
  }

  return (
    <main className="app-shell px-4 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">✏️ 기록</h1>
        <Link href="/" className="text-sm text-gray-400">
          닫기
        </Link>
      </header>

      {/* 날짜 */}
      <div className="card">
        <label className="text-sm font-semibold text-gray-600">날짜</label>
        <input
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">{krLongDate(date)}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={markStart} className="btn-ghost flex-1">
            🩸 생리 시작
          </button>
          <button onClick={markEnd} className="btn-ghost flex-1">
            생리 종료
          </button>
        </div>
      </div>

      {/* 생리 양 */}
      <section className="card mt-3">
        <h2 className="mb-2 text-sm font-semibold text-gray-600">생리 양</h2>
        <div className="flex flex-wrap gap-2">
          {FLOW_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setFlow(o.value)}
              className={`chip ${
                flow === o.value
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* 성생활 */}
      <section className="card mt-3">
        <h2 className="mb-2 text-sm font-semibold text-gray-600">성생활</h2>
        <div className="flex flex-wrap gap-2">
          {INTERCOURSE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setIntercourse(o.value)}
              className={`chip ${
                intercourse === o.value
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* 몸상태 */}
      <section className="card mt-3">
        <h2 className="mb-2 text-sm font-semibold text-gray-600">
          몸상태{" "}
          <span className="text-xs font-normal text-emerald-600">
            (💚 표시는 가임 신호)
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_TAGS.map((tag) => {
            const on = symptoms.includes(tag);
            const fertile = isFertilitySign(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleSymptom(tag)}
                className={`chip ${
                  on
                    ? fertile
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {fertile ? "💚 " : ""}
                {tag}
              </button>
            );
          })}
        </div>
      </section>

      {/* 기분 */}
      <section className="card mt-3">
        <h2 className="mb-2 text-sm font-semibold text-gray-600">기분</h2>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? "" : m)}
              className={`chip ${
                mood === m
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* 메모 */}
      <section className="card mt-3">
        <h2 className="mb-2 text-sm font-semibold text-gray-600">메모</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="자유롭게 메모하세요"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
      </section>

      {status && (
        <p className="mt-3 text-center text-sm text-brand-600">{status}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary mt-3 w-full"
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>

      <BottomNav />
    </main>
  );
}
