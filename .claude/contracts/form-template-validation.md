---
slug: form-template-validation
created: 2026-04-10
---

# Contract: Form Template Silent Failure 제거

## MUST

| # | Criterion | Verification |
|---|---|---|
| M-1 | DocxTemplate.setCellValue() 범위 초과 시 throw | tsc + unit test |
| M-2 | DocxTemplate.setDataRows() 범위 초과 시 throw | tsc + unit test |
| M-3 | DocxTemplate.setSignatureImage() 범위 초과 시 throw | tsc + unit test |
| M-4 | injectCellAfterLabel() 라벨 미발견 시 throw | tsc |
| M-5 | fillSectionRows() 섹션 마커 미발견 시 throw | tsc |
| M-6 | 체크박스/날짜/보관장소 치환 실패 시 throw | tsc |
| M-7 | XLSX 워크시트 미발견 시 throw (silent fallback 제거) | tsc |
| M-8 | pnpm --filter backend run tsc --noEmit PASS | CLI |
| M-9 | pnpm --filter backend run build PASS | CLI |
| M-10 | 기존 backend test 회귀 없음 | CLI |

## SHOULD

| # | Criterion |
|---|---|
| S-1 | 에러 메시지에 양식번호 + 실패 위치 포함 |
| S-2 | 이미지 다운로드 실패는 throw가 아닌 warn 유지 (네트워크 이슈는 양식 문제가 아님) |
