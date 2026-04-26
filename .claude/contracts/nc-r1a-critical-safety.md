---
slug: nc-r1a-critical-safety
created: 2026-04-26
mode: 1
follows: [nc-r2-deprecated-token-removal]
round: 2
---

# Contract: NC-R1a Critical Safety — scrollIntoView · CAS Hook 통일 · 권한별 i18n

## Context

NC 코드 리뷰 Round-2 항목 #1(🔴), #2(🔴), #3(🔴) + B.4 대응.

**실행 전제**: `nc-r2-deprecated-token-removal` 머지 완료 후 실행.

1. **scrollIntoView 제거** — NCDetailClient L284-286에 `scrollIntoView({ behavior:'smooth', block:'nearest' })` 존재. sticky bottom ActionBar에 `block:'nearest'`는 no-op이 될 수 있어 "CTA를 눌렀는데 아무것도 안 됨" UX 버그. 프로젝트 규칙은 scrollIntoView 금지 — `getBoundingClientRect + window.scrollBy + --sticky-header-height` 패턴 사용.
2. **nc!.version / nc!.equipmentId non-null assertion 제거** — NCDetailClient의 4개 mutation(`updateMutation`, `saveMutation`, `closeMutation`, `rejectMutation`)에서 `nc!.version` 4건 + `nc!.equipmentId` 3건 = 7건의 non-null assertion 존재. TanStack Query의 `data`는 탭 전환·리페치 타이밍에 잠깐 undefined가 될 수 있음. 4개 mutation 모두 `useCasGuardedMutation`으로 교체 (NCEditDialog/NCRepairDialog에서 이미 사용 중인 패턴).
3. **권한별 i18n 가이던스 키** — `canCreateCalibration=false`(quality_manager)인 경우 CTA 버튼은 숨겨지지만 ctaHint 메시지는 "교정을 등록하세요"류가 그대로 노출. `openBlockedRecalibration_quality_manager`/`openBlockedRepair_quality_manager` 신규 가이던스 키 + en/ko 번역 추가.

**사전 검증**: useCasGuardedMutation 훅 — `apps/frontend/hooks/use-cas-guarded-mutation.ts` 존재. scrollIntoView 대체 패턴 — `apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts` 참조.

## Scope

- MOD: `apps/frontend/components/non-conformances/NCDetailClient.tsx`
  - `scrollToActionBar` → `getBoundingClientRect` + `window.scrollBy` + `--sticky-header-height` CSS 변수 사용
  - `updateMutation`, `saveMutation`, `closeMutation`, `rejectMutation` → `useCasGuardedMutation`으로 교체
  - `nc!.version` / `nc!.equipmentId` 제거 → CAS 훅이 내부적으로 fetchCasVersion 담당
  - `canCreateCalibration` props를 GuidanceCallout으로 전달 + ctaHint 분기
- MOD: `apps/frontend/components/non-conformances/GuidanceCallout.tsx`
  - `onCalibrationNav` 유무에 따라 i18n 가이던스 키를 role-aware 버전으로 분기 (props 추가 또는 guidance key resolver 확장)
- MOD: `apps/frontend/components/non-conformances/NCRepairDialog.tsx`
  - `handleNext` 내부 pre-flight version 체크 제거 (`nonConformancesApi.getNonConformance` 호출 + `latest.version !== nc.version` 비교)
  - 409 충돌 처리는 confirm 단계의 `useCasGuardedMutation`에만 위임 — double fetch 제거, 에러 경로 단일화
- MOD: `apps/frontend/messages/en.json`
  - `nonConformances.detail.guidance.openBlockedRecalibration_quality_manager.*` 신규 키
  - `nonConformances.detail.guidance.openBlockedRepair_quality_manager.*` 신규 키 (해당 시나리오 존재할 경우)
- MOD: `apps/frontend/messages/ko.json`
  - 동일 키 한국어 번역 추가

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | scrollIntoView 제거 | `! grep -n "scrollIntoView" apps/frontend/components/non-conformances/NCDetailClient.tsx` |
| M2 | sticky 보정 패턴 적용 | `grep -nE "getBoundingClientRect\|--sticky-header-height\|window\.scrollBy" apps/frontend/components/non-conformances/NCDetailClient.tsx` → ≥ 1 hit |
| M3 | 4 mutation → useCasGuardedMutation | `grep -c "useCasGuardedMutation(" apps/frontend/components/non-conformances/NCDetailClient.tsx` → 4 |
| M4 | useOptimisticMutation 제거 (NCDetailClient) | `! grep -n "useOptimisticMutation" apps/frontend/components/non-conformances/NCDetailClient.tsx` |
| M5 | nc!.version 제거 | `! grep -nE "nc!\\.version" apps/frontend/components/non-conformances/NCDetailClient.tsx` |
| M6 | nc!.equipmentId 제거 | `! grep -nE "nc!\\.equipmentId" apps/frontend/components/non-conformances/NCDetailClient.tsx` |
| M7 | quality_manager 가이던스 키 en.json | `grep -n "openBlockedRecalibration_quality_manager" apps/frontend/messages/en.json` → ≥ 1 |
| M8 | quality_manager 가이던스 키 ko.json | `grep -n "openBlockedRecalibration_quality_manager" apps/frontend/messages/ko.json` → ≥ 1 |
| M9 | NC_WORKFLOW_GUIDANCE_TOKENS에 quality_manager 전용 키 추가 | `grep -n "openBlockedRecalibration_quality_manager" apps/frontend/lib/design-tokens/components/non-conformance.ts` → ≥ 1 |
| M10 | NCRepairDialog handleNext pre-flight 제거 | `! grep -n "getNonConformance" apps/frontend/components/non-conformances/NCRepairDialog.tsx` |
| M11 | handleNext version 비교 제거 | `! grep -n "latest\.version" apps/frontend/components/non-conformances/NCRepairDialog.tsx` |
| M12 | tsc 통과 | `pnpm tsc --noEmit -p apps/frontend/tsconfig.json --skipLibCheck 2>&1 \| grep -v ".next/" \| grep -c "error"` → 0 |
| M13 | lint 통과 | `pnpm --filter frontend lint 2>&1 \| tail -3` → 0 errors |
| M14 | verify-cas PASS | `/verify-cas` 스킬 실행 — NCDetailClient CAS 패턴 PASS |
| M15 | verify-i18n PASS | `/verify-i18n` 스킬 실행 — 신규 키 en/ko parity PASS |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | `openBlockedRepair_quality_manager` i18n 키도 추가 (유사 시나리오 대비) |
| S2 | sticky-helpers.ts 패턴을 컴포넌트 레벨 유틸로 추출 (`lib/utils/scroll-utils.ts`) |
| S3 | CTA 버튼 없는 guidance 상태에서 manager용 contextual hint ("교정 담당자에게 요청") |

## Domain Rules

- useCasGuardedMutation의 `fetchCasVersion`은 `() => nonConformancesApi.getNonConformance(ncId).then(r => r.version)` 패턴 (NCEditDialog 참조)
- sticky 보정: `document.documentElement.style.getPropertyValue('--sticky-header-height')` + `parseFloat` + 12px 여유. 파싱 실패 시 0 fallback.
- i18n 신규 키는 기존 `openBlockedRecalibration_operator`의 텍스트 구조 그대로 복사 후 역할 맞게 수정 ("교정 담당자에게 요청하세요" 등)
- GuidanceCallout props 변경 시 모든 호출부(NCDetailClient, NCListRow 등) 업데이트 필수

## Non-Goals

- NCRepairDialog / NCEditDialog의 mutation 수정 (이미 useCasGuardedMutation 사용 중)
- quality_manager 권한 전체 검토 (권한 로직은 기존 `can(Permission.CREATE_CALIBRATION)` 유지)
- R1b 대상(CSV escape, 409 토스트, cast 유틸) 수정 — 다음 contract 분리
