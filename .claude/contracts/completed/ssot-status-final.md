---
slug: ssot-status-final
created: 2026-04-21
mode: 1
---

# Contract: 백엔드 status 리터럴 SSOT 완전 종결

## Scope (전체 스캔으로 확정된 위반 8곳)

| 파일 | 위반 위치 | 수정 내용 |
|------|-----------|-----------|
| `src/common/file-upload/document.service.ts` | line 353 | `'deleted' as DocumentStatus` → `DocumentStatusValues.DELETED` |
| `src/common/file-upload/document.service.ts` | line 378 | `'superseded' as DocumentStatus` → `DocumentStatusValues.SUPERSEDED` |
| `src/common/file-upload/document.service.ts` | line 568 | `eq(..., 'deleted' as DocumentStatus)` → `eq(..., DocumentStatusValues.DELETED)` |
| `src/modules/equipment/services/history-card-data.service.ts` | line 204 | `eq(documents.status, 'active')` → `DocumentStatusValues.ACTIVE` |
| `src/modules/intermediate-inspections/services/intermediate-inspection-export-data.service.ts` | line 220 | `eq(documents.status, 'active')` → `DocumentStatusValues.ACTIVE` |
| `src/modules/notifications/schedulers/retention-expiry-scheduler.ts` | line 47 | `eq(documents.status, 'active')` → `DocumentStatusValues.ACTIVE` |
| `src/modules/self-inspections/services/self-inspection-export-data.service.ts` | line 300 | `eq(documents.status, 'active')` → `DocumentStatusValues.ACTIVE` |
| `.eslintrc.js` | no-restricted-syntax | CallExpression 인자 패턴 selector 추가 |

## 제외 판단

- `monitoring.service.ts` `'connected'`/`'operational'`/`'degraded'`: 인프라 헬스체크 DTO — DB 컬럼이 아닌 런타임 진단값. 도메인 SSOT 대상 아님
- `calibration.service.ts:1639`: 주석 문자열 — 코드 아님

## MUST Criteria

| ID | Criterion |
|----|-----------|
| M1 | `pnpm tsc --noEmit` (apps/backend/) exits 0 |
| M2 | `pnpm --filter backend run build` exits 0 |
| M3 | `pnpm lint` (apps/backend/) exits 0 |
| M4 | 전체 코드베이스 domain status 리터럴 잔존 0개 — grep 검증 |
| M5 | `as DocumentStatus` 타입 캐스팅 잔존 0개 |
| M6 | `.eslintrc.js`에 CallExpression 인자 패턴 selector 추가됨 |
| M7 | `pnpm --filter backend run test` exits 0 |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S1 | controller override에도 CallExpression selector 동기화 |
