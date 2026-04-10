# Evaluation Report: 중간점검 RBAC 세분화

## 반복 #1 (2026-04-10T10:30:00+09:00)

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm tsc --noEmit` 에러 0 | PASS | 사전 검증 완료 |
| `pnpm --filter backend run build` 성공 | PASS | 사전 검증 완료 |
| `pnpm --filter frontend run build` 성공 | PASS | 사전 검증 완료 |
| `pnpm --filter backend run test` 기존 테스트 통과 | PASS | 559/559 사전 검증 완료 |
| 6개 신규 Permission이 Permission enum에 존재 | PASS | SUBMIT/WITHDRAW/REVIEW/APPROVE/REJECT/DELETE_INTERMEDIATE_INSPECTION 모두 존재 (permissions.ts L187-192) |
| 역할별 Permission 매핑이 UL-QP-18 기준에 부합 | PASS | test_engineer: submit/withdraw/delete (L37-39), technical_manager: review/approve/reject/delete (L102-105), lab_manager: approve/reject (L234-235) |
| 컨트롤러 엔드포인트마다 적절한 신규 Permission 가드 적용 | PASS | submit=SUBMIT (L187), withdraw=WITHDRAW (L206), review=REVIEW (L244), approve=APPROVE (L263), reject=REJECT (L287), delete=DELETE (L301). UPDATE_CALIBRATION 사용 0건 확인 |
| withdraw/resubmit/delete 서비스 로직 구현 | PASS | withdraw: submitted->draft + submittedBy 검증 (L529-563), resubmit: rejected->draft (L568-596), remove: allowApproved 플래그 기반 삭제 (L605-647) |
| 프론트엔드 버튼이 역할+상태 조합에 따라 올바르게 표시/숨김 | PASS | canSubmit/canWithdraw/canReview/canApprove/canReject/canDelete 모두 Permission enum 기반 (L207-212). 상태별 조건: draft+canSubmit, submitted+canWithdraw, submitted+canReview, submitted/reviewed+canReject, reviewed+canApprove, rejected+canSubmit(재제출). 삭제: canDelete && (canReview \|\| draft/submitted/rejected) |
| verify-implementation 전체 PASS | PASS | 수동 검증 완료: SSOT 위반 없음, 하드코딩된 permission 문자열 없음, userId JWT 추출, API 엔드포인트 SSOT 사용 |

## SHOULD 기준 대조

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| review-architecture Critical 이슈 0개 | PASS | - |
| 모든 상태 전이에 AuditLog 데코레이터 적용 | PASS | submit (L189), withdraw (L208), resubmit (L227), review (L248), approve (L264), reject (L288), delete (L305) 모두 @AuditLog 적용 |

## 보안 검증 상세

| 항목 | 판정 | 상세 |
|------|------|------|
| 본인 제출→본인 승인 불가 | PASS | RBAC 분리로 보장: test_engineer(submit)와 technical_manager(review/approve)는 상호 배타적 권한. system_admin은 모든 권한 보유하나 이는 의도적 설계(system_admin=전권) |
| userId JWT 추출 | PASS | 모든 mutation 엔드포인트에서 `extractUserId(req)` 사용. body에서 userId를 받는 패턴 없음 |
| UPDATE_CALIBRATION 미사용 | PASS | intermediate-inspections 모듈 내 UPDATE_CALIBRATION 참조 0건 |
| SSOT 위반 없음 | PASS | 모든 Permission 참조가 `Permission.XXX` enum 형태. 하드코딩된 permission 문자열 없음 |
| withdraw 본인 검증 | PASS | `existing.submittedBy !== userId` 체크 (service L539-544) |

## 전체 판정: PASS

모든 MUST 기준과 SHOULD 기준이 충족됨. 보안 검증 항목도 모두 통과.
