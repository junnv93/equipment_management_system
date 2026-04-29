# Contract: checkout-url-first-state

## Problem

`CreateCheckoutContent.tsx`의 상태 관리가 mount 1회에 묶인 lazy initializer + 2개 ref + 2개 effect 조합으로 구성되어, URL 변경에 무반응하고 cross-tab navigation 시나리오에서 깨지기 쉽다. 임시 fix(commit 00496041)는 placeholder 버그를 막았으나 근본적 SSOT 위반이 잔존.

## Solution

URL query parameter(`?equipmentId`, `?purpose`)를 SSOT로 승격. 컴포넌트는 URL → useMemo 파생값으로 동작. 사용자 입력은 `router.push`로 URL을 갱신해 단방향 데이터 흐름 보장.

## MUST Criteria (FAIL = 루프 재시작)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend run tsc --noEmit` PASS | 실행 결과 |
| M2 | `pnpm --filter frontend run build` PASS | 실행 결과 |
| M3 | `?equipmentId=X` URL 진입 시 해당 장비 자동 선택 (own/cross-team 모두) | 수동 시나리오 1·2 |
| M4 | URL 변경 시 UI 즉시 반응 — lazy init / ref 가드로 1회 잠금 방식 금지 | 코드 리뷰: `CreateCheckoutContent.tsx`에 `useState(() => searchParams.get(...))` 패턴 0건, `hasInitializedPurpose` ref 0건 |
| M5 | SSOT 준수: query param 키는 `CHECKOUT_QUERY_PARAMS.EQUIPMENT_ID` / `CHECKOUT_QUERY_PARAMS.PURPOSE` 경유 | `grep -rn "\"equipmentId\"\|\"purpose\"" apps/frontend/components/equipment apps/frontend/components/mobile apps/frontend/app/(dashboard)/checkouts apps/frontend/lib/utils/checkout-create-params.ts` — SSOT 상수 정의/임포트만 허용 |
| M6 | 하드코딩 query param 키 0개 — 모든 진입점이 `CREATE_FOR_EQUIPMENT()` 빌더 사용 | `grep -rn "CHECKOUTS\.CREATE.*?equipmentId=\|/checkouts/create\?equipmentId=" apps/frontend --include="*.tsx" --include="*.ts" \| grep -v "tests/"` → 0건 |
| M7 | `parseCheckoutCreateParams()` 가 zod로 `purpose` 화이트리스트 검증 (`UserSelectableCheckoutPurposeEnum.safeParse`) — 잘못된 값은 `null` 반환 | 코드 리뷰: 신규 파일 `lib/utils/checkout-create-params.ts` |
| M8 | 빌더 `CREATE_FOR_EQUIPMENT()` 옵션 미지정 시 기존 출력 형태 보존 (`?equipmentId=...` only) | E2E spec PASS: `pnpm --filter frontend run test:e2e -- wf-25-alert-to-checkout` |
| M9 | dirty 파일 8개 무수정 (CalibrationPlansContent / CalibrationListTable / CalibrationDdayList / next-env.d.ts / CableListContent / TestSoftwareListContent / CheckoutCard / list-page-skeleton) | `git diff --name-only` |
| M10 | Effect 2 (purpose 자동 채움) 삭제, useMemo로 대체 | 코드 리뷰: 기존 라인 147-161의 useEffect 삭제, 신규 useMemo 도입 |

## SHOULD Criteria (FAIL = tech-debt 기록, 루프 비차단)

| # | Criterion |
|---|-----------|
| S1 | `?purpose=X` URL 파라미터를 통한 사전 선택 지원 (cross-team이 아닌 장비에 대한 explicit purpose override) |
| S2 | 브라우저 뒤로가기 시 직전 purpose 복원 (router.push 히스토리 push) |
| S3 | URL 공유 시 동일한 초기 상태 재현 |
| S4 | cross-tab navigation 회귀: 장비 상세 A → 반출 신청 → 뒤로 → 장비 상세 B → 반출 신청 시 매번 올바른 장비 시드 |
| S5 | 사용자가 명시적으로 purpose 변경 시 lender(site/team) 자동 시드는 1회만 — 사용자 변경 후 덮어쓰기 X |
| S6 | 신규 단위 테스트: `parseCheckoutCreateParams()` 의 7개 케이스 검증 |

## Test Plan

### Unit
- `apps/frontend/lib/utils/__tests__/checkout-create-params.test.ts` — Phase 2 신규

### E2E
- `tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts` — 회귀 (URL 형태 호환)

### Manual (Phase 5)
- own-team / cross-team / explicit purpose / invalid purpose / 변경 / 뒤로가기 / 새로고침 7 시나리오

### Verify Skills
- `verify-ssot`, `verify-hardcoding`, `verify-frontend-state`

## Slug

`checkout-url-first-state`
