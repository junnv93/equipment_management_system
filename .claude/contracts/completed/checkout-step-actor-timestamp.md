# Contract: checkout-step-actor-timestamp

**날짜**: 2026-04-29  
**슬러그**: checkout-step-actor-timestamp

## MUST 기준 (FAIL → 루프 차단)

### M1. 데이터 커버리지
buildStepMeta가 CHECKOUT_DISPLAY_STEPS의 모든 status를 fallback 보유:
- [ ] `pending` → requester.name/role + createdAt
- [ ] `borrower_approved` → borrowerApprovedAt (timestamp)
- [ ] `approved` → approvedAt (timestamp)
- [ ] `lender_checked` → lenderConfirmedAt 또는 checkoutDate (timestamp)
- [ ] `checked_out` → checkoutDate (timestamp, done 상태)
- [ ] `in_use` → checkoutDate (timestamp fallback)
- [ ] `borrower_returned` → actualReturnDate (timestamp)
- [ ] `returned` → actualReturnDate (timestamp)
- [ ] `return_approved` → returnApprovedAt (timestamp)

### M2. 타입 안전
- [ ] `pnpm --filter frontend run tsc --noEmit` 0 에러
- [ ] `any` 타입 미사용 (Rule 3)
- [ ] Checkout 인터페이스에 신규 필드 모두 optional로 선언

### M3. SSOT 준수
- [ ] buildStepMeta의 status 분기가 CHECKOUT_DISPLAY_STEPS(nonRental ∪ rental) 합집합을 1:1 커버
- [ ] 날짜 포맷은 `useFormatter().dateTime()` (next-intl) 사용 — 하드코딩 금지
- [ ] 라벨/텍스트는 `messages/{locale}/checkouts.json`의 `progressStep.*` 키 사용
- [ ] CheckoutStatus import는 `@equipment-management/schemas`에서

### M4. Breaking Change 없음
- [ ] 백엔드 응답 기존 키 모두 유지
- [ ] FE Checkout 인터페이스 기존 필드 삭제/타입 변경 없음
- [ ] ProgressStepDescriptor 인터페이스 변경 없음 (actor/timestamp 슬롯 이미 존재)

### M5. 접근성 유지
- [ ] `aria-current="step"`, `<ol role="list">`, `<li>` 기존 마크업 유지
- [ ] sr-only 상태 텍스트 유지

### M6. audit event 우선순위
- [ ] audit event 있으면 항상 event 데이터 우선, fallback은 event 없을 때만 사용

### M7. 빌드 통과
- [ ] `pnpm --filter frontend run lint` 0 에러/경고
- [ ] `eslint-disable` 신규 추가 없음

## SHOULD 기준 (FAIL → tech-debt-tracker 기록, 루프 차단 없음)

### S1. terminated 상태 timestamp
- [ ] rejected/canceled 단계에서 updatedAt을 timestamp로 표시

### S2. 백엔드 actor 이름 hydration
- [ ] findOne()이 borrowerApprover, approver, lenderConfirmer, returner, returnApprover 5개 user 객체 응답 포함
- [ ] N+1 없이 단일 쿼리 또는 Promise.all 병렬

### S3. 단위 테스트
- [ ] use-checkout-progress-steps: 8개 status × fallback 케이스 테스트
- [ ] CheckoutProgressStepper: done/current/late/terminated 각 상태 meta 렌더링 테스트

### S4. i18n parity
- [ ] ko/en 양쪽 progressStep.* 키 동기화

### S5. SSOT 컴파일타임 가드
- [ ] 새 CheckoutStatus 추가 시 buildStepMeta에서 컴파일 에러 발생하도록 exhaustive check

## 거부 기준 (즉시 FAIL)

- `tsc --noEmit` 에러
- `eslint-disable` 신규 추가
- audit event < fallback 우선순위 역전
- ProgressStepDescriptor 인터페이스 변경
- `any` 타입 사용
