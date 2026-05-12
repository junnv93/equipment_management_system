---
slug: checkouts-sprint4-followups-sh1-sh7
mode: 1
created: 2026-05-12
domain: checkouts
parent_sprint: checkouts-sprint4-followups-s2-s4-s5-s6 (commit 9787d245)
status: active
---

# Contract — checkouts-sprint4-followups-sh1-sh7

## 배경

`checkouts-sprint4-followups-s2-s4-s5-s6` (commit `9787d245`)의 SHOULD/EXT 후속 잔여 4건 closure.

| ID | 항목 | 트리거 | 처리 |
|---|---|---|---|
| SH-1 | rejection-presets-admin-e2e | 본 sprint 진입 | ✅ 실행 |
| SH-2 | revocation-window-e2e | 본 sprint 진입 | ✅ 실행 |
| SH-3 | destination-create-e2e | 본 sprint 진입 | ✅ 실행 |
| SH-4 | rejection_presets.sort_order DB index | 1000+ rows 도달 | ⏭ tech-debt 유지 |
| SH-5 | revocation-window server time skew | clock skew 보고 | ⏭ tech-debt 유지 |
| SH-6 | destination entity 승격 | dataset > 500 | ⏭ tech-debt 유지 |
| SH-7 | CheckoutDetailClient revocation 통합 | 본 sprint 진입 | ✅ 실행 |

## 발견된 architectural debt (sprint scope에 포함)

**`revokeApproval(checkoutId): Promise<void>`** ↔ **backend `revokeApprovalSchema` (version + reason 필수)** 시그니처 불일치.

- `apps/frontend/lib/api/checkout-revoke-approval.ts`: body 없이 POST → backend 항상 400.
- `apps/frontend/hooks/use-undo-toast.tsx:49`: 위 함수 호출 → 5초 undo 액션은 사실상 `undoError` toast로만 귀결 (sprint 4 commit `c01452f3` 잔존 결함).
- WF-AP03 e2e spec은 backend direct call만 검증 → frontend wire 결함 미탐지.

**처리 방침 (architectural fix)**:

- 신규 API client function `revokeApprovalWithReason(checkoutId, { version, reason })` 도입 — backend DTO 정합 (zod schema infer 사용 권장).
- 기존 `revokeApproval(checkoutId)` 는 SH-8 신규 tech-debt 항목으로 분리 — `use-undo-toast` 동작 정책(system reason vs 별도 `/undo-approval` endpoint) 결정 후 closure. 본 sprint 범위 초과로 격리.
- SH-7 통합은 신규 function 사용 — 5분 윈도우 + 사용자 입력 reason 정합.

## 변경 대상 파일

### 신규 파일

1. `apps/frontend/lib/api/checkout-revoke-approval-with-reason.ts` — 신규 API client function. `RevokeApprovalInput` schema-infer type 사용.
2. `apps/frontend/tests/e2e/admin/rejection-presets-admin.spec.ts` — SH-1 e2e (systemAdmin 토큰).
3. `apps/frontend/tests/e2e/checkouts/revocation-window.spec.ts` — SH-2 e2e (page.clock fake time).
4. `apps/frontend/tests/e2e/checkouts/destination-create.spec.ts` — SH-3 e2e.

### 수정 파일

5. `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — SH-7 통합:
   - `RevocationWindowCountdown` import + 조건부 렌더 (status === APPROVED && approverId === session.user.id).
   - 신규 `revokeMutation` (useOptimisticMutation) — `revokeApprovalWithReason` 호출, optimistic → status = PENDING, approverId/approvedAt clear.
   - `invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS` 재사용.
6. `.claude/exec-plans/tech-debt-tracker.md` — SH-1/2/3/7 [x] 처리, SH-8 신규 등록, 새 후속 등록 시 처리.
7. `.claude/contracts/REGISTRY.md` — Active → Completed 이동.

### 다른 세션 보호 (touch 금지)

39 staged/untracked 파일 — 본 sprint 외 도메인 (cache-event/audit/qr-access/EquipmentRow/design-tokens/saved-views 등). `git add <path>` 시 명시적 단일 파일만 add, **never `git add -A`**.

## MUST 기준

| # | 기준 | 검증 명령 |
|---|------|----------|
| M-1 | `pnpm --filter frontend tsc --noEmit` EXIT=0 (본 sprint 변경 영역) | tsc |
| M-2 | `pnpm --filter frontend lint` EXIT=0 (본 sprint 변경 파일) | lint |
| M-3 | Playwright spec 파일이 `npx playwright test --list` 에 인식됨 (SH-1/2/3) | `npx playwright test --list` grep |
| M-4 | 신규 API function `revokeApprovalWithReason` zod schema-infer 타입 사용 (인라인 인터페이스 0건) | grep `RevokeApprovalInput\|z.infer<typeof revokeApprovalSchema>` |
| M-5 | SH-7: CheckoutDetailClient가 `RevocationWindowCountdown` import + 조건부 가드 (status APPROVED + approverId === user.id) 명시 | grep |
| M-6 | SH-7: revokeMutation 시 invalidateKeys `CheckoutCacheInvalidation.APPROVAL_KEYS` 재사용, setQueryData 0건 | grep |
| M-7 | e2e specs: data-testid 사용 (CSS selector 깊은 nesting 0건), `data-testid` 가 component에 없으면 추가 | grep e2e specs |
| M-8 | 하드코딩 0: API endpoint는 `API_ENDPOINTS.CHECKOUTS.REVOKE_APPROVAL`, role은 schemas enum, 5분 = `APPROVAL_REVOCATION_WINDOW_MS`, 사유 min/max = `VALIDATION_RULES.*`, destination max = `VALIDATION_RULES.DESTINATION_MAX_LENGTH` | grep '5 \* 60 \* 1000\|300000\|"reason"' |
| M-9 | 다른 세션 39 파일 staged/untracked 미변경 (`git status -s` diff 검증) | `git status -s` 비교 |
| M-10 | tech-debt-tracker SH-1/2/3/7 [x], SH-4/5/6 그대로, SH-8 신규 항목 등록 | grep tech-debt |
| M-11 | use-undo-toast.tsx 호출 site 미변경 (broken state는 SH-8로 격리, surgical) — 본 sprint scope 초과 방지 | git diff |
| M-12 | i18n parity: 신규 i18n 키 ko/en 양쪽 동시 추가 (jq path diff 0) | jq |

## SHOULD 기준 (실패 시 tech-debt, 루프 미차단)

| # | 기준 |
|---|------|
| S-1 | E2E spec headed 모드 실행 시 PASS (CI 환경 미실행 시 skip) |
| S-2 | SH-7: `aria-label` 또는 `role` 정합 — RevocationWindowCountdown 자체가 SSOT (재구현 X) |
| S-3 | E2E spec 내 `page.waitForTimeout` 0건 — `expect().toHaveText`/`toBeVisible` polling 사용 |
| S-4 | SH-2 e2e: `page.clock.install({ time })` 또는 동등 fake clock 사용 — 실제 5분 대기 회피 |
| S-5 | SH-1: 권한 거부 redirect 검증 (testOperator → /admin/rejection-presets → /dashboard) |

## Out-of-scope (분리)

- SH-4/SH-5/SH-6: 트리거 미도달 — tech-debt 유지.
- SH-8 (신규 분리): `use-undo-toast.tsx` revokeApproval broken state. Backend 정책 결정 필요(별도 `/undo-approval` no-reason endpoint vs frontend system reason). Sprint 4 commit c01452f3 잔존 부채로 등록.
- `RejectionPresetFormDialog` Storybook entry (S-9): Storybook 미설치 그대로.

## 검증 워크플로

```bash
# 1. tsc + lint
pnpm --filter frontend tsc --noEmit
pnpm --filter frontend lint apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx \
  apps/frontend/lib/api/checkout-revoke-approval-with-reason.ts \
  apps/frontend/tests/e2e/admin/rejection-presets-admin.spec.ts \
  apps/frontend/tests/e2e/checkouts/revocation-window.spec.ts \
  apps/frontend/tests/e2e/checkouts/destination-create.spec.ts

# 2. Playwright list (spec 파일 인식)
cd apps/frontend && npx playwright test --list \
  tests/e2e/admin/rejection-presets-admin.spec.ts \
  tests/e2e/checkouts/revocation-window.spec.ts \
  tests/e2e/checkouts/destination-create.spec.ts

# 3. 다른 세션 보호 검증
git status -s | wc -l   # 변경 후에도 untracked + staged 총 카운트 적절

# 4. i18n parity (jq diff)
diff <(jq -S 'paths|join(".")' apps/frontend/messages/ko/checkouts.json) \
     <(jq -S 'paths|join(".")' apps/frontend/messages/en/checkouts.json)
```

## 커밋 전략

**중간 커밋 권고** (사용자 명시):

1. C1: `feat(api): revokeApprovalWithReason — schema-infer API function 신설` — 1 파일 신규.
2. C2: `feat(checkouts): SH-7 CheckoutDetailClient revocation 통합` — 1 파일 수정.
3. C3: `test(e2e): SH-1/2/3 admin presets + revocation window + destination create spec` — 3 파일 신규.
4. C4: `docs(harness): SH-1~SH-7 closure + SH-8 신규 tech-debt 등록` — 2 파일 (tracker + REGISTRY).

각 커밋 단위마다 `git add <list>` 명시적 단일 파일 add, **다른 세션 파일 흡수 방지**.
