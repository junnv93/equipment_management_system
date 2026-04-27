# approvals-ui-r2 Final Evaluation (Iter 2)
## Date: 2026-04-27
## Verdict: PASS

---

## MUST Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| 1 | tsc --noEmit PASS (0 errors) | PASS | Generator가 직접 실행: `pnpm --filter frontend exec tsc --noEmit` → 출력 없음 (exit 0) |
| 2 | AR-8: inspection.canReject=false in TAB_META | PASS | `approvals-api.ts` L247: `canReject: false, // AR-8` |
| 3 | AR-8: onReject optional in ApprovalList, ApprovalRow, ApprovalDetailModal | PASS | `ApprovalList.tsx` L21: `onReject?:`, `ApprovalRow.tsx` L41: `onReject?:`, `ApprovalDetailModal.tsx` L39: `onReject?:` |
| 4 | AR-8: ApprovalsClient가 ALL THREE reject 경로 가드 | PASS | L486 ApprovalList + L473 BulkActionBar + L501 ApprovalDetailModal — 모두 `TAB_META[...].canReject !== false ? ... : undefined` 패턴 |
| 5 | AR-8: BulkActionBar onBulkReject optional + button/modal conditional | PASS | L27 `onBulkReject?:`, L138 `{onBulkReject && <Button>}`, L177 `{onBulkReject && <RejectModal>}` |
| 6 | AR-14: software_validation commentRequired=true + dialog keys | PASS | `approvals-api.ts` L295-303: `commentRequired: true`, `commentDialogTitleKey`, `commentPlaceholderKey` 존재 |
| 7 | AR-14: i18n keys ko + en | PASS | ko L60-65: `commentDialogTitle`/`commentPlaceholder` 존재. en L61-65: 동일 키 존재 |
| 8 | S-1: reasonLabel에 "10자 이상 필수"/"min. 10 characters" 없음 | PASS | ko: `"반려 사유"`, en: `"Rejection Reason"` — 글자수 제한 문자열 없음 |
| 9 | ApprovalDetailPanel 완전 삭제 (0 grep 매치) | PASS | 파일 없음 + 어떤 파일에서도 import 없음 |
| 10 | ApprovalBadge/StatusBadge 0건 in approvals components | PASS | approvals/ 내 어떤 파일에서도 ApprovalBadge/StatusBadge 미사용 |
| 11 | getInvalidationKeys helper in ApprovalsClient | PASS | `ApprovalsClient.tsx` L125: `const getInvalidationKeys = () => [...]` |

---

## Iteration History

| Iter | Issue | Status |
|------|-------|--------|
| 1 (Evaluator) | AR-8 BulkActionBar onBulkReject 미가드 — inspection 탭에서 일괄반려 버튼 노출 | FIXED |
| 2 (Evaluator) | Final verification | PASS |

---

## SHOULD / Observations (non-blocking)

| # | Observation | Severity | Action |
|---|-------------|----------|--------|
| S-1 | `rejectModal.validation` / `bulk.rejectValidation` 키가 여전히 "10자 이상" 텍스트 포함 — RejectModal 코드에서 미사용 (Zod 에러 메시지는 스키마 내 하드코딩) | Low | tech-debt 등록 |
| S-2 | AR-13 (self_inspection ApprovalCategory) — 백엔드 self-inspection 모듈 존재하나 ApprovalCategory enum 미포함, ROLE_APPROVAL_CATEGORIES에도 없음. Backend 승인 엔드포인트 확인 필요 | Medium | tech-debt 등록 |
| S-3 | `ApprovalsClient.tsx` L501 멀티라인 onReject 표현식 — JSX 인라인 3항 연산자가 가독성 저하. 사전 변수 추출 권장 | Low | tech-debt 등록 |

---

## Post-merge Actions

1. tech-debt-tracker.md에 contract section 11의 11 deferred items 등록
2. AR-13 (self_inspection) backend 확인 → ApprovalCategory 추가 여부 결정
3. `rejectModal.validation`/`bulk.rejectValidation` i18n 키 정리 (미사용 삭제 또는 실제 min(1) 메시지로 교정)
