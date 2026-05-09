---
slug: verify-route-metadata
iteration: 1
date: 2026-05-10
---

# Evaluation Report — verify-route-metadata

## MUST Results

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| M-1 | `node apps/frontend/scripts/verify-route-metadata.mjs` exits 0 | PASS | stdout: `[verify-route-metadata] PASS (61 routes, 61 labelKeys, 72 pages checked)` / EXIT_CODE=0 |
| M-2 | spec 9케이스 모두 PASS | PASS | `node --test scripts/__tests__/verify-route-metadata.spec.mjs` → pass 9, fail 0, exit 0. Step 8a: 3/3, Step 8b: 3/3, Step 8c: 2/2, Integration: 1/1 |
| M-3 | pre-push hook에 `route-map` step + `verify-route-metadata.spec.mjs` 포함 | PASS | `grep -c "route-map\|verify-route-metadata" .husky/pre-push` → 2 (threshold ≥ 2 met) |
| M-4 | `pnpm tsc --noEmit` exits 0 | PASS | No output, EXIT_CODE=0 |
| M-5 | i18n-checks.md Step 8 섹션이 `verify-route-metadata.mjs` 또는 `verify:route-metadata` 명령을 참조 | PASS | `grep -c "verify-route-metadata\|verify:route-metadata" .claude/skills/verify-i18n/references/i18n-checks.md` → 5 (threshold ≥ 1 met) |
| M-6 | Step 8c(orphan 탐지)가 SKILL/doc에 문서화됨 | PASS | `grep -c "step-8c\|orphan\|8c" .claude/skills/verify-i18n/references/i18n-checks.md` → 11 (threshold ≥ 1 met) |

## Full Command Output

### M-1
```
[verify-route-metadata] PASS (61 routes, 61 labelKeys, 72 pages checked)
EXIT_CODE=0
```

### M-2
```
▶ Step 8a — labelKey → navigation.json
  ✔ 정상 fixture (ko + en 모두 있음) → PASS (37.823736ms)
  ✔ ko/navigation.json 에 labelKey 누락 → FAIL (38.004886ms)
  ✔ en/navigation.json 에 labelKey 누락 → FAIL (38.971174ms)
✔ Step 8a — labelKey → navigation.json (115.892542ms)
▶ Step 8b — page.tsx → routeMap
  ✔ page.tsx 가 routeMap 에 없으면 FAIL (35.696973ms)
  ✔ page.tsx 가 routeMap 에 있으면 PASS (37.930359ms)
  ✔ 동적 라우트 page.tsx → routeMap PASS (36.771029ms)
✔ Step 8b — page.tsx → routeMap (110.770045ms)
▶ Step 8c — orphan navigation.json keys
  ✔ routeMap에 없는 navigation.json 키 → FAIL (35.555128ms)
  ✔ 한쪽 locale에만 orphan 키 존재 → FAIL (42.36659ms)
✔ Step 8c — orphan navigation.json keys (78.337707ms)
▶ Integration — 실제 코드베이스
  ✔ 현재 코드베이스 전체 → PASS (47.084453ms)
✔ Integration — 실제 코드베이스 (47.358745ms)
ℹ tests 9
ℹ suites 4
ℹ pass 9
ℹ fail 0
EXIT_CODE=0
```

### M-3
```
2
EXIT_CODE=0
```

### M-4
```
(no output)
EXIT_CODE=0
```

### M-5
```
5
EXIT_CODE=0
```

### M-6
```
11
EXIT_CODE=0
```

## Verdict

PASS

## Repair Instructions

None required — all 6 MUST criteria passed.
