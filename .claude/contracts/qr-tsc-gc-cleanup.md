# Contract: qr-tsc-gc-cleanup

## Scope

3개 독립 이슈 일괄 처리:
1. `QR_CONFIG.scale` deprecated 필드 삭제 (+ 사용처 2곳 정리)
2. `Equipment.id: string | number` → `string` 타입 수정 (tsc 에러 5개 해소)
3. Worker OffscreenCanvas O(n)→O(1) 재사용 최적화

## Changed Files

| File | Change |
|------|--------|
| `packages/shared-constants/src/qr-config.ts` | `scale` 필드 제거 |
| `apps/frontend/components/checkouts/HandoverQRDisplay.tsx` | `scale: QR_CONFIG.scale` 제거 |
| `apps/frontend/components/equipment/EquipmentQRCode.tsx` | `scale: QR_CONFIG.scale` 제거 |
| `apps/frontend/lib/api/equipment-api.ts` | `id: string \| number` → `id: string` |
| `apps/frontend/lib/qr/generate-label-pdf.worker.ts` | OffscreenCanvas 단일 인스턴스 재사용 |

## MUST Criteria

- [ ] `pnpm --filter frontend exec tsc --noEmit` — 에러 0개
- [ ] `pnpm --filter shared-constants exec tsc --noEmit` (또는 build) — 성공
- [ ] `grep -r "QR_CONFIG.scale" apps/` — 결과 0건
- [ ] `grep "string | number" apps/frontend/lib/api/equipment-api.ts` — id 필드 없음
- [ ] Worker에서 OffscreenCanvas가 `buildPdf` 스코프에서 1번만 생성됨

## SHOULD Criteria

- [ ] SVG QR 렌더링 크기가 시각적으로 이상 없음 (scale 제거 후)
- [ ] OffscreenCanvas 재사용 시 각 셀 배경이 올바르게 초기화됨 (clearRect 불필요, fillRect 재칠로 충분)
