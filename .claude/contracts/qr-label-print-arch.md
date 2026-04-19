# Contract: qr-label-print-arch

## Scope
QR 라벨 인쇄 시스템 아키텍처 개선 — SSOT 준수, 하드코딩 금지, 업계 표준 절제선

**변경 파일:**
- `packages/shared-constants/src/qr-config.ts`
- `apps/frontend/lib/qr/generate-label-pdf.worker.ts`

---

## MUST Criteria (FAIL → 루프 차단)

### M1: TypeScript 타입 검사 통과
- `cd apps/frontend && pnpm tsc --noEmit` — 오류 0건
- `cd packages/shared-constants && pnpm build` — 오류 0건

### M2: SSOT — 모든 절제선 설정이 LABEL_CONFIG.pdf.cutLine에 존재
- `pdf.cutLine.dashMm` (dash 길이, mm)
- `pdf.cutLine.gapMm` (gap 길이, mm)
- `pdf.cutLine.color` (hex string)
- `pdf.cutLine.lineWidthMm` (굵기, mm)
- Worker에서 위 값 직접 참조 — 하드코딩 없음

### M3: SSOT — QR 좌측 패딩이 LABEL_CONFIG.cell.qrPaddingLeftMm에 존재
- Worker에서 `cell.qrPaddingLeftMm` 참조
- `0` 하드코딩 금지

### M4: printDpi 200으로 변경
- `LABEL_CONFIG.cell.printDpi === 200`

### M5: borderColor #c0c0c0으로 변경 (내부 구분선)
- `LABEL_CONFIG.cell.borderColor === '#c0c0c0'`

### M6: 셀 외곽 실선 제거
- Worker `renderCellToDataUrl`에서 `strokeRect` 호출 없음

### M7: 절제선이 jsPDF 레이어에서 렌더링
- Worker `buildPdf` 또는 전용 함수에서 jsPDF의 `setLineDashPattern` 호출
- 점선이 열 사이, 행 사이 각 gutter 중앙에 그려짐
- 페이지 전체를 가로지르는 직선 (0 → pageWidthMm, 0 → pageHeightMm)

### M8: QR이 qrPaddingLeftMm에서 시작
- Worker에서 QR x 좌표 = `mmToPx(cell.qrPaddingLeftMm)` (0 하드코딩 금지)
- dividerX, textX 재계산 반영

### M9: 절제선 그린 후 dash pattern 리셋
- `doc.setLineDashPattern([], 0)` 호출로 상태 오염 방지

---

## SHOULD Criteria (FAIL → tech-debt 기록, 루프 차단 안 함)

### S1: 절제선이 페이지 외곽 경계(margin 바깥)도 포함
- 0 → pageWidthMm 전체 span
### S2: 절제선 색상 파싱 로직이 유틸 함수로 분리
### S3: jsPDF 상태 변경(setDrawColor, setLineWidth 등)이 렌더링 후 원상복구
