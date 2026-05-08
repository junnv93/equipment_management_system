---
slug: verify-route-metadata-phase3
type: contract
mode: 1
created: 2026-05-08
---

# Contract: verify-route-metadata Phase 3 승격

## Context

`verify-i18n` Step 8a/8b를 Phase 3 static analysis로 승격.
새 sub-route(`/equipment/[id]/calibration-history`) 추가 시 `route-metadata.ts` + `navigation.json`
누락이 production push 직전까지 catch 안 됐던 silent miss 회귀를 자동 차단.

## Deliverables

| File | Action |
|------|--------|
| `apps/frontend/scripts/verify-route-metadata.mjs` | 신규 생성 |
| `scripts/__tests__/verify-route-metadata.spec.mjs` | 신규 생성 |
| `package.json` (root) | `verify:route-metadata` 스크립트 추가 |
| `.husky/pre-push` | `route-map` step 추가 + spec 목록 확장 |
| `.claude/exec-plans/tech-debt-tracker.md` | 항목 [x] 체크 |

## MUST Criteria

### M-1: 스크립트 동작 — Step 8a
`apps/frontend/scripts/verify-route-metadata.mjs`를 현재 코드베이스 대상으로 실행 시
**`[verify-route-metadata] PASS`** 출력 + exit code 0.

```bash
node apps/frontend/scripts/verify-route-metadata.mjs
```

### M-2: 스크립트 동작 — Step 8b
routeMap에 없는 page.tsx가 있을 때 exit code 1 + `step-8b` 메시지 출력.

### M-3: 스크립트 동작 — Step 8a labelKey 누락 시 FAIL
ko/en navigation.json에 routeMap labelKey가 없을 때 exit code 1 + `step-8a` 메시지.

### M-4: pre-push 통합
`.husky/pre-push`에 `route-map` step 추가. 기존 pre-push가 여전히 exit 0으로 완료.

```bash
# 전체 pre-push 실행 가능 여부 확인 (실제 push 없이)
bash .husky/pre-push 2>&1 | tail -5
```

### M-5: root-spec 목록 확장
pre-push의 `root-spec` node --test 커맨드에 `verify-route-metadata.spec.mjs` 포함.

### M-6: spec — PASS 케이스
`node --test scripts/__tests__/verify-route-metadata.spec.mjs` exit code 0.
케이스: (1) 정상 fixture PASS, (2) 실제 코드베이스 PASS.

### M-7: spec — FAIL 케이스
(3) page.tsx 누락 → FAIL 케이스, (4) ko 누락 → FAIL 케이스.

### M-8: tsc --noEmit
새 `.mjs` 파일 도입 후 `pnpm tsc --noEmit` exit 0.

### M-9: tech-debt-tracker.md 항목 완료
`verify-i18n-step8-automation-promotion` 항목이 `[x]` 체크됨.

## SHOULD Criteria

### S-1: EXCLUDED_ROUTE_PREFIXES 주석
각 exclusion 항목에 이유 주석 (의도적 예외 vs 실수 구분).

### S-2: 실행 통계 출력
PASS 시 `(N routes, M labelKeys, P pages checked)` 통계 출력.

### S-3: orphan 키 informational 출력
navigation.json에 있지만 routeMap에서 미참조된 dead key를 stdout에 경고 출력 (FAIL 아님).
