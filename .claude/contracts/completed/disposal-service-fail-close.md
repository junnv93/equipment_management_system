# 스프린트 계약: Disposal Service Layer Fail-Close + Edge Case Test Matrix

## 생성 시점

2026-05-01T(UTC) — `disposal-zod-defense-in-depth` 직속 follow-up

## 모드

Mode 1 (Lightweight) — 2 files (service + spec). 시니어 자기검토 4건 갭 중 🔴 1번(disposal comment service fail-close 누락) + 🟡 2번(edge case 단위 테스트 0건) closure.

## 배경

이전 sprint(`disposal-zod-defense-in-depth`)가 backend Zod에 `.trim().max().optional()`만 적용하고 reject 분기 min 강제는 service layer 위임으로 명시(D1). 그러나 service layer는 `approveDto.comment || '승인 단계에서 반려'` fallback을 그대로 둬서 frontend 우회 시 빈 comment로도 반려가 audit log에 fallback 메시지로 기록되는 가짜 closure 상태였다. Defense-in-depth 의미적 완결성 위반.

자기검토 결과 동시에 발견된 갭:
- 🟡 edge case 단위 테스트 0건 — 기존 fixture가 우연히 ≥10자라 회귀 차단 부재
- 🟡 RejectModal SSOT 통합 미검토 (별도 sprint)
- 🟡 Backend Zod i18n 한국어 하드코딩 (별도 ADR)

본 sprint는 🔴 1번 + 🟡 2번 즉시 closure.

## 다른 세션 회피 영역

- `apps/backend/test/*.e2e-spec.ts` (system_admin TestRole 작업 — 이미 commit됨, 그러나 추가 변경 회피)
- `apps/frontend/lib/utils/calibration-status.ts` (다른 세션 미커밋)
- `apps/frontend/next-env.d.ts` (Next.js 자동 생성)
- `.claude/exec-plans/active/2026-05-01-senior-permission-ssot.md` + `inspection-template-*.md` (다른 세션)

## 변경 범위 (2 files)

### 1. `apps/backend/src/modules/equipment/services/disposal.service.ts`
- `approveDisposal()` reject 분기 시작에 fail-close 추가:
  - `decision === 'reject' && (!comment || comment.trim().length < REJECTION_REASON_MIN_LENGTH)` → `BadRequestException` (구체적 error code)
- 기존 fallback (`approveDto.comment || '승인 단계에서 반려'`) 제거 — fail-close 통과한 시점에 comment는 이미 ≥10자 보장
- `reviewDisposal()` 분기는 Zod에서 이미 강제 (decision 무관 opinion 필수 ≥10) — 추가 fail-close 불필요

### 2. `apps/backend/src/modules/equipment/__tests__/disposal.service.spec.ts` (신규)
- **approveDisposal reject 분기 edge case 6건**:
  - comment 미포함(undefined) → `BadRequestException`
  - comment 빈 문자열 → `BadRequestException`
  - comment 공백 10자 (`'          '`) → `BadRequestException`
  - comment 9자 → `BadRequestException`
  - comment 10자 → 통과 + reviewStatus=REJECTED + rejectionReason=comment.trim()
  - comment 500자 → 통과
- **approveDisposal approve 분기 edge case 3건**:
  - comment 미포함 → 통과 + approvalComment=null
  - comment 10자 → 통과 + approvalComment=comment.trim()
  - comment 500자 → 통과
- **회귀 방지 — Zod pipeline 통합**:
  - reasonDetail 9자 → ZodValidationPipe rejection
  - reasonDetail 공백 10자 → trim 후 0자 → rejection
  - opinion 9자 → rejection
  - opinion 10자 → 통과
  - opinion 501자 → rejection
  - comment 501자 → rejection (Zod max)

## 성공 기준

### 필수 (MUST)

#### M1 — 컴파일
- [ ] M1.1 `pnpm tsc --noEmit` 에러 0

#### M2 — Service Layer Fail-Close
- [ ] M2.1 `disposal.service.ts approveDisposal()` reject 분기에 `if (decision === 'reject' && ...) throw new BadRequestException` 패턴 존재
  - 검증: `grep -A 5 "decision === 'reject'" apps/backend/src/modules/equipment/services/disposal.service.ts | grep -c "BadRequestException\|throw"` ≥ 1
- [ ] M2.2 `'승인 단계에서 반려'` fallback 제거됨
  - 검증: `grep -c "승인 단계에서 반려" apps/backend/src/modules/equipment/services/disposal.service.ts` = 0
- [ ] M2.3 `REJECTION_REASON_MIN_LENGTH` import + 사용 확인
  - 검증: `grep -c "REJECTION_REASON_MIN_LENGTH" apps/backend/src/modules/equipment/services/disposal.service.ts` ≥ 2

#### M3 — Edge Case Test Matrix
- [ ] M3.1 신규 spec 파일 존재 + 실행 PASS
  - 검증: `pnpm --filter backend run test --testPathPattern='disposal.service.spec'` 모든 case PASS
- [ ] M3.2 reject edge case ≥ 6건 (undefined/빈/공백10/9자/10자/500자)
  - 검증: spec 내 `it()` 블록 수동 카운트
- [ ] M3.3 approve edge case ≥ 3건
- [ ] M3.4 Zod pipeline 통합 case ≥ 5건 (reasonDetail/opinion/comment의 boundary)
- [ ] M3.5 fail-close 메시지에 ErrorCode 포함 (`DISPOSAL_REJECT_COMMENT_REQUIRED` 같은 도메인 코드)
  - 검증: spec에서 `expect(...).toThrow(BadRequestException)` + `expect(error.response.code).toBe('DISPOSAL_REJECT_COMMENT_REQUIRED')` 패턴

#### M4 — 회귀 0
- [ ] M4.1 기존 disposal/equipment unit test 회귀 0
  - 검증: `pnpm --filter backend run test --testPathPattern='(disposal|equipment.service|equipment.controller)'` 모두 PASS
- [ ] M4.2 `599e05cf` 이후 backend e2e suite 회귀 0 (시간 비용 큼 → unit test 통과로 대체 OK)

#### M5 — 다른 세션 도메인 침범 0
- [ ] M5.1 `git diff --name-only HEAD~1 HEAD~0` (commit 직후) 결과가 본 sprint 2 files + tech-debt-tracker만 포함

### 권장 (SHOULD)

- [ ] S1 fail-close error code SSOT — 새 error code를 도메인 error registry(`disposal.types.ts` 또는 shared error code)에 등록
- [ ] S2 frontend ↔ backend error code 매칭 — frontend `DisposalApprovalDialog`에서 backend의 `DISPOSAL_REJECT_COMMENT_REQUIRED` 응답을 user-friendly i18n 메시지로 변환 (별도 sprint OK)
- [ ] S3 review-architecture 검토 — defense-in-depth 의미적 완결성 + audit log 영향
- [ ] S4 commit 메시지에 "🔴 자기검토 갭 1번 closure" 명시

## 적용 verify 스킬
- `verify-zod` (이미 통과 — Step 15)
- `verify-implementation` 자동 선택

## 의사결정 로그

### D1 — error code 명명
**결정**: `DISPOSAL_REJECT_COMMENT_REQUIRED` (도메인 + 상황 + 의미). 짧은 `INVALID_INPUT` 같은 generic code 회피.
**근거**: frontend가 error code 기반 i18n 변환 시 도메인별 핸들링 가능. 운영 audit/monitoring에서도 명확.

### D2 — Zod에서 superRefine 대신 service layer 선택
**근거**: Zod superRefine으로 decision='reject' && comment 검증 가능하나, decision enum이 dto에서 통과한 후 분기 검증이라 dto 단계 복잡도 증가. service layer가 이미 reject/approve 분기를 가지고 있어 동일 위치에 fail-close 추가가 가독성 우위. 또한 service layer 검증은 도메인 invariant이라 controller 외 호출자(예: 향후 admin script)도 동일 보장.

### D3 — fallback 제거
**근거**: `'승인 단계에서 반려'` 같은 시스템 생성 fallback은 audit log 가독성 저하 + frontend bypass 시 false security. 사용자가 의도적으로 입력한 ≥10자만 audit log에 들어가도록 강제.

## Out of Scope (명시적 제외)

- RejectModal SSOT 컴포넌트 통합 (자기검토 🟡 3번 — 별도 Mode 2 sprint)
- Backend Zod 에러 메시지 i18n (자기검토 🟡 4번 — 별도 ADR)
- Tier 2 7개 도메인 페어링 (별도 sprint들)
- frontend `DisposalApprovalDialog` error code → i18n 매핑 (S2 — 별도 sprint OK)
