# QR 라벨 사이즈 샘플러 페이지 기능

## 목표
A4 1페이지에 LABEL_SIZE_PRESETS 모든 크기를 실물 크기로 배치하는 "사이즈 샘플러" 모드 도입.
기존 single/batch 경로 불변. UI 기본값: sampler.

## 변경 파일 (5개)
1. packages/shared-constants/src/qr-config.ts
2. apps/frontend/lib/qr/generate-label-pdf.worker.ts
3. apps/frontend/lib/qr/generate-label-pdf.ts
4. apps/frontend/components/equipment/EquipmentQRButton.tsx
5. apps/frontend/messages/ko/qr.json + en/qr.json

## 레이아웃 수치 검증 (labelGapMm: 2 기준)
- standard (93.5×43.7, 1×2): width=2×93.5+1×2=189mm ✓, height=43.7mm
- medium (60×30, 2×3): width=3×60+2×2=184mm ✓, height=2×30+1×2=62mm
- small (30×15, 3×6): width=6×30+5×2=190mm ✓, height=3×15+2×2=49mm
- 총 세로: 7(hdr)+43.7+6+7(hdr)+62+6+7(hdr)+49 = 187.7mm < 277mm ✓
