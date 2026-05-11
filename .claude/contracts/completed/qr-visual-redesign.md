# Contract — QR Visual Redesign

> Slug: `qr-visual-redesign` · Mode 2 (Full Planner→Generator→Evaluator) · 2026-05-11
> Exec plan: `.claude/exec-plans/active/2026-05-11-qr-visual-redesign.md`
> Source: `/mnt/c/Users/kmjkd/Downloads/QR 시각디자인 개선 - 개발 프롬프트.md`

## Scope

8 TASKs from QR mobile redesign prompt:
- TASK 1 (HIGH): Action priority pixels + `QR_ACTION_GROUP` SSOT + group rendering
- TASK 2 (HIGH): 4-tier `EQUIPMENT_STATUS_TONE` SSOT + `StatusBadge` + `CalibrationDueBadge`
- TASK 3 (HIGH): Multi-handover response model (`HandoverItem[]`) + `HandoverPickerSheet`
- TASK 4 (MED): 1-action auto-progress (2s countdown, prefers-reduced-motion 1.5s plain)
- TASK 5 (MED): Condition form normal-first flow + inline abnormal + 4-step stepper
- TASK 6 (MED): Photo position inside abnormal card + orphan cleanup
- TASK 7 (LOW): QR label PDF dialog visualization + segmented tabs + recommendedForKey
- TASK 8 (TOKEN): 4-tier brand tokens + touch-target + mobile text ramp + `.text-mono`

---

## MUST criteria (binary PASS/FAIL — harness Evaluator loop trigger on any FAIL)

### Build / Type / Test

- **M-1** `pnpm tsc --noEmit` EXIT=0 (backend + frontend + packages).
- **M-2** `pnpm --filter frontend run build` succeeds (Tailwind JIT picks up new brand-urgent/brand-mute classes).
- **M-3** `pnpm --filter backend run test` PASS + `pnpm --filter frontend run test` PASS.

### TASK 1 — QR_ACTION_GROUP SSOT

- **M-4** `QR_ACTION_GROUP` exported from `packages/shared-constants/src/qr-access.ts` as `Record<QRAllowedAction, QRActionGroup>` covering all 7 actions. Grep:
  ```bash
  grep -c "view_detail:\|view_qr:\|request_checkout:\|mark_checkout_returned:\|report_nc:\|confirm_handover_receive:\|confirm_handover_return:" packages/shared-constants/src/qr-access.ts
  # ≥ 21 (priority + group + i18n keys, 3 records × 7 = 21)
  ```
  Plus `QR_ACTION_GROUP` named export grep `≥ 1`.
- **M-5** Stale "10분 TTL" / "token 페어링" comment count = 0:
  ```bash
  rg -n "10분 TTL.*페어링|10[- ]?minute TTL.*token|token 페어링" apps/backend/src apps/frontend packages/shared-constants/src
  # = 0
  ```
  New lender/borrower role comments present (existing JSDoc keywords `lender_checked` and `borrower_returned` grep ≥ 2 in `qr-access.ts`).

### TASK 2 — EQUIPMENT_STATUS_TONE + StatusBadge

- **M-6** `EQUIPMENT_STATUS_TONE` SSOT in `packages/shared-constants/src/equipment-status-tone.ts` covers all **8** `EquipmentStatus` values (available, checked_out, non_conforming, spare, pending_disposal, disposed, temporary, inactive). Grep:
  ```bash
  grep -cE "(available|checked_out|non_conforming|spare|pending_disposal|disposed|temporary|inactive):" packages/shared-constants/src/equipment-status-tone.ts
  # ≥ 8
  ```
  TypeScript `as const satisfies Record<EquipmentStatus, EquipmentStatusTone>` ensures compile-time exhaustiveness.
- **M-7** `StatusBadge` component exists at `apps/frontend/components/ui/StatusBadge.tsx`. Production `<Badge variant="outline">{...status...}</Badge>` raw display count = 0 in `apps/frontend/components/mobile/EquipmentLandingClient.tsx`:
  ```bash
  rg -n '<Badge variant="outline">[^<]*\{[^}]*\.status[^}]*\}' apps/frontend/components/mobile/EquipmentLandingClient.tsx
  # = 0
  ```
- **M-25** `CalibrationDueBadge` renders D-N when `nextCalibrationDate` ≤ 30 days from now; renders `null` when ≥ 31 days. RTL spec covers both branches:
  ```bash
  grep -n "≤30\|days.*30\|getDaysUntil" apps/frontend/components/calibration/CalibrationDueBadge.tsx
  # ≥ 1 (boundary logic present)
  # RTL spec must include 30-day and 31-day assertions
  ```

### TASK 8 — Design Tokens

- **M-8** All 9 new CSS variables registered in `CSS_VAR_NAMES` SSOT (`apps/frontend/lib/design-tokens/css-variables.ts`):
  ```bash
  grep -c "brandUrgent:\|brandUrgentWeak:\|brandMute:\|brandMuteWeak:\|touchTargetMin:\|touchTargetGlove:\|text1Mobile:\|text2Mobile:\|textMono:" apps/frontend/lib/design-tokens/css-variables.ts
  # ≥ 9
  ```
  And defined in `apps/frontend/styles/globals.css`:
  ```bash
  grep -cE "^\s*--(brand-urgent|brand-urgent-weak|brand-mute|brand-mute-weak|touch-target-min|touch-target-glove|text-1-mobile|text-2-mobile|text-mono):" apps/frontend/styles/globals.css
  # ≥ 9
  ```
  `--touch-target-min` value updated from 44px to 48px (Material baseline).

### TASK 3 — Multi-Handover Response

- **M-9** `QRAccessResult.handovers?: HandoverItem[]` array field added. `HandoverItem` shape from `packages/schemas/src/qr-handover.ts` includes all required fields:
  ```bash
  grep -c "id:\|type:\|lenderTeamName:\|lenderSiteLabel:\|borrowerSiteLabel:\|checkedAt:\|lastCheck:\|inspectorName:" packages/schemas/src/qr-handover.ts
  # ≥ 8
  ```
  Plus `handoverCheckoutId?: string` retains backward-compat with JSDoc `@deprecated` and `logger.debug('handoverCheckoutId deprecated')` call (grep `≥ 1`).
- **M-10** `HandoverPickerSheet` exists at `apps/frontend/components/mobile/HandoverPickerSheet.tsx`. `EquipmentActionSheet` renders it when `handovers.length > 1`:
  ```bash
  grep -n "handovers.length > 1\|handovers\.length>1\|handovers && handovers.length > 1" apps/frontend/components/mobile/EquipmentActionSheet.tsx
  # ≥ 1
  ```
- **M-24** Backend unit test `apps/backend/src/modules/equipment/services/qr-access.service.spec.ts` includes a case where same borrower has 2 lender_checked checkouts and `resolveHandoverActions` returns both (handovers.length === 2):
  ```bash
  grep -cE "handovers.*length.*2|toHaveLength\(2\)" apps/backend/src/modules/equipment/services/qr-access.service.spec.ts
  # ≥ 1
  ```
  Test PASS (covered by M-3).

### TASK 4 — Auto-progress

- **M-11** `EquipmentLandingClient.tsx` has 2-second countdown for `allowedActions.length === 1 && priority>=100 && handovers.length <= 1`, with cancel button and `prefers-reduced-motion: reduce` 1.5-second plain delay branch:
  ```bash
  grep -n "prefers-reduced-motion\|matchMedia.*reduce" apps/frontend/components/mobile/AutoProgressCountdown.tsx apps/frontend/components/mobile/EquipmentLandingClient.tsx
  # ≥ 1
  grep -n "QR_ACTION_PRIORITY.*100\|priority.*>=.*100\|>= 100" apps/frontend/components/mobile/EquipmentLandingClient.tsx
  # ≥ 1
  grep -n "handovers.*length.*<=.*1\|handovers?.length\s*<=\s*1" apps/frontend/components/mobile/EquipmentLandingClient.tsx
  # ≥ 1
  ```

### TASK 5 + TASK 6 — Condition Form

- **M-12** "모두 정상으로 제출" 64px button + abnormal inline expansion + separated 촬영/갤러리 buttons (`capture="environment"` vs no capture attr):
  ```bash
  grep -c 'capture="environment"' apps/frontend/components/checkouts/EquipmentConditionForm.tsx apps/frontend/components/checkouts/ReturnInspectionForm.tsx
  # ≥ 2 (each form has 촬영 button)
  grep -n "h-16\|height.*64\|\[64px\]" apps/frontend/components/checkouts/EquipmentConditionForm.tsx
  # ≥ 1 (64px tall shortcut button)
  ```
- **M-13** Photo card moved inside abnormal card (DOM nesting). Frontend orphan cleanup via `documentApi.deleteOrphan`:
  ```bash
  grep -n "deleteOrphan" apps/frontend/lib/api/document-api.ts
  # ≥ 1 (method exported)
  grep -n "deleteOrphan" apps/frontend/components/checkouts/EquipmentConditionForm.tsx
  # ≥ 1 (called on unmount/cancel)
  ```
- **M-15** 4-step stepper (`StepperHeader`) imported and rendered in **both** `EquipmentConditionForm.tsx` and `ReturnInspectionForm.tsx`:
  ```bash
  grep -c "StepperHeader" apps/frontend/components/checkouts/EquipmentConditionForm.tsx apps/frontend/components/checkouts/ReturnInspectionForm.tsx
  # ≥ 2 (one import per file at minimum)
  ```

### TASK 7 — QR Label PDF Dialog

- **M-14** `LABEL_SIZE_PRESETS` has `recommendedForKey` per preset (all 7); segmented tabs (`<Tabs>`) in `EquipmentQRButton.tsx`; proportional visual preview rows:
  ```bash
  grep -c "recommendedForKey:" packages/shared-constants/src/qr-config.ts
  # ≥ 7 (xl, large, medium, small, xs, xxs, micro)
  grep -n "import.*Tabs.*from\|TabsList\|TabsTrigger" apps/frontend/components/equipment/EquipmentQRButton.tsx
  # ≥ 1
  ```

### i18n / Accessibility

- **M-16** All new i18n keys present in **both** `messages/ko/qr.json` and `messages/en/qr.json` (also `checkouts.json` for condition form). Key list includes (non-exhaustive):
  - `qr.mobileActionSheet.groups.urgent` / `.primary` / `.secondary`
  - `qr.landing.autoProgress.label` / `.cancel`
  - `qr.qrDisplay.recommendedFor.{a4Sheet,largeInstrument,midInstrument,smallInstrument,cable,ultraCompact,ultraCompactCable}`
  - `qr.qrDisplay.modeTab.sampler` / `.custom`
  - `qr.qrDisplay.fallbackInlineNotice`
  - `checkouts.condition.allNormalShortcut`
  - `checkouts.condition.photoCaptureLabel` / `.photoGalleryLabel`
  - `checkouts.condition.photoRecommendedHint`
  - `checkouts.condition.stepper.{step1,step2,step3,step4}`
  - `qr.handoverPicker.{title, description, emptyState}`
  - `qr.statusBadge.tone.{ok, warn, urgent, mute}`
- **M-23** ko/en key parity diff = 0. Verified by AST-based parity script or verify-i18n skill:
  ```bash
  node -e "
  const ko = require('./apps/frontend/messages/ko/qr.json');
  const en = require('./apps/frontend/messages/en/qr.json');
  const flat = (o, p = '') => Object.entries(o).flatMap(([k,v]) => typeof v === 'object' && v !== null && !Array.isArray(v) ? flat(v, p + k + '.') : [p + k]);
  const koKeys = new Set(flat(ko));
  const enKeys = new Set(flat(en));
  const diff = [...koKeys].filter(k => !enKeys.has(k)).concat([...enKeys].filter(k => !koKeys.has(k)));
  if (diff.length > 0) { console.error('DIFF', diff); process.exit(1); }
  "
  # EXIT=0 (also repeat for checkouts.json and equipment.json if touched)
  ```

### Architectural / Permission / a11y Guards

- **M-17** `verify-implementation` skill PASS (runs all 13 verify-* sub-skills below — same Mode 2 standard as prior sprints):
  - verify-ssot, verify-hardcoding, verify-zod, verify-i18n, verify-frontend-state, verify-security, verify-design-tokens, verify-handover-qr, verify-checkout-fsm, verify-routing-origin, verify-click-feedback, verify-bulk-action-bar, verify-nextjs.
- **M-18** `review-architecture` skill (single run) reports no CRITICAL or HIGH findings.
- **M-19** `useAuth().can()` calls = 0 in modified QR mobile components (server `allowedActions` SSOT only):
  ```bash
  rg -nE "useAuth\(\)\.can\(" apps/frontend/components/mobile/ apps/frontend/components/checkouts/EquipmentConditionForm.tsx apps/frontend/components/checkouts/ReturnInspectionForm.tsx
  # = 0
  ```
- **M-20** Inline `<Badge variant="outline">` for status display = 0 in QR mobile + landing flow:
  ```bash
  rg -nE '<Badge\s+variant="outline">\s*\{[^}]*\bstatus\b' apps/frontend/components/mobile/ apps/frontend/app/q
  # = 0
  ```
- **M-21** `text-muted-foreground` on 1st-tier info (장비명/CTA 라벨/현황 핵심 상태) = 0 in modified QR components. **Manual review during Evaluator** + grep heuristic:
  ```bash
  # 1st-tier info heuristic: text-muted-foreground in same line as data.name, action label, status — manual cross-check
  rg -n "text-muted-foreground" apps/frontend/components/mobile/EquipmentLandingClient.tsx
  # Each match must be on KV secondary label only (e.g. siteLabel <dt>, NOT data.name <h1>)
  ```
- **M-22** Touch targets ≥ 48px on all action buttons in mobile QR flow. CSS-level guarantee via `min-h-[var(--touch-target-min)]` (where `--touch-target-min: 48px` from M-8):
  ```bash
  grep -n "var(--touch-target-min)\|min-h-\[var(--touch-target-min)\]" apps/frontend/components/mobile/EquipmentActionSheet.tsx apps/frontend/components/mobile/AutoProgressCountdown.tsx apps/frontend/components/mobile/HandoverPickerSheet.tsx
  # ≥ 3 (one per major mobile component)
  ```

---

## SHOULD criteria (tech-debt log, NO loop trigger)

- **S-1** Playwright e2e for 6 회귀 시나리오 (`apps/frontend/tests/e2e/qr-landing-regression.spec.ts`) — all 6 cases from prompt §회귀 테스트 PASS. May be deferred if environment-flaky; documented in tech-debt-tracker.md.
- **S-2** Storybook entries: `StatusBadge` (4 tones × 8 statuses sampler), `HandoverPickerSheet` (single / multi / empty), `AutoProgressCountdown` (active / reduced-motion / canceled), `CalibrationDueBadge` (D-30 / D-7 / D-0 / null).
- **S-3** RTL spec for `HandoverPickerSheet` (single auto-route exit, multi render, empty state) + `StatusBadge` (8 statuses × tone class) + `CalibrationDueBadge` (boundary 30/31 days).
- **S-4** Backend cron path for orphan photo cleanup (`condition_check_photo` + null FK + 24h sweep) — defense-in-depth if `documentApi.deleteOrphan` frontend call fails silently. Schedule: every 6h.
- **S-5** Visual regression snapshot baseline refresh (4-tier color change + group rendering invalidates existing baselines).
- **S-6** `handoverCheckoutId` deprecated 1 release 후 cleanup — separate sprint.
- **S-7** `--touch-target-min` 44→48px 영향 audit (모바일 시트 외 hit-area). 추정 영향 0 but verify.
- **S-8** `EquipmentStatus` 8 values 의 tone 매핑 디자인 검토 (UX 팀 — `spare/inactive=mute`, `temporary=warn` 적정성).

---

## Out of scope (이 sprint 에서 손대지 않음)

- `QR_ACTION_VALUES` 확장 (`scan_continuous` 등 Phase 3)
- DB schema 변경 (`equipment`, `checkouts` 어느 테이블도 무손상)
- `useAuth` / `JwtUser` 권한 모델 변경
- `LABEL_LAYOUT_CONSTRAINTS` / `resolveLayoutMode` 알고리즘 변경 (시각 표시만)
- 기존 `EQUIPMENT_STATUS_TOKENS` 의 Tailwind class 매핑 (tone wire 만)
- Phase 5 verify-* skill 자체 수정 (skill 은 사용만, 도구 자체 갱신은 별도)

---

## Evaluator 실행 절차 (iter 1)

1. **빌드 게이트** (M-1 / M-2 / M-3 순서대로 실행, 어느 단계 FAIL 즉시 stop + Generator 재진입).
2. **SSOT 확장 검증** (M-4 / M-5 / M-6 / M-8 / M-9 grep — 정량).
3. **컴포넌트 존재 + 통합 검증** (M-7 / M-10 / M-11 / M-12 / M-13 / M-14 / M-15 grep + 파일 존재).
4. **i18n parity** (M-16 / M-23 — AST 또는 JSON keyset 비교).
5. **a11y / SSOT 우회 차단** (M-19 / M-20 / M-21 / M-22 — 우회 grep = 0 확인).
6. **백엔드 spec** (M-24 — `qr-access.service.spec.ts` Jest 실행).
7. **D-N 경계** (M-25 — RTL spec 30/31 day assertion 확인).
8. **verify-implementation + review-architecture** (M-17 / M-18 — skill 출력 보고서).

각 MUST FAIL 시 contract row 인용 + 실측 행 + 정정 가이드 포함하여 Generator 재진입 prompt 작성.

---

## Generator 시작 컨텍스트 hint (요약 — full prompt 는 별도)

- 작업 순서: **Phase 0 → Phase 1 (TASK 2 → TASK 1 → TASK 3 순서) → Phase 2 → Phase 3 → Phase 4 → Phase 5**.
- Phase 0/1 사이에 `pnpm tsc --noEmit` 1회 실행하여 token + SSOT 만 isolated PASS 확인 후 다음 진입 권고.
- `EQUIPMENT_STATUS_TONE` 은 8 values 전부 (프롬프트는 4 만 예시 — 실측 enum 우선).
- `QR_ACTION_GROUP` stale 주석 정리는 실측 결과 `qr-access.ts` 는 이미 업데이트됨 — 다른 위치 (backend service / frontend component JSDoc) 도 grep 후 일괄 정리.
- `useOptimisticMutation` 패턴 유지 (mutation 신규 없음 — orphan delete 는 fire-and-forget).
- `setQueryData` 절대 금지 (CLAUDE.md Rule 4).
- 모든 신규 string 은 i18n + ko/en parity 동시 작성 (단일 PR 커밋).

---

*Contract version*: 1 · *Author*: Planner (Mode 2 harness) · *Date*: 2026-05-11
