---
slug: data-migration-m1
iteration: 1
verdict: FAIL
---

# Evaluation Report — data-migration-m1

## MUST Criteria

| ID | Criterion | Result | Verdict |
|----|-----------|--------|---------|
| M1 | tsc --noEmit exit 0 (backend + schemas + shared-constants 3 workspace) | backend exit 0 (출력 없음), schemas exit 0 (출력 없음), shared-constants exit 0 (출력 없음) | PASS |
| M2 | `PERFORM_DATA_MIGRATION = 'perform:data:migration'`가 `permissions.ts`에 존재 | line 212: `PERFORM_DATA_MIGRATION = 'perform:data:migration',` 확인 | PASS |
| M3 | `data-migration.controller.ts`에서 `rg -c "PERFORM_DATA_MIGRATION"` = 5건 (import 1 + decorator 4) | **결과: 4건** — decorator 4건만 존재. import 행(line 29)은 `Permission` enum 전체 import이므로 `PERFORM_DATA_MIGRATION` 문자열 미포함 | **FAIL** |
| M4 | `MIGRATION_SESSION_TTL_MS`가 `business-rules.ts`에 export (값 `3_600_000`) | line 123: `export const MIGRATION_SESSION_TTL_MS = 3_600_000;` 확인 | PASS |
| M5 | `data-migration.service.ts`에 로컬 `const SESSION_TTL_MS = ...` 정의 없음 | 0건 — 로컬 정의 없음 확인 | PASS |
| M6 | `MIGRATION_ROW_STATUS`, `MIGRATION_SHEET_TYPE`, `MIGRATION_SESSION_STATUS` 3개가 `packages/schemas/src/data-migration.ts`에 `as const` export | line 10, 79, 90 — 3개 모두 존재 | PASS |
| M7 | `services/` 내 `status: 'valid'/'warning'/'error'/'duplicate'` 리터럴 0건 | 0건 — 없음 | PASS |
| M8 | `fk-resolution.service.ts` 존재 + `FkResolutionService` 클래스 + `resolveBatch` 메서드 | FILE_EXISTS, line 49: `export class FkResolutionService`, line 64: `async resolveBatch(` | PASS |
| M9 | `MultiSheetMigrationSession`에 `status: MigrationSessionStatus` 필드 | line 85: `status: MigrationSessionStatus;` 확인 | PASS |
| M10 | `session.status ===` 3건 + `session.status =` 3건 = 최소 6건 | line 378/384/390 (비교 3건) + line 398/814/848 (할당 3건) = 6건 | PASS |
| M11 | `data-migration.service.ts` 내 raw `'preview'/'executing'/'completed'/'failed'` 리터럴 0건 | 0건 — 전부 `MIGRATION_SESSION_STATUS.*`로 교체 확인 | PASS |
| M12 | backend unit test (data-migration 모듈) 통과 | 4 suites, 54 tests PASS (16.3s) | PASS |
| M13 | 프론트엔드 nav-config에 `PERFORM_DATA_MIGRATION` 사용 | line 151: `requiredPermission: Permission.PERFORM_DATA_MIGRATION,` 확인 | PASS |

## SHOULD Criteria

| ID | Criterion | Verdict |
|----|-----------|---------|
| S1 | 3개 SSOT 상수가 동일한 `as const` + `type X = (typeof X)[keyof typeof X]` 패턴으로 일관성 유지 | PASS — line 15/18, 84/87, 99/102 모두 동일 패턴 |
| S2 | `MigrationSessionStatus` type이 backend types 파일에서 re-export | PASS — import(line 12) + export(line 24) 모두 확인 |
| S3 | review-architecture 실행 시 data-migration 영역 Critical 이슈 0건 | 미실행 (시간 제약) — 평가 범위 외 |
| S4 | service.ts 변경이 상수 교체 7곳 + import 1줄 추가에 국한 (비관련 수정 없음) | PASS — git diff 확인 결과 import 추가 1행 + raw literal → 상수 교체 7행만 변경, 주석/리네이밍/포매팅 재정렬 없음 |
| S5 | `pnpm --filter backend run lint` 에러 수 증가 없음 | PASS — lint --fix 실행 후 에러 없음 |

## Issues

### M3 FAIL: controller `rg -c "PERFORM_DATA_MIGRATION"` 4건 (계약 요건 5건)

**근본 원인**: `data-migration.controller.ts` line 29의 import 구문이 `Permission` enum 전체를 import하므로 `PERFORM_DATA_MIGRATION` 문자열이 해당 행에 나타나지 않음:

```typescript
// 현재 (line 29)
import { Permission, MigrationErrorCode } from '@equipment-management/shared-constants';
```

decorator 4곳에서는 `Permission.PERFORM_DATA_MIGRATION`으로 정확히 사용하고 있으나, `rg -c "PERFORM_DATA_MIGRATION"`는 import 행에서 매칭되지 않아 4건만 반환.

**계약 해석 논쟁**: 계약 검증 명령이 "import 1 + decorator 4 = 5건"이라고 명시했지만, 이는 `Permission.PERFORM_DATA_MIGRATION`을 named import로 직접 가져오는 패턴(`import { Permission, PERFORM_DATA_MIGRATION }`)을 상정한 것으로 보임. 그러나 실제 코드는 `Permission` enum을 통해 접근하는 패턴이며, SSOT 규칙(`Permission.PERFORM_DATA_MIGRATION`)에는 부합.

**수정 방법 (계약 기준 충족을 위해)**:
계약 검증 명령 자체를 수정하거나, import 행에 `PERFORM_DATA_MIGRATION`이 직접 포함되도록 변경. 단, 후자는 현재 enum 기반 import 패턴을 파괴하므로 계약 재검토가 바람직.

**대안적 판단**: 기능은 완전히 구현되어 있고 (decorator 4곳 모두 `Permission.PERFORM_DATA_MIGRATION` 사용), tsc/lint/test 모두 통과. M3 실패는 계약 검증 명령의 카운트 가정 오류로 해석 가능하나, **계약 기준 그대로 판정 시 FAIL**.

## Summary

13개 MUST 기준 중 12개 PASS, 1개 FAIL(M3). M3 실패는 계약 검증 명령이 `rg -c "PERFORM_DATA_MIGRATION"` = 5건을 요구하나 실제 4건만 반환되는 문제다. import 행에서 `Permission` enum 전체를 가져오는 패턴이므로 `PERFORM_DATA_MIGRATION` 문자열이 import 행에 미등장한다. 실질적 기능 구현(decorator 4곳 적용, tsc/lint/test 전원 통과, SSOT 상수 교체 7건 완료)은 정상이나, 계약 명시 카운트 기준 미달로 verdict는 FAIL.
