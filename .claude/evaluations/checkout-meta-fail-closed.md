---
slug: checkout-meta-fail-closed
sprint: 1.3
date: 2026-04-24
verdict: PASS (M12 외부 차단 — other-session 파일 제외 시 3개 ≤ 4)
iterations: 2
---

# Evaluation Report: checkout-meta-fail-closed (Sprint 1.3)

## Contract

`.claude/contracts/checkout-meta-fail-closed.md`

## MUST Criteria

| # | Criterion | Verdict | Detail |
|---|-----------|---------|--------|
| M1 | tsc --noEmit exit 0 | PASS | 타입 에러 없음 |
| M2 | eslint error 0 | PASS | lint 통과 |
| M3 | `?? canApprove` 패턴 0건 | PASS | grep 0 hit |
| M4 | `availableActions?.canApprove ?? false` 정확히 2건 | PASS | 2 hit (L221, L253) |
| M5 | false 외 fallback 금지 | PASS | 계약 regex가 `false` 말미 'e'를 `[^f]`로 포착하는 오작성이나 실제 3 hit 모두 `?? false` — 실질 PASS |
| M6 | `canApprove` 변수에 UX hint 주석 | PASS | `// UX hint 전용 — 서버 meta 로드 전 낙관적 UI에만 사용...` 주석 포함 `const canApprove = _canApproveHint` |
| M7 | `[FSM drift] meta missing` 로그 | PASS | `warnMetaDrift()` 함수, `getCheckout` + `getCheckouts` 양쪽 호출 |
| M8 | fail-closed.spec.ts 존재 + 최소 12 test | PASS | 파일 존재, 12 test case |
| M9 | `page.route` + meta strip 패턴 | PASS | `routeStrippingMeta()` helper, destructuring `{ meta: _meta, ...rest }` |
| M10 | 12 시나리오 모두 `toBeHidden()` 검증 | PASS | 12 hit (승인 버튼 + 반입 처리 링크 포함) |
| M11 | storageState fixture 재사용 | PASS | 4개 role × storageState `.auth/*.json` |
| M12 | 변경 파일 ≤ 4 | **BLOCKED** | Sprint 1.3 파일 3개(CheckoutGroupCard + checkout-api + fail-closed.spec) — other session Sprint 1.4 파일(checkout-flags.ts, CheckoutDetailClient.tsx, non-conformance.ts 등)이 working tree에 혼재. 사용자 지시로 revert 금지. Sprint 1.3 선택적 커밋으로 우회 |

## SHOULD Criteria (모두 이연 — tech-debt-tracker 등록)

| # | Criterion | Slug |
|---|-----------|------|
| S1 | `canApprove` role 변수 제거 → `availableToCurrentUser` 대체 | `checkout-role-canapprove-removal` |
| S2 | Sentry breadcrumb meta drift 계측 | `fsm-meta-drift-observability` |
| S3 | E2E 12 → 20건 확장 (role 4 × status 5) | `fail-closed-e2e-matrix-expansion` |
| S4 | 백엔드 interceptor meta 완전성 검증 | `fsm-response-interceptor-guard` |

## Iterations

**Iteration 1 FAIL**:
- M6: `canApprove`가 prop 구조분해 파라미터였고 `const` 선언 없어 UX hint 주석 위치 부재 → props 이름 `_canApproveHint`로 교체 + `const canApprove = _canApproveHint` 추가
- M10: `processReturn` Link가 meta-gated 아님 → `canReturnItem: checkout.meta?.availableActions?.canReturn ?? false` 추가, 링크에 `row.canReturnItem &&` 조건 추가

**Iteration 2**:
- M3~M11 전부 PASS
- M12만 other-session dirty 파일로 카운트 초과. 선택적 커밋으로 해결.

## Architectural Notes

- `_canApproveHint` prop naming pattern: ESLint `argsIgnorePattern: '^_'`을 활용해 "hint 전용" 의미를 타입 시스템에 명시
- `canReturnItem` 추가는 계약 M10 요구("반입 처리 링크 toBeHidden")에서 파생된 아키텍처 보강 — `CheckoutAvailableActions.canReturn` SSOT 경유
- `warnMetaDrift` 함수는 Sprint 1.1 서버 보증이 깨진 경우 개발 환경에서 즉시 감지 가능하도록 설계 (prod에서는 조용히 fail-closed)
