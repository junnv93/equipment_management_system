---
name: 다음 세션 TODO
description: 61차 세션 완료 — 업계표준 이슈 6건 + AuditLogUserRole SSOT + audit.service 이중 캐스트 제거. 다음 우선순위 목록.
type: project
originSessionId: d46606a2-730f-430c-8a39-6cc96d250f95
---
2026-04-14 61차 세션 완료.

## 최근 세션 성과

### 61차: 업계표준 이슈 6건 + AuditLogUserRole SSOT

- **AuditLogUserRole SSOT**: `UserRole | 'system' | 'unknown'` 유니온 타입 → schemas 패키지, DB `.$type<>()`, interceptor `?? 'unknown'` cast, i18n 번역 추가
- **AuthProviders.tsx**: DRY + cancelled cleanup (useAuthProviders 훅 위임)
- **DocumentPreviewDialog.tsx**: blobUrlRef useRef 기반 cleanup (stale closure 방지)
- **syncUser @AuditLog**: `action: 'update'` 추가
- **incident_history 복합 인덱스**: (equipment_id, occurred_at) + migration 적용
- **CI download-artifact SHA 핀닝**: @v4 → @37930b1c
- **audit.service.ts**: `as unknown as SchemasAuditLog[]` → `as SchemasAuditLog[]` (이중 캐스트 제거)
- **audit-logs.ts**: AuditLogDetails 로컬 재정의 제거 → schemas re-export (SSOT)
- Evaluator: tsc 0 errors, 578 tests PASS

## 다음 우선순위

### A. review-architecture Warning 2건 해결 (optional)
- `DocumentPreviewDialog.tsx:loadPreview` — retry 시 이전 blob URL 누수: `loadPreview` 진입 시 기존 ref 먼저 revoke
- `AuthProviders.tsx` — 에러 상태 미전파: `error: Error | null` 필드 추가

### B. /generate-prompts 재스캔
- example-prompts.md 재스캔으로 신규 이슈 발굴

### C. audit_logs 파티셔닝 (장기 tech-debt)
- 대용량 로그 테이블 → PostgreSQL 범위 파티셔닝 검토
