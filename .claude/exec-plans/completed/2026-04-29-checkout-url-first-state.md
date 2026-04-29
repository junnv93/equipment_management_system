# Checkout URL-First State — Exec Plan

> 생성일: 2026-04-29
> 배경: commit 00496041 의 `useState lazy initializer` 임시 fix를 URL-first 아키텍처로 전환.
> 목표: URL query parameter (`?equipmentId`, `?purpose`)를 SSOT로 사용. URL 변경 시 UI가 즉시 반응.
> 제약: 현재 dirty 파일 8개는 절대 건드리지 않음 (CalibrationPlansContent.tsx, CalibrationListTable.tsx, CalibrationDdayList.tsx, next-env.d.ts, CableListContent.tsx, TestSoftwareListContent.tsx, CheckoutCard.tsx, list-page-skeleton.tsx).

## 핵심 아키텍처 결정

| ID | 결정 |
|----|------|
| D1 | `CHECKOUT_QUERY_PARAMS.PURPOSE = 'purpose'` 추가 |
| D2 | `CREATE_FOR_EQUIPMENT(id, { purpose? })` 옵셔널 옵션 객체 (기존 단일 인자 호환 유지) |
| D3 | 신규 파일 `lib/utils/checkout-create-params.ts` — 서버/클라 양용 파서 (zod 검증) |
| D4 | `equipmentId`/`purpose` URL → useMemo 파생, lazy init + ref 가드 제거 |
| D5 | 사용자 변경은 `router.push`, 자동 판정은 URL 비변경 (useMemo 파생값) |
| D6 | `selectedEquipments` 다중 선택은 useState 유지 (URL 시드 1회) |
| D7 | URL `purpose` 우선, 없으면 cross-team 자동판정 (useMemo) |
| D8 | site/teamId useState + hasSeededLenderRef 1개 (사용자 입력 보호) |

---

## Phase 1: SSOT 상수 확장

**목표**: `purpose` URL 키를 SSOT에 등록하고 빌더 시그니처를 옵션 객체로 확장.

### 수정 대상

| 파일 | 결과 (WHAT) |
|------|------------|
| `packages/shared-constants/src/frontend-routes.ts` | (1) `CHECKOUT_QUERY_PARAMS` 객체에 `PURPOSE: 'purpose'` 추가. (2) `CREATE_FOR_EQUIPMENT` 시그니처를 `(equipmentId: string, options?: { purpose?: UserSelectableCheckoutPurpose }) => string`으로 변경. URL 빌딩은 `URLSearchParams` 사용. (3) 기존 단일 인자 호출이 깨지지 않도록 `options`는 옵셔널이고 미지정 시 query에 `purpose` 키 자체 미포함. |

### 수정 금지

- `packages/shared-constants/dist/**` (빌드 산출물)

### 검증

- `pnpm --filter @equipment-management/shared-constants run build` PASS
- `grep -rn "CREATE_FOR_EQUIPMENT(" apps/frontend --include="*.tsx" --include="*.ts"` 호출지 모두 새 시그니처와 호환

---

## Phase 2: URL 파서 유틸리티 신설

**목표**: `?equipmentId`, `?purpose` 파라미터를 안전하게 파싱하는 SSOT 유틸리티.

### 수정 대상 (신규 파일)

| 파일 | 결과 (WHAT) |
|------|------------|
| `apps/frontend/lib/utils/checkout-create-params.ts` | (1) `parseCheckoutCreateParams(sp)` 함수 export — `URLSearchParams \| ReadonlyURLSearchParams \| Record<string, string \| string[] \| undefined>` 입력 모두 지원 (equipment-filter-utils.ts 패턴 답습). (2) `equipmentId`: trim된 비어있지 않은 문자열만 반환, 그 외 `null`. (3) `purpose`: `UserSelectableCheckoutPurposeEnum.safeParse()` 통과한 값만 반환, 그 외 `null` (악성/오타 URL 보호). (4) `CHECKOUT_QUERY_PARAMS.EQUIPMENT_ID`, `CHECKOUT_QUERY_PARAMS.PURPOSE` 상수 사용 — 하드코딩 0. |

### 검증

- `tsc --noEmit` PASS

---

## Phase 3: 장비 연동 UI — 라이터 SSOT 일치화

**목표**: 모든 진입점이 `CREATE_FOR_EQUIPMENT()` 빌더를 경유하도록 정리.

### 수정 대상

| 파일 | 결과 (WHAT) |
|------|------------|
| `apps/frontend/components/equipment/EquipmentStickyHeader.tsx` | line 259 `<Link href={\`${FRONTEND_ROUTES.CHECKOUTS.CREATE}?equipmentId=${equipmentId}\`}>` → `<Link href={FRONTEND_ROUTES.CHECKOUTS.CREATE_FOR_EQUIPMENT(equipmentId)}>` 로 교체. **하드코딩 쿼리 키 제거.** |
| `apps/frontend/components/mobile/EquipmentActionSheet.tsx` | (변경 없음 — 이미 SSOT 빌더 사용) |

### 수정 금지

- `apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts` — 빌더 출력은 동일 형태이므로 자동 호환

### 검증

- `grep -rn "CHECKOUTS\.CREATE.*equipmentId\|/checkouts/create\?equipmentId=" apps/frontend --include="*.tsx" --include="*.ts"` → 0건

---

## Phase 4: CreateCheckoutContent URL-first 전환

**목표**: lazy init + ref 가드 + 2개 Effect를 제거하고 URL 파생 모델로 전환.

### 수정 대상

| 파일 | 결과 (WHAT) |
|------|------------|
| `apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx` | (1) `hasInitializedEquipment`, `hasInitializedPurpose` 두 ref 삭제. (2) `purpose` lazy initializer 제거 — useMemo로 파생 (D7): URL purpose 우선, 없으면 cross-team 자동판정, 기본 calibration. (3) `selectedSite`/`selectedTeamId` lazy initializer 제거 — `useState('')` + `hasSeededLenderRef` 1개 ref (D8). (4) Effect 1 → `selectedEquipments` 시드용 useEffect 단순화 (`preselectedEquipment && selectedEquipments.length === 0` 조건으로 ref 없이). (5) Effect 2 (purpose 자동 채움) **삭제** — useMemo가 대체. (6) `handlePurposeChange`: `router.push(FRONTEND_ROUTES.CHECKOUTS.CREATE_FOR_EQUIPMENT(equipmentId, { purpose: value }), { scroll: false })` — URL 갱신. (7) `parseCheckoutCreateParams(searchParams)` 경유로 SSOT 파서 사용. |

### 수정 금지

- `apps/frontend/app/(dashboard)/checkouts/create/page.tsx` (Server Component — 변경 불필요)
- dirty 8개 파일

### 검증

- `tsc --noEmit` PASS
- 수동 시나리오 7종 (Phase 5)

---

## Phase 5: 검증

### 검증 절차

1. **타입체크**: `pnpm --filter frontend run tsc --noEmit` PASS
2. **빌드**: `pnpm --filter frontend run build` PASS
3. **E2E 회귀**: `pnpm --filter frontend run test:e2e -- wf-25` PASS
4. **회귀 스킬**: `verify-ssot`, `verify-hardcoding`, `verify-frontend-state`
5. **수동 시나리오 7종**:
   - own-team 장비 진입 (`?equipmentId=X`) → calibration default
   - cross-team 장비 진입 → rental + site/team 자동
   - URL purpose 명시 (`?purpose=repair`) → 해당 값 우선
   - 잘못된 purpose 값 (`?purpose=foo`) → null 무시 (자동판정 fallback)
   - 사용자 purpose 변경 → URL 즉시 업데이트
   - 뒤로가기 → 직전 purpose 복원
   - 새로고침 → 동일 상태 재현
6. **dirty 파일 무수정 확인**: `git diff --name-only` 결과에 dirty 8개 파일 미포함

---

## 변경 요약 (커밋 메시지 초안)

```
refactor(checkouts): migrate create page to URL-first state SSOT

- Add CHECKOUT_QUERY_PARAMS.PURPOSE to shared-constants SSOT
- Extend CREATE_FOR_EQUIPMENT(id, { purpose? }) builder
- Add parseCheckoutCreateParams() utility (server/client)
- Remove lazy initializer + dual-ref guards in CreateCheckoutContent
- Replace Effect 2 with useMemo derivation (purpose)
- Align EquipmentStickyHeader to CREATE_FOR_EQUIPMENT builder
```
