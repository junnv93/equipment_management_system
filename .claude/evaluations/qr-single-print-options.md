# Evaluation Report: qr-single-print-options

**Date:** 2026-04-19
**Iteration:** 1
**Verdict:** PASS

## MUST Criteria Results

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| M1: TypeScript 타입 검사 통과 | PASS | `packages/shared-constants pnpm build` 오류 0건; `apps/frontend pnpm tsc --noEmit` 오류 0건 |
| M2: SSOT — 크기/레이아웃 상수가 qr-config.ts에만 존재 | PASS | `LABEL_SIZE_PRESETS` (line 222), `LABEL_LAYOUT_CONSTRAINTS` (line 237) 모두 qr-config.ts에 정의. EquipmentQRButton.tsx에 mm 수치 하드코딩 없음 |
| M3: resolveLayoutMode fallback 체인 정확성 | PASS | 수동 추적: `('full','small')` → small(30×15), full(50×30) 실패, minimal(30×18) heightMm 15<18 실패, qrOnly(15×15) 통과 → `{mode:'qrOnly', fallback:true}` ✓. `('full','standard')` → `{mode:'full', fallback:false}` ✓. `('minimal','medium')` → `{mode:'minimal', fallback:false}` ✓ |
| M4: 하위 호환성 — batch 모드 경로 변경 없음 | PASS | `buildBatchPdf` 존재 (line 537). `renderCellToDataUrl` batch 호출 시 `layoutMode:'full'` 고정 (line 566), `qrSizeMm: LABEL_CONFIG.cell.qrSizeMm` (line 569) 사용 |
| M5: single 모드 — 절취선 미렌더링 | PASS | `buildSinglePdf` (line 509-531) 함수 바디에 `renderCutLines` 호출 없음. `renderCutLines`는 `buildBatchPdf` (line 578)에서만 호출 |
| M6: UI — RadioGroup 2개 존재 (양식 + 크기) | PASS | RadioGroup 2개 존재 (layout: line 133, size: line 154). value=`layoutMode`와 value=`sizePreset` 분리. fallback 시 `role="alert"` 요소 렌더링 (line 176) |
| M7: i18n 누락 없음 | PASS | ko/qr.json: `layoutMode.full/minimal/qrOnly` (line 39-42), `size.standard/medium/small` (line 45-48) 모두 존재. en/qr.json: 동일 키 존재 (line 39-42, 45-48) |
| M8: shared-constants index.ts export 포함 | PASS | index.ts line 280-288: `LABEL_SIZE_PRESETS`, `LABEL_LAYOUT_CONSTRAINTS`, `resolveLayoutMode`, `type LabelSizePreset`, `type LabelLayoutMode` 모두 export |

## SHOULD Criteria Results

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| S1: qrOnly 모드에서 외곽 strokeRect 포함 | PASS | `strokeRect` (line 340)는 `if (layoutMode === 'qrOnly')` 분기 이전 공통 코드 위치. qrOnly 포함 모든 모드에서 외곽 테두리 렌더링됨 |
| S2: 단일 라벨 PDF — 절취선 없음 의도 명시 | PASS | `buildSinglePdf` 함수 JSDoc에 "절취선 없음 (단일 라벨 → gutter 개념 없음), 단일 페이지" 명시 (line 507) |
| S3: EquipmentQRButton 다이얼로그 — 접근성 | PASS | fieldset + legend 패턴 사용 (line 129-147, 150-171). fallback 경고 `role="alert"` 존재 (line 176) |
| S4: 소형 라벨 최소 QR 크기 주석 | PASS | qr-config.ts line 218-220에 `qrSizeMm` 최솟값 근거 주석 존재: "URL ~30자 + errorCorrectionLevel H → 33×33 모듈. 300dpi 기준 스캔 신뢰 하한 ~12mm (모듈당 약 0.36mm ≥ 0.25mm 안전 마진)" |

## Issues Requiring Fix (MUST FAILs only)

없음 — 모든 MUST 기준 통과.

## Tech Debt (SHOULD FAILs)

없음 — 모든 SHOULD 기준 통과.
