# Contract: qr-render-engine

## Scope

QR 라벨 PDF 생성 Worker의 렌더링 엔진을 "measure → layout → draw" 두 패스 분리
아키텍처로 재설계. 소형 라벨(30×15mm) full 레이아웃에서 텍스트가 캔버스 상단으로
오버플로우하는 버그를 구조적으로 제거.

**변경 파일:**
- `packages/shared-constants/src/qr-config.ts` (상수 2개 추가, 기존 필드 주석 업데이트)
- `apps/frontend/lib/qr/generate-label-pdf.worker.ts` (렌더링 함수 분리/치환)

**변경하지 말 것:**
- 일괄 인쇄 경로(`buildBatchPdf`) 시각 동작
- 단일 인쇄 경로(`buildSinglePdf`) standard/medium 시각 동작
- `qrOnly` 레이아웃 분기
- 폰트 pt 수치(`mgmtFontPt`, `nameFontPt`, `serialFontPt`)
- `LABEL_SIZE_PRESETS`, `LABEL_LAYOUT_CONSTRAINTS`, `resolveLayoutMode`
- `splitIntoLines`, `drawTruncated`, `renderQrToCanvas`, `renderCutLines`

---

## MUST Criteria (FAIL → 루프 차단)

### M1: Measure-Draw 두 패스 분리 — `measureValue` 함수 존재
- `apps/frontend/lib/qr/generate-label-pdf.worker.ts`에 `function measureValue(` 정의 존재
- `measureValue`는 `fillText` / `fillRect` / `stroke` / `beginPath`를 호출하지 않음
- `measureValue`는 `{ fontPxUsed: number; linesUsed: number; lines: string[] }` 형태 반환 (`MeasureResult` 타입 정의 존재)
- `drawValue` 함수가 별도로 존재하며 `MeasureResult`를 입력으로 받음
- 기존 `renderValueWithAutoFit` 심볼은 소스에서 제거됨 — `rg "renderValueWithAutoFit" apps/frontend/` 결과 0건

### M2: `topOffset`이 실제 사용 폰트 크기 기준으로 계산됨
- `renderCellToDataUrl`의 행 루프에서 `contentH` 계산식이 `row.valueFontPx`를 직접 사용하지 않음
- 대신 `measured.fontPxUsed` 또는 `measured.linesUsed` 기반 `lineH` 참조
- `topOffset`에 clamp 적용: `Math.max(cell.topOffsetClampMin, round(...))` 패턴 존재

### M3: `nameMaxLines`가 rowHeight 기반 동적 계산
- `computeMaxLines` 함수가 `generate-label-pdf.worker.ts`에 정의됨
- 장비명 행의 maxLines로 `computeMaxLines()`를 거친 결과를 사용
- 반환값은 `[1, cap]` 범위로 clamp됨

### M4: 모든 신규 상수가 `qr-config.ts` SSOT에 정의됨
- `LABEL_CONFIG.cell`에 `nameMaxLinesCap: number` 및 `topOffsetClampMin: number` 필드 존재
- Worker 코드 내 매직 넘버로 줄 수 상한·clamp 하한 하드코딩 없음
- Worker에서 반드시 `cell.topOffsetClampMin` 참조

### M5: TypeScript 타입 검사 통과
- `pnpm tsc --noEmit` — 오류 0건

### M6: 소형 라벨(30×15mm) full 레이아웃에서 캔버스 오버플로우 없음
- `topOffset = Math.max(cell.topOffsetClampMin, ...)` 패턴으로 음수 불가
- 코드 정적 검증으로 M6 대체 (브라우저 테스트 환경 없음)

### M7: `any` 타입 없음
- `rg ": any\b|as any\b|<any>" apps/frontend/lib/qr/generate-label-pdf.worker.ts` 결과 0건
- 신규 인터페이스(`MeasureResult`, `RowSpec`, `RowMeasured`, `RowLaidOut`) 모두 명시적 필드 타입

### M8: 기존 batch/standard/medium 모드 회귀 없음
- `buildBatchPdf`, `buildSinglePdf` 함수 시그니처 불변
- `qrOnly` 분기 코드 미변경

---

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | `measureValue`는 `fillStyle`도 변경하지 않음 (순수성) |
| S2 | 기존 `nameMaxLines` 필드 `@deprecated` 표시 |
| S3 | `RowLaidOut` 타입에 `labelY`, `valueY`, `topOffset`, `contentH` 포함 |
| S4 | `computeMaxLines` 최소 1 반환 보장 |
| S5 | 각 새 함수에 Measure/Draw/Pure 역할 JSDoc |

## Verification Commands

```bash
pnpm tsc --noEmit
rg "function measureValue\(|function drawValue\(|function computeMaxLines\(" apps/frontend/lib/qr/generate-label-pdf.worker.ts
rg "renderValueWithAutoFit" apps/frontend/
rg "contentH\s*=" apps/frontend/lib/qr/generate-label-pdf.worker.ts
rg "nameMaxLinesCap|topOffsetClampMin" packages/shared-constants/src/qr-config.ts
rg "Math\.max\(" apps/frontend/lib/qr/generate-label-pdf.worker.ts
rg ": any\b|as any\b" apps/frontend/lib/qr/generate-label-pdf.worker.ts
```
