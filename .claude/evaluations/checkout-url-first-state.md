# Evaluation Report: checkout-url-first-state

## Iteration: 1
## Date: 2026-04-29

## Build Verification

| Check | Result |
|-------|--------|
| tsc --noEmit (frontend) | PASS |
| shared-constants build | PASS |

---

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | tsc PASS | PASS | `pnpm tsc --noEmit` → exit 0, no errors |
| M2 | build PASS (skipped — dev only) | SKIP | N/A |
| M3 | `?equipmentId=X` URL 진입 시 해당 장비 자동 선택 | PASS | `CreateCheckoutContent.tsx:112-131` — preselectedEquipmentId → useQuery → Effect 1 → setSelectedEquipments. own/cross-team 모두 동일 경로 처리 |
| M4 | lazy init / hasInitializedPurpose ref 0건 | PASS | grep 결과: `hasInitializedEquipment`, `hasInitializedPurpose`, `useState(() => searchParams.get(...))` 모두 0건. `hasSeededLenderRef`는 purpose 잠금이 아닌 lender seed용 (M4 grep 기준 밖) |
| M5 | SSOT query param 키 경유 | PASS | `checkout-create-params.ts:51,54,72,73` — 전부 `CHECKOUT_QUERY_PARAMS.EQUIPMENT_ID`, `CHECKOUT_QUERY_PARAMS.PURPOSE` 경유. 범위 내 `'equipmentId'`/'`purpose`' 리터럴은 i18n 키(`t('equipmentId')`) 또는 HTML attribute(`htmlFor="purpose"`, `name="purpose"`)로 query param 키 하드코딩 0건 |
| M6 | 하드코딩 query param 키 0개 — 모든 진입점이 CREATE_FOR_EQUIPMENT() 빌더 사용 | PASS | `grep "CHECKOUTS\.CREATE.*?equipmentId=" / "/checkouts/create?equipmentId"` → 0건. `EquipmentStickyHeader.tsx:259` — `FRONTEND_ROUTES.CHECKOUTS.CREATE_FOR_EQUIPMENT(equipmentId)` 경유 |
| M7 | zod safeParse로 purpose 화이트리스트 검증 | PASS | `checkout-create-params.ts:56` — `UserSelectableCheckoutPurposeEnum.safeParse(rawPurpose)` 사용, `.success ? data : null` 반환 |
| M8 | 빌더 options 미지정 시 기존 출력 보존 (`?equipmentId=...` only) | PASS | `frontend-routes.ts:158-165` — `CREATE_FOR_EQUIPMENT(id)` 호출 시 options 없으면 `URLSearchParams({equipmentId: id})` 만 → `?equipmentId=...` 출력. `wf-25` regex `/checkouts/create\?equipmentId=${id}` 호환 |
| M9 | dirty 8개 파일 무수정 | FAIL | `git diff --name-only` 결과: `apps/frontend/next-env.d.ts` 가 수정됨 (`import './.next/types/routes.d.ts'` → `import "./.next/dev/types/routes.d.ts"`). 이 파일은 계약 M9 목록에 명시된 8개 중 하나. 자동생성 파일이지만 계약은 예외를 두지 않음 |
| M10 | Effect 2 (purpose 자동채움) 삭제, useMemo 도입 | PASS | purpose 관련 useEffect 0건. 대신 `CreateCheckoutContent.tsx:120-126` — `useMemo<UserSelectableCheckoutPurpose>(() => {...}, [purposeFromUrl, preselectedEquipment?.teamId, userTeamId])` 도입. 계약의 "기존 라인 147-161 useEffect" 삭제 확인됨 |

---

## SHOULD Criteria

| # | Criterion | Verdict | Note |
|---|-----------|---------|------|
| S1 | `?purpose=X` URL 파라미터 사전 선택 지원 | PASS | `useMemo` 내 `if (purposeFromUrl) return purposeFromUrl` — URL purpose가 최우선. `parseCheckoutCreateParams`가 zod 검증 후 반환 |
| S2 | 브라우저 뒤로가기 시 직전 purpose 복원 (router.push 히스토리 push) | PASS | `handlePurposeChange:211` — `router.push(..., { scroll: false })` 사용. history push로 뒤로가기 시 이전 purpose URL 복원됨 |
| S3 | URL 공유 시 동일 초기상태 재현 | PASS | URL이 SSOT이고 컴포넌트가 useMemo로 URL에서 파생하므로 URL 공유 시 동일 상태 |
| S4 | cross-tab navigation 회귀 | PARTIAL FAIL | Effect 1 조건 `prev.length > 0 ? prev : [preselectedEquipment]`로 인해, 장비 A 선택 후 동일 마운트 내 URL만 바꿔 장비 B로 이동하면 `selectedEquipments`가 리셋되지 않아 A가 유지될 수 있음. 그러나 /checkouts/create 자체를 새로 push하는 일반적 cross-tab 시나리오에서는 컴포넌트가 리마운트되어 정상 동작. S4 기준에 따른 완전한 커버리지 아님 |
| S5 | 사용자 명시적 purpose 변경 시 lender 자동 시드 1회만 | PASS | `hasSeededLenderRef` — 최초 1회만 시드. `handlePurposeChange`에서 호환성 체크 후 장비 유지 시 site/team 수동 채움 |
| S6 | 신규 단위 테스트: parseCheckoutCreateParams 7케이스 | FAIL | `lib/utils/__tests__/` 내 `checkout-create-params.test.ts` 파일 없음. 계약 Phase 2 신규 파일로 명시됐으나 미작성 |

---

## Issues Found

### FAIL: M9 — next-env.d.ts 수정

- **파일**: `apps/frontend/next-env.d.ts`
- **변경 내용**: `import './.next/types/routes.d.ts'` → `import "./.next/dev/types/routes.d.ts"`
- **판정 근거**: 계약 M9는 "dirty 파일 8개 무수정" 을 요구하며, 목록 중 `next-env.d.ts`를 명시. 자동생성 파일임을 감안해도 계약은 예외를 허용하지 않음
- **수정 방법**: `next-env.d.ts`를 원래 커밋 상태로 복원하거나(`git checkout HEAD -- apps/frontend/next-env.d.ts`), 계약을 개정하여 next-env.d.ts를 예외 파일로 명시

### SHOULD FAIL: S6 — 단위 테스트 미작성

- **파일**: `apps/frontend/lib/utils/__tests__/checkout-create-params.test.ts` (존재하지 않음)
- **계약 내용**: "Phase 2 신규" 로 명시된 7케이스 검증 테스트
- **Tech-debt 기록 필요**: 루프 비차단이지만 기술 부채로 등록 필요

### 참고: hasSeededLenderRef 잠재적 설계 이슈 (M4 범위 외)

- `hasSeededLenderRef.current = true` 이후 URL의 `equipmentId`가 변경되어도 ref가 리셋되지 않음
- 동일 마운트 내에서 `?equipmentId=A` → `?equipmentId=B`로 URL만 바뀌면 B의 site/team이 자동 시드되지 않음
- M4의 명시적 grep 기준(hasInitializedPurpose 0건)은 통과하며, S5의 "사용자 변경 후 덮어쓰기 방지" 의도를 구현한 것임
- 계약 M4 FAIL 사유에 해당하지 않으나 향후 S4 시나리오에서 문제 발생 가능

---

## Verdict

**FAIL**

M9 기준 위반: `apps/frontend/next-env.d.ts` 가 계약 명시 8개 dirty 파일 중 하나이며 이 구현 범위 내에서 수정됨. 자동생성 파일 여부와 무관하게 계약은 예외를 두지 않음.

추가: S6 단위 테스트 미작성 (SHOULD, 루프 비차단, tech-debt 등록 필요).

나머지 M1·M3·M4·M5·M6·M7·M8·M10 전원 PASS.
