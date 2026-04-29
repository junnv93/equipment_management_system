# Contract — software-validation-system-wide-completion

## Scope

직전 세션(`software-validation-approve-comment`) backend 코드 fix만 완료한 상태에서, 시니어 표준 미달 5가지 갭(A1·A2·A3·B1·B2·C1) closure.

**관련 파일**:
- 직전 fix 대상 (이미 staged): `packages/db/src/schema/software-validations.ts`, `apps/backend/drizzle/0048_*.sql`, `apps/backend/drizzle/rollback_0048_*.sql`, `apps/backend/src/modules/software-validations/software-validations.service.ts`, `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts`, `.claude/exec-plans/tech-debt-tracker.md`
- 본 sprint 신규/수정 (Phase별 영향 범위): plan §"영향 범위" 참조

**Plan**: `.claude/exec-plans/active/2026-04-28-software-validation-system-wide-completion.md`

**도메인 결정 (사용자 사전 확정 — 본 contract 내 변경 금지)**:
- A1 — psql 직접 + journal 수동 entry (db:reset 데이터 손실 회피, db:push 우회 회피)
- B1 — qualityApprove 컬럼 분리 (`quality_approval_comment`) + DTO 분리
- B2 — 2중 배치 (verify-zod Step 14 + self-audit 8번째 룰)
- C1 — pre-push lint 추가 (backend lint:ci + frontend lint, 직렬)

---

## MUST Criteria (loop 차단)

### Phase A1 — DB 실제 적용

| #   | Criterion | Verification |
|-----|-----------|--------------|
| M1  | `software_validations.approval_comment` 컬럼이 PostgreSQL에 실제 존재 | `docker compose exec -T postgres psql -U postgres -d equipment_management -tc "SELECT column_name FROM information_schema.columns WHERE table_name='software_validations' AND column_name='approval_comment';"` 결과에 `approval_comment` 1줄 |
| M2  | `_journal.json` `entries` 마지막 항목 `tag === '0048_add_software_validation_approval_comment'` 또는 그 이후 0049 엔트리 추가됨 | `node -e "const j=require('./apps/backend/drizzle/meta/_journal.json'); const tags=j.entries.map(e=>e.tag); if(!tags.includes('0048_add_software_validation_approval_comment')) process.exit(1)"` exit 0 |
| M3  | `pnpm --filter backend exec drizzle-kit migrate` 멱등 실행 (오류 없이 통과) | command exit 0 |

### Phase A2 — Integration test

| #   | Criterion | Verification |
|-----|-----------|--------------|
| M4  | `apps/backend/test/software-validations.e2e-spec.ts` 파일 존재 + describe 블록 존재 | `test -f apps/backend/test/software-validations.e2e-spec.ts && grep -n "describe.*[Ss]oftware.*[Vv]alidation" apps/backend/test/software-validations.e2e-spec.ts` ≥ 1 hit |
| M5  | `approve` API 호출 후 응답에 `approvalComment` 값 검증 케이스 존재 | `grep -n "expect.*approvalComment" apps/backend/test/software-validations.e2e-spec.ts` ≥ 1 hit |
| M6  | DB 직접 SELECT 또는 응답에서 `approval_comment` 컬럼 검증 (mock 우회 — 실 DB 검증) | `grep -nE "approval_comment\|approvalComment.*=.*'.*'" apps/backend/test/software-validations.e2e-spec.ts` ≥ 1 hit |
| M7  | `pnpm --filter backend run test:e2e -- software-validations` 통과 (실 PostgreSQL 호출) | jest exit 0, "PASS" 1건 이상 |

### Phase A3 — Frontend UI 신설

| #   | Criterion | Verification |
|-----|-----------|--------------|
| M8  | `SoftwareValidationContent.tsx` 내 `approveDialog` 다이얼로그 렌더링 코드 존재 | `grep -nE "validation\.approveDialog\|validation\.qualityApproveDialog" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx` ≥ 2 hits |
| M9  | `softwareValidationApi.approve(id, version, approvalComment...)` 호출 패턴 (3번째 인자 전달) | `grep -nE "softwareValidationApi\.approve\([^)]*,[^)]*,[^)]*approvalComment" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx` ≥ 1 hit |
| M10 | i18n 키 ko/en parity — `validation.approveDialog.{title,commentLabel,cancel,confirm}` ko + en 양쪽 존재 | `for k in title commentLabel cancel confirm; do grep -q "\"$k\"" apps/frontend/messages/ko/software.json && grep -q "\"$k\"" apps/frontend/messages/en/software.json || exit 1; done` (loop 내 approveDialog 객체 검증) |
| M11 | `node scripts/check-i18n-call-sites.mjs --all --quiet` exit 0 | command exit 0 |
| M12 | comment max length는 SSOT (`VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` import 또는 `maxLength={500}`) — 매직넘버 단독 금지 | `grep -nE "VALIDATION_RULES\.LONG_TEXT_MAX_LENGTH\|maxLength=\{?500\}?" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx` ≥ 1 hit |

### Phase B1 — 도메인 audit (qualityApprove)

| #   | Criterion | Verification |
|-----|-----------|--------------|
| M13 | `software_validations.quality_approval_comment` 컬럼이 PostgreSQL에 실제 존재 | `docker compose exec -T postgres psql -U postgres -d equipment_management -tc "SELECT column_name FROM information_schema.columns WHERE table_name='software_validations' AND column_name='quality_approval_comment';"` 결과에 `quality_approval_comment` 1줄 |
| M14 | service `qualityApprove` 시그니처에 코멘트 파라미터 + UPDATE 필드 존재 | `grep -nE "qualityApprove\([^)]*qualityApprovalComment" apps/backend/src/modules/software-validations/software-validations.service.ts` ≥ 1 hit AND `grep -nE "qualityApprovalComment.*\|\| null" apps/backend/src/modules/software-validations/software-validations.service.ts` ≥ 1 hit |
| M15 | controller `qualityApprove` 핸들러가 dto 코멘트 필드 전달 | `grep -nE "qualityApprove\([^)]*dto\.qualityApprovalComment\|approvalComment" apps/backend/src/modules/software-validations/software-validations.controller.ts` ≥ 1 hit |
| M16 | DTO `qualityApproveValidationSchema` 또는 명시적 필드 추가 + Pipe export | `grep -nE "qualityApproveValidationSchema\|qualityApprovalComment" apps/backend/src/modules/software-validations/dto/approve-validation.dto.ts apps/backend/src/modules/software-validations/dto/index.ts` ≥ 2 hits |
| M17 | qualityApprove spec 4 케이스 (persist / undefined→null / empty→null / regression) | `grep -cE "qualityApprovalComment.*제공\|qualityApprovalComment.*undefined\|qualityApprovalComment.*빈 문자열\|기존 필드가 보존" apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` ≥ 4 |
| M18 | frontend `softwareValidationApi.qualityApprove(id, version, qualityApprovalComment?)` 시그니처 + 호출처에서 코멘트 전달 | `grep -nE "qualityApprove.*qualityApprovalComment\|qualityApprove\(id, version, qualityApprovalComment" apps/frontend/lib/api/software-api.ts` ≥ 1 hit AND `grep -nE "qualityApproveMutation\.mutate.*qualityApprovalComment" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx` ≥ 1 hit |

### Phase B2 — 정적 회귀 게이트

| #   | Criterion | Verification |
|-----|-----------|--------------|
| M19 | verify-zod Step 14 신설 (Pipe DTO ↔ service 인자 정합) | `grep -nE "Step 14:.*Pipe DTO\|Step 14:.*silent loss" .claude/skills/verify-zod/SKILL.md` ≥ 1 hit |
| M20 | self-audit 8번째 룰 `service-param-underscore-prefix` 추가 + dispatcher 등록 | `grep -nE "service-param-underscore-prefix\|checkServiceParamUnderscore" scripts/self-audit.mjs` ≥ 2 hits (룰 정의 + dispatcher 호출) |
| M21 | `node scripts/self-audit.mjs --all` 실행 시 본 sprint 코드에서 위반 0건 (직전 fix가 underscore prefix 제거함) | `node scripts/self-audit.mjs --all 2>&1 \| grep -c "service-param-underscore-prefix" \| grep -E "^0$"` |

### Phase C1 — pre-push hook lint

| #   | Criterion | Verification |
|-----|-----------|--------------|
| M22 | `.husky/pre-push`에 backend + frontend lint 스텝 추가 | `grep -nE "pnpm --filter backend run lint:ci\|pnpm --filter frontend run lint" .husky/pre-push` ≥ 2 hits |
| M23 | Lint 스텝이 tsc 다음, test 직전에 위치 (직렬 실행) | `awk '/lint:ci/{lint=NR} /test --silent/{test=NR} END{exit (lint && test && lint < test) ? 0 : 1}' .husky/pre-push` exit 0 |

### 통합 (모든 Phase 완료 후)

| #   | Criterion | Verification |
|-----|-----------|--------------|
| M24 | `pnpm tsc --noEmit` exit 0 (전체 monorepo) | tsc |
| M25 | `pnpm --filter backend run lint:ci` exit 0 | eslint |
| M26 | `pnpm --filter frontend run lint` exit 0 | eslint |
| M27 | `pnpm --filter backend run test --silent` exit 0 (unit + spec) | jest |
| M28 | `pnpm --filter frontend run test --silent` exit 0 | jest |
| M29 | `bash .husky/pre-push` exit 0 (full hook 직접 실행 — lint 포함) | hook |
| M30 | 신규 코드에 `any` 타입 0건 — `git diff HEAD -- apps packages \| grep -E "^\+.*:\s*any\b"` 실 도메인 코드 0건 (test 파일 jest mock 제외) | grep |

---

## SHOULD Criteria (tech-debt 등재 가능)

| #   | Criterion | Verification |
|-----|-----------|--------------|
| S1  | A1 0048 SQL 멱등 — `IF NOT EXISTS` 보존 (재실행 안전) | `grep -n "ADD COLUMN IF NOT EXISTS" apps/backend/drizzle/0048_*.sql apps/backend/drizzle/0049_*.sql` ≥ 2 hits |
| S2  | A2 e2e spec이 submitter !== approver 검증 (ISO/IEC 17025 §6.2.2 가드 보존 확인) | `grep -nE "submitter.*approver\|loginAs.*manager.*submit\|loginAs.*admin.*approve" apps/backend/test/software-validations.e2e-spec.ts` ≥ 1 hit |
| S3  | A3 `approveDialog` ARIA 속성 — `aria-describedby` 또는 `aria-labelledby` 명시 | `grep -nE "aria-describedby\|aria-labelledby" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx` ≥ 1 hit |
| S4  | A3 commentHelp 텍스트(ISO/IEC 17025 §6.2.2 안내)가 ko/en 양쪽 존재 | `grep -n "commentHelp" apps/frontend/messages/ko/software.json apps/frontend/messages/en/software.json` ≥ 2 hits |
| S5  | B1 0049 SQL + rollback 파일 작성 + 주석 (ISO/IEC 17025 §6.2.2 + 패턴 답습 명시) | `test -f apps/backend/drizzle/0049_*.sql && test -f apps/backend/drizzle/rollback_0049_*.sql && grep -n "ISO/IEC 17025\|17025" apps/backend/drizzle/0049_*.sql` ≥ 1 hit |
| S6  | B1 disposal/calibration-plans 패턴 답습 — `qualityApprovalComment: qualityApprovalComment \|\| null` | `grep -n "qualityApprovalComment.*\|\| null" apps/backend/src/modules/software-validations/software-validations.service.ts` ≥ 1 hit |
| S7  | B1 audit_log 의존성 무변경 — `audit.interceptor.ts` 미변경 (request.body 자동 기록 보존) | `git diff HEAD -- apps/backend/src/common/interceptors/audit.interceptor.ts` empty |
| S8  | B2 self-audit 룰에 `// allowed: <reason>` escape hatch 명시 | `grep -n "// allowed:" scripts/self-audit.mjs` ≥ 1 hit (조건 또는 주석) |
| S9  | B2 docs/references/self-audit.md 8번째 룰 항목 추가 (트레이드오프, 예외 정책 명시) | `grep -nE "service-param-underscore-prefix\|underscore prefix.*silent loss" docs/references/self-audit.md` ≥ 1 hit |
| S10 | B2 skills-index.md 갱신 (verify-zod Step 14 표기) | `grep -n "verify-zod.*Step 14\|Step 14.*Pipe DTO" docs/references/skills-index.md` ≥ 1 hit |
| S11 | C1 pre-push lint 직렬 실행 시간 < 90초 (사용자 수용 기준) — 측정 결과 문서화 | `time bash .husky/pre-push` 실측 후 plan에 기록 |
| S12 | C1 frontend lint가 staged 외 전체 코드도 검증 (lint-staged와 중복이지만 회귀 차단) | hook 동작 확인 |
| S13 | tech-debt-tracker.md `main-residual-lint-errors` 항목 ✅ 또는 후속 액션 명시 | `grep -n "main-residual-lint-errors" .claude/exec-plans/tech-debt-tracker.md` 매칭 라인이 `[x]` 또는 `✅` 또는 후속 작업 등재 |
| S14 | verify-implementation 류 verify-* 스킬 PASS — `verify-cas`, `verify-zod`, `verify-ssot`, `verify-hardcoding`, `verify-security`, `verify-i18n`, `verify-frontend-state` 7종 회귀 0건 | skill output |
| S15 | 도메인 데이터 임의 생성 금지 (메모리 교훈) — i18n 한국어 텍스트 (검토 의견/검토 의견을 입력하세요/ISO/IEC 17025 §6.2.2 안내)는 plan 명시 패턴 사용 + 사용자 검토 가능 | text 검토 |

---

## 검증 명령

```bash
set -e

echo "=== Phase A1 ==="
docker compose ps --status running postgres | grep postgres
docker compose exec -T postgres psql -U postgres -d equipment_management \
  -tc "SELECT column_name FROM information_schema.columns WHERE table_name='software_validations' AND column_name IN ('approval_comment','quality_approval_comment');"
node -e "const j=require('./apps/backend/drizzle/meta/_journal.json'); const tags=j.entries.map(e=>e.tag); ['0048_add_software_validation_approval_comment','0049_add_software_validation_quality_approval_comment'].forEach(t=>{if(!tags.includes(t)){console.error('missing:',t);process.exit(1)}}); console.log('OK')"
pnpm --filter backend exec drizzle-kit migrate

echo "=== Phase A2 ==="
test -f apps/backend/test/software-validations.e2e-spec.ts
grep -n "describe.*[Ss]oftware.*[Vv]alidation\|approvalComment persistence" apps/backend/test/software-validations.e2e-spec.ts
grep -n "expect.*approvalComment" apps/backend/test/software-validations.e2e-spec.ts
pnpm --filter backend run test:e2e -- software-validations

echo "=== Phase A3 ==="
node scripts/check-i18n-keys.mjs --changed
node scripts/check-i18n-call-sites.mjs --all --quiet
grep -n "validation.approveDialog\|validation.qualityApproveDialog" apps/frontend/messages/ko/software.json apps/frontend/messages/en/software.json
grep -n "approvalComment\|qualityApprovalComment" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx
grep -nE "VALIDATION_RULES\.LONG_TEXT_MAX_LENGTH\|maxLength=\{?500\}?" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/SoftwareValidationContent.tsx

echo "=== Phase B1 ==="
grep -n "qualityApprovalComment\|quality_approval_comment" packages/db/src/schema/software-validations.ts apps/backend/src/modules/software-validations/dto/approve-validation.dto.ts apps/backend/src/modules/software-validations/dto/index.ts apps/backend/src/modules/software-validations/software-validations.service.ts apps/backend/src/modules/software-validations/software-validations.controller.ts apps/frontend/lib/api/software-api.ts
grep -cE "qualityApprovalComment.*제공|qualityApprovalComment.*undefined|qualityApprovalComment.*빈 문자열|기존 필드가 보존" apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts

echo "=== Phase B2 ==="
grep -nE "Step 14:.*Pipe DTO|silent loss" .claude/skills/verify-zod/SKILL.md
grep -nE "service-param-underscore-prefix|checkServiceParamUnderscore" scripts/self-audit.mjs
node scripts/self-audit.mjs --all 2>&1 | grep -c "service-param-underscore-prefix" | grep -E "^0$"

echo "=== Phase C1 ==="
grep -nE "pnpm --filter backend run lint:ci|pnpm --filter frontend run lint" .husky/pre-push

echo "=== 통합 ==="
pnpm tsc --noEmit
pnpm --filter backend run lint:ci
pnpm --filter frontend run lint
pnpm --filter backend run test --silent
pnpm --filter frontend run test --silent

echo "=== Final ==="
bash .husky/pre-push  # full hook 자체 실행
```

---

## Out of Scope

- 통합 승인 페이지 (`/admin/approvals?tab=software`) — 이미 완전 구현, 무변경.
- `submit/revise/update/create/reject` 메서드 (Phase B1 매트릭스에서 OK 확인됨).
- audit_log 메타데이터 스키마 변경 (자동 기록 무변경).
- drizzle-kit `db:generate` 자동 snapshot 생성 (TTY 제약 — 사용자 후속 작업).
- 통합 승인 페이지의 `approvals-api.ts`/`ApprovalsClient.tsx` 변경 (이미 `commentRequired=true` 정확).
- 통합 승인 페이지의 qualityApprove 흐름 (현재 `commentRequired` true이지만 backend service가 코멘트 폐기 → B1 fix로 backend 정합화. 통합 승인 page UI는 변경 0).
- E2E (Playwright) 시나리오 추가 (frontend e2e는 별도 sprint).
- bundle size baseline 갱신 (frontend 코드 추가 미미 — 별도 sprint).
- pre-push hook이 60초 초과 시 lint를 staged-only 모드로 전환 (사용자 측정 후 결정).

---

## 리스크

### 1. A1 적용 실패 시 frontend 500 에러
- frontend가 이미 `approvalComment` 전송 중 (lib/api/software-api.ts:245)이라 컬럼 없으면 PostgreSQL "column does not exist" 500.
- 완화: A1을 가장 먼저 실행 + 검증. backend service에서 catch는 별도 fallback 미고려 (RDB가 SSOT).

### 2. A2 e2e가 globalSetup 시드와 결합
- `software_validations` row는 `globalSetup`에서 시드 안 됨 (test-software 시드도 없음). 본 spec이 필요한 row를 직접 INSERT 또는 fixture helper 신설 필요.
- 완화: spec 내 `beforeAll`에서 `test_software` row + `software_validations` row를 직접 INSERT (Drizzle ORM 또는 raw SQL). `afterAll`에서 cleanup.

### 3. B1 컬럼 분리 결정의 audit_log 정합성
- audit_log는 `request.body` 자동 기록 → `qualityApprovalComment` 키가 audit_log metadata에 저장됨. UI 표시 시 SSOT 하나만 사용 (DB 컬럼 priority).
- 완화: Phase B1에서 컬럼명 분리 명확 + audit_log 키도 동일 (자동).

### 4. B2 self-audit 룰 false positive
- VersionedBaseService 또는 인터페이스 호환 시그니처에서 underscore prefix 합법 케이스 발생 가능.
- 완화: `// allowed: <reason>` escape hatch + docs/references/self-audit.md에 예외 정책 명시.

### 5. C1 pre-push 시간 사용자 불만
- frontend `next lint`가 20-40초. backend lint:ci 10-20초. 합 30-60초 추가.
- 완화: 사용자 측정 후 90초 초과 시 frontend lint를 ESLint 직접 실행으로 전환.

### 6. 미커밋 직전 fix와 본 sprint 변경 합쳐 commit 시 lint-staged 다른 세션 파일 revert (메모리 교훈)
- 완화: commit 직전 `git status` + staged 파일 명시적 검토. 다른 세션 파일이 인덱스에 있으면 사용자 확인.

### 7. drizzle-kit migrate 0048/0049 동시 적용 회귀
- journal entry 추가 + IF NOT EXISTS 보장으로 멱등.
- 완화: M3 검증으로 사후 확인.

### 8. 도메인 어휘 추측 위험 (메모리 교훈)
- "검토 의견"/"기술책임자 승인" 등 i18n 텍스트 — plan에 명시한 패턴 사용. 사용자 1차 plan 검토 시 대체어 받을 수 있음.
- 완화: SHOULD S15 검증으로 사용자 검토 기회 제공.
