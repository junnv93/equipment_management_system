---
slug: data-migration-m1
phase: Phase 2
---

# Contract — data-migration M1

## 배경

Phase 2 M1: data-migration 모듈의 SSOT/Permission/State-machine 정합성 확보.
사전 탐색 결과 대부분 구현되어 있으며, 남은 gap은 `MigrationSessionStatus` SSOT 승격 + service 문자열 리터럴 7곳 교체.

---

## MUST Criteria

| ID  | 검증 기준 | 검증 명령 |
|-----|-----------|-----------|
| M1  | `tsc --noEmit` exit 0 (backend + schemas + shared-constants 3 workspace 모두) | `pnpm --filter backend run tsc --noEmit && pnpm --filter @equipment-management/schemas run tsc --noEmit && pnpm --filter @equipment-management/shared-constants run tsc --noEmit` |
| M2  | `PERFORM_DATA_MIGRATION` 상수가 `packages/shared-constants/src/permissions.ts`에 존재 (`'perform:data:migration'` 값) | `rg -n "PERFORM_DATA_MIGRATION = 'perform:data:migration'" packages/shared-constants/src/permissions.ts` — 1건 |
| M3  | `data-migration.controller.ts`에 `@RequirePermissions(Permission.PERFORM_DATA_MIGRATION)` 4곳 (preview/execute/template/error-report) | `rg -c "PERFORM_DATA_MIGRATION" apps/backend/src/modules/data-migration/data-migration.controller.ts` — 5건 (import 1 + decorator 4) |
| M4  | `MIGRATION_SESSION_TTL_MS` 상수가 `packages/shared-constants/src/business-rules.ts`에 export (값 `3_600_000`) | `rg -n "MIGRATION_SESSION_TTL_MS" packages/shared-constants/src/business-rules.ts` — 1건 |
| M5  | `data-migration.service.ts`에 로컬 `const SESSION_TTL_MS = ...` 정의 없음 (shared-constants SSOT import만 사용) | `rg -n "^const SESSION_TTL_MS\s*=" apps/backend/src/modules/data-migration` — 0건 |
| M6  | `MIGRATION_ROW_STATUS`, `MIGRATION_SHEET_TYPE`, `MIGRATION_SESSION_STATUS`가 `packages/schemas/src/data-migration.ts`에 `as const` 객체로 export. 각 enum 타입도 동일 파일에서 union type alias로 export | `rg -n "export const MIGRATION_ROW_STATUS\|export const MIGRATION_SHEET_TYPE\|export const MIGRATION_SESSION_STATUS" packages/schemas/src/data-migration.ts` — 3건 |
| M7  | `services/` 디렉토리 내 `'valid'`/`'warning'`/`'error'`/`'duplicate'` 문자열 리터럴이 (a) JSDoc 주석, (b) `Exclude<MigrationSheetType, 'equipment'>` 타입 narrowing 외에는 존재하지 않음 | `rg -n "status:\s*'(valid\|warning\|error\|duplicate)'" apps/backend/src/modules/data-migration/services` — 0건 |
| M8  | `fk-resolution.service.ts` 파일 존재 + `FkResolutionService` 클래스 + `resolveBatch` 메서드 export | `test -f apps/backend/src/modules/data-migration/services/fk-resolution.service.ts && rg -n "class FkResolutionService\|resolveBatch" apps/backend/src/modules/data-migration/services/fk-resolution.service.ts` |
| M9  | `MultiSheetMigrationSession` 인터페이스가 `status: MigrationSessionStatus` 필드를 포함 | `rg -n "status:\s*MigrationSessionStatus" apps/backend/src/modules/data-migration/types/data-migration.types.ts` — 1건 |
| M10 | `executeMultiSheet` 메서드가 session.status === `executing`/`completed`/`failed` 에 대해 각각 `ConflictException` throw (3 branch) + 성공 시 `executing` 전환, 완료 시 `completed`, 실패 시 `failed` 설정 | `rg -n "session.status ===|session.status =" apps/backend/src/modules/data-migration/services/data-migration.service.ts` — 최소 6건 (3 비교 + 3 할당) |
| M11 | `data-migration.service.ts`의 session status 문자열이 모두 `MIGRATION_SESSION_STATUS.*` 상수 참조로 교체됨 (raw `'preview'/'executing'/'completed'/'failed'` 리터럴 0건) | `rg -n "'preview'\|'executing'\|'completed'\|'failed'" apps/backend/src/modules/data-migration/services/data-migration.service.ts` — 0건 |
| M12 | `backend` 유닛 테스트 (data-migration 모듈) 통과 | `pnpm --filter backend run test -- data-migration` |
| M13 | 프론트엔드 nav-config가 `PERFORM_DATA_MIGRATION` 권한 사용 (메뉴 gate) | `rg -n "PERFORM_DATA_MIGRATION" apps/frontend/lib/navigation/nav-config.ts` — 1건 |

---

## SHOULD Criteria

| ID  | 기준 |
|-----|------|
| S1  | `packages/schemas/src/data-migration.ts`의 3개 SSOT 상수(`MIGRATION_ROW_STATUS` / `MIGRATION_SHEET_TYPE` / `MIGRATION_SESSION_STATUS`)가 동일한 `as const` + `type X = (typeof X)[keyof typeof X]` 패턴으로 일관성 유지 |
| S2  | `MigrationSessionStatus` type이 backend types 파일에서 re-export (모듈 내 단일 import 경로 보존) |
| S3  | review-architecture 실행 시 data-migration 영역 Critical 이슈 0건 |
| S4  | `service.ts`의 session status 비교/할당을 상수로 교체하는 과정에서 다른 비관련 수정(주석 정리/리네이밍/포매팅 재정렬) 없음 — surgical change 준수 |
| S5  | 변경 전/후 `pnpm --filter backend run lint` 에러 수 증가 없음 |

---

## 제외 사항 (Out of Scope)

- **FK resolution 동작 변경** — 현재 로직 유지, 성능/엣지 케이스 개선은 별도 M2~
- **Excel parser 구조 변경** — `excel-parser.service.ts` touch 금지
- **Validator 서비스 로직 변경** — `migration-validator.service.ts`, `history-validator.service.ts` touch 금지
- **DTO / Pipe 변경** — `dto/*.ts` touch 금지
- **Controller 시그니처 변경** — 메서드/파라미터/decorator 순서 변경 금지 (이미 적용된 `@RequirePermissions` 제외)
- **Frontend wizard 컴포넌트** — `components/data-migration/*` touch 금지
- **Frontend hooks 변경** — `hooks/use-data-migration.ts` touch 금지
- **API endpoint 추가/변경** — `@equipment-management/shared-constants` API_ENDPOINTS 변경 금지
- **마이그레이션 테스트 추가/변경** — 기존 `__tests__/*.spec.ts` 그대로 통과해야 함 (상수 전환 시 import 경로만 자동으로 일관성 유지됨)
- **Drizzle 스키마 / 마이그레이션 파일** — DB 레벨 변경 없음
- **E2E 테스트** — `apps/frontend/tests/e2e/features/data-migration/*` touch 금지
- **session state 확장** — `'aborted'`/`'rollback'` 등 추가 상태 도입 금지 (M1 범위는 4개 상태 SSOT 승격까지)
