# 스프린트 계약: UL-QP-18-09 소프트웨어 유효성 확인 전면 재정비

## 생성 시점
2026-04-19T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### Phase 1 (Schema)
- [ ] `pnpm tsc --noEmit` (backend + packages) 에러 0
- [ ] `pnpm --filter backend test -- software-validations` PASS (기존 + 신규 10+케이스)
- [ ] Migration NOT VALID → VALIDATE PASS, 위반 row 0건
- [ ] `jsonb_typeof(acquisition_functions)` = `array` (이중 인코딩 없음)
- [ ] `packages/schemas/src/software-validation/function-item.ts` 존재: `independentMethod`, `acceptanceCriteria`, `equipmentFunction`, `expectedFunction`, `observedFunction`, `attachmentDocumentId` 필드 포함
- [ ] seed JSONB 이중 인코딩 제거: `JSON.stringify` 호출 없음

#### Phase 2 (Service)
- [ ] self-approval 시도 → 403 ForbiddenException (spec PASS)
- [ ] dual-same-person qualityApprove → 403 ForbiddenException (spec PASS)
- [ ] quality_approved 이벤트 후 `test_software.latest_validation_id` 업데이트 (spec PASS)
- [ ] softwareVersion 변경 → `latest_validation_id` nullify + 재검증 알림 이벤트 (spec PASS)
- [ ] `GET /api/software-validations?status=submitted` → site-scoped 목록 반환
- [ ] `pnpm --filter backend test -- software-validations` 20+ 케이스 PASS

#### Phase 3 (Frontend)
- [ ] `pnpm tsc --noEmit` (frontend) 에러 0
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `grep -rn 'formNumber="UL-QP-18-09"' apps/frontend/` = 0 (하드코딩 제거)
- [ ] verify-ssot PASS (softwareValidations queryKeys SSOT 사용)
- [ ] verify-hardcoding PASS (하드코딩 URL/상수 0)
- [ ] `apps/frontend/app/(dashboard)/software-validations/page.tsx` 존재
- [ ] Sidebar에 software-validations 메뉴 항목 존재
- [ ] ValidationControlTable에 6필드 (equipmentFunction, expectedFunction, observedFunction, independentMethod, acceptanceCriteria, attachment) 포함

#### Phase 4 (Export)
- [ ] `pnpm --filter backend test -- software-validation-renderer` 12+ 케이스 PASS
- [ ] `wc -l apps/backend/src/modules/reports/form-template-export.service.ts` < 1280
- [ ] `grep -n "acquisitionFunctions\|processingFunctions\|parseJsonbFunctionArray" apps/backend/src/modules/reports/form-template-export.service.ts` = 0
- [ ] `apps/backend/src/common/http/content-disposition.util.ts` 존재
- [ ] T4 R1 셀에 `independentMethod` 값 렌더 (means/criteria 교정)

#### Phase 5 (Seed)
- [ ] `SW_VALID_P0045_IECSOFT` (또는 동등한 상수) seed 존재
- [ ] P0045 seed: `vendorName = 'Newtons4th Ltd'`, `softwareVersion` = IECSoft 관련 버전, `receivedDate = 2021-09-22`, status = `quality_approved`
- [ ] db:reset 후 DOCX 다운로드 성공 (HTTP 200, Content-Type octet-stream)

#### Phase 7 (Verification)
- [ ] `pnpm --filter frontend test:e2e -- wf-14b-software-validation` PASS (10+스텝)
- [ ] `node scripts/self-audit.mjs --all` exit 0
- [ ] `docs/references/software-validation-workflow.md` 존재

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] axe-core violations = 0 (ValidationDetailContent, software-validations 라우트)
- [ ] export DOCX p95 < 500ms (k6 또는 hey 50회 기준)
- [ ] frontend bundle delta < +15KB gzipped
- [ ] software-validations 모듈 test line coverage ≥ 85%
- [ ] `docs/operations/uat-UL-QP-18-09.md` UAT 체크리스트 포함

### 적용 verify 스킬
- verify-ssot (SSOT 위반 탐지)
- verify-hardcoding (하드코딩 URL/상수)
- verify-zod (Zod 스키마 패턴)
- verify-workflows (워크플로우 상태 전이)
- verify-cache-events (이벤트/캐시 아키텍처)
- verify-frontend-state (useOptimisticMutation, setQueryData 금지)
- verify-security (self-approval, site-scope)
- verify-implementation (종합)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
