# Evaluation: batch-a-techdebt-0421
Date: 2026-04-21
Iteration: 1

## MUST Criteria
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | tsc --noEmit | PASS | 정적 분석: VendorEditFields setEditForm 타입이 useState<EditForm\|null>과 일치, design-tokens import 확인 |
| M2 | frontend lint | PASS | any 없음, eslint-disable 없음, 미사용 import 없음 |
| M3 | S6 쿼리키 바인딩 | PASS | calibration-api.ts: `queryKeys.calibrations.detail` + `QUERY_CONFIG.CALIBRATION_DETAIL` export |
| M4 | DocumentsSection ≤150줄 | PASS | 실제 93줄 |
| M5 | EditDialog ≤150줄 | PASS | 실제 147줄 (Prettier 후) |
| M6 | Documents 기존 동작 | PASS | useQuery + deleteMutation 자체 보유, docs prop 미수신 |
| M7 | EditDialog 기존 동작 | PASS | useCasGuardedMutation + open/onOpenChange 패턴 유지 |
| M8 | SSOT 우회 없음 | PASS | role/permission/URL 리터럴 없음 |

## SHOULD Criteria
| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | DocumentTable props interface 명시적 | PASS | DocumentTableProps 인터페이스 명시 |
| S2 | VendorEditFields editForm+setEditForm | PASS | React.Dispatch<SetStateAction<EditForm\|null>> 수신 |
| S3 | 서브컴포넌트 ≤120줄 | FAIL | DocumentTable.tsx 213줄. VendorEditFields.tsx 61줄은 통과. tech-debt-tracker 등록됨 |

## Overall: PASS
MUST 8/8 통과. SHOULD S3 위반(DocumentTable.tsx)은 루프 차단하지 않음 — tech-debt-tracker 후속 추적.
