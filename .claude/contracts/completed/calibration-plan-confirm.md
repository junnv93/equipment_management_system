# Contract: calibration-plans 확인/일괄확인/Excel 서명 개선

- 기준 plan: `.claude/exec-plans/active/2026-04-20-calibration-plan-confirm.md`
- 평가자: Evaluator subagent (general-purpose)

## MUST (실패 시 재작업 루프)

### M1. 템플릿 교체 및 SSOT 동기화
- `docs/procedure/template/UL-QP-19-01(00) 연간 교정계획서.xlsx`가 Downloads 신규 파일로 교체됨.
- `calibration-plan.layout.ts`의 `DATA_START_ROW`/`DATA_END_ROW`/`SIGNATURE_NAME_ROW`/`SIGNATURE_DATE_ROW`/`SIGNATURE_COLS`/`COLUMN_COUNT`/`SHEET_NAMES`/`COLUMNS`/`CONFIRMED_COL`이 실제 새 템플릿 구조와 일치.
- 확인 열 인덱스가 `Layout.CONFIRMED_COL` 상수에서 참조되며 렌더러 하드코딩 제거됨.

### M2. 확인 버튼 UI 가드
- `PlanItemsTable.tsx` 확인 버튼 render 조건에 `item.actualCalibrationId` truthy 체크 포함.
- `isApproved && !item.confirmedBy && !item.actualCalibrationId`인 항목에서 확인 버튼 DOM 미존재.
- 실적 미기록 + approved 상태일 때 "실적 기록" 버튼은 그대로 노출(퇴보 없음).

### M3. 일괄 확인 백엔드 엔드포인트
- `PATCH /calibration-plans/:uuid/items/confirm-all` 라우트 등록됨.
- `@RequirePermissions(Permission.CONFIRM_CALIBRATION_PLAN_ITEM)` 데코레이터 부착.
- body의 `casVersion` 검증, 불일치 시 409 + detail 캐시 삭제.
- `confirmedBy`는 `extractUserId(req)`로만 주입, body에서 받지 않음 (Rule 2).
- `plan.status !== approved`일 때 400 `CALIBRATION_PLAN_ONLY_APPROVED_CAN_CONFIRM`.
- 단일 UPDATE: `WHERE confirmed_by IS NULL AND actual_calibration_id IS NOT NULL`.
- 성공 응답 `{ confirmedCount: number }`.

### M4. 일괄 확인 프론트 UI
- `PlanItemsTable`에 "일괄 확인" 버튼이 `isApproved && items.some(i => !i.confirmedBy && i.actualCalibrationId)` 조건에서만 렌더됨.
- 클릭 시 `useCasGuardedMutation` 패턴으로 엔드포인트 호출, 성공 시 `invalidatePlan` 실행.
- 409 처리가 단건 확인과 동일한 패턴.

### M5. Excel 확인란 서명자 정확성
- `calibration-plan-renderer.service.ts` 확인 열 셀 값이 `plan.authorName`이 아닌 `item.confirmedByName` 참조.
- `findOne()` SELECT에 `confirmedByUser` alias의 `leftJoin` 추가 + `confirmedByName` 반환.
- `CalibrationPlanItemDetail` 타입에 `confirmedByName: string | null` 선언됨.
- 확인자 없는 항목은 `'-'`, 있는 항목은 사용자 이름이 셀에 기록됨.

### M6. SSOT 및 보안 규칙
- `ConfirmAllPlanItemsDto`는 zod 스키마 + `ZodValidationPipe`로 검증됨.
- 신규 엔드포인트 경로는 `packages/shared-constants/src/api-endpoints.ts`의 `CALIBRATION_PLANS.CONFIRM_ALL_ITEMS`에서만 정의됨 (프론트 하드코딩 금지).
- `any` 신규 도입 0건, `eslint-disable` 신규 추가 0건.

### M7. 타입/린트/테스트 게이트
- `pnpm tsc --noEmit` 오류 0.
- `pnpm lint` 신규 경고 0.
- `pnpm --filter backend run test` 통과 (특히 `calibration-plans.service`, `calibration-plans-export.service`).
- `pnpm --filter backend run test:e2e -- calibration-plans` 통과.

### M8. 시드 유효성
- `pnpm --filter backend run db:reset` 성공.
- approved 계획서 중 **"actualCalibrationId IS NOT NULL AND confirmedBy IS NULL"** 항목 **2건 이상** 존재.
- 최소 1건의 approved 계획서에 **"actualCalibrationId IS NOT NULL AND confirmedBy IS NOT NULL"** 항목 존재 (Excel 서명 분기 검증).
- CPLAN_009 28항목 push-down 시나리오 회귀 없음.

### M9. Next.js 16 / 서버 패턴 퇴보 없음
- `calibration-plans` 라우트 `page.tsx`가 여전히 `await props.params` 패턴 유지.
- `useOptimisticMutation` onSuccess에서 `setQueryData` 신규 추가 없음.
- `useCasGuardedMutation` 패턴이 일괄 확인 mutation에 적용됨.

---

## SHOULD (미흡 시 기술부채 기록)

### S1. i18n 완결성
- `ko`/`en` 양쪽에 `confirmAll`, `confirmAllTitle`, `noConfirmableItems`, toast 4종 추가.

### S2. a11y
- 일괄 확인 버튼에 `aria-label` 또는 가시 텍스트 명확히 제공.
- 버튼 disabled 상태가 `aria-disabled` 또는 네이티브 `disabled`로 표현.

### S3. Audit 로그
- `confirmAllItems` 엔드포인트에 `@AuditLog` 데코레이터 부착.

### S4. Renderer 가독성
- 확인 열 인덱스가 `Layout.CONFIRMED_COL` 상수로 승격됨 (M1에서 달성 시 충족).

### S5. 테스트 커버리지
- `confirmAllItems` 서비스 단위 테스트: 정상(2건 업데이트), non-approved 400, actualCalibrationId 없는 항목 미포함, CAS 409.

### S6. 렌더러 테스트
- Excel 확인 셀이 서로 다른 두 확인자 이름을 담는 assertion 추가.

### S7. 시드 주석
- 각 계획서 항목의 상태 분포(bulk-confirm 대상/단건 확인/완료/실적 없음) 주석으로 명시.

---

## 금지 (발견 즉시 FAIL)

- F1. `any` 타입 신규 도입 (renderer/service/DTO 어디든).
- F2. `eslint-disable` 신규 추가.
- F3. body에서 `confirmedBy` 수신 (Rule 2 위반).
- F4. 하드코딩된 row/col 번호가 layout.ts 밖에 신규 추가.
- F5. 신규 DB migration 파일 생성 (스키마 변경 없음).
- F6. `setQueryData`로 상세 캐시 수동 갱신.
- F7. 테스트 `.skip`/`xit`.
- F8. 템플릿 파일 신규 경로에 중복 생성.
- F9. bulk-confirm을 Promise.all + loop of confirmItem 호출로 구현 (단일 UPDATE 필수).

---

## 평가 명령어 세트

```bash
# 1. 구조/SSOT 검사
grep -rn "plan\.authorName" apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts
grep -rn "confirmedByName" apps/backend/src/modules/calibration-plans
grep -rn "CONFIRM_ALL_ITEMS\|confirm-all" apps/backend/src apps/frontend packages/shared-constants
grep -rn "any\b\|eslint-disable" apps/backend/src/modules/calibration-plans apps/frontend/components/calibration-plans
grep -rn "CONFIRMED_COL\|confirmedByName" apps/backend/src/modules/calibration-plans/calibration-plan.layout.ts

# 2. 타입/린트/테스트
pnpm tsc --noEmit
pnpm lint
pnpm --filter backend run test -- calibration-plans
pnpm --filter backend run test:e2e -- calibration-plans
pnpm --filter frontend run test -- PlanItemsTable

# 3. 시드 및 DB
pnpm --filter backend run db:reset
docker compose exec -T postgres psql -U postgres -d equipment_management -c \
  "SELECT plan_id, count(*) FILTER (WHERE confirmed_by IS NULL AND actual_calibration_id IS NOT NULL) AS confirmable \
   FROM calibration_plan_items GROUP BY plan_id ORDER BY confirmable DESC LIMIT 5;"

# 4. 템플릿 교체 확인
stat "docs/procedure/template/UL-QP-19-01(00) 연간 교정계획서.xlsx"
```
