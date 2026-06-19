"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { importSeedPeriods } from "@/app/actions";
import { SEED_PERIODS } from "@/lib/seed-data";

export default function ImportPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleImport() {
    setBusy(true);
    setMsg(null);
    const res = await importSeedPeriods();
    if (res.error) setMsg(`오류: ${res.error}`);
    else {
      setMsg(`${res.count}개 주기를 가져왔어요! ✅`);
      router.refresh();
    }
    setBusy(false);
  }

  const first = SEED_PERIODS[0]?.start_date;
  const last = SEED_PERIODS[SEED_PERIODS.length - 1]?.start_date;

  return (
    <main className="app-shell px-4 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">📥 데이터 가져오기</h1>
        <Link href="/settings" className="text-sm text-gray-400">
          닫기
        </Link>
      </header>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700">
          기존 “내 캘린더” 기록
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          공유해 주신 PDF에서 추출한{" "}
          <strong className="text-brand-600">{SEED_PERIODS.length}개 주기</strong>(
          {first} ~ {last})를 가져옵니다. 이미 같은 시작일이 있으면 덮어쓰지 않고
          유지돼요.
        </p>
        <button
          onClick={handleImport}
          disabled={busy}
          className="btn-primary mt-4 w-full"
        >
          {busy ? "가져오는 중..." : "내 기록 가져오기"}
        </button>
        {msg && (
          <p className="mt-3 text-center text-sm text-brand-600">{msg}</p>
        )}
      </div>

      <p className="mt-4 px-1 text-center text-[11px] text-gray-400">
        가져온 뒤 홈/달력에서 예측이 실제 데이터로 갱신돼요.
      </p>

      <BottomNav />
    </main>
  );
}
