# Evaluation: tech-debt-closure-20260513

**Date**: 2026-05-13
**Iteration**: 1
**Model**: claude-sonnet-4-6

## Verdict: FAIL

---

## MUST Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| M-1 R-4 dead code | PASS | `use-keyboard-shortcuts-scope.ts` 파일 삭제 확인. 잔여 참조 0건 (주석만 `KeyboardShortcutsContext.tsx:25`에 있으나 import/호출 없음) |
| M-2 R-3 extractKeyPaths throw | **FAIL** | 계약은 `Array.isArray(input)` 시 `throw new Error(...)` 요구. 실제 구현: leaf 처리로 `return prefix ? [prefix] : []` 반환. commit `6f7bacda`에서 throw 추가했으나 commit `e2dd1bab`에서 명시적으로 leaf 처리로 되돌림. 계약 미충족 |
| M-3 G-7 REVOCATION_KEYS | PASS | `cache-invalidation.ts:596` — `CheckoutCacheInvalidation.REVOCATION_KEYS` static readonly 6축 정의 확인 |
| M-4 G-6 revokeMutation TData | PASS | `revokeApproval` → `Promise<Checkout>` 반환, `revokeMutation` → `useOptimisticMutation<Checkout, string, Checkout>`, `invalidateKeys: CheckoutCacheInvalidation.REVOCATION_KEYS` 확인 |
| M-5 SH-4 DB index | PASS | `0060_add_rejection_presets_sort_order_idx.sql` 존재, `_journal.json` idx:60 entry 확인, `rejection-presets.ts:38` sortOrderIdx 정의 확인 |
| M-6 G-5 team orphan cleanup | PASS | `domain-events.ts` TEAM_DELETED 상수, `teams.service.ts:223` emitAsync 호출, `saved-views-team.listener.ts:31` @OnEvent, `saved-views.module.ts:12` provider 등록 모두 확인 |
| M-7 SH-5 server-time | PASS | `monitoring.controller.ts:63-67` @Public() + @Get('server-time') 확인, `api-endpoints.ts:373` MONITORING.SERVER_TIME, `use-server-time-offset.ts` 존재, `use-revocation-window.ts` serverTimeDeltaMs 파라미터 적용 확인 |
| M-8 SH-6 destination entity | PASS | schema/migration/journal/service(getDistinctDestinations+createDestination)/controller(POST /destinations)/hook/combobox 전체 확인 |
| M-9 tsc clean | PASS | `pnpm tsc --noEmit` 오류 0건 |
| M-10 tests pass | PASS | backend 1739 PASS, frontend 810 PASS, 실패 0건 |
| M-11 SSOT 준수 | PASS | 도메인 이벤트 하드코딩 0건, API endpoint 하드코딩 0건(e2e spec 파일 제외 — 프로덕션 코드 아님), inline any 0건 |
| M-12 타 도메인 침범 없음 | PASS | HEAD~5 대비 software-validations/qr/self-inspections/inspection-form-templates 변경 0건 |

---

## SHOULD Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| S-1 G-5 audit trail | PASS | `saved-views-team.listener.ts:43` logger.log (성공), `:54` logger.error (실패) 모두 존재 |
| S-2 SH-6 destinations/recent 유지 | PASS | `checkouts.controller.ts:894` @Get('destinations/recent') + `checkouts.service.ts:3777` getRecentDestinations 유지 확인 |
| S-3 SH-5 server-time SSR safe | PASS | `use-server-time-offset.ts:19` `typeof window === 'undefined'` 가드 존재 |
| S-4 SH-6 destination 409 방어 | PASS | `createDestination` — `.onConflictDoUpdate` upsert 패턴 적용, 중복 요청 시 기존 entity 반환 |

---

## Issues Found

### FAIL: M-2 — R-3 extractKeyPaths 배열 처리

**계약 요구사항** (`M-2`):
```
apps/frontend/lib/__tests__/i18n-parity.test.ts 의 extractKeyPaths 함수에서
Array.isArray(input) 시 throw new Error(...) 발생
배열 leaf로 처리하는 silent-fail 패턴 제거
```

**실제 구현** (현재 `i18n-parity.test.ts:33-38`):
```typescript
function extractKeyPaths(input: unknown, prefix = ''): string[] {
  if (Array.isArray(input)) {
    // 배열은 leaf 로 취급 — 내부 인덱스 키는 검증 대상 아님.
    return prefix ? [prefix] : [];  // ← throw 없음, leaf 반환
  }
```

**경위**:
- commit `6f7bacda` (Phase 1): `throw new Error(...)` 추가 (계약 충족)
- commit `e2dd1bab` (후속): 명시적으로 leaf 처리로 되돌림, 커밋 메시지: "extractKeyPaths 배열 → leaf 처리 (throw 제거)"
- exec plan 및 계약은 throw 요구를 유지한 채 업데이트되지 않음

**실제 탐지 메커니즘**: `KNOWN_ARRAY_KEYS` 스냅샷 테스트가 새 배열 키 추가 시 실패를 유발하는 대안적 방어를 제공하나, 계약이 명시한 `throw` 방식이 아님.

---

## Repair Instructions

### M-2 수정 방법 (두 가지 옵션)

**옵션 A**: 계약 준수 — `extractKeyPaths`를 throw로 복구
```typescript
function extractKeyPaths(input: unknown, prefix = ''): string[] {
  if (Array.isArray(input)) {
    throw new Error(
      `[R-3] i18n 배열 값 감지: "${prefix}". 배열을 i18n 구조에 추가할 수 없습니다. ` +
      `object 구조로 변환하거나 KNOWN_ARRAY_KEYS에 등록하세요.`
    );
  }
  ...
}
```
단, 기존 47개 배열 키를 가진 i18n 파일들이 존재하므로 `extractKeyPaths` 호출 전에 배열 키를 걸러내거나 테스트 픽스처 조정 필요.

**옵션 B**: 계약 업데이트 — 설계 변경을 공식화
- `tech-debt-closure-20260513.md` 계약의 M-2 기준을 현재 구현에 맞게 수정:
  - "throw new Error 발생" → "leaf 처리 + KNOWN_ARRAY_KEYS 스냅샷 테스트로 새 배열 키 변경 탐지"
- exec plan도 동일하게 업데이트

계약 재정의 없이 구현을 변경한 것이 근본 원인. 옵션 B가 실제 이유(47개 기존 배열 키)를 고려하면 현실적이나, 계약 업데이트가 반드시 선행되어야 함.

---

## Iteration 2 Update (2026-05-13)

**M-2 재평가 (rev-2 계약 기준)**

Contract rev-2에서 M-2 기준이 "throw 발생" → "leaf 처리 + KNOWN_ARRAY_KEYS 스냅샷" 방식으로 공식 변경됨. 해당 기준으로 재검증한 결과:

| Check | Result |
|-------|--------|
| `extractKeyPaths` — `Array.isArray` 시 leaf 반환 (throw 없음) | PASS (line 35-39) |
| `extractArrayPaths` 함수 신설 (line 51) | PASS |
| `KNOWN_ARRAY_KEYS` 상수 존재 (line 71) | PASS |
| `R-3: 배열 키 스냅샷` 테스트 존재 (line 145) | PASS |
| `pnpm --filter frontend run test -- i18n-parity` → 55 tests PASS | PASS |

**M-2 verdict: FAIL → PASS**

### 최종 종합 판정

모든 MUST 12건 PASS, SHOULD 4건 PASS.

**Overall Verdict: PASS (12/12 MUST, 4/4 SHOULD)**
