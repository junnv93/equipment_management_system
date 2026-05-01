# Error Codes SSOT 시스템 통합 계획

## 메타
- 생성: 2026-05-02
- 모드: Mode 2 (시스템 전반 SSOT 격상 + 도메인 다중)
- 예상 변경: 10~14 files
- 후속: `disposal-zod-defense-in-depth` → `disposal-service-fail-close` → 본 sprint (3차 closure)

## 설계 철학

**기존 `ErrorCode` enum SSOT가 있는데도 인라인 string literal 292건이 우회 중.** 이는 SSOT 패턴 부재가 아니라 **SSOT 엔포스먼트 부재**. 본 sprint는 disposal + calibration-plan 도메인을 ErrorCode enum으로 전수 격상하고, verify-* SKILL로 회귀 차단을 정착시켜 다른 도메인이 점진적으로 따라올 길을 만든다.

또한 calibration-plan service fail-close 비대칭(`> 0` vs disposal `≥ MIN`)을 closure하여 도메인 간 일관성 확보.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 새 error-codes.ts vs 기존 ErrorCode 확장 | **기존 확장** | 새 파일 = 또 단편 처리. 기존 schemas/errors.ts가 이미 정착된 SSOT |
| 도메인별 nested namespace vs flat enum | **flat enum + 카테고리 주석** | 기존 패턴 답습, TypeScript enum syntax 단순 |
| AppError 팩토리 메서드 추가 | **추가** | 도메인별 `AppError.disposalRejectCommentRequired()` 팩토리로 호출 사이트 간결 |
| Frontend mapper 위치 | **`lib/errors/disposal-errors.ts` + `calibration-plan-errors.ts`** | 기존 `equipment-errors.ts` 패턴 답습 |
| audit log 통합 | **별도 sprint** | GlobalExceptionFilter에 AuditService DI = 시스템 전반 영향. 본 sprint scope 초과 |
| verify-error-codes 신규 SKILL vs verify-zod Step 추가 | **verify-zod Step 16 추가** | 검증 영역 통합 — error code도 zod-validation 영역 |

## 다른 세션 회피 영역

- `apps/backend/test/*.e2e-spec.ts` (수정 회피, 새 spec 추가는 OK)
- `.claude/contracts/REGISTRY.md`, `.claude/skills/{manage-skills,verify-e2e}/SKILL.md`
- `apps/frontend/lib/utils/calibration-status.ts`, `next-env.d.ts`
- `.claude/exec-plans/active/2026-05-01-{inspection-template-*,senior-permission-ssot}.md`

## 구현 Phase

### Phase 2: ErrorCode enum 확장 (1 file)
**목표**: 기존 SSOT에 disposal + calibration-plan 도메인 코드 등록.
**변경 파일**: `packages/schemas/src/errors.ts`
- ErrorCode enum에 disposal 8 + calibration-plan 14 + 공통 보조 = ~22 codes 추가
- errorCodeToStatusCode 매핑 동기화 (모든 신규 code의 HTTP status)
- AppError 도메인 팩토리 메서드 추가 (선택)
- 헬퍼 export: 도메인 카테고리 grep 가능하게 주석 분리

**검증**: `pnpm tsc --noEmit` + `grep -c "DISPOSAL_REJECT_COMMENT_REQUIRED" packages/schemas/src/errors.ts` ≥ 1

### Phase 3: calibration-plan service fail-close + ErrorCode 격상 (2 files)
**목표**: disposal과 대칭 closure + SSOT 격상.
**변경 파일**:
1. `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts`
   - reject 메서드 fail-close: `> 0` → `>= REJECTION_REASON_MIN_LENGTH` 강화
   - 인라인 string literal `'CALIBRATION_PLAN_*'` → `ErrorCode.CalibrationPlan*` 격상 (14 codes)
   - VALIDATION_RULES + ErrorCode import 추가
2. `apps/backend/src/modules/calibration-plans/calibration-plans.controller.ts` (해당 시)

**검증**: `pnpm --filter backend run test --testPathPattern='calibration-plan'` PASS

### Phase 4: disposal service ErrorCode 격상 (3 files)
**목표**: disposal 도메인 인라인 string literal 전수 SSOT 격상.
**변경 파일**:
1. `apps/backend/src/modules/equipment/services/disposal.service.ts`
   - 8 codes (`DISPOSAL_REJECT_COMMENT_REQUIRED`, `DISPOSAL_REVIEWED_NOT_FOUND`, etc) → ErrorCode.X 격상
2. `apps/backend/src/modules/equipment/disposal.controller.ts` (해당 시)
3. `apps/backend/src/modules/equipment/__tests__/disposal.service.spec.ts`
   - assertion 업데이트: `expect(response.code).toBe('DISPOSAL_REJECT_COMMENT_REQUIRED')` → `expect(response.code).toBe(ErrorCode.DisposalRejectCommentRequired)`

**검증**: `pnpm --filter backend run test --testPathPattern='disposal'` PASS

### Phase 5: Frontend ErrorCode → i18n 매퍼 + 호출처 적용 (4 files)
**목표**: backend ErrorCode 응답을 user-friendly i18n으로 변환 + UX 갭 closure.
**변경 파일**:
1. `apps/frontend/lib/errors/disposal-errors.ts` (신규)
   - `mapDisposalErrorToToast(code: ErrorCode): { title, description }` SSOT
2. `apps/frontend/lib/errors/calibration-plan-errors.ts` (신규)
   - `mapCalibrationPlanErrorToToast(code: ErrorCode): { title, description }`
3. `apps/frontend/components/equipment/disposal/DisposalApprovalDialog.tsx`
   - reject error toast → mapper 사용
4. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx`
   - reject mutation error toast → mapper 사용
5. i18n 메시지 추가 — disposal/calibrationPlan namespace에 reject error 키들

**검증**: `pnpm tsc --noEmit` + 호출처 grep으로 mapper 사용 확인

### Phase 7: verify-zod Step 16 — ErrorCode SSOT 강제 + service fail-close 비대칭 차단 (1 file)
**목표**: 회귀 차단 — 새 인라인 string literal 0건 강제, 도메인 간 fail-close 강도 일관성.
**변경 파일**: `.claude/skills/verify-zod/SKILL.md`
- Step 16 추가:
  - ① 인라인 `code: '[A-Z_]+'` 패턴 grep — Whitelist(disposal+calibration-plan 외 도메인은 점진적 마이그레이션 → tech-debt 등록 인정)
  - ② disposal/calibration-plan 도메인은 `ErrorCode.` prefix 강제 (전수 마이그레이션 PASS 후)
  - ③ service layer fail-close 비대칭 grep: 같은 검증 의미인데 도메인별 강도 다른 케이스 탐지

**검증**: `grep -n "### Step 16" .claude/skills/verify-zod/SKILL.md` ≥ 1

### Phase 8: 자체검증
- `pnpm tsc --noEmit` 0 errors
- `pnpm --filter backend run test --testPathPattern='(disposal|calibration-plan|equipment)'` PASS
- frontend 변경 영역 lint 0
- 시스템 audit grep: disposal + calibration-plan 인라인 `code: '[A-Z_]+'` 0건

### Phase 9: Evaluator (sonnet)
- 자기검토 갭 5(calibration 비대칭)/갭 6(ErrorCode SSOT)/갭 8(frontend mapper) 모두 closure 검증
- 갭 7(audit log)/갭 9(e2e)는 명시적 후속화 인정

### Phase 10: tech-debt-tracker + commit + push
- 자기검토 갭 5/6/8 closure
- 갭 7(audit log) 별도 sprint 등록 — `audit-log-fail-close-integration`
- 갭 9(e2e 통합 spec) tech-debt 등록 (다른 세션 도메인이라 회피)
- 다른 도메인 (equipment/checkout/NC/calibration/etc) ErrorCode 마이그레이션 sprint 등록

## 전체 변경 파일 요약

### 신규 생성 (3)
| 파일 | 목적 |
|------|------|
| `apps/frontend/lib/errors/disposal-errors.ts` | ErrorCode → toast SSOT |
| `apps/frontend/lib/errors/calibration-plan-errors.ts` | ErrorCode → toast SSOT |
| `.claude/exec-plans/active/2026-05-02-error-codes-ssot-system-wide.md` | (this file) |

### 수정 (8)
| 파일 | 변경 의도 |
|------|----------|
| `packages/schemas/src/errors.ts` | ErrorCode enum + statusCode 매핑 ~22 codes 추가 |
| `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` | fail-close ≥MIN 격상 + ErrorCode 격상 |
| `apps/backend/src/modules/equipment/services/disposal.service.ts` | ErrorCode 격상 |
| `apps/backend/src/modules/equipment/__tests__/disposal.service.spec.ts` | assertion ErrorCode 매칭 |
| `apps/frontend/components/equipment/disposal/DisposalApprovalDialog.tsx` | reject error toast → mapper |
| `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx` | reject error toast → mapper |
| `apps/frontend/messages/{ko,en}/disposal.json` 또는 도메인 i18n | error 메시지 키 추가 |
| `.claude/skills/verify-zod/SKILL.md` | Step 16 신설 |

## 의사결정 로그

### D1 — 도메인 ErrorCode flat naming
**결정**: `DisposalRejectCommentRequired`, `CalibrationPlanRejectionReasonRequired` 같은 PascalCase + 도메인 prefix.
**근거**: 기존 enum (`CheckoutAlreadyApproved`, `NonConformanceNotOpen`) 패턴 일관성.

### D2 — Frontend mapper 위치
**결정**: 도메인별 분리 (`disposal-errors.ts`, `calibration-plan-errors.ts`).
**근거**: 기존 `equipment-errors.ts` 패턴 답습 + 도메인별 toast 메시지가 다름.

### D3 — i18n 메시지 추가 위치
**결정**: 기존 `disposal.json` / `calibration.json` namespace에 `errors.{code}` sub-namespace 추가.
**근거**: 도메인 i18n 응집성. 새 namespace 신설 회피.

### D4 — audit log 통합 분리
**결정**: 본 sprint scope 외, tech-debt 등록.
**근거**: GlobalExceptionFilter에 AuditService DI = 시스템 전반 영향. 비동기 처리 + audit log 보존 정책 + role/userId 추출 등 별도 분석 필요.

### D5 — verify-zod Step 16 vs 신규 SKILL
**결정**: 기존 verify-zod 확장.
**근거**: 검증 영역 통합. 새 SKILL = 분산. zod 검증과 ErrorCode SSOT는 같은 input validation 영역.

## Out of Scope

- audit log 통합 (GlobalExceptionFilter ↔ AuditService) — 별도 sprint
- 다른 도메인(equipment/checkout/NC/calibration/etc) ErrorCode 마이그레이션 — 점진적 sprint들
- e2e 통합 spec (controller → service → response HTTP path) — 다른 세션 도메인 회피
- Tier 2 RejectModal 통합 — 별도 Mode 2 sprint
- backend Zod 에러 메시지 i18n ADR — 별도 결정 sprint
