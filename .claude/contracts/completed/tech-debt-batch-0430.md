# Contract: tech-debt-batch-0430

**생성일**: 2026-04-30

## Task
8건의 tech-debt 일괄 해소 — approvals-api 분할(MEDIUM) + i18n 게이트 cross-cutting ns 확장(MEDIUM) + 6건 LOW 정합성 정리.

## Scope (변경 허용 파일)

- `apps/frontend/lib/api/approvals-api.ts` (barrel로 축소)
- `apps/frontend/lib/api/approvals/types.ts` (신규)
- `apps/frontend/lib/api/approvals/internal-rows.ts` (신규)
- `apps/frontend/lib/api/approvals/mappers.ts` (신규)
- `apps/frontend/lib/api/approvals/fetchers.ts` (신규)
- `apps/frontend/lib/api/approvals/actions.ts` (신규)
- `apps/frontend/lib/types/checkout-ui.ts` (신규)
- `apps/frontend/components/shared/NextStepPanel.tsx`
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` (선택 — import 경로 유지면 불필요)
- `apps/backend/.eslintrc.js`
- `apps/backend/src/common/identifiers/identifier.service.spec.ts`
- `apps/frontend/i18n/request.ts`
- `scripts/check-i18n-call-sites.mjs`
- `docs/references/frontend-patterns.md`
- `.claude/exec-plans/tech-debt-tracker.md`

## MUST 기준 (모두 PASS해야 함)

| ID | 기준 | 검증 방법 |
|---|---|---|
| M1 | tsc --noEmit frontend 0 error | `pnpm --filter frontend run tsc --noEmit` |
| M2 | tsc --noEmit backend 0 error | `pnpm --filter backend run tsc --noEmit` |
| M3 | frontend build 성공 | `pnpm --filter frontend run build` |
| M4 | approvals-api barrel 호환 — 호출처 23개 무변경 | `grep -rn "from '@/lib/api/approvals-api'" apps/frontend --include="*.ts" --include="*.tsx" \| wc -l` 결과 ≥ 20 (import 재편 방식에 따라 일부 변동 허용 — tsc PASS로 최종 검증) |
| M5 | barrel export 완비 | `grep -E "^export" apps/frontend/lib/api/approvals-api.ts` 에 `ApprovalItem`, `ApprovalCategory`, `TAB_META`, `ROLE_TABS`, `RejectReasonSchema`, `REJECTION_MIN_LENGTH`, `REQUEST_TYPES`, `approvalsApi`, `PendingCountsByCategory`, `ApprovalKpiResponse`, `BulkActionResult`, `Attachment`, `ApprovalSummaryData`, `TabMeta`, `ApprovalSection`, `APPROVAL_SECTIONS`, `UnifiedApprovalStatus`, `ApprovalHistoryEntry` 모두 포함 |
| M6 | cross-cutting ns 5개 flat key 검사 적용 | `grep "CROSS_CUTTING_NAMESPACES" scripts/check-i18n-call-sites.mjs` + `node scripts/check-i18n-call-sites.mjs --all` exit 0 |
| M7 | cross-cutting ns flat key 위반 시 exit 1 | errors.json 루트에 flat string 임시 추가 → exit 1; 제거 후 exit 0 |
| M8 | eslint backend 통과 | `pnpm --filter backend run lint:ci` exit 0 |
| M9 | OverflowAction 로컬 interface 정의 1건 (SSOT) | `grep -rn "interface OverflowAction" apps/frontend --include="*.ts" --include="*.tsx"` 결과 `lib/types/checkout-ui.ts` 1건만 |
| M10 | identifier negative test PASS | `pnpm --filter backend exec jest src/common/identifiers/identifier.service.spec.ts` exit 0 + 신규 negative case 1건 이상 |
| M11 | i18n namespaces 배열 동작 변경 0건 | namespaces 배열 항목 추가/삭제 0건 (주석만 변경) |
| M12 | tracker 중복 [ ] 항목 0건 | `grep -E "^\- \[ \].*pre-existing-dday-deprecation" .claude/exec-plans/tech-debt-tracker.md` 매치 0건; dashboard-controller-zod-scope-validation / dashboard-controller-process-env-direct 동일 |
| M13 | frontend-patterns.md 모순 표현 제거 | "props으로 끌어올리는 것이 일관적이다" 표현이 제거되고 도메인-결합 vs cross-cutting 분기가 명확히 기재 |
| M14 | approvals sub-module 순환 의존 0건 | `mappers.ts`가 `fetchers.ts`/`actions.ts`를 import 하지 않음; `fetchers.ts`가 `actions.ts` import 안 함 |

## SHOULD 기준 (실패해도 루프 차단 않음, tech-debt-tracker 기록)

| ID | 기준 |
|---|---|
| S1 | backend test 전체 통과 (`pnpm --filter backend run test`) |
| S2 | approvals-api.ts barrel ≤ 80줄 |
| S3 | sub-module 각 ≤ 500줄 |
| S4 | `mappers.ts`는 외부 API 모듈 import 0건 (순수 함수 모듈) |
| S5 | `NextStepPanel.tsx`에 신규 호출처 권장 import 경로 주석 명시 |
| S6 | `CROSS_CUTTING_NAMESPACES` 상수가 스크립트 상단 1곳에만 정의 (중복 정의 0건) |

## OUT-OF-SCOPE

- 23개 approvals-api 호출처 코드 수정 (barrel re-export로 호환 유지가 정책)
- approvals-api 동작 변경 (메서드 시그니처/반환 타입/에러 처리 일체 보존)
- `OverflowAction` 시그니처 변경 (label/onClick/variant)
- 다른 cross-cutting ns 후보 추가 (5개 ns 한정)
- identifier.service.ts 본체 변경 (테스트만 추가)
- tech-debt-tracker.md의 다른 항목 정리 (8건 외)

## Verification Commands

```bash
# Compile / Lint / Build
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter frontend run build
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run lint:ci

# Test
pnpm --filter backend exec jest src/common/identifiers/identifier.service.spec.ts

# i18n gate
node scripts/check-i18n-call-sites.mjs --all

# Structure / SSOT
grep -rn "from '@/lib/api/approvals-api'" apps/frontend --include="*.ts" --include="*.tsx" | wc -l
grep -rn "interface OverflowAction" apps/frontend --include="*.ts" --include="*.tsx"
grep -E "^\- \[ \].*(pre-existing-dday-deprecation|dashboard-controller-zod-scope-validation|dashboard-controller-process-env-direct)" .claude/exec-plans/tech-debt-tracker.md
```
