# Contract: audit-log-array-entity-id

**Sprint**: review-architecture §3.7 closure (pre-existing audit array silent fail)
**Date**: 2026-05-13
**Mode**: 1
**Parent review**: `/home/kmjkds/.claude/plans/modular-percolating-hippo.md` §3.7

---

## Background

`apps/backend/src/common/interceptors/audit.interceptor.ts:349` `extractValue` 는 `value.toString?.()` 호출. Array `['uuid1','uuid2']` → `"uuid1,uuid2"` CSV 문자열로 변환됨. `audit_logs.entityId` 는 `uuid NOT NULL` 컬럼 (`audit-entity-id.util.ts` UUID_REGEX) — PostgreSQL 22P02 invalid input syntax 거부.

`AuditInterceptor` 의 `.catch((e) => this.logger.error(...))` (line 116-120) 가 swallow → 운영 무증상.

영향 endpoint (4 bulk operation):
- `bulk-approve` (checkouts.controller.ts:829)
- `bulk-reject` (:852)
- `bulk-cancel` (:876)
- `bulk-receive` (:900)

모두 `@AuditLog({ entityIdPath: 'body.ids' })` 동일 패턴 → silent INSERT 실패 4개 endpoint 공통 영향.

---

## MUST Criteria

### M-1: extractRawValue 메서드 신설
- `AuditInterceptor` 에 `extractRawValue(path, request, response): unknown` private 메서드 추가
- 기존 `extractValue` 의 path 탐색 로직 재사용 (DRY)
- string coercion 없이 raw value 반환
- 검증:
  ```bash
  grep -n "extractRawValue" apps/backend/src/common/interceptors/audit.interceptor.ts
  # → 메서드 정의 1건 + 호출처 1건 이상
  ```

### M-2: extractValue array 안전 처리
- `extractValue` 가 array 입력 시 `undefined` 반환 (CSV 변환 차단)
- 검증:
  ```bash
  grep -nE "Array\.isArray.*undefined|isArray.*return" apps/backend/src/common/interceptors/audit.interceptor.ts
  # → 1건 이상
  ```

### M-3: logAuditAsync array entityId 처리 — sentinel + aggregate
- array entityIdPath 결과 → `SYSTEM_USER_UUID` sentinel + `entityName` aggregate preview
- aggregate 형식: `bulk[N]: <첫3개,>...+<나머지>`
- empty array 또는 non-string entries → logger.warn + skip (현재 동작)
- 검증:
  ```bash
  grep -n "SYSTEM_USER_UUID\|aggregateName\|bulk\[" apps/backend/src/common/interceptors/audit.interceptor.ts
  # → 1건 이상
  ```

### M-4: unit spec — array entityId 경로 검증
- `apps/backend/src/common/interceptors/__tests__/audit.interceptor.spec.ts` 신규 또는 확장
- 케이스:
  - `body.ids` array → SYSTEM_USER_UUID + aggregate name
  - `body.ids` empty → skip + warn
  - 기존 `params.uuid` string → 변화 없음 (회귀 차단)
- 검증:
  ```bash
  pnpm --filter backend exec jest --testPathPattern="audit.interceptor.spec" 2>&1 | tail -5
  # → 신규 3건 PASS + 기존 회귀 0
  ```

### M-5: tsc / 전체 test 정합
- `pnpm --filter backend exec tsc --noEmit` EXIT=0
- 기존 bulk endpoint controller test 회귀 0

---

## SHOULD Criteria

### S-1: per-item audit log option (tech-debt)
- `entityIdPathArray: true` 옵션으로 N row insert (per-item audit) 향후 follow-up
- 본 sprint 는 single aggregate audit (Option B) — SYSTEM_USER_UUID sentinel 패턴 정합

---

## WON'T-DO

| 항목 | 사유 |
|------|------|
| W-1: audit_logs.entityId 컬럼 nullable 변경 | DB 마이그레이션 — 본 sprint 범위 외 |
| W-2: entityIdPath 자체 deprecation | 광범위 호출처 영향 |

---

## Verification Commands

```bash
grep -n "extractRawValue\|SYSTEM_USER_UUID\|bulk\[" apps/backend/src/common/interceptors/audit.interceptor.ts
pnpm --filter backend exec jest --testPathPattern="audit.interceptor" 2>&1 | tail -10
pnpm --filter backend exec tsc --noEmit; echo "EXIT=$?"
```
