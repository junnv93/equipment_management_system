---
name: 다음 세션 TODO
description: 49차 세션 — pending-checks 캐시 오염 버그 2계층 근본 해결 완료 + 실 브라우저 검증, 다음 우선순위 정리
type: project
originSessionId: 56619c88-95aa-4ece-bcda-886c418d062a
---
2026-04-13 49차 세션 완료.

## 최근 세션 성과

### 49차: pending-checks 버그 실 브라우저 검증 + 근본 해결 확인
- **실 브라우저 재현**: E2E 통과 후에도 실 브라우저에서 전체=1건 bug 지속 확인
- **진짜 원인 확인**: CheckoutsContent가 `queryKeys.checkouts.pending()` 키로 `pageSize:1` 캐시 → 동일 키 충돌
- **수정**: `pendingCount()` 전용 키 분리 (`['checkouts', 'pending-count']`)
- **E2E TC-06~TC-09** 추가 (탭 전환 + 반출 목록→확인 필요 경로 캐시 일관성)
- **verify-frontend-state Step 12** 추가: pageSize:1 count 전용 키 분리 패턴
- **모든 커밋 push 완료**: `e607dffb` (3개 커밋)

## 다음 우선순위

### A. verify-design-tokens 발견 (이월)
- SelfInspectionTab.tsx:66-75 — JUDGMENT_COLORS/STATUS_COLORS 하드코딩 → getJudgmentBadgeClasses 등으로 교체

### B. review-architecture Warning (이월)
- AttachmentsTab, FormTemplatesTable의 aria-label이 문자열 연결 방식 → i18n 키 interpolation으로 통일

### C. 이전 세션에서 이월
- approvals-api.ts: checkout/disposal/equipment-request mapper의 단일 `as Record` cast 10건
- relation type SSOT: {id, name, email, team} 패턴 3곳 중복 → 공통 타입 추출 검토
