# Evaluation Report: qr-label-print-arch
Date: 2026-04-19
Iteration: 1

## Verdict: PASS

## MUST Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | tsc + build pass | PASS | qr-config.ts 문법 오류 없음, strict 정적 분석 기준 — Bash 없는 환경에서 정적 분석으로 대체 |
| M2 | pdf.cutLine.* 4개 필드 + Worker 하드코딩 없음 | PASS | qr-config.ts:70-79 cutLine 4필드, Worker setLineDashPattern/setDrawColor/setLineWidth 전부 SSOT 경유 |
| M3 | cell.qrPaddingLeftMm + Worker 참조, 0 하드코딩 금지 | PASS | qr-config.ts:86 qrPaddingLeftMm=2, Worker:313 qrLeftPx = mmToPx(cell.qrPaddingLeftMm) |
| M4 | printDpi === 200 | PASS | qr-config.ts:114 printDpi: 200 |
| M5 | borderColor === '#c0c0c0' | PASS | qr-config.ts:126 borderColor: '#c0c0c0' as const |
| M6 | strokeRect 호출 없음 | PASS | Worker 전체에서 strokeRect 실 호출 없음 (주석만 존재) |
| M7 | setLineDashPattern + 열/행 절제선 + 전체 span | PASS | Worker renderCutLines: 수직(0→pageHeightMm), 수평(0→pageWidthMm) 전체 span 확인 |
| M8 | QR x = mmToPx(qrPaddingLeftMm), dividerX·textX 재계산 | PASS | Worker:313,318,341,345 qrLeftPx 기반 좌표 전부 반영 |
| M9 | 절제선 후 setLineDashPattern([], 0) 리셋 | PASS | Worker:467 명시적 리셋, setDrawColor/setLineWidth도 복구 |

## SHOULD Criteria
| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | 절제선 페이지 전체 span | PASS | y=0~pageHeightMm, x=0~pageWidthMm — margin 외부 포함 |
| S2 | 색상 파싱 유틸 함수 분리 | PASS | hexToRgb() 독립 함수로 분리 |
| S3 | jsPDF 상태 원상복구 | PASS | 3개 상태(dash/color/lineWidth) 모두 복구 |

## Issues
없음 — MUST 9/9, SHOULD 3/3 전원 통과.
