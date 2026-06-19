import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// 서버 컴포넌트 / 서버 액션 / 라우트 핸들러용 Supabase 클라이언트
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(URL, KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출 시 무시 (미들웨어가 세션을 갱신함)
          }
        },
      },
    }
  );
}
