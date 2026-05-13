# Evaluation: cache-wholesale-migration-inspection-templates

**Sprint**: `cache-wholesale-migration-inspection-templates`
**Mode**: Mode 2 (Full harness — Planner → Generator → Evaluator)
**Date**: 2026-05-13
**Iter**: 1 (PASS)
**Commit**: `28c41b1a`

## 결과 요약

| 항목 | 결과 |
|------|------|
| MUST (M-1 ~ M-8) | 8/8 PASS |
| SHOULD (S-1 ~ S-3) | 3/3 적용 (commit + tracker + evaluation) |
| 라운드 #4 사전 자기검토 갭 | 3건 식별 → 2건 closure (HIGH/MED), 1건 분리 (LOW — out of scope) |

## MUST 검증 산출물

### M-1: SSOT 정합 — INTERMEDIATE_INSPECTIONS 값 갱신

```bash
$ grep -E "INTERMEDIATE_INSPECTIONS:\s*'calibration:inspections:'" apps/backend/src/common/cache/cache-key-prefixes.ts
# 1건 (값 갱신 완료)

$ grep -nE "CACHE_KEY_PREFIXES\.CALIBRATION\s*\+\s*'inspections:'" apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts
# 0건 (인라인 concat 제거)

$ grep -nE "CACHE_KEY_PREFIXES\.INTERMEDIATE_INSPECTIONS" apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts
# 43:  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.INTERMEDIATE_INSPECTIONS;
```

### M-2 ~ M-5: registry wholesale → specific + 자기-도메인 wholesale 제거 + LEGACY allowlist 제거

```bash
# M-2: 3 INSPECTION_TEMPLATE_* entry 내 wholesale 패턴 0건
$ awk '/\[CACHE_EVENTS\.INSPECTION_TEMPLATE_(CREATED|UPDATED|VERSION_UP)\]/,/^  \},$/' apps/backend/src/common/cache/cache-event.registry.ts | grep -cE '\$\{CACHE_KEY_PREFIXES\.[A-Z_]+\}\*`'
0

# M-3a: intermediate sub-prefix 3건 (list-equip + list + detail)
$ awk '/\[CACHE_EVENTS\.INSPECTION_TEMPLATE_CREATED\]/,/^  \},$/' apps/backend/src/common/cache/cache-event.registry.ts | grep -cE 'INTERMEDIATE_INSPECTIONS\}(list-equip|list|detail):\*'
3

# M-3b: self sub-prefix 2건 (list-equip + detail)
$ awk '/\[CACHE_EVENTS\.INSPECTION_TEMPLATE_CREATED\]/,/^  \},$/' apps/backend/src/common/cache/cache-event.registry.ts | grep -cE 'SELF_INSPECTIONS\}(list-equip|detail):\*'
2

# M-4: 자기-도메인 INSPECTION_FORM_TEMPLATES wholesale 제거
$ awk '/\[CACHE_EVENTS\.INSPECTION_TEMPLATE_(CREATED|UPDATED|VERSION_UP)\]/,/^  \},$/' apps/backend/src/common/cache/cache-event.registry.ts | grep -cE 'INSPECTION_FORM_TEMPLATES'
0

# M-5: LEGACY allowlist 3 entry 제거
$ grep -cE "'CACHE_EVENTS\.INSPECTION_TEMPLATE_(CREATED|UPDATED|VERSION_UP)'" apps/backend/src/common/cache/cache-event.registry.ts
0
```

### M-6: audit script PASS

```bash
$ node scripts/audit-cache-event-channels.mjs
mirror pair 후보: 6개 (synonym: 1개)
VIOLATIONS: 0
POTENTIAL:  6
# EXIT 0
```

POTENTIAL 6건은 pre-existing (sw-validation 4, calibration 1, test-software 1) — sprint scope 외.

### M-7: tsc + lint EXIT 0

```bash
$ cd apps/backend && pnpm exec tsc --noEmit
# EXIT 0

$ pnpm exec eslint --no-fix src/common/cache/cache-key-prefixes.ts src/common/cache/cache-event.registry.ts src/modules/intermediate-inspections/intermediate-inspections.service.ts
# EXIT 0
```

전체 backend lint 는 `checkouts.controller.ts:148` 의 2건 error 가 있으나 이는 `inbound-bulk-receive-integration` 다른 세션 active 변경 — 본 sprint scope 외 (회피 대상).

### M-8: 도메인 spec PASS

```bash
$ pnpm exec jest --testPathPattern="inspection-form-templates"
Test Suites: 3 passed
Tests:       28 passed, 28 total

$ pnpm exec jest --testPathPattern="intermediate-inspections|self-inspections"
Test Suites: 6 passed
Tests:       95 passed, 95 total

$ pnpm exec jest --testPathPattern="cache-event"
Test Suites: 2 passed
Tests:       28 passed, 28 total
```

합계: 11 suite / 151 test PASS.

## 라운드 #4 사전 자기검토 갭 closure

### 갭-1 (HIGH) SSOT mismatch — closure

**발견**: `CACHE_KEY_PREFIXES.INTERMEDIATE_INSPECTIONS = 'intermediate-inspections:'` 은 dead constant. 실제 `intermediate-inspections.service.ts:43` 은 `CACHE_KEY_PREFIXES.CALIBRATION + 'inspections:'` (= `calibration:inspections:`) 인라인 concat 사용 → registry wholesale `${INTERMEDIATE_INSPECTIONS}*` 는 **0 key 매칭** (silent no-op).

**closure**:
1. `cache-key-prefixes.ts:75` 값 `'intermediate-inspections:'` → `'calibration:inspections:'` (실제 service prefix 와 정합, CABLES_CACHE_PREFIX 와 동일 nested namespace 패턴)
2. `intermediate-inspections.service.ts:43` 인라인 concat 제거 → `CACHE_KEY_PREFIXES.INTERMEDIATE_INSPECTIONS` 상수 단일 진입점
3. JSDoc 갱신 — calibration namespace nested 의도 명시 (CABLES 와 동일 패턴 참조)

### 갭-2 (MED) 책임 경계 위반 — closure

**발견**: registry comment lines 69-73 는 "service-local invalidateCache() 는 도메인 로컬 캐시 / registry 는 cross-domain only" 책임 분리 원칙 명시. 그러나 3 INSPECTION_TEMPLATE_* entry 는 자기-도메인 `${INSPECTION_FORM_TEMPLATES}*` wholesale 포함 → service-local `invalidateAndEmit()` line 483 `deleteByPrefix(CACHE_PREFIX)` 와 중복.

**closure**: registry 3 entry 에서 `${INSPECTION_FORM_TEMPLATES}*` 패턴 제거. service-local 책임으로 일원화. registry comment 보강 (책임 분리 인라인 명시).

### 갭-3 (LOW) 1B-backend trigger 명시 오류 — 분리 (post-closure note)

**발견**: cache-events.ts:45 주석 "1B-backend 출시 시 함께 활성화" 는 실제 코드 상태와 불일치. inspection-form-templates.service.ts 가 이미 emitAsync 발행 중 (line 203, 329-330). 사실상 frontend 1A-c 시점 (이미 완료) 에 trigger 됨.

**처리**: 본 sprint 진행 안전 — 사후 정합. 주석 갱신은 cache-events.ts SSOT 파일이 active 변경 충돌 가능성 (다른 세션) → 별도 마이크로 sprint 또는 후속 cache-event sprint 에 흡수.

## SHOULD 검증 산출물

### S-1: 책임 경계 주석 갱신 — 완료

registry 의 3 INSPECTION_TEMPLATE_* entry 위에 책임 분리 정책 인라인 주석 추가:
```typescript
// 책임 분리 (lines 69-73 정합):
// - 자기-도메인 inspection-form-templates 캐시: service-local `invalidateAndEmit()` 가
//   `deleteByPrefix(CACHE_PREFIX)` 로 트랜잭션 직후 동기 삭제 — registry 가 중복 처리하지 않음.
// - cross-domain (intermediate-inspections + self-inspections) 캐시: 이 레지스트리에서
//   specific sub-prefix 패턴으로 무효화 (ADR-0012 §Decision-2 — wholesale 금지, sub-prefix 강제).
```

### S-2: tech-debt closure 라인 정리 — 완료

`tech-debt-tracker.md` 의 `[2026-05-13 cache-wholesale-migration-inspection-templates]` 항목을 `[x]` 처리. closure 사유 1줄 + INTERMEDIATE_INSPECTIONS SSOT mismatch 동반 closure 명시.

### S-3: evaluation doc 작성 — 완료 (본 문서)

## 다중 세션 격리 검증

git status (commit 시점):
- 21 uncommitted (다른 세션 active 작업: ultrareview-shield-followups, inbound-bulk-receive-integration, qr-visual-redesign-followups-g4-g12-round3 등)
- 0 inspection-form-templates / intermediate-inspections / self-inspections / cache-key-prefixes / cache-event.registry 파일 충돌

commit 28c41b1a 변경 파일:
- `apps/backend/src/common/cache/cache-event.registry.ts`
- `apps/backend/src/common/cache/cache-key-prefixes.ts`
- `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts`

다른 세션 active 도메인 침범 0 (verified by `git log -1 --stat HEAD`).

lint-staged automatic backup stash@{0} 생성됨 → 다른 세션 unstaged 변경분 (.claude/exec-plans/tech-debt-tracker.md / apps/frontend/next-env.d.ts / docs/references/skills-index.md / package.json / scripts/__tests__/ultrareview-shield.spec.mjs / scripts/ultrareview-shield.sh) 격리 후 working tree 복원 — 정상 동작.

## tech-debt 잔여 (out of scope, 후속 sprint)

| 항목 | 우선순위 | 트리거 |
|------|----------|--------|
| `intermediate-inspections.service.ts:67` `deleteByPrefix(CACHE_KEY_PREFIXES.CALIBRATION)` 전수 wholesale | 🟢 LOW | calibration 도메인 cache 책임 분리 sprint |
| cache-events.ts:45 주석 "1B-backend 미구현" 오기 갱신 | 🟢 LOW | 다음 cache-event sprint |

## LEGACY wholesale 마이그레이션 진행 상황 (cache-event-arch-r4 라운드 #4)

이전 등록 5건 sprint 중 본 sprint closure:

| Sprint | 상태 |
|--------|------|
| cache-wholesale-migration-checkouts | 완료 (이전 sprint) |
| cache-wholesale-migration-equipment-imports | 완료 (이전 sprint) |
| cache-wholesale-migration-calibration-factors | 완료 (이전 sprint) |
| cache-wholesale-migration-other-legacy (disposal + intermediateCheck) | 완료 (이전 sprint) |
| **cache-wholesale-migration-inspection-templates** | **★ 본 sprint 완료** |

LEGACY 21 → 0 완전 closure.
