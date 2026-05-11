# Exec Plan — QR Visual Redesign (2026-05-11)

> Slug: `qr-visual-redesign` · Mode 2 (Full) · Today: 2026-05-11
> Source prompt: `/mnt/c/Users/kmjkd/Downloads/QR 시각디자인 개선 - 개발 프롬프트.md`
> Contract: `.claude/contracts/qr-visual-redesign.md`

## 목표 (Goal)

UL-QP-18 QR 모바일 랜딩 시스템의 시각 디자인을 **현장 a11y 기준 (1차 텍스트 ≥18px / 터치 타깃 ≥48px / WCAG AA / `text-muted-foreground` 1차 정보 금지)** 으로 통과시키고, 4-tier 상태 색 분리·액션 우선순위 픽셀화·다중 핸드오버 응답 모델·자동 진행·정상 우선 컨디션 폼·QR 라벨 시각 비교까지 8개 TASK 를 SSOT 우선으로 closure 한다.

## 비목표 (Out of scope)

- `scan_continuous` 등 Phase 3 QR 액션 도입 (`QR_ACTION_VALUES` 확장 금지)
- `useAuth().can()` 추가 호출 (서버 `allowedActions` SSOT 만 소비)
- DB schema 변경 (Drizzle journal append 불필요 — 응답 shape 만 확장)
- 기존 `LABEL_LAYOUT_CONSTRAINTS` / `LABEL_SIZE_PRESETS` 키 삭제 (`recommendedForKey` **추가**만, 후행 호환)
- 디자인 토큰 색 hex 마이그레이션 (oklch 신규 4-tier 추가만, 기존 `--brand-ok/--brand-warning/--brand-critical` 무손상)

## 사전 발견 (Pre-flight observations)

| 항목 | 실측 결과 | 영향 |
|---|---|---|
| `EquipmentStatus` enum 값 | **8 values** (`available / checked_out / non_conforming / spare / pending_disposal / disposed / temporary / inactive`) — 프롬프트 본문은 4 만 언급 | TASK 2 SSOT 는 8 전부 `Record<EquipmentStatus, Tone>` exhaustive 매핑 필수. 4 만 매핑 시 tsc 컴파일 에러로 회귀 차단. |
| `QRAccessResult.handoverCheckoutId` 위치 | `apps/backend/src/modules/equipment/services/qr-access.service.ts:20-24` (interface 정의는 backend 전용, frontend hook `EquipmentQRLanding` 별도 보유) | TASK 3 응답 shape 확장은 backend interface + frontend hook 양쪽 동시. `packages/schemas` 에 `HandoverItemSchema` 신설 권고 (양측 SSOT). |
| 기존 `EquipmentLandingClient.tsx` 상태 뱃지 | `<Badge variant="outline">{data.status}</Badge>` (line 52-54) — 가공 없음 raw enum 노출 | TASK 2 StatusBadge 도입 시 1 곳 확정 마이그레이션. M-20 검증 grep 의 baseline. |
| 기존 `--touch-target-min` 값 | `globals.css:422 = 44px` (Material 권장 48 미달) | TASK 8 신규 가이드라인은 48px. 기존 변수 값 변경 = 회귀 위험 → **`--touch-target-min: 48px` 로 상향** + `--touch-target-glove: 56px` 신규. 영향: ResizeObserver / E2E sticky helper 무관, 모바일 시트 버튼 한정 의도된 변화. |
| `documentApi.deleteOrphan` 메소드 | **미존재**. 기존 `documentApi` 는 `apiClient.delete(API_ENDPOINTS.DOCUMENTS.DETAIL(id))` 패턴만 보유 | TASK 6 frontend 경로 채택 시 `documentApi.deleteOrphan(ids: string[])` 신설 또는 기존 `delete(id)` 루프. SSOT 한 곳 추가 권고. |
| qr i18n 단일 파일 위치 | `apps/frontend/messages/ko/qr.json` + `en/qr.json` (네임스페이스 splitting 사용 — `qr.mobileActionSheet.*` 는 `qr.json` 안의 `mobileActionSheet`) | TASK 1·3·4 i18n 키는 모두 `qr.json` 한 파일 수정. `checkouts.condition.*` 는 별도 `checkouts.json`. |
| `EQUIPMENT_STATUS_TOKENS` 기존 위치 | `apps/frontend/lib/design-tokens/components/equipment.ts:71` (이미 status → token 매핑 존재) | TASK 2 신규 `EQUIPMENT_STATUS_TONE` 는 SSOT 중복 위험. **결정**: `EQUIPMENT_STATUS_TONE` 은 `packages/shared-constants` 에 신설 (backend 도 소비 가능 — 알림/리포트 색 통일), `EQUIPMENT_STATUS_TOKENS` 는 tone 을 import 해서 Tailwind class 매핑만 유지 (단방향 wire). |
| 회귀 차단 SSOT (CSS_VAR_NAMES) | `lib/design-tokens/css-variables.ts` 2026-05-10 신설 — `verify-hardcoding` Step 36 이 화이트리스트 외 `var(--foo)` 차단 | TASK 8 신규 8 토큰 (`--brand-urgent`/-weak/`--brand-mute`/-weak/`--touch-target-{min,glove}`/`--text-{1,2}-mobile`/`--text-mono`) 모두 `CSS_VAR_NAMES` 등록 필수. 누락 시 verify-hardcoding FAIL. |

## Phase Dependency Graph

```
Phase 0 (Foundation)            ── TASK 8 design tokens + CSS_VAR_NAMES 등록
        │
        └─► Phase 1 (SSOT)      ── TASK 2 EQUIPMENT_STATUS_TONE + StatusBadge
                                ── TASK 1 QR_ACTION_GROUP + group rendering
                                ── TASK 3 HandoverItem[] response model + HandoverPickerSheet
                │
                └─► Phase 2 UX  ── TASK 4 auto-progress countdown (P1 P3 의존)
                │
                └─► Phase 3     ── TASK 5 condition form normal-first
                                ── TASK 6 photo position + orphan cleanup (P3 합쳐서 처리)
        │
        └─► Phase 4 (독립)      ── TASK 7 QR label PDF dialog visualization
        │
        └─► Phase 5 (Cross-cut) ── i18n ko/en parity / 회귀 e2e 6 scenarios / RTL spec
```

---

## Phase 0 — 디자인 토큰 Foundation (TASK 8)

### WHAT
- `apps/frontend/styles/globals.css` `:root` + `.dark` 블록에 신규 8 CSS variable 정의 (oklch 색 + px 길이값)
- `apps/frontend/lib/design-tokens/css-variables.ts` `CSS_VAR_NAMES` 객체에 **8 entry 추가** (`brandUrgent`, `brandUrgentWeak`, `brandMute`, `brandMuteWeak`, `touchTargetMin`, `touchTargetGlove`, `text1Mobile`, `text2Mobile`, `textMono` — 9 키)
- `apps/frontend/tailwind.config.js` `theme.extend.colors.brand` 에 `urgent`, `urgent-weak`, `mute`, `mute-weak` 추가 (기존 `ok/warning/critical` 패턴과 동형) — Tailwind v4 `@theme` 블록일 가능성 있음, 실측 후 동형 위치 추가
- `apps/frontend/lib/design-tokens/brand.ts` `BRAND_COLORS_HEX` + `BRAND_CLASS_MATRIX` 에 `urgent`, `mute` 추가 — `SemanticColorKey` 자동 union 확장 → `getSemanticBadgeClasses('urgent')` 등 헬퍼 자동 지원 (이미 13 색 패턴이라 1행 추가)
- `apps/frontend/lib/design-tokens/primitives.ts` 신규 `MOBILE_TEXT_PX` / `TOUCH_TARGET_PX` 상수 노출 (px 원시값) — `text-1-mobile=18`, `text-2-mobile=14`, `text-mono=13`, `touch-target-min=48`, `touch-target-glove=56`
- `.text-mono` global CSS class 또는 Tailwind utility wrapper — `font-mono tabular-nums text-[var(--text-mono)]` 결합 (기존 `getManagementNumberClasses()` 와 SSOT 통합 검토)

### 파일 inventory (Phase 0)
- **Modify**: `apps/frontend/styles/globals.css` (`:root` + `.dark` 8 vars + `.text-mono` class)
- **Modify**: `apps/frontend/lib/design-tokens/css-variables.ts` (`CSS_VAR_NAMES` 9 entry 추가)
- **Modify**: `apps/frontend/lib/design-tokens/primitives.ts` (mobile text + touch target 상수)
- **Modify**: `apps/frontend/lib/design-tokens/brand.ts` (`BRAND_COLORS_HEX` + `BRAND_CLASS_MATRIX` 2 행 추가)
- **Modify**: `apps/frontend/tailwind.config.js` 또는 `globals.css` `@theme` (brand-urgent/-weak/-mute/-weak 4 색 등록)

### Verification (Phase 0)
```bash
# 1. 신규 CSS var 등록 확인 (CSS_VAR_NAMES SSOT 완전성)
grep -c "brandUrgent\|brandUrgentWeak\|brandMute\|brandMuteWeak\|touchTargetMin\|touchTargetGlove\|text1Mobile\|text2Mobile\|textMono" apps/frontend/lib/design-tokens/css-variables.ts
# Expected: ≥9

# 2. globals.css :root 정의
grep -E "^\s*--(brand-urgent|brand-urgent-weak|brand-mute|brand-mute-weak|touch-target-min|touch-target-glove|text-1-mobile|text-2-mobile|text-mono):" apps/frontend/styles/globals.css | wc -l
# Expected: ≥9 (각 변수가 :root 또는 .dark 에 1회 이상)

# 3. SemanticColorKey union 확장 검증 (tsc — brand.ts BRAND_CLASS_MATRIX exhaustive)
pnpm --filter frontend run tsc --noEmit
# Expected: EXIT=0 (urgent/mute 행 추가 후 satisfies 통과)

# 4. Tailwind 빌드 (JIT 정적 스캔 확인)
pnpm --filter frontend run build
# Expected: bg-brand-urgent / text-brand-urgent 클래스 CSS 빌드 산출물에 포함
```

---

## Phase 1 — SSOT 확장 (TASK 1 + TASK 2 + TASK 3)

### TASK 2 — `EQUIPMENT_STATUS_TONE` + `StatusBadge`
**WHAT**
- `packages/shared-constants/src/equipment-status-tone.ts` 신설 — `EquipmentStatusTone = 'ok' | 'warn' | 'urgent' | 'mute'` + `EQUIPMENT_STATUS_TONE: Record<EquipmentStatus, EquipmentStatusTone>` (**8 values 전부**: available→ok, checked_out→warn, non_conforming→urgent, spare→mute, pending_disposal→urgent, disposed→mute, temporary→warn, inactive→mute). `Record<EquipmentStatus, ...>` 강제로 신규 status 추가 시 컴파일 에러.
- `packages/shared-constants/src/index.ts` re-export
- `apps/frontend/components/ui/StatusBadge.tsx` 신설 — props `status: EquipmentStatus`, internal `EQUIPMENT_STATUS_TONE[status]` → `BRAND_CLASS_MATRIX[tone]` matrix 통한 dot+text+bg. 1차 텍스트 ≥16px 보장.
- `apps/frontend/components/calibration/CalibrationDueBadge.tsx` 신설 — `nextCalibrationDate` prop 받아 `≤30일` 만 `D-N` 형식 렌더. 31일 이상 `null`. **WCAG AA**: bg-brand-warning-weak + text-brand-warning border + tabular-nums.
- `apps/frontend/components/mobile/EquipmentLandingClient.tsx` — line 52-54 `<Badge variant="outline">{data.status}</Badge>` → `<StatusBadge status={data.status as EquipmentStatus} />` + CalibrationDueBadge 인접 배치.

### TASK 1 — `QR_ACTION_GROUP` + group rendering
**WHAT**
- `packages/shared-constants/src/qr-access.ts` 확장 — `QRActionGroup = 'urgent' | 'primary' | 'secondary'` + `QR_ACTION_GROUP: Record<QRAllowedAction, QRActionGroup>` (7 values exhaustive). 기존 line 88-95 `QR_ACTION_PRIORITY` 의 `confirm_handover_receive: 115` 주석에서 `"10분 TTL token 페어링"` 잔존 표현 정리 (`apps/backend/src/modules/equipment/services/qr-access.service.ts` 도 검토 — `qr-access.ts` 자체 주석은 이미 신규 표현 사용 중. 실제 stale 위치는 prompt §변경 사항 line 40-44 가 명시한 "qr-access.ts:88-89" — 현 코드는 이미 "rental FSM" 으로 업데이트됨, **재검증 후 정정**).
- `apps/frontend/components/mobile/EquipmentActionSheet.tsx` — `sortedActions` 를 `QR_ACTION_GROUP` 으로 grouping → 3 그룹 (urgent 위, primary 중간, secondary 아래). 그룹 내부는 기존 `QR_ACTION_PRIORITY` desc. `urgent` 그룹 첫 번째 액션은 **filled** (`bg-brand-urgent text-on-urgent` 신규 토큰), `primary` outline + ink-1, `secondary` outline + ink-2. 그룹 사이 small-caps 라벨 (`t('groups.urgent')` / `t('groups.primary')` / `t('groups.secondary')`). `urgent` 액션 0개면 그룹 라벨 미노출.
- `apps/frontend/messages/ko/qr.json` + `en/qr.json` — `mobileActionSheet.groups.{urgent,primary,secondary}` 키 추가.

### TASK 3 — 다중 `HandoverItem[]` 응답 모델 + `HandoverPickerSheet`
**WHAT**
- `packages/schemas/src/qr-handover.ts` 신설 — `HandoverItemSchema` (Zod) + `HandoverItem = z.infer<...>` 양측 SSOT. 필드: `id` (checkout uuid), `type: 'receive' | 'return'`, `lenderTeamName: string`, `lenderSiteLabel: string`, `borrowerSiteLabel: string`, `checkedAt: string` (ISO datetime), `lastCheck: { appearance: ConditionStatus, operation: ConditionStatus, accessories?: AccessoriesStatus }`, `inspectorName: string`.
- `apps/backend/src/modules/equipment/services/qr-access.service.ts` — `QRAccessResult` interface 확장: `handovers?: HandoverItem[]` 추가, `handoverCheckoutId?: string` deprecation JSDoc 유지 (one-release 후 제거). `resolveHandoverActions` 변경: 단일 row return → **배열 join 후 매핑** (lender_checked/borrower_returned 모두, 본인 매칭 row 전부). `resolveAllowedActions` 도 `handovers[0].id` 로 backward compat 채움 + `this.logger.debug('handoverCheckoutId deprecated — use handovers[].id')` (한 번만).
- `apps/backend/src/modules/equipment/services/qr-access.service.spec.ts` 신설 — 단위 테스트: (1) 동일 borrower 2 lender_checked → handovers.length===2 + 둘 다 type='receive', (2) 동일 lender 2 borrower_returned → length===2 + type='return', (3) 0 핸드오버 → `handovers: []` 또는 undefined.
- `apps/frontend/hooks/use-equipment-by-management-number.ts` — `EquipmentQRLanding` type 에 `handovers?: HandoverItem[]` 추가, `handoverCheckoutId` deprecated 표기.
- `apps/frontend/components/mobile/HandoverPickerSheet.tsx` 신설 — MobileBottomSheet 기반. 각 항목 카드: 시험소 라우팅 (`lenderSiteLabel → borrowerSiteLabel`), checkout ID (mono), inspectorName, lastCheck 외관/작동/부속 뱃지 (`StatusBadge` 색 톤 활용 — appearance/operation `normal=ok`, `abnormal=urgent`). 클릭 시 `FRONTEND_ROUTES.CHECKOUTS.CHECK_WITH_STEP(item.id, item.type === 'receive' ? 'borrower_receive' : 'lender_return')` 라우팅.
- `apps/frontend/components/mobile/EquipmentActionSheet.tsx` — `handovers` prop 추가. `confirm_handover_*` 클릭 시 `handovers.length > 1` 이면 `HandoverPickerSheet` 모달 노출, `===1` 이면 즉시 라우팅 (기존 동작 유지).

### 파일 inventory (Phase 1)
- **Create**: `packages/shared-constants/src/equipment-status-tone.ts`
- **Create**: `packages/schemas/src/qr-handover.ts`
- **Create**: `apps/frontend/components/ui/StatusBadge.tsx`
- **Create**: `apps/frontend/components/calibration/CalibrationDueBadge.tsx`
- **Create**: `apps/frontend/components/mobile/HandoverPickerSheet.tsx`
- **Create**: `apps/backend/src/modules/equipment/services/qr-access.service.spec.ts`
- **Modify**: `packages/shared-constants/src/qr-access.ts` (QR_ACTION_GROUP 추가, stale 주석 확인)
- **Modify**: `packages/shared-constants/src/index.ts` (re-export)
- **Modify**: `packages/schemas/src/index.ts` (re-export)
- **Modify**: `apps/backend/src/modules/equipment/services/qr-access.service.ts` (QRAccessResult 확장, resolveHandoverActions 배열화)
- **Modify**: `apps/frontend/hooks/use-equipment-by-management-number.ts` (type 확장)
- **Modify**: `apps/frontend/components/mobile/EquipmentActionSheet.tsx` (group rendering + handovers picker)
- **Modify**: `apps/frontend/components/mobile/EquipmentLandingClient.tsx` (StatusBadge + CalibrationDueBadge 도입, allowedActions prop 외 handovers 전달)
- **Modify**: `apps/frontend/messages/ko/qr.json` + `en/qr.json` (groups + handoverPicker + statusBadge tone label)

### Verification (Phase 1)
```bash
# QR_ACTION_GROUP exhaustive (7 values)
grep -c "view_detail\|view_qr\|request_checkout\|mark_checkout_returned\|report_nc\|confirm_handover_receive\|confirm_handover_return" packages/shared-constants/src/qr-access.ts
# Expected: ≥14 (priority + group + i18n_keys 각 7행 + 정의 7)

# EQUIPMENT_STATUS_TONE exhaustive (8 EquipmentStatus values)
grep -c "available\|checked_out\|non_conforming\|spare\|pending_disposal\|disposed\|temporary\|inactive" packages/shared-constants/src/equipment-status-tone.ts
# Expected: ≥8

# StatusBadge migration — raw Badge variant=outline status display = 0
grep -rn '<Badge variant="outline">.*status' apps/frontend/components/mobile/EquipmentLandingClient.tsx
# Expected: 0 matches

# Backend unit test
pnpm --filter backend run test -- qr-access.service
# Expected: PASS (3 cases)

# tsc 전체
pnpm tsc --noEmit
```

---

## Phase 2 — UX 자동 진행 (TASK 4)

### WHAT
- `apps/frontend/components/mobile/EquipmentLandingClient.tsx` — `useEffect` 진입 시 조건 체크:
  - `allowedActions.length === 1`
  - `QR_ACTION_PRIORITY[allowedActions[0]] >= 100`
  - `(handovers?.length ?? 0) <= 1`
- 조건 충족 시 `useState` 카운트다운 (2000ms, requestAnimationFrame 또는 setInterval 250ms tick), 화면 중앙에 원형 인디케이터 (SVG progress circle) + 취소 버튼 (`min-h-[var(--touch-target-min)]`). 완료 시 `handleActionClick(allowedActions[0])` 자동 호출.
- `window.matchMedia('(prefers-reduced-motion: reduce)')` 매칭 시 카운트다운 인디케이터 미노출 + 단순 `setTimeout(handleActionClick, 1500)` 으로 대체.
- 취소 버튼 클릭 시 카운트다운 abort + 일반 `EquipmentActionSheet` fallback.
- `apps/frontend/components/mobile/AutoProgressCountdown.tsx` 신설 — props `{ durationMs, reducedMotion, onComplete, onCancel, labelKey }`. SSR-safe (mount guard).
- `apps/frontend/messages/ko/qr.json` + `en/qr.json` — `landing.autoProgress.{label, cancel, reducedMotionLabel}` 키.
- E2E test `apps/frontend/tests/e2e/qr-auto-progress.spec.ts` — borrower 1 lender_checked checkout 시나리오, 자동 라우팅 확인.

### Verification (Phase 2)
```bash
# AutoProgressCountdown 컴포넌트 존재
test -f apps/frontend/components/mobile/AutoProgressCountdown.tsx && echo OK

# E2E spec
pnpm --filter frontend run test:e2e -- qr-auto-progress.spec.ts
# Expected: PASS

# reduced motion 분기 grep
grep -n "prefers-reduced-motion" apps/frontend/components/mobile/AutoProgressCountdown.tsx
# Expected: ≥1 match
```

---

## Phase 3 — Condition Form 정상 우선 + 사진 인접화 + Orphan 정리 (TASK 5 + TASK 6)

### WHAT
- `apps/frontend/components/checkouts/EquipmentConditionForm.tsx` — 4-step stepper 상단 컴포넌트 신설 (`StepperHeader` — `step` prop 기반 진행 상태). 상단 "모두 정상으로 제출" 버튼 (64px 높이, brand-ok solid, 클릭 시 `appearanceStatus='normal' & operationStatus='normal' & accessoriesStatus='complete'` + `onSubmit` 즉시 호출). 항목 카드 (외관/작동/부속) segmented control 로 변경 (`정상 / 이상`) — `RadioGroup` 유지 가능, 시각 변경. `abnormal` 또는 `incomplete` 선택 시 **같은 카드 내부** 에 `border-brand-critical` + textarea + 촬영/갤러리 버튼 + 사진 그리드 인라인 전개 (Task 6 photo 위치 통합). "촬영" 버튼 `<input type="file" capture="environment" accept="image/*">`, "갤러리" 버튼 `capture` 미지정. 두 버튼 DOM/aria-label 분리.
- `apps/frontend/components/checkouts/ReturnInspectionForm.tsx` — 동일 패턴 (4-step stepper + 모두 정상 + 인라인 abnormal 카드).
- `apps/frontend/components/checkouts/StepperHeader.tsx` 신설 — `step: ConditionCheckStep` 받아 4 단계 시각화.
- `apps/frontend/lib/api/document-api.ts` — `deleteOrphan(documentIds: string[]): Promise<void>` 메소드 신설 (병렬 `DELETE /documents/{id}` Promise.all + 실패는 silent log — orphan 정리는 best-effort).
- `EquipmentConditionForm.tsx` `useEffect` cleanup — unmount 시 `uploadedDocumentIds` 에서 폼 제출 안 된 것만 `documentApi.deleteOrphan(...)` 호출. 폼 제출 성공 시 `submittedRef.current = true` 마킹하여 cleanup 에서 skip.
- abnormal + 0 photos 제출은 **허용** (helper text "현장 사진 1장 이상 권장 (UL-QP-18-06)" 표시), 제출 차단 아님.
- `apps/frontend/messages/ko/checkouts.json` + `en/checkouts.json` — `condition.allNormalShortcut`, `condition.photoCaptureLabel`, `condition.photoGalleryLabel`, `condition.photoRecommendedHint`, `condition.stepper.{step1..step4}` 키.

### Verification (Phase 3)
```bash
# capture="environment" 분리 검증
grep -c 'capture="environment"' apps/frontend/components/checkouts/EquipmentConditionForm.tsx apps/frontend/components/checkouts/ReturnInspectionForm.tsx
# Expected: ≥2 (촬영 버튼만, 갤러리는 미지정)

# deleteOrphan 추가
grep -n "deleteOrphan" apps/frontend/lib/api/document-api.ts
# Expected: ≥1 match

# 4-step stepper
grep -n "StepperHeader" apps/frontend/components/checkouts/EquipmentConditionForm.tsx apps/frontend/components/checkouts/ReturnInspectionForm.tsx
# Expected: ≥2 (양쪽 import)
```

---

## Phase 4 — QR Label PDF Dialog Visualization (TASK 7)

### WHAT
- `packages/shared-constants/src/qr-config.ts` — `LABEL_SIZE_PRESETS` 타입 확장: `{ widthMm: number; heightMm: number; qrSizeMm: number; recommendedForKey: string }` (i18n key — `qr.qrDisplay.recommendedFor.{key}`). 7 preset 모두 `recommendedForKey` 채움 (xl=a4Sheet, large=largeInstrument, medium=midInstrument, small=smallInstrument, xs=cable, xxs=ultraCompact, micro=ultraCompactCable).
- `apps/frontend/components/equipment/EquipmentQRButton.tsx` — 모드 선택 `RadioGroup` → `<Tabs>` (shadcn segmented tabs: `sampler` / `custom`). 사이즈 선택 7행 그리드 — 각 행은 `widthMm × heightMm` 비례 사각형 미리보기 + mini QR pattern (svg ~16x16 placeholder) + recommendedFor 한 줄. `resolveLayoutMode` fallback 발생 시 amber 박스 제거 → 선택된 행 바로 아래 helper text 인라인.
- `apps/frontend/messages/ko/qr.json` + `en/qr.json` — `qrDisplay.recommendedFor.{a4Sheet, largeInstrument, midInstrument, smallInstrument, cable, ultraCompact, ultraCompactCable}` + `qrDisplay.modeTab.{sampler, custom}` + `qrDisplay.fallbackInlineNotice` 키.

### Verification (Phase 4)
```bash
# recommendedForKey 7건 모두
grep -c "recommendedForKey:" packages/shared-constants/src/qr-config.ts
# Expected: ≥7 (preset 7개)

# Tabs 컴포넌트 도입
grep -n "import.*Tabs.*from.*tabs" apps/frontend/components/equipment/EquipmentQRButton.tsx
# Expected: ≥1

# i18n recommendedFor 키 7개
grep -c "recommendedFor" apps/frontend/messages/ko/qr.json
# Expected: ≥7
```

---

## Phase 5 — Cross-cut: i18n parity + 회귀 e2e + RTL spec

### WHAT
- **i18n parity 검증**: `scripts/verify-i18n-parity.mjs` 또는 verify-i18n skill 의 ts-morph 분석 — `messages/ko/qr.json` ∪ `checkouts.json` ∪ `equipment.json` 신규 키 = `messages/en/...` 동일 keyset. diff = 0 강제.
- **회귀 e2e 6 scenarios** (`apps/frontend/tests/e2e/qr-landing-regression.spec.ts`):
  1. available + 시험소 일치 → `request_checkout` primary 그룹 노출 + filled 아님
  2. checked_out + 본인 반출 중 → `mark_checkout_returned` primary, `view_qr/view_detail` secondary
  3. lender_checked + 본인 borrower → `confirm_handover_receive` urgent + 자동 진행
  4. 위와 동일 + 2 lender_checked → urgent CTA 클릭 시 `HandoverPickerSheet` 노출, 항목 2개
  5. out_of_service (`non_conforming`) → StatusBadge tone=urgent + 1차 액션 없음
  6. 다음 교정일 D-7 → `CalibrationDueBadge` 노출
- **RTL spec**:
  - `apps/frontend/components/ui/__tests__/StatusBadge.test.tsx` (8 status × tone 매핑 verify, dot+text render, WCAG aria-label)
  - `apps/frontend/components/calibration/__tests__/CalibrationDueBadge.test.tsx` (≤30일 렌더, 31일+ null, tabular-nums)
  - `apps/frontend/components/mobile/__tests__/HandoverPickerSheet.test.tsx` (single 자동 라우팅 분기는 EquipmentActionSheet 측, 여기서는 multi 렌더 + 선택 콜백 + 빈 배열 회피)
- `verify-implementation` skill 전체 실행 (13 verify-* 통과).
- `review-architecture` skill 1 회 실행 (cross-layer 패턴 정합).

### Verification (Phase 5)
```bash
# i18n parity
node scripts/verify-i18n-parity.mjs  # 또는 verify-i18n skill grep

# 회귀 e2e
pnpm --filter frontend run test:e2e -- qr-landing-regression.spec.ts
# Expected: 6/6 PASS

# RTL spec
pnpm --filter frontend run test -- StatusBadge CalibrationDueBadge HandoverPickerSheet

# verify-implementation
.claude/skills/verify-implementation/run.sh  # 또는 동등 invocation
```

---

## 회귀 차단 grep guards (Mode 2 contract MUST 직접 반영)

```bash
# 1. StatusBadge 미사용 raw Badge variant=outline status — production 코드에서 0
rg -n '<Badge variant="outline">[^<]*\bstatus\b' apps/frontend/components --type tsx
# Expected: 0 (StatusBadge 도입 후)

# 2. useAuth().can() 추가 호출 — QR 모바일 폼/시트 경로에서 0
rg -n 'useAuth\(\)\.can\(' apps/frontend/components/mobile/ apps/frontend/components/checkouts/EquipmentConditionForm.tsx apps/frontend/components/checkouts/ReturnInspectionForm.tsx
# Expected: 0

# 3. text-muted-foreground 1차 정보 위치 — 수정된 QR/condition 컴포넌트의 장비명·CTA 라벨·현황 핵심에 0
rg -n 'text-muted-foreground' apps/frontend/components/mobile/EquipmentLandingClient.tsx apps/frontend/components/mobile/EquipmentActionSheet.tsx
# 검토: 결과 행의 의미 분류 — KV 보조 라벨은 허용, 장비명/CTA 라벨/주요 상태값은 금지

# 4. CSS_VAR_NAMES 신규 9 entry 등록 확인
node -e "const m = require('./apps/frontend/lib/design-tokens/css-variables.ts'); console.log(Object.keys(m.CSS_VAR_NAMES).length)"
# Expected: ≥11 (기존 2 + 신규 9)

# 5. Stale TTL token 페어링 주석 — backend/frontend production code 에서 0
rg -n "10분 TTL.*페어링|10\-minute TTL.*token" apps/backend/src apps/frontend
# Expected: 0
```

---

## 의존성 / 위험 / 완화

| 위험 | 영향 | 완화 |
|---|---|---|
| `--touch-target-min` 값 변경 (44→48px) 회귀 | 기존 sticky helper / E2E selector | 변수 정의만 변경, 사용처 grep 후 의도된 UX 변화로 문서화. E2E sticky-helpers 영향 0 (다른 변수). |
| `QRAccessResult.handovers` deprecated `handoverCheckoutId` 후행 호환 | 1 release 후 cleanup tech-debt 필요 | JSDoc `@deprecated` + `this.logger.debug` 1회 호출 (호출자 정보 포함). Tech-debt S 등록. |
| `LABEL_SIZE_PRESETS` 타입 확장 | 기존 호출처 7곳 (`resolveLayoutMode` 등) tsc 영향 | 필드 **추가**만 — destructuring 호출자는 무관 (구조 분해 무방). tsc 게이트로 회귀 자동 차단. |
| `EQUIPMENT_STATUS_TOKENS` 와 `EQUIPMENT_STATUS_TONE` 역할 중복 | 디자인 토큰 SSOT 2 곳 분기 위험 | `EQUIPMENT_STATUS_TOKENS` 는 frontend Tailwind class 매핑 유지, `EQUIPMENT_STATUS_TONE` 은 cross-stack tone enum. 후자가 전자의 single input — `EQUIPMENT_STATUS_TOKENS[status].tone = EQUIPMENT_STATUS_TONE[status]` 단방향 wire. |
| `documentApi.deleteOrphan` 실패 silent | 폼 cancel 시 photo 누락 정리 — orphan 누적 | best-effort. Backend cron path (`condition_check_photo` + null FK + 24h) 를 SHOULD 항목으로 별도 등록 → 2중 안전망. |
| 다중 핸드오버 + 자동 진행 충돌 | `handovers.length > 1` 일 때 auto-progress 발동되면 picker 가 닫힘 | TASK 4 조건에 `(handovers?.length ?? 0) <= 1` 명시 (M-11 검증). |
| `non_conforming` status → tone=urgent 색 변경 | 기존 사용자 학습된 색 (현재 outline 단일) | 4-tier 색 분리는 의도된 UX 개선. 시각 회귀 baseline 갱신 SHOULD. |

---

## Verification 통합

```bash
# 최종 통합 검증 (모든 phase 완료 후)
pnpm tsc --noEmit                                  # M-1
pnpm --filter frontend run build                   # M-2
pnpm --filter backend run test                     # M-3
pnpm --filter frontend run test                    # M-3
pnpm --filter frontend run test:e2e                # SHOULD S-1 (회귀 6 + auto-progress)

# verify-* skills
for skill in verify-ssot verify-hardcoding verify-zod verify-i18n verify-frontend-state \
             verify-security verify-design-tokens verify-handover-qr verify-checkout-fsm \
             verify-routing-origin verify-click-feedback verify-bulk-action-bar verify-implementation; do
  echo "== $skill =="
  # 각 skill 의 run command (SKILL.md 참조)
done

# review-architecture (M-18)
# Skill 실행 후 cross-layer 보고서 검토
```

---

## File Inventory Summary

| Phase | Create | Modify | Total |
|---|---|---|---|
| 0 | 0 | 5 | 5 |
| 1 | 6 | 7 | 13 |
| 2 | 2 | 1 | 3 |
| 3 | 1 | 4 | 5 |
| 4 | 0 | 3 | 3 |
| 5 | 4 | 0 | 4 |
| **Total** | **13** | **20** | **33** |

추정 ±5 (i18n 라인 변경 / 빈 export 누락 시 인덱스 추가 등).

---

## SHOULD (tech-debt 등록 후보)

- S-1 Playwright e2e for 6 회귀 scenarios (Phase 5에 포함 — but MUST 와 분리하여 환경 의존성 절연)
- S-2 Storybook entries (`StatusBadge`, `HandoverPickerSheet`, `AutoProgressCountdown`)
- S-3 Visual regression baseline 갱신 (4-tier 색 변경 + 그룹 렌더)
- S-4 Backend cron: `documents` 테이블 `condition_check_photo` + null FK + 24h sweep (frontend deleteOrphan 안전망 2중)
- S-5 `handoverCheckoutId` deprecated 1 release 후 제거 (다음 sprint)
- S-6 `EquipmentStatus` 8 values 의 tone 매핑 디자인 검토 (UX 팀 — spare/inactive 가 mute 적정한가)
- S-7 `--touch-target-min` 44→48 회귀 시각 검토 (모바일 시트 외 영향)

---

*Plan version*: 1 · *Generator/Evaluator handoff*: contract `.claude/contracts/qr-visual-redesign.md`
