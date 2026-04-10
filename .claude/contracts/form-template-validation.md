---
slug: form-template-validation
created: 2026-04-10
updated: 2026-04-10
iteration: 2
---

# Contract: Form Template Silent Failure 제거 (Iteration 2)

이전 평가(form-template-validation.md)에서 FAIL 2건 + WARN 5건 발견.
이번 iteration은 해당 이슈들의 수정 검증.

## MUST

| # | Criterion | Verification |
|---|---|---|
| M-1 | QP-18-01: `worksheets[0]` fallback 제거, 시트 미발견 시 InternalServerErrorException throw | form-template-export.service.ts ~line 240 |
| M-2 | QP-18-08: 빈 워크북 fallback(try-catch) 제거, 템플릿 로드 실패 시 에러 전파 | form-template-export.service.ts ~line 1235 |
| M-3 | DocxTemplate 생성 시 formLabel 2nd arg 전달 (6곳: QP-18-03/05/06/07/09/10) | `new DocxTemplate(` 검색 |
| M-4 | InternalServerErrorException import 존재 | form-template-export.service.ts import |
| M-5 | history-card.service.ts fillSectionRows() `pos === -1` silent return → throw 교체 | ~line 570 |
| M-6 | docx-template.util.ts setDataRows() data.length > cells.length 시 throw | ~line 95 |
| M-7 | `pnpm tsc --noEmit` PASS | CLI |
| M-8 | `pnpm --filter backend run build` PASS | CLI |
| M-9 | `pnpm --filter backend run test` 회귀 없음 | CLI |

## SHOULD

| # | Criterion |
|---|---|
| S-1 | 에러 메시지에 양식번호(UL-QP-18-XX) + 실패 위치 포함 |
| S-2 | insertEquipmentPhoto() silent return에 throw 또는 warn 추가 (WARN-4) |
| S-3 | 이미지 다운로드 실패는 throw가 아닌 warn 유지 |
