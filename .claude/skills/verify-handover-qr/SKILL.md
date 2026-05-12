---
name: verify-handover-qr
description: QR SSOT 검증 — QR URL/설정/액션 SSOT(qr-url.ts, qr-config.ts, qr-access.ts) 경유 + 직접 스캔 워크플로(confirm_handover 액션 라우팅, attachment fail-close). 2026-05-09 토큰 메커니즘 제거 후 직접 스캔 방식으로 재편. 2026-05-12 Step 16~18 추가: QR_ACTION_GROUP SSOT + HandoverItem Zod schema 다중 핸드오버 + LABEL_SIZE_PRESETS.recommendedForKey i18n parity. 반출 QR 또는 인수인계 기능 추가·수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: qr | handover | 특정 step 번호]'
---

# QR SSOT + 직접 스캔 인수인계 검증

## Purpose

반출 QR/직접 스캔 인수인계 도메인의 SSOT + 워크플로 검증.

**2026-05-09 아키텍처 결정**: 인수인계 토큰(HandoverToken/OneTimeToken/jti nonce) 메커니즘 전면 제거.
"scan-once, contextual-action" IBM Maximo / SAP Asset Manager 표준 채택 —
장비 QR 직접 스캔 → `resolveAllowedActions()` → `confirm_handover_receive/return` 액션.

**Section A — QR SSOT** (Step 1~11):
1. **QR URL 빌더 SSOT** — `buildEquipmentQRUrl` 이외의 URL 조합 탐지
2. **QR URL 경로 상수** — `EQUIPMENT_QR_PATH_PREFIX` 하드코딩 탐지
3. **QR 설정 SSOT** — `QR_CONFIG` / `LABEL_CONFIG` / `getLabelCellDimensions` 우회 탐지
4. **QR 액션 SSOT** — `QR_ACTION_VALUES` 재정의·인라인 배열 탐지
5. **appUrl 파라미터 주입** — `process.env.NEXT_PUBLIC_APP_URL` / `window.location.origin` 직접 인라인 탐지
6. **FRONTEND_ROUTES 딥링크 빌더** — 빌더 우회 탐지
7. **QRAccessService 응답 shape** — 허용된 actions를 클라이언트가 중복 계산하는 패턴 탐지

**Section B — 직접 스캔 인수인계 검증** (Step 12~15):
8. **confirm_handover 액션 라우팅** — EquipmentActionSheet에서 `CHECK_WITH_STEP` 경유
9. **PURPOSE_BY_STATUS 프론트 mirror 금지** — 백엔드 `resolveAllowedActions` SSOT 유지
10. **attachment fail-close 3-layer** — submitConditionCheck + returnCheckout 양 경로
11. **handover 토큰 잔재 0건** — 제거된 메커니즘의 코드 잔재 탐지

## When to Run

**QR 도메인 (Section A)**:
- QR URL 생성/파싱 코드를 추가·수정한 후
- 라벨 PDF 생성 로직을 수정한 후
- QR 모바일 랜딩 액션 추가 후
- `qr-url.ts` / `qr-config.ts` / `qr-access.ts` 변경 후

**직접 스캔 인수인계 (Section B)**:
- `confirm_handover_receive` / `confirm_handover_return` 액션 수정 후
- `EquipmentActionSheet.tsx` 변경 후
- `checkouts.service.ts` 첨부 링크 로직 변경 후
- 보안 감사 전

## Related Files

| File | Section | Purpose |
|------|---------|---------|
| `packages/shared-constants/src/qr-url.ts` | A | QR URL 빌더/파서 SSOT (`buildEquipmentQRUrl`, `EQUIPMENT_QR_PATH_PREFIX`) |
| `packages/shared-constants/src/qr-config.ts` | A | QR 설정 SSOT (`QR_CONFIG`, `LABEL_CONFIG`, `getLabelCellDimensions`) |
| `packages/shared-constants/src/qr-access.ts` | A | QR 액션 SSOT (`QR_ACTION_VALUES`, `QR_ACTION_PRIORITY`, `QR_ACTION_I18N_KEYS`) |
| `packages/shared-constants/src/frontend-routes.ts` | A | 딥링크 빌더 SSOT (`CHECKOUTS.CHECK_WITH_STEP` 등) |
| `apps/frontend/lib/qr/app-url.ts` | A | `getAppUrl()` — NEXT_PUBLIC_APP_URL 캡슐화 |
| `apps/frontend/lib/qr/generate-label-pdf.ts` | A | 라벨 PDF 생성 — `QR_CONFIG`/`LABEL_CONFIG` 경유 필수 |
| `apps/frontend/lib/qr/generate-label-pdf.worker.ts` | A | Web Worker 라벨 렌더 — 동일 SSOT 경유 |
| `apps/frontend/components/equipment/EquipmentQRCode.tsx` | A | QR 컴포넌트 — `buildEquipmentQRUrl` 경유 필수 |
| `apps/frontend/components/mobile/EquipmentActionSheet.tsx` | A/B | QR 액션 CTA — `FRONTEND_ROUTES` 빌더 + `confirm_handover` 라우팅 |
| `apps/backend/src/modules/equipment/services/qr-access.service.ts` | A/B | 서버 QR 액션 판정 SSOT (`resolveHandoverActions` 포함) |
| `apps/backend/src/modules/checkouts/checkouts.service.ts` | B | attachment fail-close 3-layer (submitConditionCheck + returnCheckout) |

---

## Section A — QR SSOT Workflow (Step 1~11)

### Step 1: QR URL 인라인 조합 탐지

**PASS:** `/e/` + 관리번호 조합이 `buildEquipmentQRUrl` 경유.
**FAIL:** 인라인 문자열 템플릿으로 `/e/${...}` 직접 조합.

```bash
grep -rn '`/e/\${' --include="*.ts" --include="*.tsx" apps/ packages/ \
  | grep -v node_modules | grep -v ".spec." | grep -v qr-url.ts
```

### Step 2: QR 경로 상수 하드코딩 탐지

**PASS:** `EQUIPMENT_QR_PATH_PREFIX` 상수 경유.
**FAIL:** `'/e/'` 리터럴 직접 사용.

```bash
grep -rn "'/e/'" --include="*.ts" --include="*.tsx" apps/ packages/ \
  | grep -v node_modules | grep -v qr-url.ts | grep -v ".spec."
```

### Step 3: QR 설정 매직넘버 탐지

**PASS:** QR 크기/여백/폰트 값이 `QR_CONFIG` / `LABEL_CONFIG` / `getLabelCellDimensions` 경유.
**FAIL:** `252`, `126`, `38`, `76` 등 픽셀 매직넘버 인라인 사용.

```bash
# LABEL_CONFIG 우회 — mm 단위 하드코딩
grep -rn "width: [0-9]\+" --include="*.ts" --include="*.tsx" apps/frontend/lib/qr/ \
  | grep -v node_modules | grep -v qr-config.ts
# QR_CONFIG 우회 — 픽셀 크기 하드코딩
grep -rn "qrSize\|errorCorrectionLevel\|margin:" --include="*.ts" --include="*.tsx" \
  apps/frontend/ | grep -v node_modules | grep -v qr-config.ts | grep -v ".spec."
```

### Step 4: LabelSizePreset SSOT 준수 탐지 (2026-04-19 추가)

`LabelSizePreset` / `LABEL_SIZE_PRESETS` / `LABEL_SAMPLER_LAYOUT`은 `qr-config.ts` SSOT에서
정의(현재 6종: `xl | large | medium | small | xs | xxs`). 다른 파일에서 이 목록을 재정의하거나
인라인 union type으로 중복 선언하면 drift가 발생한다.

```bash
# LabelSizePreset 로컬 재정의 금지
grep -rn "LabelSizePreset\s*=" \
  apps/frontend --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules\|qr-config.ts\|\.d\.ts"
# LABEL_SIZE_PRESETS 인라인 객체 정의 금지
grep -rn "LABEL_SIZE_PRESETS\s*[=:{]" \
  apps/frontend --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules\|qr-config.ts\|\.d\.ts"
```

**PASS:** 0건 (import만 존재).

### Step 5: XL_LABEL_HEIGHT_MM SSOT drift 탐지 (2026-04-19 추가)

`XL_LABEL_HEIGHT_MM`은 `qr-config.ts`의 `const` — `LABEL_CONFIG.scaling.referenceLabelHeightMm`과
`LABEL_SIZE_PRESETS.xl.heightMm`이 이 값을 공통 참조하여 drift를 방지한다.
Worker 또는 다른 파일에서 `43.7` / `referenceLabelHeightMm` 값을 하드코딩하는 패턴을 탐지한다.

```bash
# 43.7 매직넘버 직접 할당 탐지
grep -rn "43\.7\|referenceLabelHeightMm\s*[:=]\s*[0-9]" \
  apps/frontend/lib/qr/ --include="*.ts" --include="*.tsx" \
  | grep -v "node_modules\|qr-config.ts\|\.spec\."
# heightScale 계산이 SSOT 경유 (referenceLabelHeightMm을 직접 숫자로 대체 금지)
grep -n "heightScale" \
  apps/frontend/lib/qr/generate-label-pdf.worker.ts 2>/dev/null \
  | grep -v "referenceLabelHeightMm\|scaling\."
```

**PASS:** 첫 번째 명령어 0건, 두 번째 명령어 0건.

### Step 6: precomputedQrData 주입 패턴 준수 탐지 (2026-04-19 추가)

sampler/batch 모드에서 동일 장비의 QR을 반복 계산하지 않도록 `renderCellToDataUrl`에
`precomputedQrData?` 파라미터를 주입하는 패턴을 유지해야 한다.
Worker 내에서 `QRCode.create()` 직접 호출이 `precomputedQrData ?? ...` 패턴 없이
루프 내에서 반복 호출되는지 탐지한다.

```bash
# renderCellToDataUrl 시그니처에 precomputedQrData 파라미터 확인
grep -n "precomputedQrData" \
  apps/frontend/lib/qr/generate-label-pdf.worker.ts 2>/dev/null
```

**PASS:** `precomputedQrData` 관련 라인이 함수 시그니처 + 사용부 양쪽에 존재.
**FAIL:** 시그니처에 없거나 함수 내부에서 `QRCode.create()` 조건 없이 직접 호출.

### Step 7: getSamplerPresetOrder() ↔ i18n 키 동기화 탐지 (2026-04-19 추가, 2026-04-21 동적화)

`getSamplerPresetOrder()`가 반환하는 preset 목록이 i18n 파일
(`sampler.header.{preset}`, `size.{preset}`)와 동기화되어야 한다.
Worker는 `samplerHeaders`를 메인 스레드로부터 주입받으므로, 주입 측(`EquipmentQRButton.tsx`)이
`getSamplerPresetOrder()`를 경유하는지 확인한다.

```bash
# EquipmentQRButton에서 getSamplerPresetOrder() 경유 확인
grep -n "getSamplerPresetOrder\|sampler\.header\." \
  apps/frontend/components/equipment/EquipmentQRButton.tsx 2>/dev/null
# i18n 파일이 SSOT(getSamplerPresetOrder)와 동기화 확인 — dist 경유 동적 비교
node -e "
const { getSamplerPresetOrder } = require('./packages/shared-constants/dist/qr-config.js');
const en = require('./apps/frontend/messages/en/qr.json');
const ko = require('./apps/frontend/messages/ko/qr.json');
const order = getSamplerPresetOrder();
const enKeys = Object.keys(en.qrDisplay?.sampler?.header ?? {});
const koKeys = Object.keys(ko.qrDisplay?.sampler?.header ?? {});
const enSizeKeys = Object.keys(en.qrDisplay?.size ?? {});
const koSizeKeys = Object.keys(ko.qrDisplay?.size ?? {});
const missing = order.filter(p => !enKeys.includes(p) || !koKeys.includes(p) || !enSizeKeys.includes(p) || !koSizeKeys.includes(p));
console.log(missing.length === 0 ? 'PASS: ' + order.length + '개 키 모두 존재' : 'FAIL: 누락=' + missing.join(','));
" 2>/dev/null
```

**PASS:** `getSamplerPresetOrder()` 사용 확인, SSOT와 동일한 키 개수 모두 i18n에 존재.
**FAIL:** 고정 배열 직접 선언 또는 i18n 키 누락.

### Step 8: QR 액션 재정의 탐지

**PASS:** 프론트 액션 배열이 `QR_ACTION_VALUES` import 경유.
**FAIL:** 인라인 `['view_detail', 'request_checkout', ...]` 배열 직접 선언.

```bash
grep -rn "'view_detail'\|'request_checkout'\|'view_qr'" \
  --include="*.ts" --include="*.tsx" apps/frontend/ \
  | grep -v node_modules | grep -v qr-access.ts | grep -v ".spec."
```

### Step 9: appUrl 직접 접근 탐지

**PASS:** `getAppUrl()` 유틸 경유 (`apps/frontend/lib/qr/app-url.ts`).
**FAIL:** `process.env.NEXT_PUBLIC_APP_URL` 또는 `window.location.origin` 인라인 사용.

```bash
grep -rn "process\.env\.NEXT_PUBLIC_APP_URL\|window\.location\.origin" \
  --include="*.ts" --include="*.tsx" apps/frontend/ \
  | grep -v node_modules | grep -v app-url.ts | grep -v ".spec."
```

### Step 10: FRONTEND_ROUTES 딥링크 빌더 우회 탐지

**PASS:** `FRONTEND_ROUTES.CHECKOUTS.CREATE_FOR_EQUIPMENT(id)` 등 빌더 사용.
**FAIL:** `/checkouts/create?equipmentId=` 인라인 URL 조합.

```bash
grep -rn "checkouts/create.*equipmentId\|CHECKOUTS\.CREATE.*EQUIPMENT_ID" \
  --include="*.ts" --include="*.tsx" apps/frontend/ \
  | grep -v node_modules | grep -v frontend-routes.ts | grep -v ".spec."
grep -rn "non-conformance.*action=create\|equipment.*action=create" \
  --include="*.ts" --include="*.tsx" apps/frontend/ \
  | grep -v node_modules | grep -v frontend-routes.ts | grep -v ".spec."
```

### Step 11: QRAccessService 클라이언트 중복 판정 탐지

**PASS:** 프론트가 `allowedActions` 배열을 서버에서 받아 순회 렌더링만 함.
**FAIL:** 프론트가 `equipment.status === 'available'` 등으로 자체 액션 판정 후 CTA 렌더.

```bash
# ActionSheet에서 장비 상태 직접 판정 여부
grep -rn "equipment\.status\|\.status === " \
  --include="*.ts" --include="*.tsx" \
  apps/frontend/components/mobile/EquipmentActionSheet.tsx \
  | grep -v node_modules
```

---

## Section B — 직접 스캔 인수인계 검증 (Step 12~15)

### Step 12: confirm_handover 액션 라우팅 확인 (2026-05-09 직접 스캔 전환)

**PASS:**
- `EquipmentActionSheet.tsx`에서 `confirm_handover_receive` / `confirm_handover_return` 액션이
  `FRONTEND_ROUTES.CHECKOUTS.CHECK_WITH_STEP(checkoutId, step)` 경유로 라우팅.
- `assertNever` exhaustiveness guard 존재.

**FAIL:** 하드코딩 URL, 토큰 발급 시도, or assertNever 누락.

```bash
grep -n "confirm_handover\|CHECK_WITH_STEP\|assertNever" \
  apps/frontend/components/mobile/EquipmentActionSheet.tsx 2>/dev/null
# PASS: confirm_handover + CHECK_WITH_STEP + assertNever 각 1건 이상
```

### Step 13: PURPOSE_BY_STATUS 프론트 mirror 금지

**PASS:** `PURPOSE_BY_STATUS`가 프론트엔드에 0건 — 백엔드 `resolveAllowedActions` SSOT만 사용.
**FAIL:** 프론트엔드 코드에 `PURPOSE_BY_STATUS` 또는 상태→purpose 매핑 mirror 정의 존재.

```bash
grep -rn "PURPOSE_BY_STATUS\|purposeByStatus\|lender_checked.*borrower_receive\|borrower_returned.*lender_receive" \
  apps/frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".spec.ts"
# PASS: 0건
```

### Step 14: attachment fail-close 3-layer — submitConditionCheck + returnCheckout 양 경로

**PASS:**
- `submitConditionCheck`: `isNull(conditionCheckId)` + `uploadedBy` + `documentType` 화이트리스트 3중.
- `returnCheckout`: `isNull(checkoutId)` + `uploadedBy` + `documentType` 화이트리스트 3중.
- `startCheckout` DTO에 `attachmentIds` 필드 **없음** (entity 링크 불가 — dead field 금지).

**FAIL:** 어느 한 경로라도 3-layer 중 하나 누락, 또는 `startCheckout` DTO에 attachmentIds 잔존.

```bash
SFILE=apps/backend/src/modules/checkouts/checkouts.service.ts
# submitConditionCheck — isNull(conditionCheckId) + uploadedBy(checkerId) + ALLOWED_PHOTO_TYPES
grep -c "isNull(schema.documents.conditionCheckId)" "$SFILE"   # PASS: ≥1
grep -c "eq(schema.documents.uploadedBy, checkerId)" "$SFILE"  # PASS: ≥1
# returnCheckout — isNull(checkoutId) + uploadedBy(returnerId) + ALLOWED_PHOTO_TYPES
grep -c "isNull(schema.documents.checkoutId)" "$SFILE"         # PASS: ≥1
grep -c "eq(schema.documents.uploadedBy, returnerId)" "$SFILE" # PASS: ≥1
# startCheckout DTO에 attachmentIds 없음 (dead field 금지)
grep -c "attachmentIds" \
  apps/backend/src/modules/checkouts/dto/start-checkout.dto.ts 2>/dev/null || echo 0
# PASS: 0
```

### Step 15: handover 토큰 잔재 0건 검증 (2026-05-09 신규)

**배경**: 2026-05-09 HandoverToken/OneTimeToken 메커니즘 전면 제거.
코드베이스에 제거된 메커니즘의 참조가 0건인지 확인.

**PASS:** 아래 명령어 모두 0건.
**FAIL:** 1건 이상 — 불완전 제거 또는 새 참조 추가.

```bash
# 토큰 서비스/컴포넌트 참조 0건
grep -rn "HandoverToken\|handoverToken\|HANDOVER_TOKEN\|HANDOVER_VERIFY\|HANDOVER_QR_PATH\|HANDOVER_QR_TOKEN\|buildHandoverQR\|parseHandoverQR\|forge-handover\|one-time-token\|OneTimeToken\|HandoverActionButton\|HandoverQRDisplay" \
  apps/ packages/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "node_modules\|dist/\|checkout_handover_photo\|CheckoutHandoverPhoto"
# PASS: 0건

# vm.handover 잔재 0건
grep -rn "VM\.handover" apps/ packages/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v node_modules
# PASS: 0건

# /handover 라우트 페이지 0건
ls apps/frontend/app/\(dashboard\)/handover/ 2>/dev/null && echo "FAIL: handover page exists" || echo "PASS: handover page removed"
```

---

### Step 16: QR_ACTION_GROUP / QR_ACTION_GROUP_ORDER SSOT — 그룹 렌더링 인라인 분기 금지 (2026-05-12 qr-visual-redesign TASK 1)

**배경**: `QR_ACTION_GROUP: Record<QRAllowedAction, QRActionGroup>` + `QR_ACTION_GROUP_ORDER: readonly QRActionGroup[]` 를
`qr-access.ts` 에 신설 (2026-05-11). `EquipmentActionSheet` 가 이 두 SSOT 를 소비하여 그룹 렌더링.
클라이언트에서 action 문자열 비교로 그룹을 직접 분기하면 SSOT 우회.

**PASS:** `EquipmentActionSheet` 가 `QR_ACTION_GROUP` + `QR_ACTION_GROUP_ORDER` import 후 소비.
인라인 `action === 'confirm_handover_receive' || action === 'confirm_handover_return'` 분기 0건.
**FAIL:** 인라인 그룹 분기 발견.

```bash
# (1) QR_ACTION_GROUP, QR_ACTION_GROUP_ORDER import 존재
grep -n "QR_ACTION_GROUP\|QR_ACTION_GROUP_ORDER" \
  apps/frontend/components/mobile/EquipmentActionSheet.tsx
# 기대: 2건 이상

# (2) 인라인 그룹 action 리터럴 비교 회귀
awk '/function EquipmentActionSheet/,/^}$/' apps/frontend/components/mobile/EquipmentActionSheet.tsx \
  | grep -E "'confirm_handover_receive'|'confirm_handover_return'|'mark_checkout_returned'|'request_checkout'" \
  | grep -v "QR_ACTION_GROUP\[" | grep -v "//"
# 기대: 0건 (QR_ACTION_GROUP 조회 외 인라인 비교 없음)

# (3) qr-access.ts 에서 SSOT 단 1곳 정의 — 로컬 재정의 0
grep -rn "QR_ACTION_GROUP\s*=" \
  apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next" \
  | grep -v "qr-access.ts"
# 기대: 0건
```

---

### Step 17: HandoverItem Zod schema + handovers array 다중 핸드오버 SSOT (2026-05-12 qr-visual-redesign TASK 3)

**배경**: `packages/schemas/src/qr-handover.ts` 에 `HandoverItemSchema` + `HandoverItemsSchema` 신설.
BE `QRAccessResult.handovers: HandoverItem[]` + FE `HandoverPickerSheet` 양측이 동일 스키마 소비.
`handoverCheckoutId: string` 단일 값 패턴이 다시 추가되면 다중 핸드오버 선택 UI 우회.

**PASS:** (1) schema 파일 단 1곳 정의, (2) BE service import 확인, (3) 로컬 재정의 0건.
**FAIL:** 로컬 HandoverItem interface 재정의 발견 또는 `handoverCheckoutId` 단일 값 패턴 부활.

```bash
# (1) HandoverItemSchema 정의는 packages/schemas 단 1곳
grep -rn "HandoverItemSchema\s*=" \
  apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next"
# 기대: packages/schemas/src/qr-handover.ts 1건

# (2) BE qr-access.service.ts 가 HandoverItem[] 배열 반환 (단일 handoverCheckoutId 0건)
grep -n "HandoverItem\|handovers\s*:" \
  apps/backend/src/modules/equipment/services/qr-access.service.ts
# 기대: import + 반환 타입 포함 ≥ 2건

# (3) 단일 handoverCheckoutId 패턴 부활 차단
grep -rn "handoverCheckoutId\s*:" \
  apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".next" \
  | grep -v "qr-handover.ts" | grep -v "@deprecated"
# 기대: 0건 (deprecated 주석 달린 것만 허용)
```

---

### Step 18: LABEL_SIZE_PRESETS.recommendedForKey i18n 키 parity (2026-05-12 qr-visual-redesign TASK 7)

**배경**: `LABEL_SIZE_PRESETS` 7 preset 의 `recommendedForKey` 값이 `qr.labelSettings.recommendedFor.*` i18n 카탈로그와 1:1 매핑.
새 preset 추가 시 `recommendedForKey` 값이 i18n 카탈로그에 등록되지 않으면 silent undefined 노출.

**PASS:** `LABEL_SIZE_PRESETS` 의 모든 `recommendedForKey` 값이 `qr.json` (ko + en) 에 존재.
**FAIL:** i18n 키 누락 발견.

```bash
# (1) LABEL_SIZE_PRESETS recommendedForKey 값 목록 추출
grep -oE "recommendedForKey: '[a-zA-Z]+'" \
  packages/shared-constants/src/qr-config.ts | grep -oE "'[^']+'" | tr -d "'"
# 출력 예: a4Sheet, largeInstrument, midInstrument, smallInstrument, cable, ultraCompact, ultraCompactCable

# (2) ko/en qr.json 에 recommendedFor 섹션 7 키 모두 존재
grep -A15 '"recommendedFor"' apps/frontend/messages/ko/qr.json
grep -A15 '"recommendedFor"' apps/frontend/messages/en/qr.json
# 기대: 두 파일 모두 7개 키 존재

# (3) 하드코딩 recommended 라벨 직접 사용 0 (t() 경유 필수)
grep -rn "A4 시트\|대형 계측기\|중형 계측기\|소형 계측기\|케이블 라벨\|ultra compact\|ultraCompact" \
  apps/frontend/components --include="*.tsx" | grep -v ".next"
# 기대: 0건 (i18n 경유)
```

---

## Output Format

```markdown
## QR SSOT (Section A)

| #   | 검사                                | 상태      | 상세                                  |
| --- | ----------------------------------- | --------- | ------------------------------------- |
| 1   | QR URL 인라인 조합                  | PASS/FAIL | 우회 파일명:라인                      |
| 2   | QR 경로 상수 하드코딩               | PASS/FAIL | '/e/' 리터럴 건수                     |
| 3   | QR 설정 매직넘버                    | PASS/FAIL | 인라인 픽셀/mm 값 위치                |
| 4   | LabelSizePreset 로컬 재정의         | PASS/FAIL | 로컬 union/preset 재정의 위치         |
| 5   | XL_LABEL_HEIGHT_MM SSOT drift       | PASS/FAIL | 43.7 하드코딩 또는 referenceLabelHeightMm 인라인 위치 |
| 6   | precomputedQrData 주입 패턴         | PASS/FAIL | QRCode.create() 루프 내 중복 호출 위치 |
| 7   | getSamplerPresetOrder ↔ i18n 동기화 | PASS/FAIL | 고정 배열 대체 또는 i18n 키 누락      |
| 8   | QR 액션 재정의                      | PASS/FAIL | 인라인 액션 배열 위치                 |
| 9   | appUrl 직접 접근                    | PASS/FAIL | getAppUrl() 우회 위치                 |
| 10  | FRONTEND_ROUTES 빌더 우회           | PASS/FAIL | 인라인 URL 조합 위치                  |
| 11  | QRAccessService 중복 판정           | PASS/FAIL | 프론트 자체 상태 판정 여부            |

## 직접 스캔 인수인계 (Section B)

| #   | 검사                                      | 상태      | 상세                                          |
| --- | ----------------------------------------- | --------- | --------------------------------------------- |
| 12  | confirm_handover 액션 라우팅              | PASS/FAIL | CHECK_WITH_STEP + assertNever 존재 여부       |
| 13  | PURPOSE_BY_STATUS 프론트 mirror 금지      | PASS/FAIL | 프론트에 mirror 0건                           |
| 14  | condition_check 사진 attachmentIds 3-layer| PASS/FAIL | owner+type+중복링크 fail-close 3건 존재       |
| 15  | handover 토큰 잔재 0건                    | PASS/FAIL | 제거된 메커니즘 참조 0건                      |
| 16  | QR_ACTION_GROUP SSOT 소비                 | PASS/FAIL | 인라인 그룹 분기 0건                          |
| 17  | HandoverItem schema 단 1곳 정의           | PASS/FAIL | 로컬 재정의 0건 + BE import 확인              |
| 18  | recommendedForKey i18n parity             | PASS/FAIL | 7 preset 키 ko+en 모두 존재                   |
```

## Exceptions

**Section A (QR SSOT)**:
1. **`qr-url.ts` 내부** — 경로 상수 원본 정의 위치, 자체 탐지 제외
2. **`qr-config.ts` 내부** — 설정 상수 원본 정의, 자체 탐지 제외 (XL_LABEL_HEIGHT_MM 포함)
3. **`qr-access.ts` 내부** — 액션 enum 원본 정의, 자체 탐지 제외
4. **`frontend-routes.ts` 내부** — 딥링크 빌더 원본 정의, 자체 탐지 제외
5. **`.spec.ts` / `.e2e-spec.ts`** — 테스트 픽스처의 인라인 값은 허용
6. **`app-url.ts` 내부** — `process.env.NEXT_PUBLIC_APP_URL` 원본 접근 위치
7. **Worker 내 `precomputedQrData ?? QRCode.create(...)` 1회 조건부 호출** — `renderCellToDataUrl` 함수 내부의 null coalesce 패턴은 정상 (재사용 주입 패턴의 fallback)
8. **`getSamplerPresetOrder()` 반환값의 스프레드/매핑** — `getSamplerPresetOrder().map(...)` 형태로 SSOT를 소비하는 패턴은 정상 (재정의가 아닌 소비)

**Section B (직접 스캔 인수인계)**:
9. **`checkout_handover_photo` / `CheckoutHandoverPhoto`** — 문서 타입 enum 값으로 허용 (도메인 개념, 토큰 메커니즘 아님)
10. **`rentalPhase.ts` 내 `handover` 문자열** — FSM phase 이름(approve/handover/return), 토큰 메커니즘과 무관
