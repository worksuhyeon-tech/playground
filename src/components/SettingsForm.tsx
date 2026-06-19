"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  setGoal,
  updateProfile,
  updateNotificationPrefs,
  startPregnancy,
  endPregnancy,
  signOut,
} from "@/app/actions";
import { todayIso } from "@/lib/dates";
import type { Goal, NotificationPrefs, Pregnancy, Profile } from "@/types";

const GOALS: { value: Goal; label: string; desc: string }[] = [
  { value: "tracking", label: "🌙 생리 추적", desc: "생리 예정일·PMS 중심" },
  { value: "ttc", label: "🌱 임신 준비", desc: "배란일·가임기 강조" },
  { value: "pregnant", label: "🤰 임신 중", desc: "출산예정일·주수 안내" },
];

export default function SettingsForm({
  profile,
  prefs,
  pregnancy,
}: {
  profile: Profile;
  prefs: NotificationPrefs;
  pregnancy: Pregnancy | null;
}) {
  const router = useRouter();
  const [goal, setGoalState] = useState<Goal>(profile.goal);
  const [name, setName] = useState(profile.display_name ?? "");
  const [cycle, setCycle] = useState(profile.avg_cycle_length);
  const [period, setPeriod] = useState(profile.avg_period_length);
  const [lmp, setLmp] = useState(pregnancy?.lmp_date ?? todayIso());
  const [p, setP] = useState(prefs);
  const [msg, setMsg] = useState<string | null>(null);

  async function changeGoal(g: Goal) {
    setGoalState(g);
    if (g === "pregnant" && !pregnancy) return; // 아래 임신 시작 섹션에서 처리
    await setGoal(g);
    router.refresh();
  }

  async function saveProfile() {
    setMsg(null);
    const res = await updateProfile({
      display_name: name,
      avg_cycle_length: Number(cycle),
      avg_period_length: Number(period),
    });
    setMsg(res.error ? `오류: ${res.error}` : "저장됐어요 ✅");
  }

  async function togglePref(key: keyof NotificationPrefs, value: boolean) {
    setP({ ...p, [key]: value });
    await updateNotificationPrefs({ [key]: value });
  }

  async function beginPregnancy() {
    const res = await startPregnancy(lmp);
    setMsg(res.error ? `오류: ${res.error}` : "임신 모드로 전환했어요 🤰");
    if (!res.error) router.refresh();
  }

  async function finishPregnancy() {
    if (!pregnancy) return;
    await endPregnancy(pregnancy.id);
    await setGoal("tracking");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* 목표(모드) */}
      <section className="card">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">현재 목표</h2>
        <div className="space-y-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              onClick={() => changeGoal(g.value)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                goal === g.value
                  ? "border-brand-400 bg-brand-50"
                  : "border-gray-200"
              }`}
            >
              <span>
                <span className="block text-sm font-semibold text-gray-700">
                  {g.label}
                </span>
                <span className="text-xs text-gray-400">{g.desc}</span>
              </span>
              {goal === g.value && <span className="text-brand-500">✓</span>}
            </button>
          ))}
        </div>

        {/* 임신 중 모드 선택 시: 마지막 생리 시작일 입력 → 임신 시작 */}
        {goal === "pregnant" && !pregnancy && (
          <div className="mt-3 rounded-xl bg-brand-50 p-3">
            <label className="text-xs text-gray-500">
              마지막 생리 시작일 (출산예정일 계산용)
            </label>
            <input
              type="date"
              value={lmp}
              max={todayIso()}
              onChange={(e) => setLmp(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button onClick={beginPregnancy} className="btn-primary mt-2 w-full">
              임신 모드 시작
            </button>
          </div>
        )}
        {goal === "pregnant" && pregnancy && (
          <button
            onClick={finishPregnancy}
            className="mt-3 w-full text-center text-xs text-gray-400 underline"
          >
            임신 모드 종료
          </button>
        )}
      </section>

      {/* 프로필 */}
      <section className="card">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">프로필</h2>
        <label className="text-xs text-gray-500">표시 이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-2 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500">평균 주기(일)</label>
            <input
              type="number"
              value={cycle}
              min={20}
              max={60}
              onChange={(e) => setCycle(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">평균 생리(일)</label>
            <input
              type="number"
              value={period}
              min={1}
              max={14}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button onClick={saveProfile} className="btn-ghost mt-3 w-full">
          프로필 저장
        </button>
      </section>

      {/* 알림 설정 */}
      <section className="card">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">알림</h2>
        <Toggle
          label="생리 예정일 임박 알림"
          checked={p.period_reminder}
          onChange={(v) => togglePref("period_reminder", v)}
        />
        <Toggle
          label="배란일 알림"
          checked={p.ovulation_reminder}
          onChange={(v) => togglePref("ovulation_reminder", v)}
        />
        <Toggle
          label="가임기 시작 알림"
          checked={p.fertile_window_reminder}
          onChange={(v) => togglePref("fertile_window_reminder", v)}
        />
        <Toggle
          label="매일 기록 리마인더"
          checked={p.log_reminder}
          onChange={(v) => togglePref("log_reminder", v)}
        />
        <Toggle
          label="파트너에게 배란/가임기 알림 보내기"
          checked={p.partner_fertile_alert}
          onChange={(v) => togglePref("partner_fertile_alert", v)}
        />
      </section>

      {msg && <p className="text-center text-sm text-brand-600">{msg}</p>}

      <form action={signOut}>
        <button type="submit" className="btn-ghost w-full text-gray-500">
          로그아웃
        </button>
      </form>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-brand-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
