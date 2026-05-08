# Contract: reject-modal-ssot-closure

**Date**: 2026-05-08
**Mode**: Mode 1 (Lightweight)
**Slug**: `reject-modal-ssot-closure`

## Context

tech-debt-tracker.md "2026-05-01~02 disposal-zod 후속" 섹션 closure.

조사 결과:
- Backend 13개 rejection 스키마는 이미 `min(REJECTION_REASON_MIN_LENGTH) + max(LONG_TEXT_MAX_LENGTH)` 완비 ✅
- Frontend `RejectModal` (components/approvals/RejectModal.tsx)는 `mode='single'|'bulk'|'domain'` SSOT로 9개 도메인에서 사용 중 ✅
- `DisposalReviewDialog` / `DisposalApprovalDialog`는 의도적으로 RejectModal 미사용 (approve+reject 통합 워크플로우 다이얼로그)

## Actual Gaps (실제 잔여)

1. **`admin/RejectReasonDialog.tsx` dead code** — 프로덕션 import 0건. 삭제 대상.
2. **`approveDisposalSchema`** — `comment: optional` 필드가 `decision=reject` 경로에서도 Zod min 미적용. service layer 수동 fail-close만 있음. 개선: `z.discriminatedUnion` 또는 `.superRefine`으로 Zod 레벨 min 강제.
3. **e2e 테스트 주석** — `rejection-workflow.spec.ts` line ~99에 `RejectReasonDialog` 언급 → `RejectModal (mode='domain')` 정정.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M-1 | `admin/RejectReasonDialog.tsx` 파일 삭제 | `ls apps/frontend/components/admin/RejectReasonDialog.tsx` → No such file |
| M-2 | `admin/RejectReasonDialog.tsx` import 0건 (전체 codebase) | `grep -rn "RejectReasonDialog" apps/ packages/` → 0건 (spec 주석 제외) |
| M-3 | `approveDisposalSchema`에서 `decision=reject` 경로 `comment min(REJECTION_REASON_MIN_LENGTH)` 강제 | `grep -n "superRefine\|discriminatedUnion" apps/backend/src/modules/equipment/dto/disposal.dto.ts` |
| M-4 | disposal.service.ts의 수동 min-check 주석 업데이트 (Zod로 이관됨 표시) | `grep -n "Zod는 max+optional만" apps/backend/src/modules/equipment/services/disposal.service.ts` → 0건 |
| M-5 | `pnpm --filter backend run tsc --noEmit` PASS | 0 errors |
| M-6 | `pnpm --filter frontend run tsc --noEmit` PASS | 0 errors |
| M-7 | `pnpm --filter backend run test` PASS | 기존 test suite 회귀 없음 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S-1 | e2e 테스트 주석에서 `RejectReasonDialog` → `RejectModal (mode='domain')` 정정 |
| S-2 | disposal.service.ts 수동 min-check 코드 제거 (Zod 이관 후 중복) |
| S-3 | `approveDisposalSchema` 변경으로 service layer 타입 에러 없음 (`tsc` M-5 커버) |

## Out of Scope

- `DisposalReviewDialog` / `DisposalApprovalDialog` RejectModal 변환 (의도적 다른 UX 패턴)
- backend 다른 도메인 rejection 스키마 (이미 완비)
- frontend rejection 컴포넌트 추가 기능

## Files Changed

| File | Action |
|------|--------|
| `apps/frontend/components/admin/RejectReasonDialog.tsx` | DELETE |
| `apps/backend/src/modules/equipment/dto/disposal.dto.ts` | MODIFY — superRefine/discriminatedUnion |
| `apps/backend/src/modules/equipment/services/disposal.service.ts` | MODIFY — 수동 min-check 제거 or 주석 업데이트 |
| `apps/frontend/tests/e2e/features/calibration/certificate/rejection-workflow.spec.ts` | MODIFY — 주석 정정 |
| `.claude/exec-plans/tech-debt-tracker.md` | MODIFY — 섹션 정리 |
