# Contract: tech-debt-batch-0421

## Task
tech-debt-tracker Open 항목 9개 구현 + 3개 tracker 정리 (코드 변경 없음)

## MUST Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| M1 | Backend tsc | `pnpm --filter backend exec tsc --noEmit` exit 0 |
| M2 | Frontend tsc | `pnpm --filter frontend exec tsc --noEmit` exit 0 |
| M3 | Backend tests | `pnpm --filter backend run test` exit 0 |
| M4 | Frontend lint | `pnpm --filter frontend run lint` exit 0 |
| M5 | A1 — 절대경로 제거 | `grep -n "'/uploads/" apps/backend/src/database/seed-data/admin/equipment-attachments.seed.ts` = 0 matches |
| M6 | A1 — placeholder 루틴 존재 | seed-test-new.ts에 ensureSeedPlaceholderAttachments 함수 존재 |
| M7 | B2 — stale 판정 로직 | data-migration.service.ts에 executionStartedAt + MIGRATION_EXECUTION_TIMEOUT_MS 분기 존재 |
| M8 | B2 — SSOT 상수 | MIGRATION_EXECUTION_TIMEOUT_MS가 shared-constants에 export, 서비스에서 import |
| M9 | B2 — 회귀 스펙 | data-migration.service.spec에 stale 판정 + timeout 이내 ConflictException 스펙 PASS |
| M10 | C2 — alignment 토큰화 | `grep -n "alignment = {" apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts` = 0 matches |
| M11 | C2 — layout 토큰 존재 | calibration-plan.layout.ts에 ALIGNMENT 객체 export |
| M12 | C4 — .first() 제거 | `grep -c '\.first()' apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts` = 0 |
| M13 | C4 — helper import | wf-35 파일에 toast-helpers import 존재 |
| M14 | C5 — CPLAN_008 주석 | calibration-plans.seed.ts CPLAN_008 블록에 bulk-confirm 주석 존재 |
| M15 | E2 — DocumentTable 크기 | wc -l DocumentTable.tsx ≤ 120 |
| M16 | E2 — 서브컴포넌트 존재 | DocumentUploadButton.tsx + DocumentTableRow.tsx 파일 존재 |
| M17 | E1 — SoftwareValidationContent 크기 | wc -l SoftwareValidationContent.tsx ≤ 500 |
| M18 | E1 — 서브컴포넌트 존재 | ValidationFunctionsTable.tsx + ValidationControlTable.tsx + ValidationActionsBar.tsx 파일 존재 |
| M19 | C3 — 문서 섹션 | frontend-patterns.md에 "API GET 응답 패턴" heading 존재 |
| M20 | F1 — 운영가이드 존재 | docs/references/software-validation-workflow.md 파일 존재 |
| M21 | F1 — 추측 없음 | 절차서 수치(일/년/시간) 인용 시 출처 병기 또는 TBD 처리 |
| M22 | SSOT 준수 | 신규 코드에 role/permission/URL 리터럴 없음 |
| M23 | any 금지 | 신규/수정 코드 any 사용 없음 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | A1 placeholder 생성 실패 시 warn only (non-fatal) |
| S2 | B2 stale 판정에 logger.warn + sessionId + elapsedMs 로깅 |
| S3 | E2 서브컴포넌트 각 ≤ 100줄 |
| S4 | E1 서브컴포넌트 각 ≤ 150줄 |
| S5 | E1 ValidationFunctionsTable이 acquisition/processing 모두 처리 (재사용) |
| S6 | F1 말미에 TBD 섹션 (확인 필요 수치 목록) |

## OUT-OF-SCOPE

- Docker Phase K / CSP 영속화 / ZodSerializerInterceptor 글로벌 승격
- Drizzle snapshot (TTY) / 브라우저 수동 검증 / k6 부하 테스트
- class-DTO 마이그레이션 14개 (트리거 없음)
- Multi-form 3-way 분리 / History-card E2E / UL-QP-19-01 E2E
- M4.8 계약 모순 / 사용자 결정 대기 커밋 귀속

## Verification Commands

```bash
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend run lint
grep -n "'/uploads/" apps/backend/src/database/seed-data/admin/equipment-attachments.seed.ts
grep -n "alignment = {" apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts
grep -c '\.first()' apps/frontend/tests/e2e/workflows/wf-35-cas-ui-recovery.spec.ts
wc -l "apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/DocumentTable.tsx"
wc -l "apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx"
```
