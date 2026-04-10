---
slug: checkout-callback-resilience
status: active
created: 2026-04-10
mode: 2
scope: Backend cross-domain workflow resilience (checkouts ↔ equipment-imports)
---

# Checkout Callback Resilience

## Problem Statement

checkout 상태 전환(반납 승인/취소) 커밋 후, 크로스 도메인 콜백 `onReturnCompleted`/`onReturnCanceled`가 silent fail 가능. catch 블록이 `logger.warn`만 사용하여 운영 알림 불가. 콜백 실패 시 equipment-import가 `RETURN_REQUESTED`에 영구 잠금.

두 가지 연관 이슈:
1. **Silent swallow**: `logger.warn`이 운영 주의가 필요한 실패를 숨김
2. **CAS version race**: `onReturnCanceled`에서 읽기-업데이트 사이 version 변경 → ConflictException이 checkouts catch에서 삼켜짐

## Phase 1: CAS Retry in onReturnCanceled

### Goal
ConflictException 발생 시 1회 재시도로 주요 실패 모드 제거.

### Files
- `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` — `onReturnCanceled`에서 ConflictException 발생 시 read-update 시퀀스를 1회 재시도. 기존 advisory lock retry 패턴 참조.

### Verification
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --grep "onReturnCanceled"
```

## Phase 2: Escalate Callback Errors to logger.error

### Goal
콜백 실패를 운영 모니터링/알림에 노출.

### Files
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — 두 콜백 catch 블록에서:
  - `logger.warn` → `logger.error`
  - checkoutId, purpose 포함하여 추적 가능하게
  - 기존 동작 유지 (re-throw 금지 — checkout 상태 전환은 이미 커밋)

### Verification
```bash
pnpm --filter backend run tsc --noEmit
```

## Phase 3: Orphan Detection Scheduler

### Goal
Phase 1/2 재시도를 넘어선 콜백 실패에 대한 안전망. `RETURN_REQUESTED` 상태에서 연결된 checkout이 이미 완료/취소된 equipment-import 감지.

### Files
- `apps/backend/src/modules/notifications/schedulers/import-orphan-scheduler.ts` — `CheckoutOverdueScheduler` 패턴 참조. 6시간 주기 + startup 체크. orphan 발견 시 적절한 콜백 재시도 + logger.error + 알림 이벤트
- `apps/backend/src/modules/notifications/events/notification-events.ts` — `IMPORT_ORPHAN_DETECTED` 이벤트 상수 추가
- `packages/schemas/src/enums/notification.ts` — SSOT 알림 타입 추가
- `apps/backend/src/modules/notifications/notifications.module.ts` — 새 스케줄러 등록

### Verification
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run build
```

## Phase 4: Unit Tests

### Goal
콜백 경로와 새 retry/escalation 동작 테스트 커버리지.

### Files
- `apps/backend/src/modules/equipment-imports/__tests__/equipment-imports.service.spec.ts` — onReturnCanceled 성공/retry 성공/retry 실패 테스트
- `apps/backend/src/modules/checkouts/__tests__/checkouts.service.spec.ts` — 콜백 실패 시 checkout 상태 유지 + logger.error 호출 확인

### Verification
```bash
pnpm --filter backend run test
```

## Sequencing

- Phase 1, 2: 독립 (병렬 가능)
- Phase 3: Phase 1 의존 (동일 메서드 호출)
- Phase 4: Phase 1-3 의존

## Out of Scope

- 콜백을 event-driven saga로 리팩토링
- `onReturnCompleted` retry (단일 tx, CAS race 해당 없음)
- 프론트엔드 변경
- DB 스키마 변경
