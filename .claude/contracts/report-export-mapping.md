---
slug: report-export-mapping
created: 2026-04-09
mode: 1
---

# Contract: Report Export Mapping 검증 및 개선

## MUST Criteria

1. `pnpm tsc --noEmit` 통과 (에러 0)
2. 수리이력 보고서에서 DB에 존재하지 않는 `cost` 컬럼이 제거됨
3. 장비현황 보고서에 `serialNumber` 컬럼이 추가되어 DB 조회 결과와 일치
4. `docs/manual/report-export-mapping.md` 문서가 존재하며, 모든 구현된 레포트의 DB→출력 매핑이 정확하게 기술됨

## SHOULD Criteria

1. 문서의 DB 필드명이 실제 스키마와 일치
2. 변경된 코드가 기존 레포트의 동작을 깨뜨리지 않음
