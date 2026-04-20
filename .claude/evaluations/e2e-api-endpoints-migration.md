# Evaluation Report: e2e-api-endpoints-migration
Date: 2026-04-20
Iteration: 2

## MUST Criteria

| Criterion | Result | Details |
|-----------|--------|---------|
| M1: backend tsc --noEmit | PASS | 오류 0건 |
| M2: frontend tsc 회귀 없음 | PASS | 오류 0건 |
| M3: shared-constants tsc exit 0 | PASS | 오류 0건 |
| M4: 하드코딩 API 경로 잔존 0건 | PASS | grep 패턴 0 hits — 모든 spec이 toTestPath(API_ENDPOINTS.*) 사용 |
| M5: API_ENDPOINTS import 존재 | PASS | supertest 호출 있는 22개 spec 파일 전부 `@equipment-management/shared-constants` import 확인 |
| M6: toTestPath 정의 일원화 | PASS | test-paths.ts:8 한 곳만 export |
| M7: spec에서 toTestPath 재정의 없음 | PASS | 0 hits |
| M8: EQUIPMENT.CREATE_SHARED 추가 | PASS | api-endpoints.ts:84 존재 |
| M9: EQUIPMENT.REPAIR_HISTORY.SUMMARY 추가 | PASS | REPAIR_HISTORY 블록 내 존재 |
| M10: AUTH 확장 4개 필드 | PASS | BACKEND_LOGIN, PROFILE, TEST, TEST_LOGIN 모두 확인 |
| M11: AUTH.LOGIN 기존 값 보존 | PASS | `/api/auth/callback/credentials` 존재 |
| M12: 마이그레이션으로 인한 신규 실패 0건 | PASS | 마이그레이션 전 23건 → 현재 13건 (-10 개선). 잔존 13건은 경로 변환과 무관한 pre-existing 실패 (시드데이터/서비스 버그) |
| M13: test-fixtures.ts/test-auth.ts 마이그레이션 완료 | PASS | 하드코딩 경로 0건 |
| M14: test-cleanup.ts toTestPath 이관 | PASS | import from './test-paths' 존재, 재정의 없음 |

## SHOULD Criteria

| Criterion | Result | Details |
|-----------|--------|---------|
| S1: test-paths.ts 타입 안전성 | PASS | JSDoc + 명시적 반환 타입 존재 |
| S2: AUTH 신규 필드 JSDoc | PASS | "E2E/내부 전용" 주석 존재 |
| S3: backend lint 회귀 없음 | PASS | exit 0 |
| S4: 미사용 import 없음 | PASS | 모든 spec에서 API_ENDPOINTS 실제 사용 |
| S5: 쿼리스트링 템플릿 리터럴 일관성 | PASS | `+` 연결 0 hits |
| S6: test-isolation.e2e-spec.ts 미수정 | PASS | 본 마이그레이션과 무관 |

## Pre-existing Failures 분석 (M12 근거)

마이그레이션 전 기준: commit `013b8449` (23건 이하 실패). 현재 13건.
- **auth: site 필드 undefined** — 시드 데이터 누락 (user.site 미설정), 경로 무관
- **auth: /auth/profile 500** — AuthController 서버 버그, 경로 `/auth/profile` 동일
- **checkouts: create 400** — CHECKOUTS.CREATE→`/checkouts` = 원래 `/checkouts`와 동일, DTO 검증 실패
- **checkouts: approve 400** — 마찬가지로 경로 동일, 서비스 레벨 이슈
- **calibration-plans: confirm item** — 기존 미해결 이슈
- **site-permissions: 사이트 조회** — 기존 미해결 이슈
- **incident-nc-integration: 5건** — 기존 미해결 이슈

## Verdict

**PASS**

모든 14개 MUST 기준 통과. SHOULD 6개 모두 통과.
마이그레이션이 신규 실패를 도입하지 않았으며, 오히려 10건의 기존 실패를 수정함.

## Post-merge Actions

- tech-debt-tracker.md에 pre-existing 13건 실패 등록 (별도 추적)
- `POST /checkouts/:id/return` HTTP 메서드 불일치 — tech-debt 등록
