# Contract: QR 인쇄 양식 단순화

## Scope
QR 인쇄 양식을 'full'+'minimal'+'qrOnly' 3종 → 'full'+'qrOnly' 2종으로 단순화.
소형(30×15mm) 크기에서 'full' 레이아웃이 모든 정보(관리번호·장비명·일련번호)를 표시.

## MUST Criteria

| # | Criterion | Check |
|---|-----------|-------|
| M1 | `LabelLayoutMode` 타입이 `'full' \| 'qrOnly'` (minimal 제거) | grep |
| M2 | `LABEL_LAYOUT_CONSTRAINTS`에 'minimal' 키 없음 | grep |
| M3 | `resolveLayoutMode` order 배열이 `['full', 'qrOnly']` | grep |
| M4 | `EquipmentQRButton` RadioGroup이 `['full', 'qrOnly']`만 렌더링 | grep |
| M5 | Worker `renderCellToDataUrl`에서 minimal 분기 코드 없음 | grep |
| M6 | ko/en qr.json에 `layoutMode.minimal`, `fallbackMode.minimal` 키 없음 | grep |
| M7 | `LABEL_LAYOUT_CONSTRAINTS.full.minHeightMm ≤ 15` (소형 허용) | grep |
| M8 | `pnpm tsc --noEmit` PASS (frontend + shared-constants) | tsc |
| M9 | `pnpm build` PASS | build |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | 소형 full 렌더링 시 mgmtMinFontPt ≤ 6 (행 오버플로 방지) |
| S2 | fallback 인프라 유지 (향후 모드 추가 대비) |
