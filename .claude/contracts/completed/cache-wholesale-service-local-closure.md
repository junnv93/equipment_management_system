# Contract: cache-wholesale-service-local-closure

**Sprint**: 라운드 #5 service-local wholesale closure (review-architecture 발견 §3.2 + §3.5 + §3.6)
**Date**: 2026-05-13
**Mode**: 1
**Parent review**: `/home/kmjkds/.claude/plans/modular-percolating-hippo.md` §3.2 / §3.5 / §3.6

---

## Background

라운드 #4 `cache-wholesale-migration-inspection-templates` sprint이 registry 레이어 wholesale 패턴 21건을 specific sub-prefix로 분해 완료했으나, **service-local `invalidateCache()` 의 cross-domain wholesale 패턴**은 audit 범위 밖에 있어 silently 잔존. 라운드 #5는 service 레이어 closure로 ADR-0012 §Decision-2를 service-local까지 강제.

3개 wholesale 잔존:
| 파일 | 위치 | 패턴 | 분류 |
|---|---|---|---|
| `intermediate-inspections.service.ts` | line 67 | `deleteByPrefix(CACHE_KEY_PREFIXES.CALIBRATION)` | cross-domain wholesale |
| `calibration-factors.service.ts` | line 86 | `deleteByPrefix(CACHE_KEY_PREFIXES.APPROVALS)` | cross-domain wholesale |
| `calibration.service.ts` | line 180 | `deleteByPrefix(CACHE_KEY_PREFIXES.APPROVALS)` | cross-domain wholesale |

`inspection-form-templates.service.ts:483` `deleteByPrefix(this.CACHE_PREFIX)` 은 self-domain wholesale (ADR-0012 §Decision-2 예외 — 책임 분리 정합).

추가 SSOT 정합 (§3.6):
- `CACHE_KEY_PREFIXES.INTERMEDIATE_INSPECTIONS: 'calibration:inspections:'` 하드코딩 literal
- `CABLES_CACHE_PREFIX = ${CACHE_KEY_PREFIXES.CALIBRATION}cables:` 동적 합성 (이미 정합)
- 두 nested namespace의 합성 스타일 비대칭 → CALIBRATION 명명 변경 시 silent drift

---

## MUST Criteria

### M-1: intermediate-inspections.service.ts 분해
- line 67 `deleteByPrefix(CACHE_KEY_PREFIXES.CALIBRATION)` 제거
- 대체: `${CALIBRATION}list:` + `${CALIBRATION}pending:` + `${CALIBRATION}detail:` 3건 specific sub-prefix
- `calibration:cables:*`, `calibration:plans:*` 등 다른 nested namespace 침범 0건 보장
- 검증: 
  ```bash
  grep -n "deleteByPrefix(CACHE_KEY_PREFIXES.CALIBRATION)" apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts
  # → 0건
  grep -nE "deleteByPrefix\(.CACHE_KEY_PREFIXES\.CALIBRATION.(list|pending|detail):" apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts
  # → 3건
  ```

### M-2: calibration-factors.service.ts 분해
- line 86 `deleteByPrefix(CACHE_KEY_PREFIXES.APPROVALS)` 제거
- 대체: `${APPROVALS}pending:` (calibration-factors가 영향 주는 approvals 서브 영역)
- 검증:
  ```bash
  grep -nE "deleteByPrefix\(CACHE_KEY_PREFIXES\.APPROVALS\)" apps/backend/src/modules/calibration-factors/calibration-factors.service.ts
  # → 0건
  ```

### M-3: calibration.service.ts 분해
- line 180 `deleteByPrefix(CACHE_KEY_PREFIXES.APPROVALS)` 제거
- 대체: `${APPROVALS}pending:` (calibration이 영향 주는 approvals 서브 영역)
- 검증:
  ```bash
  grep -nE "deleteByPrefix\(CACHE_KEY_PREFIXES\.APPROVALS\)" apps/backend/src/modules/calibration/calibration.service.ts
  # → 0건
  ```

### M-4: cache-key-prefixes.ts SSOT 합성
- `INTERMEDIATE_INSPECTIONS`이 `CALIBRATION` 기반 합성 (literal 하드코딩 제거)
- `CABLES_CACHE_PREFIX` 합성 스타일과 일관성 확보
- 모든 nested calibration namespace는 단일 base 참조 — drift 차단
- 검증:
  ```bash
  grep -n "INTERMEDIATE_INSPECTIONS:" apps/backend/src/common/cache/cache-key-prefixes.ts
  # → 'calibration:inspections:' literal 아니어야 함
  ```

### M-5: audit script service-local wholesale 검사 확장
- `scripts/audit-cache-event-channels.mjs` 가 service-local `deleteByPrefix(CACHE_KEY_PREFIXES.X)` 패턴 검사
- 분류 규칙:
  - **self-domain wholesale** (X == 해당 service의 `private CACHE_PREFIX = CACHE_KEY_PREFIXES.Y` 의 Y) → POTENTIAL (allowed)
  - **cross-domain wholesale** (X != Y) → VIOLATION (즉시 fix 요구)
  - **sub-prefix 부착** (`deleteByPrefix(\`${X}list:\`)` 등) → NO_VIOLATION
- 검증: 
  ```bash
  node scripts/audit-cache-event-channels.mjs
  # EXIT=0, "VIOLATIONS: 0" 보고
  ```

### M-6: 신규 wholesale 회귀 차단 spec
- audit script 변경에 대한 spec (`scripts/__tests__/audit-cache-event-channels.spec.mjs` 신규 또는 기존 파일 확장)
- fixture 기반: cross-domain wholesale 패턴이 violation으로 감지되는지 확인
- 검증: `node --test scripts/__tests__/audit-cache-event-channels.spec.mjs` PASS

### M-7: 빌드 / 타입 / 테스트 정합
- `pnpm --filter backend run tsc --noEmit` EXIT=0
- `pnpm --filter backend run test -- intermediate-inspections|calibration-factors|calibration` 신규 regression 0
- pre-existing test PASS 유지

---

## SHOULD Criteria

### S-1: tech-debt 분리
- `inspection-form-templates.service.ts:483` `deleteByPrefix(this.CACHE_PREFIX)` self-domain wholesale은 본 sprint 범위 외 (ADR-0012 §Decision-2 예외)
- 추후 sub-prefix 분해 권장은 tech-debt-tracker에 후속 등록

### S-2: 명명 일관성
- 향후 신규 calibration nested namespace 추가 시 `${CALIBRATION_BASE}<sub>:` 합성 패턴 강제 — README/주석 가이드 1줄 추가

### S-3: Performance baseline
- intermediate-inspections CRUD 후 calibration 캐시 hit rate 측정 권장 (Critical §3.2 영향 검증)
- 본 sprint에서는 측정 없이 closure — production 모니터링 후 verify

---

## WON'T-DO

| 항목 | 사유 |
|------|------|
| W-1: registry 이벤트로 cross-domain 위임 | option (a) — `invalidateAfterEquipmentUpdate(statusChanged: true)` 가 모든 CRUD 시 발화하면 equipment 캐시 과잉 무효화 |
| W-2: ESLint custom rule 도입 | audit script 만으로 CI 회귀 차단 충분 |
| W-3: self-domain wholesale 패턴 제거 | ADR-0012 §Decision-2 예외 — 책임 분리 정합 |

---

## Verification Commands

```bash
# 본 sprint 핵심 검증
grep -nE "deleteByPrefix\(CACHE_KEY_PREFIXES\.[A-Z_]+\)" apps/backend/src/modules/**/*.service.ts | grep -v "this.CACHE_PREFIX\|sub-prefix"
# → 0건 (모든 cross-domain wholesale 제거 확인)

node scripts/audit-cache-event-channels.mjs
# → EXIT=0, VIOLATIONS: 0

pnpm --filter backend run tsc --noEmit
# → EXIT=0
```
