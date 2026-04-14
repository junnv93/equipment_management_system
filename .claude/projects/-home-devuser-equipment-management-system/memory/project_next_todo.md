---
name: 다음 세션 TODO
description: 51차 세션 — 46차 시간복잡도 harness 이월 작업 완료 + i18n 버그 수정, 다음 우선순위 정리
type: project
originSessionId: current
---
2026-04-14 51차 세션 완료.

## 최근 세션 성과

### 51차: 시간복잡도 harness 이월 작업 완료 + i18n 버그 수정
- **fix(i18n)**: approval summaryTemplates `{equipmentName}` → `{equipment}` 변수명 통일
- **fix(backend)**: `QUERY_SAFETY_LIMITS` SSOT 상수 추가 — audit/attachments/calibration-factors/condition-checks 무제한 조회 방지
- **fix(backend)**: equipment `invalidateCacheBatch()` 신설 — O(n) → O(unique teams) 캐시 무효화 최적화
- **perf(backend)**: calibration-plans 날짜 필터 JS filter → DB `gte/lt` WHERE push-down
- **perf(backend)**: calibration 중간점검 집계 `Array.filter() × 3` → `reduce()` 단일 패스 O(3n)→O(n)
- **fix(backend)**: calibration-plans `gte/lt` 타입 오류 수정 (string→Date, TS2769)
- 모든 커밋 push 완료: `dddcde5a`

## 다음 우선순위

### A. verify-design-tokens 발견 (이월)
- `apps/frontend/components/self-inspections/SelfInspectionTab.tsx:66-75`
- JUDGMENT_COLORS / STATUS_COLORS 하드코딩 → `getJudgmentBadgeClasses` 등 design token 함수로 교체

### B. review-architecture Warning (이월)
- `AttachmentsTab`, `FormTemplatesTable`의 aria-label이 문자열 연결 방식
- → i18n 키 interpolation으로 통일

### C. frontend-ssot-typing contract (이월)
- `approvals-api.ts`: checkout/disposal/equipment-request mapper의 단일 `as Record` cast 10건
- relation type SSOT: `{id, name, email, team}` 패턴 3곳 중복 → 공통 타입 추출 검토

### D. 46차 example-prompts 이월 프롬프트 (미완료)
- data-migration 배치 INSERT + chunkArray SSOT (🔴 CRITICAL)
- 그 외 remaining 프롬프트는 `.claude/skills/harness/references/example-prompts.md` 참조
