# 달거리 — 생리주기 트래커 PWA 🌸

생리 주기를 기록하고 **배란일·생리예정일을 예측**하는 모바일 웹앱(PWA)입니다.
아이폰·갤럭시 어디서든 “홈 화면에 추가”하면 앱처럼 사용할 수 있고, 파트너와 예측을
읽기 전용으로 공유할 수 있습니다.

## 주요 기능
- 🌙🌱🤰 **세 가지 목표 모드** — 생리 추적 / 임신 준비 / 임신 중. 모드에 따라 대시보드와 알림이 바뀝니다.
- 📊 **주기 예측** — 최근 주기 평균(이상치 자동 제외)으로 다음 생리·배란일·가임기를 예측.
- ✏️ **기록** — 생리 양, 성생활(피임 여부), 몸상태 태그(가임 신호 강조), 기분, 메모.
- 📅 **달력** — 생리일/예측 생리일/배란일/가임기 색상 구분.
- 💞 **파트너 공유** — 초대 코드로 연결. 파트너는 배란일·생리예정일만 보고, 증상·메모는 비공개.
- 🔔 **푸시 알림** — 생리 임박/배란/가임기/기록 리마인더. 파트너에게도 가임기 알림.
- 🤰 **임신 모드** — 마지막 생리일(LMP) 기준 출산예정일(EDD)·임신 주수·주차 안내.
- 📥 **가져오기** — 기존 “내 캘린더” 기록(2021~2026, 55개 주기)을 한 번에 시드.

## 기술 스택
- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Supabase (Postgres + Auth + RLS)
- `@ducanh2912/next-pwa` (서비스워커/오프라인/푸시)
- Web Push (VAPID) + Supabase Edge Function 스케줄 알림
- Vitest (예측 로직 단위 테스트)

## 로컬 실행
```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 참고)
npm run dev                  # http://localhost:3000
npm test                     # 예측 로직 테스트
npm run build                # 프로덕션 빌드
```

### 환경변수 (`.env.local`)
| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push 공개키 (`npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | Web Push 비밀키 (Edge Function 시크릿) |
| `VAPID_SUBJECT` | `mailto:you@example.com` |
| `CRON_SECRET` | 알림 함수 cron 호출 보호용 |

## 백엔드 설정 (Supabase)
1. 마이그레이션 적용: `supabase/migrations/0001_init.sql` (테이블 + RLS + 회원가입 트리거).
2. 알림 함수 배포: `supabase functions deploy send-reminders` 후 매일 1회 cron 호출 설정.
3. 함수 시크릿에 `VAPID_*`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` 등록.

## 기존 데이터 가져오기
- 앱 로그인 후 **설정 → 기존 데이터 가져오기**에서 버튼 한 번으로 가져오거나,
- CLI: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TARGET_USER_ID=... npm run import-pdf`

원본 데이터는 `src/lib/seed-data.ts`에 있습니다.

## 배포 (Vercel)
1. 이 저장소를 Vercel에 연결.
2. 위 환경변수 등록 후 배포.
3. 아이폰: Safari에서 공유 → “홈 화면에 추가”. 갤럭시: Chrome에서 “앱 설치”.
   설치 후 설정에서 **알림 켜기**.

## 예측 로직
`src/lib/predictions.ts` — 연속 생리 시작일 간격의 평균(최근 6주기, 45일 초과 이상치 제외)으로
주기를 추정하고, **배란일 = 다음 생리 예정일 − 14일**, 가임기 = 배란일 −5 ~ +1일로 계산합니다.

> ⚠️ 본 예측은 통계 기반 참고용이며 의학적 조언이 아닙니다.
