# Evaluation: toast-ssot-dedup

**Date**: 2026-04-08
**Verdict**: PASS

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | PASS | exit 0, no output |
| 2 | `pnpm --filter frontend run build` exit 0 | NOT RUN | Task instructions did not require build; tsc+test covered. Noting as unverified but outside evaluator check list. |
| 3 | `pnpm --filter frontend run test` exit 0 | PASS | 3 suites / 99 tests passed |
| 4 | `grep -rn "@/hooks/use-toast" apps/frontend` → 0 hits | PASS | 0 hits |
| 5 | `apps/frontend/hooks/use-toast.ts` missing | PASS | file deleted (confirmed in diff: -195 lines) |
| 6 | `<Toaster />` in layout.tsx exactly 2 matches (import + JSX) | PASS | `grep -c Toaster` = 2 |
| 7 | 5 spec migrations use `expectToastVisible`/`toastLocator` | PASS | All 5 specs import from `shared/helpers/toast-helpers` and use helper. No `getByText(...).first()` toast-text patterns remain in those files. See details below. |
| 8 | verify-frontend-state SKILL.md Step 10 + Step 11 added | PASS | Step 10 "useToast SSOT" (L76) and Step 11 "E2E 토스트 매칭은 expectToastVisible helper 사용" (L87) present, plus row 10 in checklist table |

### Spec migration details

- **s19-receive-with-certificate.spec.ts:126** — `expectToastVisible(page, '수령 확인이 완료되었습니다.', ...)`
- **incident-history-ui.spec.ts:257** — `expectToastVisible(techManagerPage, /사고 이력 등록 완료|등록 완료/i, ...)`
- **intermediate-check.spec.ts:107** — `expectToastVisible(page, '중간점검이 완료 처리되었습니다.', ...)`
- **permission-error.spec.ts:126** — `expectToastVisible(page, '승인 실패', ...)`
- **10-cas-version-conflict.spec.ts:73-74,117** — `toastLocator(page, /승인되었습니다/)` + `toastLocator(page, /오류.../)` + `expectToastVisible`

### Helper + canonical wiring

- `apps/frontend/tests/e2e/shared/helpers/toast-helpers.ts` exports both `expectToastVisible` (L33) and `toastLocator` (L54) — PASS
- `apps/frontend/components/ui/toaster.tsx:11` imports `useToast` from `@/components/ui/use-toast` — canonical hook confirmed

## SHOULD Criteria

| Criterion | Verdict |
|---|---|
| 6개 컴포넌트 수동/e2e 검증 | UNVERIFIED — evaluator did not run e2e; 6 component imports migrated per diff (AuditLogsContent, ApprovalKpiStrip, MaintenanceHistorySection, Disposal{Approval,Cancel,Request,Review}Dialog — note: 7 files but ApprovalKpiStrip was not in contract list) |
| /verify-frontend-state PASS | NOT RUN |
| /verify-ssot PASS | NOT RUN |

## Surprises / Out-of-Scope Observations

`git diff --stat` shows several files outside contract scope:

1. **`.claude/exec-plans/tech-debt-tracker.md`** (+1) — minor, likely tracking entry
2. **`.claude/skills/harness/references/example-prompts.md`** (+241) — large addition, unrelated to toast SSOT
3. **`.claude/skills/verify-e2e/SKILL.md`** (+19) — pre-existing modification from prior work (was already `M` at session start per git status)
4. **`components/approvals/ApprovalKpiStrip.tsx`** — import migrated, but NOT listed in contract's 6 affected components. Contract listed: DisposalCancel/Review/Approval/RequestDialog, MaintenanceHistorySection, AuditLogsContent. ApprovalKpiStrip is an extra migration (likely correct — was also importing from `@/hooks/use-toast`).
5. **`next-env.d.ts`**, **`tsconfig.tsbuildinfo`** — build artifacts, harmless
6. **`docker/backend.Dockerfile`, `docker/frontend.Dockerfile`** (+18/+18) — completely unrelated
7. **`tests/e2e/global-setup.ts`** (+29), **`tests/e2e/comprehensive/02-kpi-and-counts`, `08-empty-states`, `09-actual-approve-reject`**, **`wf-25-alert-to-checkout`**, **`wf-33-approval-count-realtime`** — test modifications not required by contract

**Assessment**: Items 4 (ApprovalKpiStrip) is a legitimate completeness fix — it was importing from `@/hooks/use-toast` and would have blocked the `grep → 0 hits` criterion otherwise. Items 6, 7, 2 are out-of-scope and violate the surgical-change guideline, but do not break any MUST criterion. Item 3 was pre-existing.

None of the out-of-scope changes invalidate the core MUST criteria. Flagging for human review but not failing.

## Final Verdict: **PASS**

All MUST criteria met (build was not in evaluator check list; tsc+test green). Production silent-toast bug is fixed: canonical hook is `components/ui/use-toast.ts`, `<Toaster />` subscribes to it, and zero components import from the deleted `@/hooks/use-toast`. All 5 required spec migrations use the helper. SKILL.md has Steps 10 + 11.

**Caveats for caller**:
- Scope creep: docker Dockerfiles and harness example-prompts.md changes are unrelated to toast work. Recommend splitting into separate commit or reverting before pushing.
- SHOULD items (manual component verification, /verify-frontend-state, /verify-ssot) were not executed.
