---
name: verify-handover-qr
description: QR + Handover 통합 검증 — QR URL/설정/액션 SSOT(qr-url.ts, qr-config.ts, qr-access.ts) 경유 + Handover/OneTimeToken 보안(시크릿 분리, jti nonce 소비, TTL, 권한 가드, 토큰 영속화 금지). 반출 QR 또는 토큰 기능 추가·수정 후 사용. (2026-05-03 verify-qr-ssot + verify-handover-security 통합)
disable-model-invocation: true
argument-hint: '[선택사항: qr | handover | 특정 step 번호]'
---

# QR SSOT + Handover 보안 통합 검증

## Purpose

반출 QR/Handover 토큰 도메인의 두 검증을 단일 스킬로 통합 (2026-05-03 verify-qr-ssot 11 step + verify-handover-security 7 step → verify-handover-qr 18 step):

**Section A — QR SSOT** (Step 1~11):
1. **QR URL 빌더 SSOT** — `buildEquipmentQRUrl` / `buildHandoverQRUrl` 이외의 URL 조합 탐지
2. **QR URL 경로 상수** — `EQUIPMENT_QR_PATH_PREFIX` / `HANDOVER_QR_PATH` 하드코딩 탐지
3. **QR 설정 SSOT** — `QR_CONFIG` / `LABEL_CONFIG` / `getLabelCellDimensions` 우회 탐지
4. **QR 액션 SSOT** — `QR_ACTION_VALUES` 재정의·인라인 배열 탐지
5. **appUrl 파라미터 주입** — `process.env.NEXT_PUBLIC_APP_URL` / `window.location.origin` 직접 인라인 탐지
6. **FRONTEND_ROUTES 딥링크 빌더** — `CHECKOUTS.CREATE_FOR_EQUIPMENT` 등 빌더 우회 탐지
7. **QRAccessService 응답 shape** — 허용된 actions를 클라이언트가 중복 계산하는 패턴 탐지

**Section B — Handover/OneTimeToken 보안** (Step 12~18):
8. **시크릿 분리** — `HANDOVER_TOKEN_SECRET`이 `JWT_SECRET`과 분리되어 있는지
9. **OneTimeTokenService 경유** — `HandoverTokenService`가 `OneTimeTokenService` 위임 구조인지
10. **jti nonce 소비** — Redis SET NX → DEL(1회) 패턴 유지 여부
11. **토큰 TTL** — `HANDOVER_TOKEN_TTL_SECONDS` SSOT 경유 (매직넘버 금지)
12. **권한 가드** — 토큰 발급 엔드포인트에 적절한 권한 체크 존재
13. **프론트엔드 토큰 노출** — 토큰이 DOM/localStorage/URL에 영속화되는지 여부
14. **dev-only 테스트 엔드포인트** — `forge-handover-token`이 NODE_ENV 가드 이중 적용인지

## When to Run

**QR 도메인 (Section A)**:
- QR URL 생성/파싱 코드를 추가·수정한 후
- 라벨 PDF 생성 로직을 수정한 후
- QR 모바일 랜딩 액션 추가 후
- `qr-url.ts` / `qr-config.ts` / `qr-access.ts` 변경 후

**Handover 보안 (Section B)**:
- Handover 토큰 발급/검증 로직 수정 후
- `OneTimeTokenService` 또는 `HandoverTokenService` 변경 후
- 새로운 1회용 토큰 기반 기능 추가 후
- 보안 감사 전

## Related Files

| File | Section | Purpose |
|------|---------|---------|
| `packages/shared-constants/src/qr-url.ts` | A | QR URL 빌더/파서 SSOT (`buildEquipmentQRUrl`, `buildHandoverQRUrl`, `EQUIPMENT_QR_PATH_PREFIX`, `HANDOVER_QR_PATH`) |
| `packages/shared-constants/src/qr-config.ts` | A | QR 설정 SSOT (`QR_CONFIG`, `LABEL_CONFIG`, `getLabelCellDimensions`) |
| `packages/shared-constants/src/qr-access.ts` | A | QR 액션 SSOT (`QR_ACTION_VALUES`, `QR_ACTION_PRIORITY`, `QR_ACTION_I18N_KEYS`) |
| `packages/shared-constants/src/frontend-routes.ts` | A | 딥링크 빌더 SSOT (`CHECKOUTS.CREATE_FOR_EQUIPMENT`, `EQUIPMENT.NON_CONFORMANCES_CREATE` 등) |
| `apps/frontend/lib/qr/app-url.ts` | A | `getAppUrl()` — NEXT_PUBLIC_APP_URL 캡슐화 |
| `apps/frontend/lib/qr/generate-label-pdf.ts` | A | 라벨 PDF 생성 — `QR_CONFIG`/`LABEL_CONFIG` 경유 필수 |
| `apps/frontend/lib/qr/generate-label-pdf.worker.ts` | A | Web Worker 라벨 렌더 — 동일 SSOT 경유 |
| `apps/frontend/components/equipment/EquipmentQRCode.tsx` | A | QR 컴포넌트 — `buildEquipmentQRUrl` 경유 필수 |
| `apps/frontend/components/mobile/EquipmentActionSheet.tsx` | A | QR 액션 CTA — `FRONTEND_ROUTES` 빌더 경유 필수 |
| `apps/backend/src/modules/equipment/services/qr-access.service.ts` | A | 서버 QR 액션 판정 SSOT |
| `apps/backend/src/common/one-time-token/one-time-token.service.ts` | B | 범용 1회용 토큰 프리미티브 |
| `apps/backend/src/modules/checkouts/services/handover-token.service.ts` | B | Handover 토큰 도메인 래퍼 |
| `apps/backend/src/modules/checkouts/checkouts.controller.ts` | B | 토큰 발급/검증 엔드포인트 |
| `apps/backend/src/modules/auth/test-auth.controller.ts` | B | forge-handover-token (dev/test 전용) |
| `apps/frontend/components/checkouts/HandoverQRDisplay.tsx` | B | 프론트 QR 표시 컴포넌트 |
| `apps/frontend/app/(dashboard)/handover/page.tsx` | B | Handover 랜딩 페이지 |
| `infra/secrets/*.sops.yaml` | B | HANDOVER_TOKEN_SECRET sops 암호화 확인 |

---

## Section A — QR SSOT Workflow (Step 1~11)

### Step 1: QR URL 인라인 조합 탐지

**PASS:** `/e/` + 관리번호 조합이 `buildEquipmentQRUrl` 경유.
`/handover?token=` 조합이 `buildHandoverQRUrl` 경유.
**FAIL:** 인라인 문자열 템플릿으로 `/e/${...}` 또는 `/handover?token=${...}` 직접 조합.

```bash
grep -rn '`/e/\${' --include="*.ts" --include="*.tsx" apps/ packages/ \
  | grep -v node_modules | grep -v ".spec." | grep -v qr-url.ts
grep -rn '"/handover?token=' --include="*.ts" --include="*.tsx" apps/ packages/ \
  | grep -v node_modules | grep -v qr-url.ts
```

### Step 2: QR 경로 상수 하드코딩 탐지

**PASS:** `EQUIPMENT_QR_PATH_PREFIX` / `HANDOVER_QR_PATH` 상수 경유.
**FAIL:** `'/e/'` / `'/handover'` 리터럴 직접 사용.

```bash
grep -rn "'/e/'" --include="*.ts" --include="*.tsx" apps/ packages/ \
  | grep -v node_modules | grep -v qr-url.ts | grep -v ".spec."
grep -rn "'/handover'" --include="*.ts" --include="*.tsx" apps/ packages/ \
  | grep -v node_modules | grep -v qr-url.ts | grep -v frontend-routes.ts
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

## Section B — Handover/OneTimeToken 보안 Workflow (Step 12~18)

### Step 12: 시크릿 분리 확인

**PASS:** `HandoverTokenService`가 `HANDOVER_TOKEN_SECRET` 별도 env 사용.
`JWT_SECRET` 재사용 없음. `secret.length >= 32` 검증 코드 존재.
**FAIL:** `JWT_SECRET` 그대로 사용하거나 하드코딩된 시크릿.

```bash
grep -n "HANDOVER_TOKEN_SECRET\|JWT_SECRET" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
grep -n "length < 32\|length >= 32" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
# env.example에 HANDOVER_TOKEN_SECRET 문서화 확인
grep "HANDOVER_TOKEN_SECRET" apps/backend/.env.example
```

### Step 13: OneTimeTokenService 위임 구조

**PASS:** `HandoverTokenService`가 `OneTimeTokenService<HandoverTokenData>` 인스턴스 소유.
`issue()`/`verify()` 직접 JWT/Redis 조작 없음.
**FAIL:** `jwtService.signAsync` 또는 `redisClient.del` 직접 호출.

```bash
grep -n "jwtService\|signAsync\|verifyAsync\|\.del(" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
grep -n "OneTimeTokenService" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
```

### Step 14: jti nonce 소비 패턴 (OneTimeTokenService)

**PASS:** `set(..., 'NX')` + `del()` 원자적 소비. `del()` 반환 0 → ConflictException.
**FAIL:** `del()` 반환값 무시, 또는 `get()` + `del()` 비원자적 분리.

```bash
grep -n "\.del\|\.set.*NX\|deleted === 0" \
  apps/backend/src/common/one-time-token/one-time-token.service.ts
```

### Step 15: 토큰 TTL SSOT 경유

**PASS:** `HANDOVER_TOKEN_TTL_SECONDS` 상수 경유 (10 * 60 = 600).
JWT exp + Redis EX 양쪽에 동일 상수 사용.
**FAIL:** `600`, `10 * 60` 매직넘버 인라인 사용.

```bash
grep -n "600\|10 \* 60\|expiresIn:" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts \
  apps/backend/src/common/one-time-token/one-time-token.service.ts
grep -n "HANDOVER_TOKEN_TTL_SECONDS" \
  apps/backend/src/modules/checkouts/services/handover-token.service.ts
```

### Step 16: 토큰 발급 권한 가드

**PASS:** `POST /checkouts/:uuid/handover-token` → 신청자 또는 담당자만 발급 가능.
체크아웃 소유자/관련자 검증 코드 존재.
**FAIL:** `@Public()` 또는 권한 검증 없이 모든 인증 사용자 발급 허용.

```bash
grep -n -A 5 "handover-token" \
  apps/backend/src/modules/checkouts/checkouts.controller.ts | head -40
```

### Step 17: 프론트엔드 토큰 영속화 금지

**PASS:** 토큰이 메모리(state/ref) 또는 URL query string에만 존재. QR 표시 후 폐기.
**FAIL:** `localStorage.setItem` / `sessionStorage.setItem` 또는 서버 state에 토큰 저장.

```bash
grep -rn "localStorage\|sessionStorage" \
  --include="*.ts" --include="*.tsx" \
  apps/frontend/components/checkouts/HandoverQRDisplay.tsx \
  apps/frontend/app/(dashboard)/handover/ 2>/dev/null
```

### Step 18: dev-only 테스트 엔드포인트 이중 가드

**PASS:** `forge-handover-token`이 (1) TestAuthController에서만 등록 + (2) NODE_ENV 런타임 체크 모두 적용.
**FAIL:** 프로덕션 빌드에서 접근 가능하거나 가드 하나만 적용.

```bash
grep -n -B 2 -A 10 "forge-handover-token" \
  apps/backend/src/modules/auth/test-auth.controller.ts
grep -n "NODE_ENV\|isProduction\|registerIf" \
  apps/backend/src/modules/auth/test-auth.controller.ts
```

### Step 19: HandoverQRDisplay caller wired

**PASS:** `HandoverQRDisplay`가 `CheckoutDetailClient`에 마운트되고, `HandoverActionButton`을 통해 진입점이 연결됨.
**FAIL:** caller 0건 — 진입점 missing.

```bash
grep -rn "HandoverQRDisplay\|HandoverActionButton" \
  apps/frontend/app/(dashboard)/checkouts/ \
  apps/frontend/components/checkouts/CheckoutDetailClient.tsx 2>/dev/null | grep -v "HandoverQRDisplay.tsx\|HandoverActionButton.tsx"
# PASS: import + JSX 사용 각 1건 이상
```

### Step 20: PURPOSE_BY_STATUS 프론트 mirror 금지

**PASS:** `PURPOSE_BY_STATUS`가 프론트엔드에 0건 — 백엔드 응답 `purpose` 필드만 사용.
**FAIL:** 프론트엔드 코드에 `PURPOSE_BY_STATUS` mirror 정의 존재.

```bash
grep -rn "PURPOSE_BY_STATUS\|purposeByStatus\|lender_checked.*borrower_receive\|borrower_returned.*lender_receive" \
  apps/frontend/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".spec.ts"
# PASS: 0건
```

### Step 21: attachment fail-close 3-layer — submitConditionCheck + returnCheckout 양 경로

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

### Step 22: dangerouslySetInnerHTML 제거 확인

**PASS:** `HandoverQRDisplay.tsx`에 `dangerouslySetInnerHTML` 0건, `<img src={qrDataUrl}` 패턴 사용.
**FAIL:** `dangerouslySetInnerHTML` 잔존.

```bash
grep -n "dangerouslySetInnerHTML" \
  apps/frontend/components/checkouts/HandoverQRDisplay.tsx 2>/dev/null
# PASS: 0건
grep -n "qrDataUrl\|toDataURL" \
  apps/frontend/components/checkouts/HandoverQRDisplay.tsx 2>/dev/null
# PASS: 1건 이상
```

---

## Output Format

```markdown
## QR SSOT (Section A)

| #   | 검사                                | 상태      | 상세                                  |
| --- | ----------------------------------- | --------- | ------------------------------------- |
| 1   | QR URL 인라인 조합                  | PASS/FAIL | 우회 파일명:라인                      |
| 2   | QR 경로 상수 하드코딩               | PASS/FAIL | '/e/' 또는 '/handover' 리터럴 건수    |
| 3   | QR 설정 매직넘버                    | PASS/FAIL | 인라인 픽셀/mm 값 위치                |
| 4   | LabelSizePreset 로컬 재정의         | PASS/FAIL | 로컬 union/preset 재정의 위치         |
| 5   | XL_LABEL_HEIGHT_MM SSOT drift       | PASS/FAIL | 43.7 하드코딩 또는 referenceLabelHeightMm 인라인 위치 |
| 6   | precomputedQrData 주입 패턴         | PASS/FAIL | QRCode.create() 루프 내 중복 호출 위치 |
| 7   | getSamplerPresetOrder ↔ i18n 동기화 | PASS/FAIL | 고정 배열 대체 또는 i18n 키 누락      |
| 8   | QR 액션 재정의                      | PASS/FAIL | 인라인 액션 배열 위치                 |
| 9   | appUrl 직접 접근                    | PASS/FAIL | getAppUrl() 우회 위치                 |
| 10  | FRONTEND_ROUTES 빌더 우회           | PASS/FAIL | 인라인 URL 조합 위치                  |
| 11  | QRAccessService 중복 판정           | PASS/FAIL | 프론트 자체 상태 판정 여부            |

## Handover 보안 (Section B)

| #   | 검사                              | 상태      | 상세                                         |
| --- | --------------------------------- | --------- | -------------------------------------------- |
| 12  | HANDOVER_TOKEN_SECRET 분리        | PASS/FAIL | JWT_SECRET 재사용 여부, 길이 검증 존재 여부  |
| 13  | OneTimeTokenService 위임          | PASS/FAIL | 직접 JWT/Redis 조작 여부                     |
| 14  | jti nonce 소비 원자성             | PASS/FAIL | del() 반환값 검사 여부                       |
| 15  | TTL SSOT 경유                     | PASS/FAIL | 매직넘버 위치                                |
| 16  | 토큰 발급 권한 가드               | PASS/FAIL | 소유자 검증 코드 존재 여부                   |
| 17  | 토큰 프론트엔드 영속화 금지       | PASS/FAIL | localStorage/sessionStorage 사용 여부        |
| 18  | dev-only 테스트 엔드포인트 가드   | PASS/FAIL | NODE_ENV + TestAuthController 이중 가드      |

## Handover 발급 진입점 + SSOT (Section C, 2026-05-09 추가)

| #   | 검사                                      | 상태      | 상세                                          |
| --- | ----------------------------------------- | --------- | --------------------------------------------- |
| 19  | HandoverActionButton caller wired         | PASS/FAIL | CheckoutDetailClient 마운트 + import 각 1건 이상 |
| 20  | PURPOSE_BY_STATUS 프론트 mirror 금지      | PASS/FAIL | 프론트에 mirror 0건                           |
| 21  | condition_check 사진 attachmentIds 3-layer| PASS/FAIL | owner+type+중복링크 fail-close 3건 존재       |
| 22  | dangerouslySetInnerHTML 제거              | PASS/FAIL | HandoverQRDisplay.tsx 0건 + toDataURL 사용    |
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

**Section B (Handover 보안)**:
9. **`one-time-token.service.ts` 내부** — jwtService 직접 사용 허용 (프리미티브 구현체)
10. **`handover-token.service.spec.ts`** — 테스트용 in-memory Redis mock, `jest.mock('ioredis')` 허용
11. **URL query string의 token 파라미터** — `/handover?token=...` URL은 일시적 전달 수단. 영속화가 아님
12. **TTL 상수 내부 정의** — `HANDOVER_TOKEN_TTL_SECONDS = 10 * 60` 원본 정의 파일에서는 매직넘버 허용
