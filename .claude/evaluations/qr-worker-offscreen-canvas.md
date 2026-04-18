---
slug: qr-worker-offscreen-canvas
iteration: 1
verdict: PASS
---

## MUST Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| M1 | tsc passes | PASS | `pnpm exec tsc --noEmit` — 출력 없음, 오류 0건 |
| M2 | toDataURL removed | PASS | grep 0건. `QRCode.toDataURL` 호출 완전 제거 |
| M3 | OffscreenCanvas used | PASS | 89번 줄 `new OffscreenCanvas(1, 1)` + `convertToBlob` 경로 |
| M4 | No `any` type | PASS | grep 0건. `unknown` / 구조 타입으로 대체됨 |
| M5 | blobToDataUrl typed | PASS | 54번 줄 `function blobToDataUrl(blob: Blob): Promise<string>` |

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | blobToDataUrl extracted | PASS | 54-61번 줄 named function으로 분리, 인라인 아님 |
| S2 | QR options use SSOT | PASS | `QR_CONFIG.errorCorrectionLevel` / `.margin` / `.scale` 모두 `@equipment-management/shared-constants` 경유 |

## 추가 검증 항목

| 항목 | 결과 | 비고 |
|------|------|------|
| `/// <reference lib="webworker" />` 존재 | PASS | 1번 줄. `OffscreenCanvas`, `DedicatedWorkerGlobalScope`, `FileReader` 타입 확보 |
| `QRCode.toCanvas` 캐스트에 `any` 없음 | PASS | `(canvas: unknown, text: string, options: object) => Promise<void>` — `unknown` 사용 |
| `reader.result as string` | 경고 수준 | `FileReader.result`는 `string \| ArrayBuffer \| null`. `readAsDataURL`은 항상 string을 반환하므로 런타임은 안전하나 타입 검사가 단락됨. 계약 MUST 기준 외 항목이므로 FAIL 처리 안 함 |

## Issues Found

없음. MUST 기준 5개 전부 통과. SHOULD 기준 2개 전부 통과.

참고로 `reader.onload = () => resolve(reader.result as string)` 의 `as string` 단언은
`readAsDataURL` 의미론적으로 안전하지만, 엄밀한 타입 안전성을 원한다면
`typeof reader.result === 'string' ? reader.result : ''` 가드로 대체하는 것이 더 정확하다.
이는 계약 범위 밖이므로 이번 평가에 영향 없음.

## Summary

변경 파일 `generate-label-pdf.worker.ts`는 계약 `qr-worker-offscreen-canvas.md`의
MUST 5개, SHOULD 2개 전부 충족한다. `QRCode.toDataURL` DOM 의존성이 `OffscreenCanvas` +
`FileReader` 경로로 완전 대체되었고, 타입 안전성(`any` 0건)과 SSOT 준수도 확인됨.
**verdict: PASS**
