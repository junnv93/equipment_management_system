# Contract: qr-single-print-options

## Scope
장비 상세 페이지 QR 인쇄 다이얼로그에 양식 선택(full/minimal/qrOnly)과 크기 프리셋(standard/medium/small) 기능 추가.
일괄 인쇄(BulkLabelPrintButton) 경로는 영향 없음.

**변경 파일:**
- `packages/shared-constants/src/qr-config.ts`
- `packages/shared-constants/src/index.ts`
- `apps/frontend/lib/qr/generate-label-pdf.ts`
- `apps/frontend/lib/qr/generate-label-pdf.worker.ts`
- `apps/frontend/components/equipment/EquipmentQRButton.tsx`
- `apps/frontend/messages/ko/qr.json`
- `apps/frontend/messages/en/qr.json`

---

## MUST Criteria (FAIL → 루프 차단)

### M1: TypeScript 타입 검사 통과
- `cd apps/frontend && pnpm tsc --noEmit` — 오류 0건
- `cd packages/shared-constants && pnpm build` — 오류 0건

### M2: SSOT — 크기/레이아웃 상수가 qr-config.ts에만 존재
- `LABEL_SIZE_PRESETS` 상수가 `packages/shared-constants/src/qr-config.ts`에 존재
- Worker·Wrapper·UI 어디에도 크기 수치(mm) 하드코딩 없음
- `LABEL_LAYOUT_CONSTRAINTS` 상수가 `packages/shared-constants/src/qr-config.ts`에 존재

### M3: resolveLayoutMode — fallback 체인 정확성
- `resolveLayoutMode('full', 'small')` → small 셀(30×15mm)이 full 최소 크기(50×30mm) 미만 → `{ mode: 'minimal', fallback: true }` 또는 `{ mode: 'qrOnly', fallback: true }` (기준에 맞는 첫 단계)
  - small(30×15): minimal 제약(minWidthMm:30, minHeightMm:18) → heightMm(15) < 18 → qrOnly로 fallback
  - 실제 기대: `{ mode: 'qrOnly', fallback: true }`
- `resolveLayoutMode('full', 'standard')` → `{ mode: 'full', fallback: false }`
- `resolveLayoutMode('minimal', 'medium')` → medium(60×30) ≥ minimal 제약(30×18) → `{ mode: 'minimal', fallback: false }`

### M4: 하위 호환성 — batch 모드 경로 변경 없음
- `generateLabelPdf({ items, appUrl })` (mode 미지정) → batch 동작
- Worker `buildBatchPdf`가 존재하며 `LABEL_CONFIG.cell.qrSizeMm`를 참조 (25mm)
- `renderCellToDataUrl` batch 경로에서 `layoutMode: 'full'` 고정

### M5: single 모드 — 절취선 미렌더링
- `buildSinglePdf` 함수에서 `renderCutLines` 호출 없음 (grep으로 확인)

### M6: UI — RadioGroup 2개 존재 (양식 + 크기)
- `EquipmentQRButton.tsx`에 `RadioGroup` 2개 이상 존재
- value=`layoutMode` RadioGroup과 value=`sizePreset` RadioGroup 분리
- fallback 발생 시 `role="alert"` 요소 렌더링

### M7: i18n 누락 없음
- `ko/qr.json`에 `qrDisplay.layoutMode.full/minimal/qrOnly` 모두 존재
- `ko/qr.json`에 `qrDisplay.size.standard/medium/small` 모두 존재
- `en/qr.json`에 동일 키 존재

### M8: shared-constants index.ts export 포함
- `resolveLayoutMode`, `LABEL_SIZE_PRESETS`, `LABEL_LAYOUT_CONSTRAINTS`, `LabelSizePreset`, `LabelLayoutMode` 모두 index.ts에서 export

---

## SHOULD Criteria (FAIL → tech-debt 기록, 루프 차단 안 함)

### S1: qrOnly 모드에서 외곽 strokeRect 포함
- Worker `renderCellToDataUrl` qrOnly 분기에서도 셀 외곽 테두리 렌더링

### S2: 단일 라벨 PDF — marginMm 이후 절취선 없음 확인 (물리 인쇄 시 여백 가이드 부재)
- 단일 라벨 PDF에 gutter/절취선 없음이 의도적임을 주석 또는 명시적 분기로 표현

### S3: EquipmentQRButton 다이얼로그 — 접근성
- fieldset + legend 패턴 사용 (RadioGroup 그룹 레이블 접근성)
- fallback 경고 `role="alert"` 존재

### S4: 소형 라벨 최소 QR 크기 주석
- `LABEL_SIZE_PRESETS.small.qrSizeMm: 12` 결정 근거 주석 존재
