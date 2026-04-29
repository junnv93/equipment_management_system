---
slug: e2e-api-endpoints-migration
iteration: 1
---

# Contract: E2E API_ENDPOINTS 마이그레이션

## MUST Criteria (모두 PASS 필요)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | backend tsc exit 0 | `pnpm --filter backend run tsc --noEmit` → 오류 0건 |
| M2 | frontend tsc 회귀 없음 | `pnpm --filter frontend run tsc --noEmit` → 오류 0건 |
| M3 | shared-constants tsc exit 0 | `pnpm --filter shared-constants run tsc --noEmit` → 오류 0건 |
| M4 | 하드코딩 API 경로 잔존 0건 | grep 패턴으로 0 hits 확인 (아래 참조) |
| M5 | API_ENDPOINTS import 존재 | 수정된 모든 spec에 `from '@equipment-management/shared-constants'` 1회 이상 |
| M6 | toTestPath 정의 일원화 | `grep -rn "export const toTestPath" apps/backend/test` → 1 hit (test-paths.ts) |
| M7 | 각 spec에서 toTestPath 재정의 없음 | `grep -rn "const toTestPath\|function toTestPath" apps/backend/test/*.e2e-spec.ts` → 0 hits |
| M8 | EQUIPMENT.CREATE_SHARED 추가 | `grep -n "CREATE_SHARED" packages/shared-constants/src/api-endpoints.ts` → 1 hit |
| M9 | EQUIPMENT.REPAIR_HISTORY.SUMMARY 추가 | `grep -n "SUMMARY" packages/shared-constants/src/api-endpoints.ts` → REPAIR_HISTORY 블록 내 존재 |
| M10 | AUTH 확장 4개 필드 | `grep -n "BACKEND_LOGIN\|PROFILE:\|TEST:\|TEST_LOGIN" packages/shared-constants/src/api-endpoints.ts` → AUTH 블록 내 4개 |
| M11 | AUTH.LOGIN 기존 값 보존 | `grep -n "LOGIN: '/api/auth/callback/credentials'" packages/shared-constants/src/api-endpoints.ts` → 1 hit |
| M12 | 마이그레이션으로 인한 신규 실패 0건 | 마이그레이션 이전 대비 신규 실패 미발생. 기존 pre-existing 실패(23건→13건)는 경로 변환과 무관 |
| M13 | test-fixtures.ts/test-auth.ts 마이그레이션 완료 | helpers 파일에 하드코딩 경로 0건 |
| M14 | test-cleanup.ts toTestPath 이관 | test-cleanup.ts 에 `export const toTestPath` 선언 없음, `import { toTestPath } from './test-paths'` 존재 |

## SHOULD Criteria (실패 시 tech-debt 등록)

| # | Criterion |
|---|-----------|
| S1 | helpers/test-paths.ts 타입 안전성 — 명시적 반환 타입 + JSDoc |
| S2 | AUTH 신규 필드에 "E2E/백엔드 전용" JSDoc 주석 |
| S3 | backend lint 회귀 없음 |
| S4 | 미사용 import 없음 (각 spec 파일) |
| S5 | 쿼리스트링 템플릿 리터럴 일관성 (`+` 연결 금지) |
| S6 | test-isolation.e2e-spec.ts 미수정 |

## 하드코딩 잔존 확인 grep (M4)

```bash
grep -rn "\.\(get\|post\|patch\|put\|delete\)(['\`]/\(equipment\|checkouts\|calibration\|calibration-factors\|calibration-plans\|non-conformances\|cables\|users\|teams\|audit-logs\|auth\|data-migration\|repair-history\|reports\)" apps/backend/test
```

## Out of Scope
- 프론트엔드 코드 SSOT 개선
- `POST /checkouts/:id/return` 메서드 불일치 수정 → tech-debt
- AUTH.LOGIN 네이밍 변경 (프론트엔드 광범위 영향)
- test-isolation.e2e-spec.ts (supertest 호출 없음)
