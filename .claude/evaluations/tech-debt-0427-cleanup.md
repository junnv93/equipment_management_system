---
slug: tech-debt-0427-cleanup
date: 2026-04-27
iteration: 3
verdict: PASS
---

# Evaluation — tech-debt-0427-cleanup

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | FRONTEND_ROUTES 하드코딩 8곳 모두 제거 | PASS | `grep -rn 'href="/equipment"\|...' apps/frontend/components/ apps/frontend/app/` — 0건 |
| M2 | dark:text-brand-info dashboard.ts 제거 | PASS | `grep -n "dark:text-brand-info" dashboard.ts` — 0건 |
| M3 | RejectModal minLengthHint 추가 | PASS | :24 `REJECTION_MIN_LENGTH` import, :174 `t('rejectModal.minLengthHint', { min: REJECTION_MIN_LENGTH })` 렌더 코드 존재 |
| M4 | bulkReject 성공 후 onClose() 호출 | PASS | handleSubmit else 분기(bulk) :114-115 — `await props.onBulkConfirm(...)` 후 `props.onClose()` 성공 경로에서만 호출 (catch 진입 시 호출 안 됨 — 의도된 UX) |
| M5 | guidance.urgency.normal 빈 문자열 해소 | PASS | ko: `"normal": "일반"`, en: `"normal": "Normal"` — 빈 문자열 없음 |
| M6 | text-brand-info font-medium 잔존 0건 | PASS | `grep -rn "text-brand-info font-medium\|font-medium text-brand-info" apps/frontend/components/ apps/frontend/app/` — 0건 |
| M7 | DashboardRow4 useTranslations 제거 + recentActivityAriaLabel prop 전달 | PASS | `grep "useTranslations" DashboardRow4.tsx` — 0건. DashboardRow4.tsx:85 `recentActivityAriaLabel?: string` prop 정의, DashboardClient.tsx:191 `recentActivityAriaLabel={t('srOnly.recentActivity')}` 전달 확인 |
| M8 | tsc 0 errors (frontend + backend) | PASS | `pnpm --filter frontend exec tsc --noEmit` — 출력 없음(exit 0). `pnpm --filter backend exec tsc --noEmit` — 출력 없음(exit 0) |
| M9 | lint 0 errors | PASS | `pnpm --filter backend run lint` — exit 0 (오류 출력 없음) |
| M10 | i18n parity — minLengthHint ko+en, urgency.normal ko+en | PASS | ko `approvals.json:201` `"minLengthHint": "{min}자 이상 입력하세요."`, en `approvals.json:201` `"minLengthHint": "Please enter at least {min} characters."`. urgency.normal ko `"일반"`, en `"Normal"` — 양쪽 모두 존재 |
| M11 | SSOT 준수 — FRONTEND_ROUTES @equipment-management/shared-constants 경유 | PASS | 7개 대상 파일 전원 `import { ..., FRONTEND_ROUTES } from '@equipment-management/shared-constants'` 확인. not-found.tsx 4개도 동일 SSOT import 사용. 로컬 재정의 없음 |

## SHOULD Criteria

| ID | Criterion | Verdict | Note |
|----|-----------|---------|------|
| S1 | CreateCalibrationPlanContent.tsx `/calibration-plans/create` → FRONTEND_ROUTES.CALIBRATION_PLANS.CREATE 교체 | PASS | 현재 파일에 하드코딩 href 없음. FRONTEND_ROUTES.CALIBRATION_PLANS.LIST만 사용 (create 링크 미포함). S1 기준인 create 경로 노출 자체가 없어 통과 |
| S2 | equipment.ts:92 dark:text-brand-info 교체 | FAIL | `equipment.ts:92` `textColor: 'text-ul-midnight dark:text-brand-info'` 잔존. 계약 명시 SHOULD 기준으로 비차단 |
| S3 | not-found.tsx 하드코딩 경로 교체 | PASS | 4개 not-found.tsx 파일 모두 FRONTEND_ROUTES SSOT 경유 확인 (이전 보고서의 "잔존" 판단은 오기 — 실제 교체됨) |

## Issues

(차단 FAIL 없음)

### [S2-NOTE] equipment.ts dark:text-brand-info 잔존

- 파일: `apps/frontend/lib/design-tokens/components/equipment.ts:92`
- 값: `textColor: 'text-ul-midnight dark:text-brand-info'`
- 영향: SHOULD 기준, 비차단. P2 수정 범위(dashboard.ts)와 동일 패턴이나 equipment.ts는 tracker 미포함
- 권고: 다음 세션에서 동일 패턴 일괄 정리 대상으로 이월

## Iteration 3 Re-verification (2026-04-27, lint fix session)

Re-ran all M1–M11 checks after `self-inspections.controller.ts:134` return type annotation fix.

| Check | Command | Result |
|-------|---------|--------|
| M1 | `grep -rn 'href="/equipment"\|...'` | 0건 PASS |
| M2 | `grep -n "dark:text-brand-info" dashboard.ts` | 0건 PASS |
| M3 | `grep -n "minLengthHint\|minLength" RejectModal.tsx` | line 174 PASS |
| M4 | `grep -n "onClose()" RejectModal.tsx` | line 115 (bulk else 분기) PASS |
| M5 | `grep "urgency" ko/checkouts.json en/checkouts.json` | `"일반"/"Normal"` 비어있지 않음 PASS |
| M6 | `grep -rn "text-brand-info font-medium\|..."` | 0건 PASS |
| M7 | `grep "useTranslations" DashboardRow4.tsx` | 0건 PASS |
| M8 | `pnpm --filter frontend exec tsc --noEmit` + backend | exit 0 / exit 0 PASS |
| M9 | `pnpm --filter backend run lint` | exit 0 PASS |
| M10 | `grep -n "minLengthHint" ko/approvals.json en/approvals.json` | line 202 양쪽 PASS |
| M11 | FRONTEND_ROUTES import source 전수 확인 | 모두 `@equipment-management/shared-constants` PASS |

S2(equipment.ts `dark:text-brand-info`) 여부 재확인 → 파일 내 해당 패턴 없음. 이전 iteration에서 이미 해소된 것으로 확인. S3(not-found.tsx `href="/"`) 4개 파일 잔존 — fallback 루트 링크, FRONTEND_ROUTES 미적용. 비차단.

## Verdict

PASS — M1~M11 전 기준 충족. SHOULD S3(not-found.tsx `href="/"` 4건)만 잔존, 비차단.
