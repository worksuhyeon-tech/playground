"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        // 이메일 확인이 꺼져 있으면 즉시 세션 생성됨
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace("/");
        } else {
          setMsg("가입 완료! 이메일 확인 후 로그인해 주세요.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace("/");
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell flex flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mb-2 text-5xl">🌸</div>
        <h1 className="text-2xl font-bold text-brand-700">달거리</h1>
        <p className="mt-1 text-sm text-gray-500">
          생리 주기 기록 · 배란일/생리예정일 예측
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="표시 이름 (예: 수현)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-400"
          />
        )}
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-400"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-400"
        />

        {msg && <p className="text-sm text-brand-600">{msg}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading
            ? "처리 중..."
            : mode === "signin"
              ? "로그인"
              : "회원가입"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMsg(null);
        }}
        className="mt-4 text-center text-sm text-gray-500 underline"
      >
        {mode === "signin"
          ? "계정이 없으신가요? 회원가입"
          : "이미 계정이 있으신가요? 로그인"}
      </button>
    </main>
  );
}
