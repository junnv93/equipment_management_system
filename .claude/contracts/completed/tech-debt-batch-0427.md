# Contract: tech-debt-batch-0427

**날짜**: 2026-04-27  
**모드**: Mode 1  
**슬러그**: tech-debt-batch-0427

## Scope

tech-debt-tracker.md 누적 항목 배치 처리.  
이미 해결된 5개 항목 아카이브 이동 + 7개 카테고리 실구현.

## MUST Criteria

| # | 기준 | 검증 방법 |
|---|------|----------|
| M1 | `pnpm --filter frontend run tsc --noEmit` PASS | 빌드 오류 0 |
| M2 | `workflow-panel.ts` urgencyDot에 인라인 `motion-safe:animate-pulse` 문자열 없음 | grep |
| M3 | `CHECKOUT_TAB_BADGE_TOKENS.base`에 `inline-flex items-center justify-center` 포함 | grep |
| M4 | `ConditionCheckClient.tsx`에 `queryKeys.checkouts.all` 직접 invalidate 없음 | grep |
| M5 | `checkouts.json` ko/en 양쪽 `yourTurn.summary` 키 제거됨 | json check |
| M6 | `PrintableAuditReport.tsx` `formatFilters()`에 한국어 리터럴 없음 | grep |
| M7 | `borrowerApproveCheckout/borrowerRejectCheckout` 내 `page.request.get/patch` 직접 호출 없음 | grep |
| M8 | `CheckoutDetailClient.tsx`에 `format(new Date` 패턴 없음 | grep |
| M9 | `tech-debt-tracker.md` 처리 항목 제거 + `archive.md` 이동 기록 | diff |

## SHOULD Criteria

| # | 기준 | 비고 |
|---|------|------|
| S1 | `CheckoutsContent.tsx` tab-badge 호출부 중복 레이아웃 클래스 제거 | M3 선행 필요 |
| S2 | ko/en audit.json에 report.filter.* 키 추가 | M6 선행 |
| S3 | `apiGetWithToken`/`apiPatchWithToken` 헬퍼 함수 추가 | M7 선행 |

## Out of Scope (deferred)

- `fsm-terminal-step-index-semantics` — DB 스키마 변경 필요
- `actor-variant-role-mapping-gap` — Sprint 4.3 트리거
- `inbound-bff-flag-removal` — 1주 안정화 관찰 필요
- `fsm-meta-drift-observability` — Sentry SDK 미도입
