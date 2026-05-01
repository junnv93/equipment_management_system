# 스프린트 계약: Error Codes SSOT 시스템 통합

## 생성 시점

2026-05-02 (Mode 2 Lightweight, disposal-zod 후속 3차 closure)

## 배경

이전 sprint들 자기검토 결과 발견된 시스템적 갭:
- 🔴 갭 5: calibration-plan service fail-close 비대칭 (`> 0` vs disposal `≥ MIN`)
- 🔴 갭 6: ErrorCode enum SSOT 존재하나 인라인 string literal 292건이 우회
- 🟡 갭 7: audit log 통합 부재 (별도 sprint로 분리)
- 🟡 갭 8: frontend error code → i18n 매핑 부재
- 🟡 갭 9: e2e 통합 spec 부재 (다른 세션 도메인 회피로 분리)

본 sprint는 갭 5/6/8 closure. 갭 7/9는 명시적 후속화 인정.

## 다른 세션 회피

`apps/backend/test/*.e2e-spec.ts`, REGISTRY.md, manage-skills/verify-e2e SKILL.md, calibration-status.ts, next-env.d.ts, 다른 세션 active exec-plans

## 성공 기준

### MUST

#### M1 — 컴파일
- [ ] M1.1 `pnpm tsc --noEmit` 0 errors

#### M2 — ErrorCode enum 확장
- [ ] M2.1 disposal 도메인 8 codes 추가 (DisposalRejectCommentRequired, DisposalReviewedNotFound, DisposalPendingNotFound, DisposalReviewerNotFound, DisposalTeamScopeOnly, DisposalAlreadyInProgress, DisposalOnlyRequesterCanCancel, DisposalRequestNotFound)
  - 검증: `grep -c "Disposal[A-Z]" packages/schemas/src/errors.ts` ≥ 8
- [ ] M2.2 calibration-plan 도메인 14 codes 추가 (CalibrationPlanNotFound, ItemNotFound, RejectionReasonRequired, AlreadyExists, InvalidStatusForReject, InvalidStatusForSubmit, OnlyApprovedCanConfirm, OnlyApprovedCanCreateVersion, OnlyDraftCanDelete/Update/UpdateItem, OnlyPendingApprovalCanApprove, OnlyPendingReviewCanReview, PlanItemNotExecuted)
  - 검증: `grep -c "CalibrationPlan[A-Z]" packages/schemas/src/errors.ts` ≥ 14
- [ ] M2.3 errorCodeToStatusCode 매핑이 모든 신규 code에 대해 등록됨
  - 검증: `pnpm tsc --noEmit` 통과 (Record<ErrorCode, number> 강제)

#### M3 — calibration-plan service fail-close ≥MIN 격상
- [ ] M3.1 `calibration-plans.service.ts` reject 메서드에 `rejectionReason.trim().length < REJECTION_REASON_MIN_LENGTH` 강도 검증 존재
  - 검증: `grep -A 3 "rejectionReason\.trim()" apps/backend/src/modules/calibration-plans/calibration-plans.service.ts | grep -c "REJECTION_REASON_MIN_LENGTH"` ≥ 1
- [ ] M3.2 disposal과 동일 패턴 (fail-close 강도 비대칭 0)

#### M4 — 인라인 string literal → ErrorCode 격상
- [ ] M4.1 disposal 도메인 (service + controller) 인라인 `code: '[A-Z_]+'` 0건
  - 검증: `grep -E "code: '[A-Z_]+'" apps/backend/src/modules/equipment/services/disposal.service.ts apps/backend/src/modules/equipment/disposal.controller.ts` 결과에 disposal 관련 string 0건
- [ ] M4.2 calibration-plan 도메인 인라인 `code: '[A-Z_]+'` 0건
  - 검증: `grep -E "code: '[A-Z_]+'" apps/backend/src/modules/calibration-plans/*.ts apps/backend/src/modules/calibration-plans/services/*.ts 2>/dev/null` 결과에 calibration-plan 관련 string 0건
- [ ] M4.3 ErrorCode enum 사용으로 격상됨
  - 검증: `grep -c "ErrorCode\." apps/backend/src/modules/equipment/services/disposal.service.ts` ≥ 8
  - 검증: `grep -c "ErrorCode\." apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` ≥ 14

#### M5 — Frontend error code → i18n 매퍼
- [ ] M5.1 `apps/frontend/lib/errors/disposal-errors.ts` 신규 — ErrorCode → toast 매퍼 export
- [ ] M5.2 `apps/frontend/lib/errors/calibration-plan-errors.ts` 신규
- [ ] M5.3 `DisposalApprovalDialog.tsx` reject error toast가 mapper 사용
  - 검증: `grep -c "mapDisposalErrorToToast\|disposal-errors" apps/frontend/components/equipment/disposal/DisposalApprovalDialog.tsx` ≥ 1
- [ ] M5.4 `CalibrationPlanDetailClient.tsx` reject mutation error toast가 mapper 사용
  - 검증: `grep -c "mapCalibrationPlanErrorToToast\|calibration-plan-errors" apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` ≥ 1

#### M6 — verify-zod Step 16 신설
- [ ] M6.1 `.claude/skills/verify-zod/SKILL.md`에 Step 16 (인라인 error code SSOT 강제 + service fail-close 비대칭 차단) 추가
  - 검증: `grep -n "### Step 16" .claude/skills/verify-zod/SKILL.md` ≥ 1
- [ ] M6.2 grep 패턴이 contract 작성 규칙 준수

#### M7 — 회귀 0
- [ ] M7.1 disposal/calibration-plan/equipment unit test 모두 PASS
- [ ] M7.2 새 spec assertion이 `ErrorCode.X` 매칭으로 업데이트됨

#### M8 — 다른 세션 도메인 침범 0

### SHOULD

- [ ] S1 audit log 통합 별도 sprint 등록 (galleries 7)
- [ ] S2 e2e 통합 spec 별도 sprint 등록 (galleries 9)
- [ ] S3 다른 도메인(equipment/checkout/NC 등) ErrorCode 마이그레이션 sprint 등록
- [ ] S4 frontend mapper unit test 추가
- [ ] S5 review-architecture 검토 (defense-in-depth + ErrorCode SSOT 일관성)

## 적용 verify 스킬
- verify-zod (Step 15 + 신규 Step 16)
- verify-implementation 자동 선택

## 종료 조건
- M1~M8 전체 PASS → Phase 10 진행
- SHOULD 실패는 tech-debt 등록 후 PASS
- 동일 이슈 2회 연속 FAIL → 설계 문제

## 의사결정 로그

이전 exec-plan(`.claude/exec-plans/active/2026-05-02-error-codes-ssot-system-wide.md`) D1~D5 참조.
