# calibration-plans Export 감사 + 전방위 페이지 리뷰

## 메타
- 생성: 2026-04-20T00:00:00+09:00
- 모드: Mode 2
- 예상 변경: ~35개 파일
- slug: cplan-export-audit

## 설계 철학
UL-QP-19-01 export는 이미 구현되어 있으나 sw-validation 157606ca 커밋의 allowlist 패턴, layout SSOT, 백엔드 상태 가드가 적용되지 않았다. 기존 패턴을 1:1 이식하고, 19개 페이지 리뷰 이슈를 아키텍처 레벨에서 수정한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| Export allowlist 위치 | backend-local + frontend-local (sw-validation 선례) | schemas는 데이터 형태만, 정책은 각 레이어에 |
| Backend 서비스 분리 | 3-service (export-data + renderer + orchestrator) | equipment-registry 패턴과 정렬 |
| Permission 정책 | EXPORT_REPORTS로 통일 | UL-QP-18 컨벤션 통일, enum 신설 불필요 |
| 컴포넌트 디렉터리 | calibration/ → calibration-plans/ 이동 | 도메인 경계 명확화 |
| CAS 훅 | useOptimisticMutation 래핑 beforeMutate 패턴 | 기존 훅 재사용 |
| Export 파일명 | FORM_CATALOG 참조 | 하드코딩 제거 |
| Layout SSOT | calibration-plan.layout.ts 신설 | equipment-registry.layout.ts 1:1 복제 |

## 구현 Phase

### Phase 0: 기반 인프라
**목표:** 후속 Phase가 의존하는 공용 유틸/훅을 신설하고 컴포넌트 디렉터리를 분리
**변경 파일:**
1. `apps/frontend/lib/utils/calibration-plan-exportability.ts` — 신규: EXPORTABLE_CALIBRATION_PLAN_STATUSES + isCalibrationPlanExportable
2. `apps/frontend/lib/utils/__tests__/calibration-plan-exportability.test.ts` — 신규: 5개 상태 enumerate 테스트
3. `apps/frontend/hooks/use-cas-guarded-mutation.ts` — 신규: CAS fetch-before-mutate 훅 (useOptimisticMutation 래핑)
4. `apps/frontend/components/calibration-plans/` — 신규 디렉터리: CalibrationPlanDetailClient/ApprovalTimeline/PlanItemsTable/VersionHistory 이동
**검증:** `pnpm --filter frontend tsc --noEmit` + import 경로 오류 0

### Phase 1: 프론트엔드 SSOT + i18n
**목표:** 인라인 하드코딩과 i18n 누락을 제거하고 exportability/CAS 훅으로 통일
**변경 파일:**
1. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` — 수정: isApproved → isCalibrationPlanExportable, FORM_CATALOG fallback 파일명, EXPORT_REPORTS can() 추가
2. `apps/frontend/lib/api/calibration-plans-api.ts` — 수정: fallback 파일명 FORM_CATALOG 기반
3. `apps/frontend/lib/errors/calibration-plan-errors.ts` — 신규: NON_EXPORTABLE_PLAN_STATUS 에러 코드
4. `apps/frontend/messages/ko/errors.json` — 수정: NON_EXPORTABLE_PLAN_STATUS 키 추가
5. `apps/frontend/messages/en/errors.json` — 수정: 동일
6. `apps/frontend/app/(dashboard)/calibration-plans/[uuid]/page.tsx` — 수정: generateMetadata i18n
7. `apps/frontend/app/(dashboard)/calibration-plans/page.tsx` — 수정: skeleton title/description i18n
8. `apps/frontend/app/(dashboard)/calibration-plans/loading.tsx` — 수정: translator-aware
9. `apps/frontend/messages/ko/calibration.json` — 수정: planDetail.metadata.title/description 키
10. `apps/frontend/messages/en/calibration.json` — 수정: 동일
11. `apps/frontend/app/(dashboard)/calibration-plans/create/CreateCalibrationPlanContent.tsx` — 수정: __all__ → _all sentinel
**검증:** `pnpm --filter frontend tsc --noEmit`

### Phase 2: CAS 훅 + UX 개선
**목표:** CAS 가드 통일 + UX 이슈(sticky/optimistic/빈장비가드/reject minLength/year필터/에러재시도/skeleton)
**변경 파일:**
1. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` — 수정: submit/approve/reject → useCasGuardedMutation, sticky 헤더, reject minLength=10
2. `apps/frontend/components/calibration-plans/ApprovalTimeline.tsx` — 수정: reviewMutation → useCasGuardedMutation
3. `apps/frontend/components/calibration-plans/PlanItemsTable.tsx` — 수정: confirmItemMutation → useCasGuardedMutation + optimistic update
4. `apps/frontend/app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx` — 수정: year _all 옵션, ErrorState + retry, yearOptions memo
5. `apps/frontend/app/(dashboard)/calibration-plans/create/CreateCalibrationPlanContent.tsx` — 수정: 빈 장비 submit disabled + Alert CTA
6. `apps/frontend/app/(dashboard)/calibration-plans/[uuid]/page.tsx` — 수정: CalibrationPlanSkeleton 확장
7. `apps/frontend/app/(dashboard)/calibration-plans/page.tsx` — 수정: teams prefetch
8. `apps/frontend/lib/design-tokens/components/calibration-plans.ts` — 수정: stickyContainer 변형 추가
**검증:** `pnpm --filter frontend tsc --noEmit` + 브라우저 수동 확인

### Phase 3: a11y + 디자인 토큰
**목표:** WCAG 2.1 AA 접근성 이슈 6개 + 디자인 토큰 불일치 4개 수정
**변경 파일:**
1. `apps/frontend/app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx` — 수정: TableRow Link overlay (A1), KPI aria-label 분기 (A2), yearOptions memo (P4)
2. `apps/frontend/components/calibration-plans/PlanItemsTable.tsx` — 수정: role="region" + tabIndex (A3), Input aria-label (A4)
3. `apps/frontend/components/calibration-plans/ApprovalTimeline.tsx` — 수정: sr-only 요약 블록 (A5)
4. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` — 수정: Reject Label htmlFor (A6), motion-reduce 가드
5. `apps/frontend/lib/design-tokens/components/calibration-plans.ts` — 수정: KPI active 대비 강화 (D1), progress transition (D3)
6. `apps/frontend/components/ui/badge.tsx` — 수정: PlanStatusBadge 추출 또는 variant 추가 (D4)
7. `apps/frontend/messages/ko/calibration.json` — 수정: a11y 관련 i18n 키 (tableAriaLabel, timeline.ariaDescription, kpi labels)
8. `apps/frontend/messages/en/calibration.json` — 수정: 동일
**검증:** `pnpm --filter frontend tsc --noEmit`

### Phase 4: 시드 데이터 보강
**목표:** suwon+FCC_EMC_RF_SUWON 조합에 pending_approval 상태 추가, CPLAN_001 items 확장
**변경 파일:**
1. `apps/backend/src/database/utils/uuid-constants.ts` — 수정: CPLAN_007_ID + CPLAN_ITEM_013~018 추가
2. `apps/backend/src/database/seed-data/calibration/calibration-plans.seed.ts` — 수정: CPLAN_007 entry + CPLAN_001 items 4개 추가
**검증:** `pnpm --filter backend run db:reset` + SELECT 쿼리로 상태 분포 확인

### Phase 5: 백엔드 Export 구조 개선 + 테스트
**목표:** 3-service 분리, layout SSOT, xlsx-helper 재사용, 상태 가드, SkipResponseTransform, 파일명 SSOT, 단위테스트
**변경 파일:**
1. `apps/backend/src/modules/calibration-plans/calibration-plan.layout.ts` — 신규: SHEET_NAMES/DATA_START_ROW/COLUMN_COUNT/COLUMNS SSOT
2. `apps/backend/src/modules/calibration-plans/services/calibration-plan-export-data.service.ts` — 신규: DB 조회 + scope + EXPORTABLE_PLAN_STATUSES 가드
3. `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts` — 신규: xlsx-helper 기반 렌더링 + FORM_CATALOG 파일명
4. `apps/backend/src/modules/calibration-plans/calibration-plans-export.service.ts` — 수정: 얇은 orchestrator로 축소
5. `apps/backend/src/modules/calibration-plans/calibration-plans.controller.ts` — 수정: @SkipResponseTransform 추가
6. `apps/backend/src/modules/calibration-plans/calibration-plans.module.ts` — 수정: 신규 provider 2개 등록
7. `apps/backend/src/modules/calibration-plans/__tests__/calibration-plans-export.service.spec.ts` — 신규: 단위 테스트 (allowlist/빈items/파일명/ExcelJS reverse)
8. `apps/backend/src/modules/calibration-plans/__tests__/calibration-plan.layout.spec.ts` — 신규: layout 불변식
**검증:** `pnpm --filter backend test calibration-plans` + `pnpm --filter backend tsc --noEmit`

### Phase 6: Permission 정책 변경
**목표:** export 엔드포인트를 EXPORT_REPORTS로 통일 (선행 e2e grep 필수)
**변경 파일:**
1. `apps/backend/src/modules/calibration-plans/calibration-plans.controller.ts` — 수정: @RequirePermissions(VIEW_CALIBRATION_PLANS → EXPORT_REPORTS)
2. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` — 수정: can() Permission 변경
**검증:** `grep -rn "EXPORT_REPORTS\|downloadExcel" apps/frontend/tests/ apps/backend/test/` + `pnpm --filter frontend test:e2e`

### Phase 7: E2E 테스트
**목표:** wf-cplan-export.spec.ts 신설 — 파일 내용 실측 검증 + axe-core a11y 자동화
**변경 파일:**
1. `apps/frontend/tests/e2e/workflows/wf-cplan-export.spec.ts` — 신규: approved export/draft 400/PizZip 내용검증/axe-core
**검증:** `pnpm --filter frontend test:e2e -- wf-cplan-export`

## 전체 변경 파일 요약

### 신규 생성
| 파일 | 목적 |
|------|------|
| `apps/frontend/lib/utils/calibration-plan-exportability.ts` | export 허용 상태 allowlist |
| `apps/frontend/lib/utils/__tests__/calibration-plan-exportability.test.ts` | allowlist 단위 테스트 |
| `apps/frontend/hooks/use-cas-guarded-mutation.ts` | CAS fetch-before-mutate SSOT |
| `apps/frontend/components/calibration-plans/` | 기존 4개 파일 이동 디렉터리 |
| `apps/frontend/lib/errors/calibration-plan-errors.ts` | 에러 코드 SSOT |
| `apps/frontend/tests/e2e/workflows/wf-cplan-export.spec.ts` | E2E 파일 내용 검증 |
| `apps/backend/src/modules/calibration-plans/calibration-plan.layout.ts` | 셀 좌표 layout SSOT |
| `apps/backend/src/modules/calibration-plans/services/calibration-plan-export-data.service.ts` | DB 조회 + 상태 가드 |
| `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts` | xlsx 렌더링 |
| `apps/backend/src/modules/calibration-plans/__tests__/calibration-plans-export.service.spec.ts` | export 단위 테스트 |
| `apps/backend/src/modules/calibration-plans/__tests__/calibration-plan.layout.spec.ts` | layout 불변식 |

### 수정
| 파일 | 변경 의도 |
|------|----------|
| `apps/frontend/components/calibration/CalibrationPlanDetailClient.tsx` (→ calibration-plans/) | isCalibrationPlanExportable, CAS 훅, sticky, reject minLength |
| `apps/frontend/components/calibration/ApprovalTimeline.tsx` (→ calibration-plans/) | CAS 훅, sr-only |
| `apps/frontend/components/calibration/PlanItemsTable.tsx` (→ calibration-plans/) | CAS 훅 + optimistic, a11y |
| `apps/frontend/components/calibration/VersionHistory.tsx` (→ calibration-plans/) | 디렉터리 이동만 |
| `apps/frontend/lib/api/calibration-plans-api.ts` | FORM_CATALOG fallback 파일명 |
| `apps/frontend/app/(dashboard)/calibration-plans/*.tsx` | i18n, skeleton, prefetch, filter |
| `apps/frontend/lib/design-tokens/components/calibration-plans.ts` | stickyContainer, KPI active, progress |
| `apps/frontend/components/ui/badge.tsx` | PlanStatusBadge |
| `apps/frontend/messages/{ko,en}/*.json` | i18n 키, 에러 코드 |
| `apps/backend/src/modules/calibration-plans/calibration-plans-export.service.ts` | orchestrator로 축소 |
| `apps/backend/src/modules/calibration-plans/calibration-plans.controller.ts` | @SkipResponseTransform, Permission |
| `apps/backend/src/modules/calibration-plans/calibration-plans.module.ts` | provider 등록 |
| `apps/backend/src/database/utils/uuid-constants.ts` | 신규 UUID 상수 |
| `apps/backend/src/database/seed-data/calibration/calibration-plans.seed.ts` | CPLAN_007 + CPLAN_001 items |

## 의사결정 로그
- 2026-04-20: 플랜 Mode 2 확정. Planner 생략 (이미 승인된 플랜 존재)
- 2026-04-20: Phase 실행 순서 — 0(기반) → 1(SSOT) → 2(UX) → 3(a11y) → 4(seed) → 5(backend) → 6(permission) → 7(e2e) 순서로 의존성 최소화
- 2026-04-20: Permission = EXPORT_REPORTS (사용자 선택). test_engineer 자동 획득 여부 Phase 6에서 사전 grep 확인
- 2026-04-20: Component dir move = Phase 0에서 단일 커밋으로 진행 (git log --follow 유지)
