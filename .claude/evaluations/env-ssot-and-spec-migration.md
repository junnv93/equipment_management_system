# Evaluation — env-ssot-and-spec-migration

**Date**: 2026-05-13
**Iteration**: 1
**Verdict**: PASS

---

## MUST Criteria

| # | 기준 | 결과 | 증거 |
|---|------|------|------|
| M-1 | `.env.local`에 "임시" 주석 0건 | PASS | `grep "임시" .env.local` → EXIT=1 (0 matches confirmed) |
| M-2 | `.env.local`에 `ENABLE_LOCAL_AUTH=true` 존재 | PASS | line 10: `ENABLE_LOCAL_AUTH=true` |
| M-3 | `.env.local`에 `INTERNAL_BACKEND_URL=http://localhost:3001` 존재 (permanent) | PASS | line 19: `INTERNAL_BACKEND_URL=http://localhost:3001`, "임시" 주석 없음, ADR-0006 헤더로 교체됨 |
| M-4 | `drizzle-stub.ts`에 `createDrizzleInsertWithReturningChain` export | PASS | line 125: `export function createDrizzleInsertWithReturningChain<T = unknown>` |
| M-5 | `drizzle-stub.ts`에 `createDrizzleUpdateWithReturningChain` export | PASS | line 147: `export function createDrizzleUpdateWithReturningChain<T = unknown>` |
| M-6 | `equipment.service.spec.ts`에 drizzle-stub SSOT import | PASS | lines 10–13: `import { createDrizzleSelectChain, createDrizzleInsertWithReturningChain, createDrizzleUpdateWithReturningChain } from '../../../common/__tests__/drizzle-stub'` |
| M-7 | `equipment.service.spec.ts`에 `mockReturnThis` monolithic chain 0건 (line 47–64 범위) | PASS | lines 47–64: 해당 범위에 `mockReturnThis` 없음. 파일 전체 0건 확인 (`grep -c` → 0) |
| M-8 | backend unit test PASS | PASS | 12/12 tests passed, 0 failed. `equipment.service.spec.ts` EXIT=0 |
| M-9 | backend tsc EXIT=0 | PASS | `pnpm exec tsc --noEmit` EXIT=0, 에러 없음 |
| M-10 | frontend build EXIT=0 | PASS | `pnpm exec next build` EXIT=0, "Compiled successfully" |

---

## SHOULD Status

| # | 기준 | 상태 | 비고 |
|---|------|------|------|
| S-1 | `.env.local` 섹션 구조가 `.env.example`와 동일 순서 | PASS (superset) | `.env.example` 4개 섹션(NextAuth, 인증 옵션, 백엔드 API, 서비스 간 통신)이 동일 순서로 포함. `.env.local`에는 추가 섹션(애플리케이션 설정, 로깅 설정, Azure AD) 존재 — 순서 위반 없음 |
| S-2 | `drizzle-stub.ts`에 신규 인터페이스 JSDoc | PASS | `DrizzleInsertWithReturningChain`(lines 61–70), `DrizzleUpdateWithReturningChain`(lines 72–82) 양쪽 모두 JSDoc 블록 존재. 구현 함수에도 JSDoc + 사용 예제 포함 |
| S-3 | `equipment.service.spec.ts` `findAll` 테스트: cache-level mock으로 DB 독립 | PASS | 두 `findAll` 테스트 모두 `mockCacheService.getOrSet.mockResolvedValue(expectedResult)` 패턴 사용. DB query 순서와 무관 |

---

## Backward Compatibility

기존 spec 3개가 구 export(`createDrizzleInsertChain`, `createDrizzleUpdateChain`, `createDrizzleSelectChain`, `createSequentialDrizzleStub`)를 계속 사용:

- `settings.service.spec.ts` — `createDrizzleInsertChain as createInsertChain`, `createDrizzleUpdateChain as createUpdateChain`
- `audit.service.spec.ts` — 동일 패턴
- `qr-access.service.spec.ts` — `createSequentialDrizzleStub`

4개 구 export 모두 `drizzle-stub.ts`에 유지됨. tsc EXIT=0으로 타입 안전성 확인. **회귀 없음.**

---

## Issues

없음. MUST 10/10 PASS, SHOULD 3/3 PASS.

---

## Recommendation

**PASS** — PR-2, PR-3 양쪽 모두 계약 기준 완전 충족.

- `.env.local`: "임시" 주석 제거, `ENABLE_LOCAL_AUTH=true` 추가, `INTERNAL_BACKEND_URL` permanent 선언, ADR-0006 헤더로 교체. 구조 청결.
- `drizzle-stub.ts`: 신규 `createDrizzleInsertWithReturningChain` / `createDrizzleUpdateWithReturningChain` export + 인터페이스 정의 + JSDoc 완비. 기존 4개 export 보존으로 backward compat 유지.
- `equipment.service.spec.ts`: monolithic mockReturnThis 패턴 0건, drizzle-stub SSOT import, 12/12 tests PASS, cache-level DB 독립 패턴(`findAll`) 적용.
