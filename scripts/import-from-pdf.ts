/**
 * 기존 PDF에서 추출한 생리 기록을 Supabase에 시드하는 CLI.
 *
 * 사용법:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TARGET_USER_ID=... \
 *     npm run import-pdf
 *
 * (앱 로그인 후 /import 화면에서도 동일하게 가져올 수 있습니다.)
 */
import { createClient } from "@supabase/supabase-js";
import { SEED_PERIODS } from "../src/lib/seed-data";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.TARGET_USER_ID;

if (!url || !key || !userId) {
  console.error(
    "환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TARGET_USER_ID 가 필요합니다."
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

async function main() {
  const rows = SEED_PERIODS.map((p) => ({
    user_id: userId,
    start_date: p.start_date,
    end_date: p.end_date,
  }));
  const { error } = await supabase
    .from("periods")
    .upsert(rows, { onConflict: "user_id,start_date" });
  if (error) {
    console.error("가져오기 실패:", error.message);
    process.exit(1);
  }
  console.log(`✅ ${rows.length}개 주기를 가져왔습니다.`);
}

main();
