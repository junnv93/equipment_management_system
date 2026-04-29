# Contract: sv-system-wide-completion

> exec-plan: `.claude/exec-plans/active/2026-04-28-software-validation-system-wide-completion.md`
> slug: `sv-system-wide-completion`
> created: 2026-04-30

## Scope

Software Validation 시스템 전반 완성 — 5 갭 closure.
- **A1**: DB approval_comment + quality_approval_comment 컬럼 실 적용 + journal 등록
- **A2**: e2e integration spec (실 PostgreSQL) 신설
- **A3**: 도메인 직접 페이지 approveDialog + qualityApproveDialog UI 신설
- **B1**: qualityApprove silent loss closure (DTO 분리 + 컬럼 + service 시그니처)
- **B2**: 정적 회귀 게이트 (verify-zod Step 14 + self-audit 8번째 룰)
- **C1**: pre-push hook lint 추가

---

## MUST Criteria (PASS/FAIL — loop trigger on FAIL)

### A1 — DB 실 적용
- [ ] M-A1.1: `approval_comment` 컬럼이 실 DB에 존재
- [ ] M-A1.2: `quality_approval_comment` 컬럼이 실 DB에 존재
- [ ] M-A1.3: `_journal.json` 에 0048, 0049 entry 모두 등재
- [ ] M-A1.4: DB schema 파일(`packages/db/src/schema/software-validations.ts`)에 두 필드 선언

### A2 — Integration test
- [ ] M-A2.1: `apps/backend/test/software-validations.e2e-spec.ts` 파일 존재
- [ ] M-A2.2: spec에 실 DB SELECT 검증 패턴 포함 (`db.select` 또는 `db.query` 직접 호출)
- [ ] M-A2.3: `pnpm --filter backend run test:e2e -- software-validations` PASS

### A3 — Frontend UI
- [ ] M-A3.1: `SoftwareValidationContent.tsx`에 `approveDialog` + `qualityApproveDialog` UI 존재
- [ ] M-A3.2: i18n ko/en 양쪽에 `validation.approveDialog.*` + `validation.qualityApproveDialog.*` 키 존재
- [ ] M-A3.3: API 호출 시 `approvalComment` / `qualityApprovalComment` 전달 (코멘트 미소실)
- [ ] M-A3.4: `pnpm --filter frontend run tsc --noEmit` PASS (타입 오류 0)

### B1 — qualityApprove closure
- [ ] M-B1.1: `qualityApproveValidationSchema` / `QualityApproveValidationPipe` DTO 분리
- [ ] M-B1.2: service `qualityApprove` 시그니처에 `qualityApprovalComment?: string` 파라미터 존재
- [ ] M-B1.3: controller `qualityApprove`가 `QualityApproveValidationPipe` 사용 + `dto.qualityApprovalComment` 전달
- [ ] M-B1.4: service spec에 qualityApprove 4 케이스 (persist/undefined→null/empty→null/regression guard)
- [ ] M-B1.5: `pnpm --filter backend run test --silent` PASS

### B2 — 정적 회귀 게이트
- [ ] M-B2.1: `verify-zod/SKILL.md` Step 14 존재 (silent loss underscore prefix 탐지)
- [ ] M-B2.2: `scripts/self-audit.mjs`에 `checkServiceParamUnderscore` 함수 + dispatcher 등록
- [ ] M-B2.3: `node scripts/self-audit.mjs --all` 실행 시 `service-param-underscore-prefix` 0건

### C1 — pre-push lint
- [ ] M-C1.1: `.husky/pre-push`에 `pnpm --filter backend run lint:ci` 존재
- [ ] M-C1.2: `.husky/pre-push`에 `pnpm --filter frontend run lint` 존재

### 통합 검증
- [ ] M-INT.1: `pnpm tsc --noEmit` PASS (전체)
- [ ] M-INT.2: `pnpm --filter backend run test --silent` PASS
- [ ] M-INT.3: `pnpm --filter frontend run test --silent` PASS

---

## SHOULD Criteria (기록만 — loop 차단 없음)

- [ ] S-1: frontend playwright e2e 브라우저 검증 (approveDialog 렌더링 + 코멘트 입력 흐름)
- [ ] S-2: `docs/references/self-audit.md`에 8번째 룰 항목 문서화
- [ ] S-3: `docs/references/skills-index.md`에 verify-zod Step 14 표기
- [ ] S-4: `sv-approval-comment-ui.md` 기존 contract 완료 처리

---

## Success Definition

모든 MUST 기준 PASS + 실 e2e 테스트 GREEN = sprint 완료.
