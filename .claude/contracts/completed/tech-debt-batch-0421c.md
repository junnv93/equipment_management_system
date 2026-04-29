---
slug: tech-debt-batch-0421c
date: 2026-04-21
mode: 2
related_exec_plan: .claude/exec-plans/active/2026-04-21-tech-debt-batch-0421c.md
---

# Contract: tech-debt-batch-0421c

## Task

tech-debt-tracker.md open 항목 5종을 5개 Phase로 처리:
- Phase 1: class-DTO 마이그레이션 14개 (`z.infer` → `createZodDto`)
- Phase 2: CSP report DB 영속화 (`csp_reports` 테이블 + SecurityService 분리)
- Phase 3: `CreateFormState` 타입 분리 (계층 역의존 해소)
- Phase 4: k6 부하 테스트 스크립트 2종 신규 작성 (실행은 수동)
- Phase 5: DOCX renderer 매직 넘버 → named constant

## MUST Criteria (blocking — 하나라도 실패 시 FAIL)

| # | Criterion | Verification Command |
|---|-----------|----------------------|
| M1 | Backend tsc | `pnpm --filter backend run tsc --noEmit` exit 0 |
| M2 | Frontend tsc | `pnpm --filter frontend run tsc --noEmit` exit 0 |
| M3 | Backend build | `pnpm --filter backend run build` exit 0 |
| M4 | Backend unit tests | `pnpm --filter backend run test` exit 0 |
| M5 | Backend E2E tests | `pnpm --filter backend run test:e2e` exit 0 |
| M6 | Frontend tests | `pnpm --filter frontend run test` exit 0 |
| M7 | Phase 1 — type-only DTO 0건 | `grep -rnE "^export type [A-Z][A-Za-z0-9]*Dto\s*=\s*z\.infer" apps/backend/src/modules --include="*.dto.ts" \| wc -l` → 0 |
| M8 | Phase 1 — createZodDto DTO ≥ 15개 | `grep -rlE "extends createZodDto\(" apps/backend/src/modules --include="*.dto.ts" \| wc -l` → ≥ 15 |
| M9 | Phase 1 — 수동 Swagger class 2개 제거 | `! grep -rn "UpdateTeamSwaggerDto\|ExecuteEquipmentMigrationSwagger" apps/backend/src` |
| M10 | Phase 2 — Drizzle 스키마 파일 존재 | `test -f packages/db/src/schema/csp-reports.ts` |
| M11 | Phase 2 — schema index re-export | `grep -q "csp-reports" packages/db/src/schema/index.ts` |
| M12 | Phase 2 — migration SQL 파일 존재 | `ls apps/backend/drizzle/0041_csp_reports.sql` |
| M13 | Phase 2 — SecurityService 신규 + saveReport 메서드 | `test -f apps/backend/src/modules/security/security.service.ts && grep -q "saveReport" apps/backend/src/modules/security/security.service.ts` |
| M14 | Phase 2 — module provider 등록 | `grep -q "SecurityService" apps/backend/src/modules/security/security.module.ts` |
| M15 | Phase 2 — Controller가 saveReport 호출 | `grep -q "saveReport" apps/backend/src/modules/security/security.controller.ts` |
| M16 | Phase 2 — logger.warn 유지 (≥ 3건) | `test $(grep -c "this\.logger\.warn" apps/backend/src/modules/security/security.controller.ts) -ge 3` |
| M17 | Phase 3 — types 파일 신규 | `test -f "apps/frontend/app/(dashboard)/software/[id]/validation/_components/validation-create-form.types.ts"` |
| M18 | Phase 3 — Dialog에서 정의 제거 | `! grep -q "^export interface CreateFormState" "apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationCreateDialog.tsx"` |
| M19 | Phase 3 — 모든 import가 types 파일 경유 | `test $(grep -rn "CreateFormState" apps/frontend \| grep "import" \| grep -v "validation-create-form.types" \| wc -l) -eq 0` |
| M20 | Phase 4 — 3개 파일 존재 | `test -f scripts/load/software-validation-list.k6.js && test -f scripts/load/software-validation-export.k6.js && test -f scripts/load/README.md` |
| M21 | Phase 4 — threshold 명시 | `grep -q "p(95)<500" scripts/load/software-validation-list.k6.js && grep -q "p(95)<2000" scripts/load/software-validation-export.k6.js` |
| M22 | Phase 4 — setup() + login | `grep -q "setup()" scripts/load/software-validation-list.k6.js && grep -q "/api/auth/login" scripts/load/software-validation-list.k6.js` |
| M23 | Phase 4 — API_BASE 환경변수 패턴 | `grep -q "API_BASE" scripts/load/software-validation-list.k6.js && grep -q "API_BASE" scripts/load/software-validation-export.k6.js` |
| M24 | Phase 5 — layout 상수 2건 | `grep -q "MERGED_TEXT_COL" apps/backend/src/modules/checkouts/services/checkout-form.layout.ts && grep -q "MERGED_TEXT_COL" apps/backend/src/modules/equipment-imports/services/equipment-import-form.layout.ts` |
| M25 | Phase 5 — 병합 셀 리터럴 0건 | `! grep -nE "setCellValue\(0,\s*ROWS\.(checkoutConfirmText|returnConfirmText|usageConfirmText),\s*0," apps/backend/src/modules/checkouts/services/checkout-form-renderer.service.ts apps/backend/src/modules/equipment-imports/services/equipment-import-form-renderer.service.ts` |
| M26 | no-any (신규 코드) | `git diff HEAD -- apps/backend/src apps/frontend/app packages \| grep -E "^\+.*: any\b"` → 0줄 (단, `NodePgDatabase<typeof schema>` = `AppDatabase` 타입 사용 확인) |
| M27 | no-eslint-disable | `git diff HEAD -- apps/backend/src apps/frontend/app packages scripts/load \| grep -E "^\+.*eslint-disable"` → 0줄 |

## SHOULD Criteria (non-blocking — 기록만)

| # | Criterion |
|---|-----------|
| S1 | Phase 1 — 소비자 `import type` → `import` 전환 누락 없음 |
| S2 | Phase 2 — SecurityService unit spec (`saveReport` INSERT 호출 검증) |
| S3 | Phase 2 — `db:migrate` 실행 후 `csp_reports` 테이블 생성 확인 로그 |
| S4 | Phase 3 — `VendorValidationFields` / `SelfValidationFields` 모두 types 파일 경유 |
| S5 | Phase 4 — README에 p95 위반 시 원인 체크리스트 포함 |
| S6 | Phase 5 — renderer spec에 출력 byte-level 동등성 테스트 추가 |
| S7 | Phase 2 — 90일 TTL 배치 삭제 설계 노트 추가 |

## OUT-OF-SCOPE

- k6 실제 실행 + p95 수치 측정 (스크립트 작성만)
- CSP Grafana 대시보드
- ZodSerializerInterceptor 글로벌 승격 (2026-05-01 재평가)
- Phase 5 확산 (equipment-registry 등 다른 renderer)
- 90일 TTL 실제 cron (설계 노트까지만)

## Verification Script (all MUST)

```bash
#!/bin/bash
set -e

echo "=== M1-M6: Build & Test ==="
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run build
pnpm --filter backend run test
pnpm --filter backend run test:e2e
pnpm --filter frontend run test

echo "=== M7: type-only DTO 0건 ==="
test $(grep -rnE "^export type [A-Z][A-Za-z0-9]*Dto\s*=\s*z\.infer" apps/backend/src/modules --include="*.dto.ts" | wc -l) -eq 0

echo "=== M8: createZodDto ≥ 15 ==="
test $(grep -rlE "extends createZodDto\(" apps/backend/src/modules --include="*.dto.ts" | wc -l) -ge 15

echo "=== M9: 수동 Swagger class 제거 ==="
! grep -rn "UpdateTeamSwaggerDto\|ExecuteEquipmentMigrationSwagger" apps/backend/src

echo "=== M10-M16: Phase 2 CSP ==="
test -f packages/db/src/schema/csp-reports.ts
grep -q "csp-reports" packages/db/src/schema/index.ts
test -f apps/backend/drizzle/0041_csp_reports.sql
test -f apps/backend/src/modules/security/security.service.ts
grep -q "saveReport" apps/backend/src/modules/security/security.service.ts
grep -q "SecurityService" apps/backend/src/modules/security/security.module.ts
grep -q "saveReport" apps/backend/src/modules/security/security.controller.ts
test $(grep -c "this\.logger\.warn" apps/backend/src/modules/security/security.controller.ts) -ge 3

echo "=== M17-M19: Phase 3 CreateFormState ==="
test -f "apps/frontend/app/(dashboard)/software/[id]/validation/_components/validation-create-form.types.ts"
! grep -q "^export interface CreateFormState" "apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationCreateDialog.tsx"
test $(grep -rn "CreateFormState" apps/frontend | grep "import" | grep -v "validation-create-form.types" | wc -l) -eq 0

echo "=== M20-M23: Phase 4 k6 ==="
test -f scripts/load/software-validation-list.k6.js
test -f scripts/load/software-validation-export.k6.js
test -f scripts/load/README.md
grep -q "p(95)<500" scripts/load/software-validation-list.k6.js
grep -q "p(95)<2000" scripts/load/software-validation-export.k6.js
grep -q "setup()" scripts/load/software-validation-list.k6.js
grep -q "/api/auth/login" scripts/load/software-validation-list.k6.js
grep -q "API_BASE" scripts/load/software-validation-list.k6.js
grep -q "API_BASE" scripts/load/software-validation-export.k6.js

echo "=== M24-M25: Phase 5 renderer ==="
grep -q "MERGED_TEXT_COL" apps/backend/src/modules/checkouts/services/checkout-form.layout.ts
grep -q "MERGED_TEXT_COL" apps/backend/src/modules/equipment-imports/services/equipment-import-form.layout.ts
! grep -nE "setCellValue\(0,\s*ROWS\.(checkoutConfirmText|returnConfirmText|usageConfirmText),\s*0," \
  apps/backend/src/modules/checkouts/services/checkout-form-renderer.service.ts \
  apps/backend/src/modules/equipment-imports/services/equipment-import-form-renderer.service.ts

echo "=== M26-M27: 품질 게이트 ==="
test $(git diff HEAD -- apps/backend/src apps/frontend/app packages | grep -cE "^\+.*: any\b") -eq 0
test $(git diff HEAD -- apps/backend/src apps/frontend/app packages scripts/load | grep -cE "^\+.*eslint-disable") -eq 0

echo "=== ALL MUST PASS ==="
```
