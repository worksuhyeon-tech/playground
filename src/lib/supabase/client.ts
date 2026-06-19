import { createBrowserClient } from "@supabase/ssr";

// 빌드/프리렌더 시 env가 비어 있어도 throw하지 않도록 placeholder fallback.
// 운영 환경에서는 실제 값(NEXT_PUBLIC_*)이 주입된다.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트
export function createClient() {
  return createBrowserClient(URL, KEY);
}
