---
name: verify-qr-ssot
description: QR 코드 URL 생성·파싱·라벨 설정이 SSOT(qr-url.ts, qr-config.ts, qr-access.ts)를 경유하는지 검증합니다. QR/handover 기능 추가·수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 검사 항목]'
---

# QR SSOT 검증

## Purpose

QR 코드 관련 모든 하드코딩 값·인라인 URL 조합을 탐지합니다:

1. **QR URL 빌더 SSOT** — `buildEquipmentQRUrl` / `buildHandoverQRUrl` 이외의 URL 조합 탐지
2. **QR URL 경로 상수** — `EQUIPMENT_QR_PATH_PREFIX` / `HANDOVER_QR_PATH` 하드코딩 탐지
3. **QR 설정 SSOT** — `QR_CONFIG` / `LABEL_CONFIG` / `getLabelCellDimensions` 우회 탐지
4. **QR 액션 SSOT** — `QR_ACTION_VALUES` 재정의·인라인 배열 탐지
5. **appUrl 파라미터 주입** — `process.env.NEXT_PUBLIC_APP_URL` / `window.location.origin` 직접 인라인 탐지
6. **FRONTEND_ROUTES 딥링크 빌더** — `CHECKOUTS.CREATE_FOR_EQUIPMENT` 등 빌더 우회 탐지
7. **QRAccessService 응답 shape** — 허용된 actions를 클라이언트가 중복 계산하는 패턴 탐지

## When to Run

- QR URL 생성/파싱 코드를 추가·수정한 후
- 라벨 PDF 생성 로직을 수정한 후
- QR 모바일 랜딩 액션 추가 후
- `qr-url.ts` / `qr-config.ts` / `qr-access.ts` 변경 후

## Related Files

| File | Purpose |
|------|---------|
| `packages/shared-constants/src/qr-url.ts` | QR URL 빌더/파서 SSOT (`buildEquipmentQRUrl`, `buildHandoverQRUrl`, `EQUIPMENT_QR_PATH_PREFIX`, `HANDOVER_QR_PATH`) |
| `packages/shared-constants/src/qr-config.ts` | QR 설정 SSOT (`QR_CONFIG`, `LABEL_CONFIG`, `getLabelCellDimensions`) |
| `packages/shared-constants/src/qr-access.ts` | QR 액션 SSOT (`QR_ACTION_VALUES`, `QR_ACTION_PRIORITY`, `QR_ACTION_I18N_KEYS`) |
| `packages/shared-constants/src/frontend-routes.ts` | 딥링크 빌더 SSOT (`CHECKOUTS.CREATE_FOR_EQUIPMENT`, `EQUIPMENT.NON_CONFORMANCES_CREATE` 등) |
| `apps/frontend/lib/qr/app-url.ts` | `getAppUrl()` — NEXT_PUBLIC_APP_URL 캡슐화 |
| `apps/frontend/lib/qr/generate-label-pdf.ts` | 라벨 PDF 생성 — `QR_CONFIG`/`LABEL_CONFIG` 경유 필수 |
| `apps/frontend/lib/qr/generate-label-pdf.worker.ts` | Web Worker 라벨 렌더 — 동일 SSOT 경유 |
| `apps/frontend/components/equipment/EquipmentQRCode.tsx` | QR 컴포넌트 — `buildEquipmentQRUrl` 경유 필수 |
| `apps/frontend/components/mobile/EquipmentActionSheet.tsx` | QR 액션 CTA — `FRONTEND_ROUTES` 빌더 경유 필수 |
| `apps/backend/src/modules/equipment/services/qr-access.service.ts` | 서버 QR 액션 판정 SSOT |

## Workflow

각 Step의 bash 명령어 상세: [references/step-details.md](references/step-details.md) 참조

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

### Step 4: QR 액션 재정의 탐지

**PASS:** 프론트 액션 배열이 `QR_ACTION_VALUES` import 경유.
**FAIL:** 인라인 `['view_detail', 'request_checkout', ...]` 배열 직접 선언.

```bash
grep -rn "'view_detail'\|'request_checkout'\|'view_qr'" \
  --include="*.ts" --include="*.tsx" apps/frontend/ \
  | grep -v node_modules | grep -v qr-access.ts | grep -v ".spec."
```

### Step 5: appUrl 직접 접근 탐지

**PASS:** `getAppUrl()` 유틸 경유 (`apps/frontend/lib/qr/app-url.ts`).
**FAIL:** `process.env.NEXT_PUBLIC_APP_URL` 또는 `window.location.origin` 인라인 사용.

```bash
grep -rn "process\.env\.NEXT_PUBLIC_APP_URL\|window\.location\.origin" \
  --include="*.ts" --include="*.tsx" apps/frontend/ \
  | grep -v node_modules | grep -v app-url.ts | grep -v ".spec."
```

### Step 6: FRONTEND_ROUTES 딥링크 빌더 우회 탐지

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

### Step 7: QRAccessService 클라이언트 중복 판정 탐지

**PASS:** 프론트가 `allowedActions` 배열을 서버에서 받아 순회 렌더링만 함.
**FAIL:** 프론트가 `equipment.status === 'available'` 등으로 자체 액션 판정 후 CTA 렌더.

```bash
# ActionSheet에서 장비 상태 직접 판정 여부
grep -rn "equipment\.status\|\.status === " \
  --include="*.ts" --include="*.tsx" \
  apps/frontend/components/mobile/EquipmentActionSheet.tsx \
  | grep -v node_modules
```

## Output Format

```markdown
| #   | 검사                              | 상태      | 상세                                  |
| --- | --------------------------------- | --------- | ------------------------------------- |
| 1   | QR URL 인라인 조합                | PASS/FAIL | 우회 파일명:라인                      |
| 2   | QR 경로 상수 하드코딩             | PASS/FAIL | '/e/' 또는 '/handover' 리터럴 건수    |
| 3   | QR 설정 매직넘버                  | PASS/FAIL | 인라인 픽셀/mm 값 위치                |
| 4   | QR 액션 재정의                    | PASS/FAIL | 인라인 액션 배열 위치                 |
| 5   | appUrl 직접 접근                  | PASS/FAIL | getAppUrl() 우회 위치                 |
| 6   | FRONTEND_ROUTES 빌더 우회         | PASS/FAIL | 인라인 URL 조합 위치                  |
| 7   | QRAccessService 중복 판정         | PASS/FAIL | 프론트 자체 상태 판정 여부            |
```

## Exceptions

1. **`qr-url.ts` 내부** — 경로 상수 원본 정의 위치, 자체 탐지 제외
2. **`qr-config.ts` 내부** — 설정 상수 원본 정의, 자체 탐지 제외
3. **`qr-access.ts` 내부** — 액션 enum 원본 정의, 자체 탐지 제외
4. **`frontend-routes.ts` 내부** — 딥링크 빌더 원본 정의, 자체 탐지 제외
5. **`.spec.ts` / `.e2e-spec.ts`** — 테스트 픽스처의 인라인 값은 허용
6. **`app-url.ts` 내부** — `process.env.NEXT_PUBLIC_APP_URL` 원본 접근 위치
