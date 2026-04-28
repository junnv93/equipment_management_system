# Evaluation Report — software-validation-approve-comment

## Iteration: 1
## Date: 2026-04-28

## Build Verification
- tsc: PASS (exit 0, no output)
- build: PASS (exit 0, `nest build` succeeded)
- test (software-validations): 38 passed / 38 total (2 suites: software-validations.service.spec + software-validation-renderer.service.spec)
- lint: PASS (exit 0, `eslint "{src,apps,libs,test}/**/*.ts" --fix` clean)

---

## MUST Criteria (Loop-blocking)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | `pnpm --filter backend exec tsc --noEmit` exit 0 | PASS | exit 0, no error output |
| M2 | `pnpm --filter backend run build` exit 0 | PASS | exit 0, `nest build` clean |
| M3 | `pnpm --filter backend test software-validations` exit 0 (기존 + 신규 모두 PASS) | PASS | 38 passed, 0 failed |
| M4 | DB schema에 `approval_comment` 컬럼 존재 | PASS | `packages/db/src/schema/software-validations.ts:74: approvalComment: text('approval_comment')` — 2 hits |
| M5 | Migration 파일 신설 — 파일 존재 + ALTER TABLE + ADD COLUMN IF NOT EXISTS | PASS | 파일 존재 확인; `apps/backend/drizzle/0048_add_software_validation_approval_comment.sql:14` — `ADD COLUMN IF NOT EXISTS "approval_comment" text;` 포함 |
| M6 | Service `approve()`에서 underscore prefix 제거 — `_approvalComment` = 0 hits | PASS | `grep -c "_approvalComment"` = 0 |
| M7 | Service `approve()` 본문에서 approvalComment 사용 ≥ 2 hits | PASS | 2 hits: line 388 (파라미터 선언), line 410 (UPDATE 필드 assign) |
| M8 | UPDATE persist 검증 spec — `expect(updateChain.set).toHaveBeenCalledWith(expect.objectContaining({approvalComment: ...}))` ≥ 3건 | PASS | 4건 확인: line 269 (`'검토 완료...'`), 290 (`null`), 311 (`null`), 335 (regression guard — `'코멘트'`) |
| M9 | 기존 `approve()` 동작 보존 spec — `technicalApproverId.*approver-uuid` ≥ 1 hit | PASS | 2 hits: line 335 (`'approver-uuid-1'`), line 348 (`'tech-approver-uuid'`) |
| M10 | server-side userId extraction 보존 — `extractUserId(req)` ≥ 1 hit in controller | PASS | 5 hits (line 63, 157, 174, 191, 208) — 변경 없이 보존 |
| M11 | CAS 보존 — `updateWithVersion` in approve() ≥ 1 hit | PASS | line 402: `const updated = await this.updateWithVersion<SoftwareValidation>(` — approve() 메서드 내 정확히 위치 |
| M12 | TODO silent loss 주석 제거 — `tech-debt 2026-04-28.*silent loss` = 0 hits in service.ts | PASS | grep 결과 없음 (exit code 1 = 0 matches) |
| M13 | tech-debt-tracker.md 항목 ✅ 처리 | PASS | line 185: `- [x] ... ✅ 2026-04-28 완료 (harness Mode 2 — software-validation-approve-comment)` |
| M14 | DTO/Controller/Audit interceptor 무변경 — `git diff HEAD --` empty | PASS | `git diff HEAD -- dto/approve-validation.dto.ts controller.ts audit.interceptor.ts` = empty (exit 0) |
| M15 | 신규 코드에 `any` 타입 0건 | PASS | `git diff HEAD -- schema + software-validations \| grep -E "^\+.*:\s*any\b"` = 0 hits (exit 1 = no matches) |

**모든 MUST 기준 PASS (15/15)**

---

## SHOULD Criteria (Tech-debt 등재 가능)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| S1 | Phase 4 신규 spec 4 케이스 모두 존재 — `grep -cE` 패턴 ≥ 4 | PASS | count = 4 (정확히 4 패턴 모두 매칭) |
| S2 | Audit action SSOT 준수 — controller `@AuditLog({ action: 'approve' })` 변경 없음, 신규 하드코딩 0건 | PASS | `git diff HEAD -- controller.ts` = empty; 서비스 diff에서 audit/AUDIT_ACTION 하드코딩 패턴 0 hits |
| S3 | Approval comment max length SSOT 준수 — DTO `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` 변경 없음 | PASS | `git diff HEAD -- dto/` = empty (exit 0) |
| S4 | Migration 파일 네이밍 — `^0048_[a-z_]+\.sql$` 패턴, 이전 0047+1 | PASS | `0048_add_software_validation_approval_comment.sql` — regex 검증 PASS |
| S5 | drizzle journal/snapshot 갱신 — `_journal.json` 마지막 항목 0048 tag, `0048_snapshot.json` 존재 | FAIL | journal 마지막 항목 = `"0047_add_rejection_presets"` (0048 미등재); `meta/0048_snapshot.json` 파일 없음. 계약서 리스크 섹션에 TTY 제약으로 hand-written SQL 1차 진행 명시 — SHOULD임을 인지한 의도적 skip |
| S6 | 패턴 일관성 — `approvalComment.*\|\| null` ≥ 1 hit | PASS | line 410: `approvalComment: approvalComment \|\| null,` — 정확히 1 hits (approve() 내에만 위치) |
| S7 | Rollback SQL 작성 — 파일 존재, `DROP COLUMN IF EXISTS "approval_comment"` 포함 | PASS | 파일 존재; line 9: `DROP COLUMN IF EXISTS "approval_comment";` 포함 |
| S8 | Migration 주석 — ISO/IEC 17025 §6.2.2 + 도메인 결정 + disposal/calibration-plans 패턴 참조 | PASS | line 2: `ISO/IEC 17025 §6.2.2`; line 6: `이중 안전망`; line 9: `disposal_requests.approval_comment, calibration_plans.review_comment 동일 SSOT` |
| S9 | verify-* 스킬 5종 회귀 0건 | PASS | verify-cas: updateWithVersion line 402 확인; verify-zod: DTO diff empty; verify-ssot: disposal_requests.approval_comment + calibration_plans.review_comment 동일 패턴 답습; verify-hardcoding: 신규 하드코딩 0건; verify-security: extractUserId(req) 5 hits 보존 |
| S10 | tech-debt-tracker.md에 underscore prefix 정적 검증 부재 항목 등재 | PASS | line 186: `- [ ] ... 🟢 LOW service-param-underscore-prefix-static-check` — 등재 확인 |

**SHOULD: 9/10 PASS, 1 FAIL (S5 — 의도적 TTY 제약)**

---

## Architectural Sanity Checks

| # | Check | Result | Notes |
|---|-------|--------|-------|
| A | Drizzle type inference — `approvalComment?: string \| null` 포함 여부 | PASS | `tsc --noEmit` PASS + spec에서 `MOCK_VALIDATION.approvalComment: null` 존재 → `$inferSelect` 인식 확인 |
| B | Audit interceptor sensitiveFields에 `comment` 미포함 (approvalComment redact 금지) | PASS | sensitiveFields = `['password', 'token', 'accesstoken', 'refreshtoken', 'secret', 'apikey', 'privatekey']` — `comment` 없음. approvalComment는 audit_logs에 정상 기록됨 |
| C | Cache invalidation 적절성 — `approve()` 완료 후 `this.invalidateCache(id, existing.testSoftwareId)` 호출 | PASS | line 417: `this.invalidateCache(id, existing.testSoftwareId)` — detail 쿼리가 approvalComment 포함 반환하므로 캐시 무효화 충분 |
| D | qualityApprove() comment gap — `quality-approve-comment-policy` tech-debt 등재 | PASS | line 188: `- [ ] ... 🟢 LOW quality-approve-comment-policy` — 등재 확인 |
| E | Migration 순서 — 0048이 0047 다음으로 정렬 | PARTIAL PASS | SQL 파일은 `0047` 다음 `0048` 존재. 그러나 **`_journal.json` 미갱신** (S5 FAIL과 동일 원인): Drizzle은 journal 기반으로 마이그레이션 추적하므로 `db:migrate` 실행 시 0048이 인식되지 않을 위험. TTY 환경에서 `db:generate` 또는 `db:push` 실행 전까지 불완전한 상태 |
| F | Frontend `approvalComment` 전송 여부 | INFO | `apps/frontend/lib/api/software-api.ts:245`: `.patch(API_ENDPOINTS.SOFTWARE_VALIDATIONS.APPROVE(id), { version, approvalComment })` — 프론트엔드가 이미 approvalComment를 요청 body에 포함해 전송 중. UI 입력 컴포넌트가 없어도 API 레벨에서 이미 전달 가능 |
| G | 기존 approve() 호출 (no comment) spec 케이스 — 여전히 PASS | PASS | jest 38/38 PASS. 기존 케이스(line 212: `service.approve('val-uuid-1', 1, 'approver-uuid-1')`)가 approvalComment 없이 호출 — `undefined || null` = null persist로 정상 동작 |
| H | `approvalComment \|\| null` falsy 처리 — approve() 내 정확히 1 occurrence | PASS | `grep -n "approvalComment.*\|\| null"` = line 410 단 1건. 다른 메서드에서 오염 없음 |

---

## Verdict
- **All MUST PASS**: YES (15/15)
- **SHOULD failures (count)**: 1 (S5 — Drizzle journal/snapshot 미갱신, 계약서에 TTY 제약으로 의도적 SHOULD 격하 명시됨)
- **Loop continuation needed**: NO

---

## Issues Found

### [S5 FAIL] Drizzle journal/snapshot 미갱신 — 의도적이지만 실운영 위험

- **파일**: `apps/backend/drizzle/meta/_journal.json`, `apps/backend/drizzle/meta/0048_snapshot.json`
- **심각도**: SHOULD (loop 차단 아님), 실운영 위험 존재
- **현상**: `_journal.json` 마지막 항목 = `"0047_add_rejection_presets"`. `0048_snapshot.json` 없음.
- **위험**: Drizzle `db:migrate`는 journal 기반으로 적용 여부를 판단. journal에 0048 없으면 SQL 파일이 존재해도 `db:migrate`가 해당 마이그레이션을 **자동 적용하지 않음** (경고: 파일은 있지만 journal에 없는 SQL은 unmanaged 상태).
- **수리 지시**: 사용자 TTY 환경에서 `pnpm --filter backend run db:generate` 실행 → 자동으로 journal + snapshot 갱신. 또는 journal에 수동으로 0048 entry 추가 후 `db:migrate`.

### [A5 PARTIAL] Migration SQL 파일 미커밋

- **파일**: `apps/backend/drizzle/0048_add_software_validation_approval_comment.sql`, `apps/backend/drizzle/rollback_0048_software_validation_approval_comment.sql`
- **심각도**: INFO (계약서 MUST 기준에 "커밋 필수" 없음)
- **현상**: `git status` = `??` (untracked). 서비스/스펙/스키마 변경도 working tree에만 존재 (unstaged modified).
- **참고**: 계약서 M5/S7은 "파일 존재 + 내용 검증"만 요구하며 커밋을 강제하지 않음. 그러나 실제 배포 전 커밋이 필요.

---

## Recommendations

1. **즉시 필요**: `pnpm --filter backend run db:generate` 실행 → journal/snapshot 갱신 후 `db:migrate` 적용. 이 없이는 DB에 `approval_comment` 컬럼이 추가되지 않아 실운영에서 `approve()` 호출 시 Drizzle이 해당 필드를 unknown으로 처리할 수 있음.

2. **커밋 필요**: 아래 파일 일괄 커밋:
   - `packages/db/src/schema/software-validations.ts`
   - `apps/backend/src/modules/software-validations/software-validations.service.ts`
   - `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts`
   - `apps/backend/drizzle/0048_add_software_validation_approval_comment.sql`
   - `apps/backend/drizzle/rollback_0048_software_validation_approval_comment.sql`
   - `.claude/exec-plans/tech-debt-tracker.md`
   - (journal/snapshot — db:generate 실행 후 포함)

3. **Frontend UI**: `apps/frontend/lib/api/software-api.ts:245`가 이미 `approvalComment` 전송 중. 그러나 UI 입력 컴포넌트(ApprovalCommentField)는 별도 frontend sprint 필요 — 현재 사용자가 approvalComment 값을 입력할 수 없음.

4. **qualityApprove() 후속**: tech-debt line 188 (`quality-approve-comment-policy`) 등재됨 — 동일 ISO/IEC 17025 §6.2.2 관점에서 이중 승인 trail 일관성을 위해 우선순위 검토 권장.
