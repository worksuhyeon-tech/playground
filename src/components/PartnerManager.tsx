"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvite, acceptInvite, removeLink } from "@/app/actions";
import type { PartnerLink } from "@/types";

export default function PartnerManager({
  ownedLinks,
}: {
  ownedLinks: PartnerLink[];
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    setMsg(null);
    const res = await createInvite();
    if (res.error) setMsg(`오류: ${res.error}`);
    else setNewCode(res.invite_code ?? null);
    setBusy(false);
    router.refresh();
  }

  async function handleAccept() {
    setBusy(true);
    setMsg(null);
    const res = await acceptInvite(code);
    setMsg(res.error ? `오류: ${res.error}` : "연결됐어요! 💞");
    if (!res.error) setCode("");
    setBusy(false);
    router.refresh();
  }

  async function handleRemove(id: string) {
    await removeLink(id);
    router.refresh();
  }

  const accepted = ownedLinks.filter((l) => l.status === "accepted");
  const pending = ownedLinks.filter((l) => l.status === "pending");

  return (
    <div className="space-y-3">
      {/* 내가 공유하기 (아내) */}
      <section className="card">
        <h2 className="text-sm font-semibold text-gray-700">
          내 예측을 파트너와 공유
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          초대 코드를 만들어 파트너에게 알려주세요. 파트너는 배란일·생리예정일만
          볼 수 있고, 증상·메모는 공개되지 않아요.
        </p>
        <button
          onClick={handleCreate}
          disabled={busy}
          className="btn-primary mt-3 w-full"
        >
          초대 코드 만들기
        </button>

        {newCode && (
          <div className="mt-3 rounded-xl bg-brand-50 p-3 text-center">
            <p className="text-xs text-gray-500">파트너에게 알려줄 코드</p>
            <p className="text-2xl font-bold tracking-widest text-brand-700">
              {newCode}
            </p>
          </div>
        )}

        {pending.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {pending.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
              >
                <span className="tracking-widest text-gray-600">
                  {l.invite_code}{" "}
                  <span className="text-xs text-gray-400">(대기 중)</span>
                </span>
                <button
                  onClick={() => handleRemove(l.id)}
                  className="text-xs text-gray-400 underline"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        {accepted.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {accepted.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2"
              >
                <span className="text-emerald-700">💞 연결된 파트너</span>
                <button
                  onClick={() => handleRemove(l.id)}
                  className="text-xs text-gray-400 underline"
                >
                  연결 해제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 코드로 연결하기 (남편) */}
      <section className="card">
        <h2 className="text-sm font-semibold text-gray-700">
          파트너 코드로 연결
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          파트너에게 받은 코드를 입력하면 예측을 함께 볼 수 있어요.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="초대 코드 6자리"
            maxLength={6}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-brand-400"
          />
          <button
            onClick={handleAccept}
            disabled={busy || code.length < 6}
            className="btn-primary"
          >
            연결
          </button>
        </div>
      </section>

      {msg && <p className="text-center text-sm text-brand-600">{msg}</p>}
    </div>
  );
}
