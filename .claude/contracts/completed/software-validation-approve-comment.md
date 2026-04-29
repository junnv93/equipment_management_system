# Contract — software-validation-approve-comment

## Scope

`apps/backend/src/modules/software-validations/software-validations.service.ts:approve()` 메서드의 silent loss 진짜 fix (이전 commit `f981e0e9`는 lint 통과 위한 underscore prefix 임시방편). DB 컬럼 신설 + service persist + spec 보강.

도메인 결정 (사용자 확정): **(c) 컬럼 + audit_logs metadata 이중 안전망**.
audit_logs 측은 기존 audit interceptor (`apps/backend/src/common/interceptors/audit.interceptor.ts:287-291`)가 이미 `request.body`를 자동 기록 중 → 변경 없음.

관련 파일:
- `packages/db/src/schema/software-validations.ts` (수정 — 컬럼 1개 추가)
- `apps/backend/drizzle/0048_add_software_validation_approval_comment.sql` (신규)
- `apps/backend/drizzle/meta/_journal.json` + `0048_snapshot.json` (drizzle-kit 생성)
- `apps/backend/src/modules/software-validations/software-validations.service.ts` (수정 — approve 1메서드)
- `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` (수정 — 4 케이스 추가)
- `.claude/exec-plans/tech-debt-tracker.md` (✅ resolved 처리)
- `apps/backend/drizzle/rollback_0048_software_validation_approval_comment.sql` (신규)

## MUST Criteria (loop 차단)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter backend exec tsc --noEmit` exit 0 | tsc |
| M2 | `pnpm --filter backend run build` exit 0 | build |
| M3 | `pnpm --filter backend test software-validations` exit 0 (기존 + 신규 모두 PASS) | jest |
| M4 | DB schema에 `approval_comment` 컬럼 존재 — `grep -n "approval_comment\|approvalComment" packages/db/src/schema/software-validations.ts` ≥ 1 hit | grep |
| M5 | Migration 파일 신설 — `ls apps/backend/drizzle/0048_add_software_validation_approval_comment.sql` 존재 + 내용에 `ALTER TABLE "software_validations"` AND `ADD COLUMN IF NOT EXISTS "approval_comment" text` 모두 포함 | ls + grep |
| M6 | Service `approve()` 시그니처에서 underscore prefix 제거 — `grep -n "_approvalComment" apps/backend/src/modules/software-validations/software-validations.service.ts` = 0 hits | grep |
| M7 | Service `approve()` 본문에서 approvalComment 사용 — `grep -n "approvalComment" apps/backend/src/modules/software-validations/software-validations.service.ts` ≥ 2 hits (파라미터 + UPDATE 필드) | grep |
| M8 | UPDATE persist 동작 검증 — spec에 `expect(updateChain.set).toHaveBeenCalledWith(expect.objectContaining({ approvalComment: ... }))` 패턴 ≥ 3건 | grep spec |
| M9 | 기존 `approve()` 동작(status / technicalApproverId / technicalApprovedAt) 보존 spec — `grep -n "technicalApproverId.*approver-uuid" apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` ≥ 1 hit | grep |
| M10 | server-side userId extraction 보존 — `grep -n "extractUserId(req)" apps/backend/src/modules/software-validations/software-validations.controller.ts` ≥ 1 hit (변경 없이 보존) | grep |
| M11 | CAS 보존 — `grep -n "updateWithVersion" apps/backend/src/modules/software-validations/software-validations.service.ts` 의 approve() 메서드 내 호출 ≥ 1 hit (제거 금지) | grep |
| M12 | TODO silent loss 주석 제거 — `grep -n "tech-debt 2026-04-28.*silent loss" apps/backend/src/modules/software-validations/software-validations.service.ts` = 0 hits | grep |
| M13 | tech-debt-tracker.md 항목 ✅ 처리 — `grep -n "software-validation-approve-comment-silent-loss" .claude/exec-plans/tech-debt-tracker.md` 매칭 라인이 `[x]` 또는 `✅` 마커 포함 | grep |
| M14 | DTO/Controller/Audit interceptor 무변경 — `git diff HEAD -- apps/backend/src/modules/software-validations/dto/approve-validation.dto.ts apps/backend/src/modules/software-validations/software-validations.controller.ts apps/backend/src/common/interceptors/audit.interceptor.ts` = empty | git diff |
| M15 | 신규 코드에 `any` 타입 0건 — `git diff HEAD -- packages/db/src/schema/software-validations.ts apps/backend/src/modules/software-validations \| grep -E "^\+.*:\s*any\b"` = 0 hits | grep |

## SHOULD Criteria (tech-debt 등재 가능)

| # | Criterion | Verification |
|---|-----------|-------------|
| S1 | Phase 4 신규 spec 4 케이스 모두 존재 — `grep -cE "approvalComment.*제공|approvalComment.*undefined|approvalComment.*빈 문자열|기존 필드가 보존" apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` ≥ 4 | grep |
| S2 | Audit action SSOT 준수 — controller `@AuditLog({ action: 'approve' })` 변경 없음, 하드코딩 `'software_validation.approved'` 같은 신규 문자열 0건 | git diff |
| S3 | Approval comment max length SSOT 준수 — DTO `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` 그대로 사용 (변경 없음) | git diff |
| S4 | Migration 파일 네이밍 — `^0048_[a-z_]+\.sql$` 패턴, drizzle 컨벤션 (snake_case + 이전 `0047`+1) | regex |
| S5 | drizzle journal/snapshot 갱신 — `apps/backend/drizzle/meta/_journal.json` 의 `entries` 배열 마지막 항목 `tag` == `0048_add_software_validation_approval_comment`, `apps/backend/drizzle/meta/0048_snapshot.json` 존재 (TTY 환경에서 db:generate 실행 후) | jq + ls |
| S6 | 패턴 일관성 — `disposal.service.ts:352` 의 `approvalComment: approveDto.comment \|\| null` 패턴을 답습 (`grep -n "approvalComment.*\|\| null" apps/backend/src/modules/software-validations/software-validations.service.ts` ≥ 1 hit) | grep |
| S7 | Rollback SQL 작성 — `apps/backend/drizzle/rollback_0048_software_validation_approval_comment.sql` 존재, `DROP COLUMN IF EXISTS "approval_comment"` 포함 | ls + grep |
| S8 | Migration 주석 — SQL 파일 상단에 ISO/IEC 17025 §6.2.2 + 도메인 결정 (이중 안전망) + disposal/calibration-plans 패턴 참조 주석 존재 | grep |
| S9 | verify-implementation 류 verify-* 스킬 PASS — `verify-cas`, `verify-zod`, `verify-ssot`, `verify-hardcoding`, `verify-security` 5종 회귀 0건 | skill output |
| S10 | tech-debt-tracker.md에 회귀 후속 항목 추가 — "Service 메서드 파라미터 underscore prefix 패턴 정적 검증 부재" (LOW) 등재 | grep |

## 검증 명령

```bash
# M1, M2 — 컴파일/빌드
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend run build

# M3, S1 — 테스트
pnpm --filter backend test software-validations

# M4, M5 — 스키마/마이그레이션
grep -n "approval_comment\|approvalComment" packages/db/src/schema/software-validations.ts
ls apps/backend/drizzle/0048_add_software_validation_approval_comment.sql
grep -n 'ADD COLUMN IF NOT EXISTS "approval_comment" text' apps/backend/drizzle/0048_add_software_validation_approval_comment.sql

# M6, M7, M11, M12 — service fix
grep -n "_approvalComment" apps/backend/src/modules/software-validations/software-validations.service.ts  # = 0
grep -n "approvalComment" apps/backend/src/modules/software-validations/software-validations.service.ts  # ≥ 2
grep -n "updateWithVersion" apps/backend/src/modules/software-validations/software-validations.service.ts
grep -n "tech-debt 2026-04-28.*silent loss" apps/backend/src/modules/software-validations/software-validations.service.ts  # = 0

# M8, M9, S6 — spec 검증
grep -n "expect(updateChain.set).toHaveBeenCalledWith" apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts
grep -n "approvalComment.*|| null" apps/backend/src/modules/software-validations/software-validations.service.ts

# M10 — security 회귀 (controller 무변경)
grep -n "extractUserId(req)" apps/backend/src/modules/software-validations/software-validations.controller.ts

# M13 — tech-debt 처리
grep -n "software-validation-approve-comment-silent-loss" .claude/exec-plans/tech-debt-tracker.md

# M14 — 비변경 영역 검증
git diff HEAD -- apps/backend/src/modules/software-validations/dto/approve-validation.dto.ts
git diff HEAD -- apps/backend/src/modules/software-validations/software-validations.controller.ts
git diff HEAD -- apps/backend/src/common/interceptors/audit.interceptor.ts

# M15 — any 타입 0건
git diff HEAD -- packages/db/src/schema/software-validations.ts apps/backend/src/modules/software-validations | grep -E "^\+.*:\s*any\b"

# S5 — drizzle journal (TTY 환경에서 db:generate 후)
ls apps/backend/drizzle/meta/0048_snapshot.json
jq '.entries[-1].tag' apps/backend/drizzle/meta/_journal.json  # "0048_add_software_validation_approval_comment"

# S7 — rollback
ls apps/backend/drizzle/rollback_0048_software_validation_approval_comment.sql
grep -n 'DROP COLUMN IF EXISTS "approval_comment"' apps/backend/drizzle/rollback_0048_software_validation_approval_comment.sql

# S9 — verify-* 스킬 (Evaluator)
# /verify-cas software-validations
# /verify-zod software-validations
# /verify-ssot software-validations
# /verify-hardcoding software-validations
# /verify-security software-validations
```

## Out of Scope

- `qualityApprove()` 메서드의 코멘트 영속화 — DTO에 `approvalComment` 필드는 받지만 service 시그니처에 코멘트 파라미터 자체가 없음. 별도 도메인 결정 필요 시 후속 sprint
- DTO / Controller / Audit interceptor 변경 — 이미 정상 동작
- Frontend ApprovalCommentField 입력 컴포넌트 — 별도 frontend 작업
- ESLint 룰 신설 (Phase 5 trade-off에서 채택 안 함, tech-debt 등재로 위임)
- `qualityApprove() / reject() / submit() / revise()` 등 다른 워크플로우 메서드 — 본 fix 범위 외

## 리스크

| 리스크 | 완화 |
|--------|------|
| `db:generate` non-TTY 환경에서 실패 | hand-written SQL을 1차로 진행. journal/snapshot은 사용자 TTY 환경에서 별도 단계로 분리. S5는 SHOULD로 격하해 loop 차단하지 않음 |
| Drizzle 타입 추론이 신규 컬럼 미인식 → spec 컴파일 실패 | M2 build 게이트가 사전 차단. schema 파일 먼저 변경 후 service 변경 순서 |
| spec mock 시그니처 변경으로 기존 테스트 회귀 | mockUpdateChain.set이 jest.fn으로 노출되어 `expect.objectContaining` 사용 가능 (line 79-86 검증 완료) |
| audit interceptor의 sanitize 로직이 `approvalComment`를 sensitive field로 오판 | 인터셉터 sensitiveFields 목록(`password / token / secret / apikey / privatekey`)에 `comment` 미포함 — 안전. 회귀 방지: 기존 audit.interceptor.spec PASS 유지 |
| 컬럼 추가 후 다른 코드 경로(예: form export, list view)에서 `SoftwareValidation.approvalComment` 사용 시 undefined 처리 누락 | nullable이라 TS는 `string | null` 추론 — 사용처에서 null guard 필수. 본 fix 범위는 `approve()` persist만, 표시 측은 후속 |
| Frontend가 `approvalComment` 입력 UI를 아직 안 가진 경우 — fix해도 사용자가 코멘트 전송 못 함 | controller에서 이미 받고 있다는 사실이 어떤 클라이언트가 전송 중임을 시사. UI 미구현 시 별도 frontend plan으로 분리 |
