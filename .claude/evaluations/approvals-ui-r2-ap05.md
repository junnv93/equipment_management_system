# AP-05 Evaluation Report (hover-inline buttons)

## Iteration: 1
## Date: 2026-04-27

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | approveIcon token used | PASS | ApprovalRow.tsx:146 — `APPROVAL_ACTION_BUTTON_TOKENS.approveIcon` 직접 참조 |
| 2 | rejectIcon token used | PASS | ApprovalRow.tsx:159 — `APPROVAL_ACTION_BUTTON_TOKENS.rejectIcon` 직접 참조 |
| 3 | group-hover:inline-flex pattern | PASS | ApprovalRow.tsx:145,158 — `'h-7 w-7 hidden group-hover:inline-flex'` 두 버튼 모두 적용, TableRow에 `className="group"` |
| 4 | tsc PASS | PASS | `pnpm tsc --noEmit` 출력 없음 (오류 0건) |
| 5 | APPROVAL_ACTION_BUTTON_TOKENS exported | PASS | design-tokens/index.ts:551에서 named export 확인 |
| 6 | i18n parity ko/en hoverApprove/hoverReject | PASS | ko/approvals.json:118-119 `"hoverApprove": "승인"`, `"hoverReject": "반려"` / en:118-119 `"hoverApprove": "Approve"`, `"hoverReject": "Reject"` — 양쪽 동일 키 존재 |

## SHOULD Criteria Results

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | aria-label on hover buttons | PASS | ApprovalRow.tsx:150 `aria-label={t('row.hoverApprove')}`, :163 `aria-label={t('row.hoverReject')}` — i18n 키 경유, 하드코딩 없음 |

## Verdict: PASS

## Issues (if any)

없음.

### 추가 검증 메모

- `approveIcon` 토큰 값: `'text-brand-ok hover:bg-brand-ok/10'` — semantic 토큰 경유, hardcoded 색상 없음
- `rejectIcon` 토큰 값: `'text-brand-critical hover:bg-brand-critical/10'` — semantic 토큰 경유, hardcoded 색상 없음
- 컴포넌트 내 `text-green-*`, `text-red-*` 등 hardcoded 색상 클래스 0건 확인
- `verify-design-tokens.mjs` 스크립트 미존재 (scripts/ 디렉토리에 없음) — 토큰 정의 직접 육안 검증으로 대체
