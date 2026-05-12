# Contract: cache-event-arch-r3

**시작일**: 2026-05-13
**Mode**: Mode 1
**범위**: `cache-event-channel-architecture-r2` 시니어 자기검토 라운드 #3 — 6갭 통합 closure (단편 fix 회피)

## 배경

라운드 #2 (commit `8cfd8ae1`/`b67b98f7`)에서 5갭 closure 후 시니어 자기검토 #3 발견 6갭:
- **갭 K (HIGH)**: audit script pre-push/CI 게이트 통합 안 됨 → 실 회귀 차단 무력
- **갭 A (MED)**: SW_VALIDATION registry `detail:*` ↔ service-local 100% 중복 (calibration 미완전 정합)
- **갭 O (MED)**: wholesale `<domain>:*` 금지 정책이 코드로 강제 안 됨 (문서 only)
- **갭 F (MED)**: TEST_SOFTWARE_REVALIDATION_REQUIRED grandfather clause — ADR-0012 §Decision-1 예외 제거 후 cleanness
- **갭 D (LOW)**: mirror 검사가 cache→noti 단방향 (noti에 `cache.` prefix 등록 회귀 미검출)
- **갭 C (LOW)**: audit script regex 기반 fragility (TS AST 미사용)

## 영향 범위 (10~12 파일)

| 파일 | 변경 |
|------|------|
| `apps/backend/src/common/cache/cache-events.ts` | CACHE_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED 신설 + 페이로드 타입 + 양방향 synonym 주석 (갭 F, D) |
| `apps/backend/src/common/cache/cache-event.registry.ts` | (a) SW_VALIDATION 4 entry detail:* 제거 (b) CACHE_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED entry 추가 (c) NOTIFICATION_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED entry 제거 (갭 A, F) |
| `apps/backend/src/common/cache/cache-event-listener.ts` | (a) `deriveCacheMirror` 역추론 export (b) invariant 양방향 검사 (갭 D) |
| `apps/backend/src/modules/test-software/test-software.service.ts` | NOTIFICATION + CACHE 양채널 emit (갭 F) |
| `apps/backend/src/common/cache/__tests__/cache-events-naming.spec.ts` | (a) registry signature mirror 직접 검증 (regex fragility 보강) (b) wholesale `<prefix>*` 패턴 차단 + LEGACY allowlist (c) cache→noti / noti→cache 양방향 검사 (갭 C, O, D) |
| `apps/backend/src/common/cache/__tests__/cache-event-listener.spec.ts` | 양방향 invariant 회귀 spec 추가 (갭 D) |
| `apps/backend/src/modules/software-validations/software-validations.service.ts` | invalidateCache 주석 갱신 — detail:* 단독 책임 명시 (갭 A) |
| `apps/backend/src/modules/test-software/__tests__/test-software.service.spec.ts` (있다면) | revalidation 양채널 emit assertion 추가 (갭 F) |
| `scripts/audit-cache-event-channels.mjs` | 양방향 검사 + wholesale 패턴 violation 보고 (갭 D, O) |
| `docs/adr/0012-cache-event-channel-responsibility.md` | (a) §Decision-1 예외 절 제거 (TEST_SOFTWARE_REVALIDATION 이제 CACHE_EVENTS) (b) §Decision-2 wholesale 강제 명시 (audit script enforcement) (c) §References 갱신 (갭 F, O) |
| `.husky/pre-push` | `pnpm audit:cache-events` 1줄 추가 (갭 K) |
| `package.json` | `audit:cache-events` script alias (갭 K) |
| `.claude/skills/verify-cache-events/SKILL.md` | Step 8 강화 (pre-push 통합 invariant) + 양방향 검사 명시 + wholesale 차단 (갭 D, O, K) |
| `.claude/exec-plans/tech-debt-tracker.md` | 라운드 #3 closure 마커 |

**다른 세션 도메인 침범 금지** (현재 활성):
- saved-views (`apps/backend/src/modules/saved-views/`, frontend saved-views/import banner)
- qr-visual-redesign-followups-batch-1 (`documents/schedulers/`, mobile/Equipment*, qr-access.service, packages/schemas/qr-handover.ts, equipment-api.ts)
- `.gitleaks.toml`, `scripts/ultrareview-*`, frontend Equipment 관련 일체

## MUST 기준

### M-1: SW_VALIDATION registry `detail:*` 제거 (갭 A — calibration 패턴 완전 정합)

```bash
awk '/\[CACHE_EVENTS\.SW_VALIDATION_/,/^  \},$/' apps/backend/src/common/cache/cache-event.registry.ts \
  | grep -c "SOFTWARE_VALIDATIONS}detail:\*"
# 결과: 0 (registry에서 detail:* 제외)

# list:* + pending:*만 (4 entry × 2 = 8)
awk '/\[CACHE_EVENTS\.SW_VALIDATION_/,/^  \},$/' apps/backend/src/common/cache/cache-event.registry.ts \
  | grep -cE "SOFTWARE_VALIDATIONS}(list|pending):\*"
# >= 8
```

### M-2: CACHE_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED 신설 + NOTIFICATION 측 entry 제거 (갭 F)

```bash
# CACHE_EVENTS 정의
grep -nE "TEST_SOFTWARE_REVALIDATION_REQUIRED:\s*'cache\." apps/backend/src/common/cache/cache-events.ts
# >= 1 — 'cache.testSoftware.revalidationRequired' 형식

# registry CACHE_EVENTS entry 등록
grep -nE "\[CACHE_EVENTS\.TEST_SOFTWARE_REVALIDATION_REQUIRED\]" apps/backend/src/common/cache/cache-event.registry.ts
# >= 1

# NOTIFICATION_EVENTS entry 제거됨
grep -nE "\[NOTIFICATION_EVENTS\.TEST_SOFTWARE_REVALIDATION_REQUIRED\]" apps/backend/src/common/cache/cache-event.registry.ts
# 0

# service에서 양채널 emit (test-software.service.ts revalidation 분기)
grep -cE "(NOTIFICATION_EVENTS\.TEST_SOFTWARE_REVALIDATION_REQUIRED|CACHE_EVENTS\.TEST_SOFTWARE_REVALIDATION_REQUIRED)" apps/backend/src/modules/test-software/test-software.service.ts
# >= 2 (양채널)
```

### M-3: 양방향 mirror 검사 — deriveCacheMirror 신설 (갭 D)

```bash
# listener export
grep -cE "export function deriveCacheMirror|export const deriveCacheMirror" apps/backend/src/common/cache/cache-event-listener.ts
# >= 1

# invariant가 양방향 검사
grep -cE "deriveCacheMirror" apps/backend/src/common/cache/cache-event-listener.ts
# >= 2 (정의 + 사용)

# audit script도 양방향
grep -cE "deriveCacheMirror" scripts/audit-cache-event-channels.mjs
# >= 1
```

### M-4: wholesale 패턴 정책 강제 (갭 O)

```bash
# audit script가 wholesale 검사
grep -cE "wholesale|WHOLESALE|}\\\\\\*'" scripts/audit-cache-event-channels.mjs
# >= 2 (탐지 로직 + 보고)

# naming spec에 wholesale 차단 test
grep -cE "wholesale|WHOLESALE|}\\\\\\*" apps/backend/src/common/cache/__tests__/cache-events-naming.spec.ts
# >= 1

# 현 registry는 violation 0 (audit 통과)
node scripts/audit-cache-event-channels.mjs  # EXIT 0
```

### M-5: pre-push + npm script 통합 (갭 K)

```bash
# package.json script alias
grep -cE '"audit:cache-events":' package.json
# >= 1

# .husky/pre-push 호출
grep -cE "audit:cache-events|audit-cache-event-channels" .husky/pre-push
# >= 1
```

### M-6: regex fragility 보강 jest spec (갭 C)

cache-events-naming.spec.ts에 실 import 기반 dual-channel mirror 검사 spec 추가 — audit script regex가 깨져도 jest가 catch.

```bash
grep -cE "validateDualChannelExclusivity|registry signature|dual.?channel" apps/backend/src/common/cache/__tests__/cache-events-naming.spec.ts
# >= 1
```

### M-7: ADR-0012 갱신 (갭 F, O)

```bash
# §Decision-1 예외 절 제거 (TEST_SOFTWARE_REVALIDATION 이제 CACHE_EVENTS)
grep -c "TEST_SOFTWARE_REVALIDATION_REQUIRED" docs/adr/0012-cache-event-channel-responsibility.md
# 인용 OK, 단 "예외" 표현은 0

# §Decision-2 wholesale 강제 명시
grep -cE "wholesale.*금지|audit script.*강제|wholesale.*audit" docs/adr/0012-cache-event-channel-responsibility.md
# >= 1
```

### M-8: tsc + lint + test 전부 PASS

```bash
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend exec eslint src/common/cache/ apps/backend/src/modules/test-software/ scripts/audit-cache-event-channels.mjs
pnpm --filter backend exec jest --testPathPattern='(cache-event|test-software.service)'
node scripts/audit-cache-event-channels.mjs  # EXIT 0
```

### M-9: tech-debt-tracker 라운드 #3 closure

```bash
grep -cE "cache-event-arch-r3|라운드 #3" .claude/exec-plans/tech-debt-tracker.md
# >= 1
```

### M-10: 다른 세션 파일 무수정

```bash
git diff --cached --name-only | grep -E "saved-views|drizzle-stub|qr-access|orphan-photo-cleanup|EquipmentActionSheet|EquipmentLanding|qr-handover|equipment-api|use-equipment-by-management|StatusBadge\.test"
# 빈 결과
```

## SHOULD 기준

### S-1: CI workflow에 audit:cache-events 통합

`.github/workflows/*.yml`에 audit 호출 추가. pre-push가 1차, CI가 2차.

### S-2: ESLint custom rule `no-wholesale-cache-pattern`

audit script + naming spec이 강제하지만, ESLint 단계에서 IDE warning을 위해 custom rule 추가 검토. 본 sprint 외.
