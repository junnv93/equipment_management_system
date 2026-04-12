---
slug: docx-export-fidelity
title: DOCX Export 원본 양식 충실도 — numbering 스타일 + 시드 데이터 구조 정합
mode: 1
created: 2026-04-12
---

## 원본 양식 구조 원칙

1. 결과 섹션 제목 (title) → 양식 템플릿의 numbering 스타일(Wingdings bullet) 사용
2. 비고/확인 텍스트 (text) → ※ 또는 ■ numbering 스타일 사용
3. T2 특기사항 → remarks 필드값만 (글머리 기호 텍스트는 result section text로 분리)
4. data_table 앞 소제목 → 점검항목명과 일치
5. 시드 데이터가 원본의 섹션 순서를 정확히 재현

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `tsc --noEmit` PASS | CLI |
| M2 | `pnpm --filter backend run build` PASS | CLI |
| M3 | `pnpm --filter backend run test` ALL PASS | CLI |
| M4 | appendParagraph에 numbering(bullet) 옵션 지원 | Code review |
| M5 | 생성 DOCX에서 title 섹션이 numPr 포함 | PizZip XML 검증 |
| M6 | 생성 DOCX에서 text 섹션의 ※/■가 numPr 포함 | PizZip XML 검증 |
| M7 | 시드 데이터의 결과 섹션 소제목이 원본 점검항목명과 일치 | 시드 스크립트 검증 |
