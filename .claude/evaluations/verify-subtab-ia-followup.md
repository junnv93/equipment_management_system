---
slug: verify-subtab-ia-followup
date: 2026-04-22
scope: CheckoutsContent.tsx, OutboundCheckoutsTab.tsx, InboundCheckoutsTab.tsx, query-config.ts
verdict: WARN
---

## verify-implementation Results

| Skill | Status | Issues |
|-------|--------|--------|
| verify-ssot | ✅ PASS | 모든 enum/타입/상수가 올바른 패키지에서 import됨 |
| verify-hardcoding | ✅ PASS | queryKeys 팩토리 일관 사용, API 경로 하드코딩 없음 |
| verify-frontend-state | ⚠️ WARN | isError 분기 누락 3곳 (아래 상세), placeholderData 순서 |
| verify-design-tokens | ✅ PASS | transition-all 없음, focus-visible 패턴 정상 |
| verify-nextjs | ✅ PASS | 클라이언트 컴포넌트 패턴 정상, next/dynamic 코드 분할 정상 |
| verify-filters | ✅ PASS | countActiveFilters SSOT 사용, getSubTabForStatus 모두 사용됨 |
| verify-security | ✅ PASS | userId 클라이언트 신뢰 없음, XSS 벡터 없음 |
| verify-i18n | ✅ PASS | en/ko 키 완전 일치 |

## Issues Found

### verify-frontend-state [신뢰도 85] — isError 분기 누락 (pre-existing)
- OutboundCheckoutsTab.tsx:155 — isError 없어 네트워크 오류 시 빈 상태로 오인 가능
- InboundCheckoutsTab.tsx:75,94,114 — 3개 useQuery 모두 isError 미처리
- → tech-debt 등록 (세션 전부터 존재하는 패턴)

### verify-frontend-state [신뢰도 80] — placeholderData 순서
- CheckoutsContent.tsx:164 — `placeholderData`가 `...QUERY_CONFIG.CHECKOUT_SUMMARY` 앞에 위치
- QUERY_CONFIG에 placeholderData가 없어 현재 안전하지만 향후 silent overwrite 위험
- → 즉시 수정 (스프레드 뒤로 이동)
