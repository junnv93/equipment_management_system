# Contract: cache-wholesale-migration-inspection-templates

**시작일**: 2026-05-13
**Mode**: Mode 2 (Full harness) — harness skill orchestrator 활용
**범위**: `INSPECTION_TEMPLATE_CREATED/UPDATED/VERSION_UP` × 3 도메인 (inspection-form-templates / intermediate-inspections / self-inspections) wholesale pattern → specific sub-prefix 마이그레이션

## 배경

`cache-event-arch-r4` 라운드 #4 closure 에서 LEGACY 21 wholesale 의 도메인별 마이그레이션 sprint 5건 등록. 본 sprint 는 그중 **inspection-templates** 도메인 closure (3 events × 3 wholesale patterns = 9 wholesale entries).

### 사전 조사 발견 갭 (시니어 자기검토)

1. **갭-1 (HIGH) — SSOT mismatch**: `CACHE_KEY_PREFIXES.INTERMEDIATE_INSPECTIONS = 'intermediate-inspections:'` 은 dead constant. 실제 `intermediate-inspections.service.ts:43` 는 `CACHE_KEY_PREFIXES.CALIBRATION + 'inspections:'` = `calibration:inspections:` 사용 → 기존 `${INTERMEDIATE_INSPECTIONS}*` wholesale 패턴은 **0 key 매칭** (silent no-op). SSOT 동시 수정 필요.

2. **갭-2 (MED) — 책임 경계 위반**: registry 의 `${INSPECTION_FORM_TEMPLATES}*` 자기 도메인 wholesale 은 service `invalidateAndEmit()` line 483 `deleteByPrefix(CACHE_PREFIX)` 와 중복. registry 책임 (cross-domain only, lines 69-73) 위반 → registry 에서 제거하여 책임 분리 명확화.

3. **갭-3 (LOW) — 1B-backend 미구현 trigger 명시**: cache-events.ts:45 주석은 "1B-backend 출시 시 함께 활성화" 라 했으나 실제로는 inspection-form-templates.service.ts 가 emitAsync 를 이미 발행 (line 203, 329-330). 트리거 조건은 **frontend 1A-c 시점 (이미 완료)** — 사후 정합. 본 sprint 진행 안전.

## 영향 범위 (8 파일)

| 파일 | 변경 |
|------|------|
| `apps/backend/src/common/cache/cache-key-prefixes.ts` | `INTERMEDIATE_INSPECTIONS` 값 `'intermediate-inspections:'` → `'calibration:inspections:'` (실제 service prefix 와 SSOT 일치) + JSDoc 갱신 |
| `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts` | line 43 `CACHE_KEY_PREFIXES.CALIBRATION + 'inspections:'` → `CACHE_KEY_PREFIXES.INTERMEDIATE_INSPECTIONS` (SSOT 단일 진입점) |
| `apps/backend/src/common/cache/cache-event.registry.ts` | `INSPECTION_TEMPLATE_CREATED/UPDATED/VERSION_UP` 3 entry: ① `${INSPECTION_FORM_TEMPLATES}*` 제거 (책임 분리) ② `${INTERMEDIATE_INSPECTIONS}*` → 3 sub-prefix (`list-equip:*`, `list:*`, `detail:*`) ③ `${SELF_INSPECTIONS}*` → 2 sub-prefix (`list-equip:*`, `detail:*`) |
| `apps/backend/src/common/cache/cache-events.ts` | LEGACY allowlist 3 entry 제거 + 마이그레이션 closure 주석 추가 |
| `apps/backend/src/common/cache/cache-event.registry.ts` (allowlist 부분) | `CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST` 에서 3 entry 제거 |
| `.claude/exec-plans/tech-debt-tracker.md` | `cache-wholesale-migration-inspection-templates` 항목 closure |
| `.claude/contracts/REGISTRY.md` | row 추가 + Completed 갱신 |
| `.claude/evaluations/cache-wholesale-migration-inspection-templates.md` | **신규** evaluation doc |

**다른 세션 도메인 침범 금지** (git status + .claude/contracts 검토):
- `.claude/handoff/` (다른 세션 active)
- `apps/frontend/contexts/KeyboardShortcutsContext.tsx` (qr-visual-redesign-followups-g4-g12-round3)
- `apps/backend/src/modules/checkouts/dto/bulk-receive.dto.ts` (inbound-bulk-receive-integration)
- `scripts/ultrareview-shield.sh`, `scripts/__tests__/ultrareview-shield.spec.mjs` (ultrareview-shield-followups-sh1-sh4)
- `apps/frontend/next-env.d.ts`, `package.json`, `docs/references/skills-index.md` (다른 sprint active 수정 중)

## MUST 기준

### M-1: SSOT 정합 — INTERMEDIATE_INSPECTIONS 값 갱신

```bash
grep -E "INTERMEDIATE_INSPECTIONS:\s*'calibration:inspections:'" apps/backend/src/common/cache/cache-key-prefixes.ts
# 결과: 1건
grep -nE "CACHE_KEY_PREFIXES\.CALIBRATION\s*\+\s*'inspections:'" apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts
# 결과: 0건 (인라인 concat 제거)
grep -nE "CACHE_KEY_PREFIXES\.INTERMEDIATE_INSPECTIONS" apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts
# 결과: ≥1건 (SSOT 단일 진입점)
```

### M-2: registry wholesale 제거

```bash
# 3 INSPECTION_TEMPLATE_* entry 내 wholesale 패턴 0건
awk '/\[CACHE_EVENTS\.INSPECTION_TEMPLATE_(CREATED|UPDATED|VERSION_UP)\]/,/^  \},$/' \
  apps/backend/src/common/cache/cache-event.registry.ts \
  | grep -cE '\$\{CACHE_KEY_PREFIXES\.[A-Z_]+\}\*`'
# 결과: 0
```

### M-3: specific sub-prefix 등록

```bash
# 각 INSPECTION_TEMPLATE_* entry 가 sub-prefix 패턴 ≥3건 (intermediate list-equip + list + detail, self list-equip + detail)
awk '/\[CACHE_EVENTS\.INSPECTION_TEMPLATE_CREATED\]/,/^  \},$/' \
  apps/backend/src/common/cache/cache-event.registry.ts \
  | grep -cE 'INTERMEDIATE_INSPECTIONS\}(list-equip|list|detail):\*'
# 결과: 3
awk '/\[CACHE_EVENTS\.INSPECTION_TEMPLATE_CREATED\]/,/^  \},$/' \
  apps/backend/src/common/cache/cache-event.registry.ts \
  | grep -cE 'SELF_INSPECTIONS\}(list-equip|detail):\*'
# 결과: 2
```

### M-4: 자기-도메인 wholesale 제거 (책임 분리)

```bash
# inspection-form-templates 자기 패턴은 registry 에서 제거됨 (service-local invalidateAndEmit 책임)
awk '/\[CACHE_EVENTS\.INSPECTION_TEMPLATE_(CREATED|UPDATED|VERSION_UP)\]/,/^  \},$/' \
  apps/backend/src/common/cache/cache-event.registry.ts \
  | grep -cE 'INSPECTION_FORM_TEMPLATES'
# 결과: 0
```

### M-5: LEGACY allowlist 3 entry 제거

```bash
grep -cE "'CACHE_EVENTS\.INSPECTION_TEMPLATE_(CREATED|UPDATED|VERSION_UP)'" \
  apps/backend/src/common/cache/cache-event.registry.ts
# 결과: 0 (allowlist 에서 제거됨)
```

### M-6: audit script PASS

```bash
node scripts/audit-cache-event-channels.mjs
# EXIT 0 (WHOLESALE_LEGACY 0건 신규)
```

### M-7: tsc + lint EXIT 0

```bash
pnpm --filter backend tsc --noEmit
pnpm --filter backend lint
# 양쪽 EXIT 0
```

### M-8: 도메인 spec PASS

```bash
pnpm --filter backend test -- --testPathPattern="inspection-form-templates"
# emitAsync 시그니처 검증은 event 이름 + payload 기반 → 변경 영향 없음
# 결과: PASS
```

## SHOULD 기준 (시니어 검토)

### S-1: 책임 경계 주석 갱신
registry comment lines 69-73 의 책임 분리 원칙을 inspection-templates entry 에도 인라인 주석으로 명시.

### S-2: tech-debt closure 라인 정리
`tech-debt-tracker.md` 의 `cache-wholesale-migration-inspection-templates` 항목을 `[x]` 처리 + 사유 1줄 (`★ INTERMEDIATE_INSPECTIONS SSOT mismatch closure 동반`).

### S-3: evaluation doc 작성
라운드별 갭 + 검토 결과 + 검증 산출물 기록.

## 회귀 차단 invariant (자동화된 SKILL)

- `verify-cache-events` Step 4-7: registry 패턴 SSOT, listener Promise 반환, emit/emitAsync 일관성
- `audit-cache-event-channels.mjs`: wholesale 신규 추가 차단 (legacy allowlist 외)
- `cache-events-naming.spec.ts`: `cache.<domain>.<verb>` 네이밍 강제 (변경 없음)

## NOT IN SCOPE

- 다른 4 도메인 LEGACY wholesale 마이그레이션 (별도 sprint 등록)
- `intermediate-inspections.service.ts` 의 `deleteByPrefix(CACHE_KEY_PREFIXES.CALIBRATION)` 전수 wholesale (line 67) — 별도 tech-debt 항목으로 등록 (calibration 도메인 책임)
- frontend hook 변경 (use-inspection-template.ts) — backend invalidate 이벤트만 변경, query key 무관
