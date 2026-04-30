---
slug: tech-debt-batch-0430b
mode: 1
date: 2026-04-30
items:
  - fetchers-status-literal-ssot
  - bulk-approve-rate-limit
  - inbound-bff-flag-removal
---

# Contract: tech-debt-batch-0430b

## Scope

| File | Change |
|------|--------|
| `apps/frontend/lib/api/approvals/fetchers.ts` | raw 리터럴 3건 → SSOT 상수 교체 |
| `apps/frontend/lib/api/approvals/actions.ts` | bulkApprove/bulkReject 동시성 제한 (배치 실행) |
| `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx` | BFF flag 분기 제거, BFF 경로만 유지 |
| `apps/frontend/lib/features/checkout-flags.ts` | `isInboundBffEnabled()` 제거 (파일 삭제 또는 빈 모듈) |

---

## MUST Criteria

### M1: SSOT 리터럴 0건
`fetchers.ts` 내 `'pending'`, `'return_to_vendor'`, `'due'` raw 문자열이 URLSearchParams 인자로 직접 사용되는 패턴이 사라져야 한다.
- `'pending'` → `CheckoutStatusValues.PENDING`
- `'return_to_vendor'` → `CheckoutPurposeValues.RETURN_TO_VENDOR`
- `'due'` → `IntermediateCheckFilterStatusValues.DUE`
- 검증: `grep -n "'pending'\|'return_to_vendor'\|'due'" apps/frontend/lib/api/approvals/fetchers.ts` → 0건

### M2: SSOT import 정확성
새 import가 `@equipment-management/schemas`에서 정확히 가져와야 한다.
- `CheckoutStatusValues`, `CheckoutPurposeValues`는 이미 import 가능 여부 확인됨
- `IntermediateCheckFilterStatusValues`가 schemas 인덱스에서 export되는지 확인 후 사용
- 검증: `pnpm --filter frontend run tsc --noEmit` PASS

### M3: 동시성 제한 구현
`bulkApprove`/`bulkReject`에 외부 패키지 없이 배치 실행 로직 추가.
- `BULK_CONCURRENCY_LIMIT` 상수(5) 정의
- N건 초과 시 concurrency=5로 배치 처리
- 부분 실패 허용(`Promise.allSettled` 의미론 유지)
- 검증: 함수 내 `Promise.allSettled`를 `runWithConcurrency`(또는 동등 헬퍼)로 대체, 단순 `Promise.allSettled(ids.map(...))` 패턴 제거

### M4: BFF flag 완전 제거
- `isInboundBffEnabled()` 함수 호출이 `InboundCheckoutsTab.tsx`에 남아있지 않아야 함
- `bffEnabled` 변수 사용 분기가 제거되어 BFF 경로만 남아야 함
- `checkout-flags.ts`의 `isInboundBffEnabled` export가 사라지거나 파일 자체가 삭제되어야 함
- legacy 3-useQuery 경로 코드(enabled: !bffEnabled 패턴) 삭제
- 검증: `grep -rn "isInboundBffEnabled\|bffEnabled\|CHECKOUT_INBOUND_BFF" apps/frontend/` → 0건

### M5: TypeScript 컴파일 통과
- `pnpm --filter frontend run tsc --noEmit` PASS
- 검증 명령: 위 커맨드

### M6: ESLint 통과
- `pnpm --filter frontend run lint` PASS (기존 위반 외 신규 위반 없음)

---

## SHOULD Criteria

### S1: import 정렬 유지
fetchers.ts의 import 블록이 기존 grouping 패턴 유지 (schemas import 그룹 내 추가).

### S2: 동시성 헬퍼 위치
`runWithConcurrency` (또는 동등 함수)가 actions.ts 내부 private 함수로 위치. 별도 파일 추출 불필요 (단일 사용처).

### S3: .env.example 정리
`.env.example`에서 `NEXT_PUBLIC_CHECKOUT_INBOUND_BFF` 항목 제거.

### S4: queryKeys 정리
BFF 경로에서 사용하지 않는 legacy queryKey (`queryKeys.checkouts.view.inboundSection(...)` 등)가 `InboundCheckoutsTab.tsx`에서 제거됨.

---

## Out of Scope

- `inbound-overview-module-boundary` (별도 아키텍처 이슈, 트리거 미충족)
- `canonical-filter-sort-helper` (리팩토링 규모 초과)
- Backend 배치 API 엔드포인트 신설 (bulk-approve-rate-limit의 프론트 완화가 우선)
- `approval-vocabulary-unification` (별도 tech-debt)
