---
slug: sv-approval-comment-ui
type: contract
created: 2026-04-30
status: active
---

# Contract: Software Validation Approval Comment UI

## Scope

- `apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx`
- `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationApproveDialog.tsx` (new)
- `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationRejectDialog.tsx` (new)
- `apps/frontend/messages/ko/software.json`
- `apps/frontend/messages/en/software.json`

## MUST Criteria

- [ ] M1: `tsc --noEmit` — 에러 없음
- [ ] M2: `pnpm --filter frontend run build` — 빌드 성공
- [ ] M3: `ValidationRejectDialog`가 `rejectionReason.trim().length === 0`일 때 confirm 버튼 disabled + aria-required="true" textarea
- [ ] M4: `ValidationRejectDialog`에 inline 에러 메시지 + `role="alert"` aria-live="assertive" (빈 제출 시도 시)
- [ ] M5: `ValidationApproveDialog`가 optional comment + char count 표시 (`${count}/${VALIDATION_RULES.LONG_TEXT_MAX_LENGTH}`)
- [ ] M6: 승인/품질승인 다이얼로그가 단일 `ValidationApproveDialog` 컴포넌트로 통합 (type prop: 'technical' | 'quality')
- [ ] M7: `SoftwareValidationContent`에서 8개 상태 → `activeDialog` 단일 discriminated union 또는 최소한 각 다이얼로그별 state 그룹
- [ ] M8: 모든 i18n 키가 ko/en 양쪽에 존재 (누락 없음)
- [ ] M9: `aria-describedby` textarea에 도움말 텍스트 ID 연결 (approve/reject 모두)

## SHOULD Criteria

- [ ] S1: `ValidationRejectDialog` — 반려 사유 글자 수 힌트 ("반려 사유를 입력하세요 (필수)" 수준)
- [ ] S2: open시 textarea autoFocus
- [ ] S3: Dialog `onOpenChange` 닫힐 때 상태 초기화 (approveComment, rejectionReason 초기화)

## Anti-patterns (MUST NOT)

- 범용 `RejectModal` import 금지 — ApprovalItem 타입 의존성 있음
- `setQueryData` 사용 금지
- Dialog 밖에서 fetch 금지
- `any` 타입 금지
- 하드코딩된 숫자 — `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` 반드시 import

## Reference Patterns

- char count: `{value.length}/{VALIDATION_RULES.LONG_TEXT_MAX_LENGTH}` 스타일
- Aria live alert: `role="alert" aria-live="assertive"` (only for error states)
- Discriminated union state:
  ```ts
  type ActiveDialog =
    | { type: 'approve'; target: SoftwareValidation }
    | { type: 'qualityApprove'; target: SoftwareValidation }
    | { type: 'reject'; target: SoftwareValidation }
    | null;
  ```
