---
slug: checkout-callback-resilience
created: 2026-04-10
harness-mode: 2
---

# Contract: Checkout Callback Resilience

## MUST Criteria (loop-blocking)

| # | Criterion | Verify |
|---|-----------|--------|
| M1 | `pnpm --filter backend run tsc --noEmit` 0 에러 | CI output |
| M2 | `pnpm --filter backend run test` 전체 PASS, 0 regression | Test results |
| M3 | `onReturnCanceled` ConflictException 시 1회 재시도 — re-read + re-attempt CAS | Unit test |
| M4 | 두 콜백 catch 블록이 `logger.error` 사용 (`logger.warn` 아님) | grep 검증 |
| M5 | 콜백 실패가 부모 checkout 상태 전환을 롤백하지 않음 | Unit test |
| M6 | Orphan detection scheduler 존재, cron 스케줄, RETURN_REQUESTED + completed/canceled checkout 쿼리 | File + module 등록 확인 |
| M7 | 새 notification type이 `packages/schemas` SSOT에 추가 — app build 성공 | `pnpm --filter backend run build` |
| M8 | 모든 shared enum/type은 `@equipment-management/schemas` 또는 `shared-constants`에서 import | Code review |

## SHOULD Criteria (non-blocking, tech-debt 추적)

| # | Criterion |
|---|-----------|
| S1 | Orphan scheduler가 자동 복구 시도 (콜백 재호출) + 로깅 |
| S2 | 에러 로그에 checkoutId, equipmentImportId, purpose 포함 |
| S3 | Orphan 감지 시 ADMIN/QA_MANAGER에게 알림 이벤트 발생 |
| S4 | Phase별 독립 커밋 |
| S5 | `onReturnCanceled` retry가 1회 추가 DB round-trip 이상 블로킹하지 않음 |

## Out of Scope

- 콜백을 event-driven saga로 리팩토링
- `onReturnCompleted` retry 추가
- 프론트엔드 UI 변경
- DB 스키마 마이그레이션
- `VersionedBaseService` 수정
- 기존 통과 테스트 수정 (regression fix 제외)

## Exit Criteria

- M1-M8 전체 PASS → /git-commit
- 동일 M 기준 2회 연속 실패 → manual intervention
- 3+ iteration 진전 없음 → harness 중단
