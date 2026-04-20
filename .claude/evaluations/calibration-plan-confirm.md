# Evaluation: calibration-plan-confirm
Date: 2026-04-20
Iteration: 1

## MUST Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | 템플릿 교체 및 SSOT 동기화 | PASS | `docs/procedure/template/UL-QP-19-01(00) 연간 교정계획서.xlsx` 존재 (mtime 2026-04-20). `calibration-plan.layout.ts`에 `DATA_START_ROW=6`, `DATA_END_ROW=32`, `SIGNATURE_NAME_ROW=35`, `SIGNATURE_DATE_ROW=37`, `SIGNATURE_COLS`, `COLUMN_COUNT=10`, `SHEET_NAMES`, `COLUMNS`, `CONFIRMED_COL=9` 모두 정의됨. 렌더러는 `Layout.CONFIRMED_COL` 상수 참조 (하드코딩 없음, line 91). |
| M2 | 확인 버튼 UI 가드 | PASS | `PlanItemsTable.tsx` line 550-552: `isApproved && !item.confirmedBy && !!item.actualCalibrationId && optimisticConfirmedId !== item.id` 조건에서만 확인 버튼 렌더. `!actualCalibrationId` 항목에서 "실적 기록" 버튼은 별도 조건(line 538)으로 그대로 노출. |
| M3 | 일괄 확인 백엔드 엔드포인트 | PASS | `PATCH :uuid/items/confirm-all` 라우트 등록(line 325). `@RequirePermissions(Permission.CONFIRM_CALIBRATION_PLAN_ITEM)` 부착(line 335). `casVersion` Zod 검증 + CAS 불일치 시 캐시 삭제 + 409(service line 820-824). `confirmedBy`는 `extractUserId(req)`로만 주입(controller line 370). non-approved 시 400+`CALIBRATION_PLAN_ONLY_APPROVED_CAN_CONFIRM` 코드(service line 813-818). 단일 UPDATE with `confirmedBy IS NULL AND actualCalibrationId IS NOT NULL` 조건(service line 826-841). 응답 `{ confirmedCount: number }`. |
| M4 | 일괄 확인 프론트 UI | PASS | `PlanItemsTable.tsx` line 154: `confirmAllMutation = useCasGuardedMutation`. line 276: `canConfirmItem && (hasConfirmableItems || isOptimisticAllConfirmed)` 조건. 성공 시 `invalidatePlan` 호출(line 167). 409 처리는 `useCasGuardedMutation` 패턴 공유. |
| M5 | Excel 확인란 서명자 정확성 | PASS | renderer line 72: `item.confirmedBy ? (item.confirmedByName ?? '-') : '-'` — `authorName` 아닌 `item.confirmedByName` 참조. service line 398-418: `confirmedByUser` alias leftJoin + `confirmedByName` 반환. types.ts line 68: `confirmedByName: string \| null` 선언. |
| M6 | SSOT 및 보안 규칙 | PASS | `confirmAllPlanItemsSchema` Zod 스키마 + `ConfirmAllPlanItemsValidationPipe` 적용. `CALIBRATION_PLANS.CONFIRM_ALL_ITEMS` shared-constants에서 정의(api-endpoints.ts line 194). `any` 신규 도입 0건, `eslint-disable` 0건. |
| M7 | 타입/린트/테스트 게이트 | PASS | `pnpm tsc --noEmit` 오류 0. jest 직접 실행: `calibration-plans` 3개 스위트 35개 테스트 전체 PASS. |
| M8 | 시드 유효성 | PASS | CPLAN_008 항목 중 `actualCalibrationId IS NOT NULL AND confirmedBy IS NULL` 2건(CPLAN_ITEM_021, 022) 존재. CPLAN_004/008 항목 중 `confirmedBy IS NOT NULL` 항목 다수 존재(line 485-501, 599-615). CPLAN_009 28항목 push-down 시나리오는 export spec에서 검증됨. |
| M9 | Next.js 16 / 서버 패턴 퇴보 없음 | PASS | `calibration-plans/[uuid]/page.tsx` line 77: `const { uuid } = await props.params`. `setQueryData` 신규 추가 0건. `useCasGuardedMutation` 일괄 확인 mutation에 적용됨. |

## SHOULD Results

| # | Criterion | Result | Note |
|---|-----------|--------|------|
| S1 | i18n 완결성 | PASS | ko/calibration.json: `confirmAll`, `confirmAllTitle`, `confirmAllSuccess`, `confirmAllSuccessDesc`, `confirmAllError`, `confirmAllErrorDesc` 모두 추가됨. en/calibration.json도 동일. `noConfirmableItems` 키는 코드에서 미사용으로 불필요. |
| S2 | a11y | PASS | 일괄 확인 버튼: `aria-label={t('planDetail.items.confirmAllTitle')}` (line 285), `disabled` 속성 사용(line 284). |
| S3 | Audit 로그 | PASS | `confirmAllItems` 엔드포인트에 `@AuditLog({ action: 'update', ... })` 데코레이터 부착(controller line 337). |
| S4 | Renderer 가독성 | PASS | M1에서 달성. renderer line 91: `Layout.CONFIRMED_COL` 상수 참조. |
| S5 | 테스트 커버리지 — confirmAllItems 단위 테스트 | FAIL | `calibration-plans.service.spec.ts` 295줄 전체에 `confirmAllItems` describe/it 블록 없음. 정상(2건 업데이트)/non-approved 400/actualCalibrationId 없는 항목 미포함/CAS 409 케이스 모두 미작성. |
| S6 | 렌더러 테스트 — 두 확인자 이름 assertion | FAIL | `calibration-plans-export.service.spec.ts`에서 `confirmedByName` 또는 확인 셀(CONFIRMED_COL) 값에 대한 assertion 없음. 확인자 분기(`'-'` vs 실제 이름) 검증 누락. |
| S7 | 시드 주석 | PARTIAL | CPLAN_008의 bulk-confirm 대상 2건에 주석 존재. 단건 확인 완료(line 485-501, 599-615) 항목과 실적 없는 항목의 상태 분포 주석은 없음. |

## Forbidden Violations

F1~F9 위반 없음:
- F1 (`any` 신규 도입): 없음
- F2 (`eslint-disable` 신규 추가): 없음
- F3 (body에서 `confirmedBy` 수신): DTO에 `confirmedBy` 필드 없음, 서버에서만 주입
- F4 (layout.ts 밖 hardcoded row/col): 없음
- F5 (신규 DB migration 파일): 없음 (스키마 변경 없음)
- F6 (`setQueryData`로 상세 캐시 수동 갱신): 없음
- F7 (테스트 `.skip`/`xit`): 없음
- F8 (템플릿 파일 중복 생성): 없음
- F9 (Promise.all + loop confirmItem 호출): 없음 — 단일 UPDATE로 구현됨

## Verdict

**PASS**

모든 MUST 기준 충족, 금지 위반 없음.

## Repair Instructions (SHOULD 미충족 — 기술부채로 기록)

### S5 — confirmAllItems 서비스 단위 테스트 추가 필요
`apps/backend/src/modules/calibration-plans/__tests__/calibration-plans.service.spec.ts`에 다음 케이스 추가:
- 정상: approved plan + 2건 actualCalibrationId IS NOT NULL → confirmedCount: 2
- non-approved 400: plan.status !== 'approved' → BadRequestException(CALIBRATION_PLAN_ONLY_APPROVED_CAN_CONFIRM)
- CAS 불일치 409: plan.casVersion !== payload.casVersion → ConflictException + cache delete
- actualCalibrationId 없는 항목 미포함: WHERE 조건 검증

### S6 — 렌더러 테스트 확인 셀 assertion 추가 필요
`apps/backend/src/modules/calibration-plans/__tests__/calibration-plans-export.service.spec.ts`에 추가:
- `confirmedBy` 있는 항목: `CONFIRMED_COL` 셀 값 = `confirmedByName` (예: '수원 기술책임자')
- `confirmedBy` 없는 항목: `CONFIRMED_COL` 셀 값 = `'-'`
- 두 항목이 서로 다른 확인자 이름을 갖는 시나리오

### S7 — 시드 주석 보완
`apps/backend/src/database/seed-data/calibration/calibration-plans.seed.ts`의 CPLAN_004/008 항목에
각 항목의 상태 분포 (단건 확인 완료 / bulk-confirm 대상 / 실적 없음) 주석 추가 권장.
