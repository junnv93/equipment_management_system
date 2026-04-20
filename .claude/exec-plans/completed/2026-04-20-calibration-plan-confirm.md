# 교정계획서 확인/일괄확인/Excel 서명 개선 실행 계획

- 작성일: 2026-04-20
- 범위: calibration-plans 모듈 (백엔드 + 프론트엔드 + 시드 + 템플릿)
- 관련 컨트랙트: `.claude/contracts/calibration-plan-confirm.md`

## 배경

`apps/backend/src/modules/calibration-plans/`에는 3단계 승인 + 항목 확인 워크플로우가
구현되어 있으나, 다음 격차가 존재한다.

1. 항목 확인 버튼이 교정기록 미연결 시에도 노출되어 422 응답으로 귀결 (백엔드 가드는 있지만 UI 가드 없음)
2. 일괄 확인 기능이 백엔드/프론트 모두 부재 — 승인 후 다수 항목을 개별 클릭해야 함
3. Excel 확인란 서명이 `plan.authorName`(작성자)으로 고정되어 실제 항목 확인자와 불일치
4. 새 교정계획서 양식(`UL-QP-19-01(00)`) 파일이 `/mnt/c/Users/kmjkd/Downloads/`에 준비되어 레이아웃 SSOT와 동기화 필요
5. 시드가 위 시나리오를 모두 커버하지 않음 (특히 bulk-confirm 대상 항목)

## 목표

- 확인 버튼은 `isApproved && !item.confirmedBy && !!item.actualCalibrationId` 삼항 조건으로 노출/비활성화
- `PATCH /calibration-plans/:uuid/items/confirm-all` 엔드포인트 + UI 버튼 신설
- Excel 확인란에 각 항목별 `confirmedByName`(실제 확인자) 서명
- 최신 UL-QP-19-01 양식으로 교체 + 레이아웃 SSOT 재동기화
- 모든 기능을 시드만으로 검증 가능하도록 상태 조합 보강

---

## Phase 0 — 템플릿 파일 교체 및 레이아웃 SSOT 재보정

신규 템플릿이 기존 파일과 행/열 구조가 다를 수 있으므로 **반드시** 실제 파일을 열어서
값을 확인한 뒤 `calibration-plan.layout.ts`를 업데이트해야 한다.

### 수정할 파일

1. `docs/procedure/template/UL-QP-19-01(00) 연간 교정계획서.xlsx`
   - WHAT: `/mnt/c/Users/kmjkd/Downloads/UL-QP-19-01(00) 연간 교정계획서.xlsx`에서 복사하여
     기존 파일을 대체. 파일명은 기존과 동일 유지 (`FormTemplateService`가 이 경로를 참조).

2. `apps/backend/src/modules/calibration-plans/calibration-plan.layout.ts`
   - WHAT: 새 템플릿 구조에 맞춰 아래 상수를 재검증 및 필요 시 수정.
     - `SHEET_NAMES`: 새 템플릿 시트명을 첫 번째 후보로 배치. 기존 후보는 fallback으로 유지.
     - `DATA_START_ROW`: 데이터 주입 시작 행(1-based).
     - `DATA_END_ROW`: 데이터 영역 마지막 행. 서명란 직전까지.
     - `COLUMN_COUNT`: A부터 마지막 데이터 열까지. 새 양식이 열 수를 바꿨다면 반영.
     - `SIGNATURE_NAME_ROW`, `SIGNATURE_DATE_ROW`: 서명란 이름/날짜 행.
     - `SIGNATURE_COLS`: `author/reviewer/approver` 각 병합 셀 시작 열.
     - `COLUMNS`: 새 양식의 컬럼 순서/헤더와 1:1 일치 (특히 '확인' 열이 분리되었는지).
     - `CONFIRMED_COL`: 확인 열 인덱스를 별도 상수로 승격하여 렌더러 하드코딩 제거.
     - `TEMPLATE_DATA_ROW_COUNT`는 `DATA_END_ROW - DATA_START_ROW + 1`로 자동 유도되므로 별도 수정 불필요.
   - WHAT(주석): 새 양식 개정에 맞게 JSDoc `@see` 경로 및 구조 설명 갱신.

3. `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts`
   - WHAT: `shrinkToFit` 적용 대상 컬럼이 새 레이아웃 상수 `Layout.CONFIRMED_COL`을 참조하도록 변경.
     기존 하드코딩 `9` 제거.

### 검증 명령어

```bash
ls -la "docs/procedure/template/UL-QP-19-01(00) 연간 교정계획서.xlsx"
pnpm --filter backend run tsc --noEmit
```

---

## Phase 1 — 백엔드: 확인자 이름(`confirmedByName`) 조회 추가

### 수정할 파일

1. `apps/backend/src/modules/calibration-plans/calibration-plans.types.ts`
   - WHAT: `CalibrationPlanItemDetail` 타입에 `confirmedByName: string | null` 필드 추가
     (Drizzle `$inferSelect` 확장 — `&` intersection).

2. `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` — `findOne()` 내부
   - WHAT: 항목 조회 SELECT에 `users` 테이블을 `confirmedByUser` alias로 `leftJoin`,
     `confirmedByName: confirmedByUser.name` 추가. `on` 조건은 `confirmedBy = users.id`.
     결과 매핑(`items.map`)에서 `confirmedByName`을 포함.
   - WHAT: `confirmItem`/`updateItem` 시그니처는 변경하지 않음.

3. `apps/frontend/lib/api/calibration-plans-api.ts` — `CalibrationPlanItem` 인터페이스
   - WHAT: `confirmedByName: string | null` 필드 추가. Excel 전용이지만 타입 일관성을 위해 선언.

### 검증 명령어

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test -- calibration-plans.service
```

---

## Phase 2 — 백엔드: 일괄 확인 엔드포인트

### 수정할 파일

1. `apps/backend/src/modules/calibration-plans/dto/approve-calibration-plan.dto.ts`
   - WHAT: `confirmAllPlanItemsSchema` 추가. 필드는 `casVersion: number` (required, positive int).
     `ConfirmAllPlanItemsPayload = { confirmedBy: string; casVersion: number }` 서버 내부 타입.
     `ConfirmAllPlanItemsDto` Swagger 클래스 + `ConfirmAllPlanItemsValidationPipe` export.

2. `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts`
   - WHAT: `confirmAllItems(planUuid, payload)` 메서드 추가.
     - `findOneBasic`으로 plan 로드 → `status !== APPROVED`이면 `CALIBRATION_PLAN_ONLY_APPROVED_CAN_CONFIRM` 400.
     - `casVersion !== plan.casVersion`이면 detail 캐시 삭제 + `createVersionConflictException`.
     - 단일 UPDATE: `WHERE planId = :id AND confirmedBy IS NULL AND actualCalibrationId IS NOT NULL`.
       `SET confirmedBy = :userId, confirmedAt = now(), updatedAt = now()`. `.returning({ id })`로 건수.
     - 업데이트 건수 > 0이면 `invalidatePlanCache(planUuid)`.
     - 반환: `{ confirmedCount: number }`.
   - WHAT: 단일 transaction 불필요(단일 UPDATE). Promise.all loop 구현 금지(원자성).

3. `apps/backend/src/modules/calibration-plans/calibration-plans.controller.ts`
   - WHAT: `@Patch(':uuid/items/confirm-all')` 핸들러 추가.
     - `@RequirePermissions(Permission.CONFIRM_CALIBRATION_PLAN_ITEM)`
     - `@UsePipes(ConfirmAllPlanItemsValidationPipe)`
     - `@AuditLog({ action: 'update', entityType: 'calibration_plan', entityIdPath: 'params.uuid' })`
     - `enforceSiteAccess` 후 `extractUserId(req)`로 `confirmedBy` 주입. body에서 받지 않음.
     - Swagger: 성공 200, 404/400/409 응답 문서화.
   - WHAT: 라우팅 충돌 방지 — `@Patch(':uuid/items/:itemUuid/confirm')`보다 이 핸들러를 먼저 배치.

4. `packages/shared-constants/src/api-endpoints.ts`
   - WHAT: `CALIBRATION_PLANS.CONFIRM_ALL_ITEMS: (planId: string) => \`/api/calibration-plans/\${planId}/items/confirm-all\`` 추가.

### 검증 명령어

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- calibration-plans.service
```

---

## Phase 3 — 백엔드: Excel 렌더러에 확인자 이름 반영

### 수정할 파일

1. `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts`
   - WHAT: `items.forEach` 루프에서 `confirmedSignature`를 `plan.authorName` → `item.confirmedByName`으로 교체.
     null 처리는 기존 `'-'` fallback 유지.
   - WHAT: 확인 열 shrinkToFit 적용 시 `Layout.CONFIRMED_COL` 상수 사용(Phase 0에서 승격됨).

2. `apps/backend/src/modules/calibration-plans/__tests__/calibration-plans-export.service.spec.ts` (존재 시)
   - WHAT: mock items에 `confirmedByName` 포함, Excel 확인 셀이 `confirmedByName`과 일치하는 assertion 추가.
     기존 `plan.authorName` 기반 assertion 교체.

### 검증 명령어

```bash
pnpm --filter backend run test -- calibration-plans-export
pnpm --filter backend run tsc --noEmit
```

---

## Phase 4 — 프론트엔드: 확인 버튼 조건 + 일괄 확인 UI

### 수정할 파일

1. `apps/frontend/lib/api/calibration-plans-api.ts`
   - WHAT: `confirmAllPlanItems(planUuid, { casVersion })` 메서드 추가.
     `API_ENDPOINTS.CALIBRATION_PLANS.CONFIRM_ALL_ITEMS(planUuid)` 호출.
     반환 타입 `{ confirmedCount: number }`.

2. `apps/frontend/components/calibration-plans/PlanItemsTable.tsx`
   - WHAT: 단건 확인 버튼 render 조건을
     `isApproved && !item.confirmedBy && !!item.actualCalibrationId && optimisticConfirmedId !== item.id`
     으로 변경. `actualCalibrationId` 없으면 버튼 DOM 미노출.
   - WHAT: "실적 기록" 버튼은 기존 동작 유지 (퇴보 없음).
   - WHAT: 카드 헤더 또는 진행률 바 영역에 "일괄 확인" 버튼 추가.
     - 조건: `isApproved && items.some(i => !i.confirmedBy && i.actualCalibrationId)`
     - `useCasGuardedMutation`으로 `confirmAllPlanItems` 호출.
     - 성공: `{confirmedCount}건 확인 완료` toast + `CalibrationPlansCacheInvalidation.invalidatePlan`.
     - 409: version conflict 처리 (detail 재조회 안내).
   - WHAT: 단건/일괄 mutation 동시 pending 시 둘 다 disabled.

3. `apps/frontend/messages/ko/calibration.json`
   - WHAT: `planDetail.items`에 `confirmAll`, `confirmAllTitle`, `noConfirmableItems` 추가.
     `planDetail.toasts`에 `confirmAllSuccess`, `confirmAllSuccessDesc`(count 치환), `confirmAllError`, `confirmAllErrorDesc` 추가.

4. `apps/frontend/messages/en/calibration.json`
   - WHAT: 동일 키의 영문 번역 추가.

### 검증 명령어

```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
```

---

## Phase 5 — 시드 데이터 보강

### 수정할 파일

1. `apps/backend/src/database/seed-data/calibration/calibration-plans.seed.ts`
   - WHAT: CPLAN_008 등 approved 계획서 항목 중 **"actualCalibrationId IS NOT NULL AND confirmedBy IS NULL"**
     상태인 항목이 **2건 이상** 되도록 보강. bulk-confirm 시나리오 검증용.
   - WHAT: 최소 1건의 항목은 `confirmedByName`이 있어야 Excel 서명 분기 검증 가능.
   - WHAT: CPLAN_009 28항목은 변경하지 않음 (서명란 push-down 테스트 전용).
   - WHAT: 시드 주석에 각 계획서의 상태 분포 명시.

2. `apps/backend/src/database/seed-data/calibration/calibrations.seed.ts` (필요 시)
   - WHAT: 위 시나리오의 `actualCalibrationId` 연결에 필요한 calibration row가 없으면 추가.
     연도/장비/calibrationDate 일관성 유지.

3. `apps/backend/src/database/utils/uuid-constants.ts` (필요 시)
   - WHAT: 신규 calibration ID 상수 export.

### 검증 명령어

```bash
pnpm --filter backend run db:reset
docker compose exec -T postgres psql -U postgres -d equipment_management -c \
  "SELECT plan_id, count(*) FILTER (WHERE confirmed_by IS NULL AND actual_calibration_id IS NOT NULL) AS confirmable \
   FROM calibration_plan_items GROUP BY plan_id ORDER BY confirmable DESC LIMIT 5;"
```

---

## Phase 6 — 통합 검증

### 자동화

```bash
pnpm tsc --noEmit
pnpm lint
pnpm --filter backend run test
pnpm --filter backend run test:e2e -- calibration-plans
pnpm --filter frontend run test
```

### 수동 UX 확인 (Generator가 브라우저에서 반드시 확인)

1. approved 계획서 상세 → 실적 연결된 항목의 "확인" 버튼 **노출**.
2. pending_approval 계획서 상세 → 확인 버튼 **미노출**.
3. approved 계획서 + 실적 미연결 항목 → 확인 버튼 **미노출**, "실적 기록" 버튼만.
4. 일괄 확인 버튼 클릭 → `{n}건 확인 완료` toast + 진행률 바 증가.
5. 동일 계획서 Excel 내보내기 → 확인란 열에 각 항목별 확인자 이름.
6. CPLAN_009 Excel → 서명란이 데이터 아래에 정상 렌더링.

---

## 의존성 및 순서

Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

- Phase 0 먼저: 렌더러의 CONFIRMED_COL 상수가 Phase 3에서 필요.
- Phase 1 먼저: confirmedByName이 Phase 3 렌더러에서 필요.
- Phase 2 먼저: 엔드포인트가 Phase 4 프론트에서 필요.

## 롤백 포인트

- Phase 0 완료 시 커밋.
- Phase 3 완료 시 커밋 (독립적 개선).
- Phase 4 완료 시 커밋.
- pre-push hook이 각 커밋에서 tsc + test 게이트.
