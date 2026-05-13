# Evaluation: audit-log-array-entity-id

**Date**: 2026-05-13
**Iteration**: 1 (PASS)
**Verdict**: ✅ ALL MUST PASS

## MUST Verification

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| M-1 | extractRawValue 메서드 신설 | ✅ | `audit.interceptor.ts` `extractRawValue(): unknown` 추가 — 기존 path 탐색 로직 재사용 |
| M-2 | extractValue array → undefined | ✅ | `Array.isArray(value) → return undefined` (CSV 변환 차단) |
| M-3 | logAuditAsync array entityId 처리 | ✅ | `SYSTEM_USER_UUID` sentinel + `bulk[N]: <preview>...+<overflow>` aggregate entityName |
| M-4 | unit spec | ✅ | 4 신규 spec PASS (3 items / 5 items overflow / empty array skip / CSV 회귀 차단) |
| M-5 | tsc / 전체 test 정합 | ✅ | tsc EXIT=0, audit.interceptor.spec 9/9 PASS (기존 5 + 신규 4) |

## 핵심 설계

### Before (silent fail)
```ts
return typeof value === 'string' ? value : value.toString();
// → Array ['uuid1','uuid2'] → "uuid1,uuid2" CSV
// → audit_logs.entityId UUID 컬럼 INSERT 22P02 거부
// → AuditInterceptor .catch swallow → silent fail
```

### After (sentinel + aggregate)
```ts
if (Array.isArray(rawEntityId)) {
  entityId = SYSTEM_USER_UUID;  // uuid 컬럼 호환 sentinel
  aggregateEntityName = `bulk[${ids.length}]: ${preview}${overflow}`;
  // 예: "bulk[3]: uuid1,uuid2,uuid3"
  //     "bulk[5]: uuid1,uuid2,uuid3...+2"
}
```

### 영향 endpoint
4개 bulk endpoint (`bulk-approve`, `bulk-reject`, `bulk-cancel`, `bulk-receive`) 의 audit trail 보존 — 이전 silent fail 상태에서 정상 INSERT.

audit_logs 쿼리 패턴:
- `WHERE entity_id = SYSTEM_USER_UUID AND entity_name LIKE 'bulk[%'` → bulk operation 통계
- `WHERE entity_name LIKE 'bulk%' AND entity_name LIKE '%<uuid>%'` → 특정 entity 가 bulk 에 포함된 이력 추적

## SHOULD Status

- S-1: per-item N row insert option (`entityIdPathArray: true`) — tech-debt 후속. 본 sprint 는 single aggregate 패턴 (`SYSTEM_USER_UUID` sentinel 정합).

## Verdict

**PASS** — MUST 5/5. 4개 bulk endpoint audit trail 정상화.
