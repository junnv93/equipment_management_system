---
slug: tech-debt-0427-cleanup
date: 2026-04-27
round: 1
verdict: PASS
---

# Evaluation Report — tech-debt-0427-cleanup

## MUST Criteria Results

| Criterion | Status | Evidence |
|-----------|--------|----------|
| M1 | PASS | 지정 4가지 하드코딩 경로 grep 결과: not-found.tsx 4건만 잔존 (계약 명시 예외). components/ + app/ 비not-found 파일 0건. 7개 대상 파일 전원 FRONTEND_ROUTES 교체 확인 |
| M2 | PASS | `grep -n "dark:text-brand-info" dashboard.ts` 출력 없음 (exit 0) |
| M3 | PASS | RejectModal.tsx:24에 `REJECTION_MIN_LENGTH` import, :174에 `t('rejectModal.minLengthHint', { min: REJECTION_MIN_LENGTH })` 렌더 코드 존재 |
| M4 | PASS | handleSubmit else 분기(bulk 경로) :114-115에서 `await props.onBulkConfirm(reason.trim())` 후 `props.onClose()` 호출. 성공 경로에서만 실행되며 catch 블록 진입 시 호출 안 됨 (정상) |
| M5 | PASS | ko: `guidance.urgency.normal = "일반"`, en: `guidance.urgency.normal = "Normal"` — 빈 문자열 없음. fsm.urgency.normal도 동일하게 채워짐 |
| M6 | PASS | `grep -rn "text-brand-info font-medium\|font-medium text-brand-info" apps/frontend/components/` 결과 없음 |
| M7 | PASS | DashboardRow4.tsx에 `useTranslations` 없음. `'use client'` 디렉티브 1행 유지 (dynamic import 등 클라이언트 훅 사용을 위해 정상) |
| M8 | PASS | `pnpm --filter frontend exec tsc --noEmit` 출력 없음 (exit 0). `pnpm --filter backend exec tsc --noEmit` 출력 없음 (exit 0) |
| M9 | PASS | `pnpm --filter backend run lint` exit 0 |
| M10 | PASS | ko: `rejectModal.minLengthHint = "{min}자 이상 입력하세요."`, en: `rejectModal.minLengthHint = "Please enter at least {min} characters."`. ko/en 양쪽 rejectModal 네임스페이스 하위에 정상 위치 확인. `guidance.urgency.normal` ko/en 값 존재 |
| M11 | PASS | 7개 대상 파일 전원 `import { ..., FRONTEND_ROUTES } from '@equipment-management/shared-constants'` 경유. 로컬 재정의 없음 |

## Issues Found

### FAIL items (loop-blocking)

없음.

### SHOULD items (non-blocking)

**S1 — CalibrationPlansContent.tsx 미처리 (비차단)**
- 파일: `apps/frontend/app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx`
- 상태: `:199`, `:399`에 `href="/calibration-plans/create"` 하드코딩 잔존
- 계약 명시: S1은 SHOULD 기준, 이번 범위 외로 허용됨

**S2 — equipment.ts dark:text-brand-info 미처리 (비차단)**
- 파일: `apps/frontend/lib/design-tokens/components/equipment.ts:92`
- 값: `textColor: 'text-ul-midnight dark:text-brand-info'`
- 계약 명시: S2는 SHOULD 기준, tracker 범위 외로 허용됨

**S3 — not-found.tsx 하드코딩 경로 (비차단)**
- `app/not-found.tsx`, `app/(dashboard)/equipment/[id]/not-found.tsx`, `app/(dashboard)/calibration-plans/[uuid]/not-found.tsx`, `app/(dashboard)/non-conformances/[id]/not-found.tsx`에 하드코딩 경로 잔존
- 계약에서 명시적 예외로 처리됨

### 추가 관찰

- **DashboardRow4.tsx `'use client'` 유지**: `dynamic` import 사용으로 필수 정상. M7 기준에서 `useTranslations`만 제거하면 되고, 클라이언트 디렉티브 자체는 제거 대상이 아님.
- **RejectModal M4 세부**: `props.onClose()`가 `finally` 블록이 아닌 `try` 내 성공 경로에만 위치. 오류 발생 시 모달이 열린 채 에러 메시지 표시 — 의도된 UX임.
- **rejectModal.minLengthHint i18n**: `reasonLabel`에도 이미 "(10자 이상 필수)" 하드코딩된 설명이 존재하나, minLengthHint는 REJECTION_MIN_LENGTH 상수 기반으로 동적 바인딩 — 이중 표시지만 계약 범위 외.
- **srOnly.recentActivity**: DashboardClient가 `t('srOnly.recentActivity')`를 전달하며, dashboard.json ko/en 양쪽에 키 존재 확인.

## Verdict

**PASS**

M1~M11 전 기준 통과. SSOT 경유 8곳 하드코딩 제거, dark:text-brand-info dashboard.ts 제거, RejectModal minLengthHint + bulk onClose 추가, urgency.normal i18n 채움, DashboardRow4 useTranslations 이관, tsc 0 errors, lint 0 errors 모두 충족. SHOULD 3항목(S1·S2·S3)은 계약 명시 비차단으로 다음 세션 이월 적절.
