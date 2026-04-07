# Contract: inspection-form-gap-analysis

**Date**: 2026-04-06
**Scope**: QP-18-03/QP-18-05 양식 적합성 검증 + Export 구현 + E2E 테스트

---

## MUST Criteria

| # | Criterion | Verification |
|---|---|---|
| M-1 | QP-18-03 중간점검표 XLSX export가 200 응답 반환 | `curl GET /reports/export/form/UL-QP-18-03?inspectionId={uuid}` → 200 |
| M-2 | QP-18-03 export에 장비 헤더(분류, 관리팀, 관리번호, 장비위치, 장비명, 모델명, 점검주기, 교정유효기간) 포함 | Export 파일 내용 검증 |
| M-3 | QP-18-03 export에 점검 항목 테이블(번호, 점검항목, 점검기준, 점검결과, 판정) 포함 | Export 파일 내용 검증 |
| M-4 | QP-18-03 export에 측정 장비 List(번호, 관리번호, 장비명, 교정일자) 포함 | Export 파일 내용 검증 |
| M-5 | QP-18-03 export에 결재란(점검일, 점검자, 특이사항, 담당/검토 서명자, 승인 서명자) 포함 | Export 파일 내용 검증 |
| M-6 | QP-18-05 export에 장비 헤더 섹션 추가 | Export 파일 내용 검증 |
| M-7 | QP-18-05 export에 점검자 이름 + 결재란(담당/검토, 승인) 포함 | Export 파일 내용 검증 |
| M-8 | 결재란 매핑: 담당/검토 = 점검자(inspectorId) 서명, 승인 = 기술책임자(approvedBy/confirmedBy) 서명 | 코드 리뷰 |
| M-9 | `form-catalog.ts`에서 UL-QP-18-03.implemented = true | 코드 확인 |
| M-10 | `pnpm --filter backend run tsc --noEmit` 통과 | CLI |
| M-11 | `pnpm --filter backend run build` 통과 | CLI |

## SHOULD Criteria

| # | Criterion | Verification |
|---|---|---|
| S-1 | Export E2E 테스트: QP-18-03 다운로드 → 200 + content-type 검증 | E2E spec |
| S-2 | Export E2E 테스트: QP-18-05 다운로드 → 200 + content-type 검증 | E2E spec |
| S-3 | 서명 이미지 삽입 (signatureImagePath → Excel 이미지) | Export 파일 검증 |
| S-4 | verify-implementation PASS (13 verify-* skills) | Evaluator |
| S-5 | `pnpm --filter backend run test` 관련 스위트 통과 | CLI |

---

## Evaluation Method

1. Build verification: `tsc --noEmit` + `build`
2. Backend test: `pnpm --filter backend run test`
3. Manual API test: Export endpoints 호출
4. Code review: 결재란 매핑 정확성
5. verify-implementation (13 verify-* skills)
