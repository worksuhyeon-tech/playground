import BottomNav from "@/components/BottomNav";
import PartnerManager from "@/components/PartnerManager";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  getOwnedLinks,
  getPartneredLinks,
} from "@/lib/data";
import { predict } from "@/lib/predictions";
import { pregnancyProgress } from "@/lib/pregnancy";
import { krShortDate, krLongDate, ddayLabel } from "@/lib/dates";
import type { Period, Profile, Pregnancy } from "@/types";

export const dynamic = "force-dynamic";

// 파트너(남편) 시점: owner의 예측만 읽기 전용으로 표시
async function PartnerView({ ownerId }: { ownerId: string }) {
  const supabase = createClient();
  const [{ data: profile }, { data: periods }, { data: pregnancy }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", ownerId).maybeSingle(),
      supabase
        .from("periods")
        .select("*")
        .eq("user_id", ownerId)
        .order("start_date", { ascending: true }),
      supabase
        .from("pregnancies")
        .select("*")
        .eq("user_id", ownerId)
        .eq("status", "active")
        .maybeSingle(),
    ]);

  const p = profile as Profile | null;
  const name = p?.display_name ?? "파트너";

  if (p?.goal === "pregnant" && pregnancy) {
    const preg = pregnancy as Pregnancy;
    const prog = pregnancyProgress(preg.lmp_date);
    return (
      <div className="card bg-gradient-to-br from-brand-100 to-brand-50">
        <p className="text-sm font-semibold text-brand-700">
          💞 {name}님의 임신 정보
        </p>
        <p className="mt-1 text-3xl font-bold text-brand-700">{prog.label}</p>
        <p className="mt-2 text-sm text-brand-600">
          출산예정일 {krLongDate(preg.due_date)} (D-{Math.max(0, prog.daysUntilDue)})
        </p>
      </div>
    );
  }

  const prediction = predict((periods ?? []) as Period[], {
    fallbackCycle: p?.avg_cycle_length,
    fallbackPeriod: p?.avg_period_length,
    cycles: 2,
  });
  const next = prediction.cycles[0];

  if (!next) {
    return (
      <div className="card">
        <p className="text-sm text-gray-500">
          {name}님의 예측 데이터가 아직 부족해요.
        </p>
      </div>
    );
  }

  const ttc = p?.goal === "ttc";

  return (
    <div className="space-y-3">
      <p className="px-1 text-sm font-semibold text-gray-600">
        💞 {name}님의 예측
      </p>

      {ttc && (
        <div className="card bg-gradient-to-br from-fertile/10 to-brand-50">
          <span className="text-sm font-semibold text-emerald-700">
            🥚 배란 예상일
          </span>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            {krShortDate(next.ovulationDate)}{" "}
            <span className="text-sm font-normal text-emerald-600">
              ({ddayLabel(next.ovulationDate)})
            </span>
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            가임기 {krShortDate(next.fertileStart)} ~{" "}
            {krShortDate(next.fertileEnd)} 💚
          </p>
        </div>
      )}

      <div className="card">
        <span className="text-sm font-semibold text-brand-700">
          🩸 다음 생리 예정일
        </span>
        <p className="mt-1 text-2xl font-bold text-brand-700">
          {krShortDate(next.periodStart)}{" "}
          <span className="text-sm font-normal text-gray-400">
            ({ddayLabel(next.periodStart)})
          </span>
        </p>
        {!ttc && (
          <p className="mt-2 text-sm text-gray-500">
            🥚 배란 {krShortDate(next.ovulationDate)} · 가임기{" "}
            {krShortDate(next.fertileStart)}~{krShortDate(next.fertileEnd)}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function PartnerPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [ownedLinks, partneredLinks] = await Promise.all([
    getOwnedLinks(user.id),
    getPartneredLinks(user.id),
  ]);

  return (
    <main className="app-shell px-4 pt-6">
      <h1 className="mb-4 text-xl font-bold text-gray-800">💞 파트너</h1>

      {/* 내가 누군가의 파트너로 연결돼 있으면 그 사람 예측을 보여줌 */}
      {partneredLinks.length > 0 && (
        <div className="mb-5 space-y-5">
          {partneredLinks.map((l) => (
            <PartnerView key={l.id} ownerId={l.owner_id} />
          ))}
        </div>
      )}

      <PartnerManager ownedLinks={ownedLinks} />

      <BottomNav />
    </main>
  );
}
