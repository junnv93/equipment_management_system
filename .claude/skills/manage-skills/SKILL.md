---
name: manage-skills
description: Analyzes session changes to detect missing verification skills. Dynamically discovers existing skills, creates new skills or updates existing ones, and manages CLAUDE.md skill references. Use when adding new patterns/modules that may need verification coverage, or when maintaining skill consistency. 스킬 관리, 검증 스킬 누락 탐지, CLAUDE.md 업데이트.
disable-model-invocation: false
argument-hint: '[선택사항: 특정 스킬 이름 또는 집중할 영역]'
---

# 세션 기반 스킬 유지보수

## 목적

현재 세션에서 변경된 내용을 분석하여 검증 스킬의 드리프트를 탐지하고 수정합니다:

1. **커버리지 누락** — 어떤 verify 스킬에서도 참조하지 않는 변경된 파일
2. **유효하지 않은 참조** — 삭제/이동된 파일을 참조하는 스킬
3. **누락된 검사** — 새로운 패턴/규칙
4. **오래된 값** — 더 이상 일치하지 않는 설정값/탐지 명령어

## 실행 시점

- 새로운 패턴이나 규칙을 도입한 후
- PR 전 verify 스킬 커버리지 확인
- 검증 실행 시 예상 이슈를 놓쳤을 때
- 주기적 코드베이스 정렬

> **배치 원칙 (토큰 절약):** 하나의 harness sprint가 끝난 직후 harness Step 7에서 통합 실행하는 것이 이상적이다. harness sprint마다 별도 세션으로 호출하면 각 호출이 독립적인 컨텍스트를 소비한다. sprint가 여러 개 연속될 경우 마지막 sprint 완료 후 한 번 실행으로 묶어 처리한다.

## 등록된 검증 스킬 (19개 + verify-implementation 통합 실행기)

> **편집 정책**: 각 스킬의 상세 Step 목록은 `.claude/skills/<name>/SKILL.md` 본문에서만 관리한다. drift 방지를 위해 manage-skills 테이블의 description은 **1줄 한 줄 요약**(과거 분리/흡수 이력 포함)으로 유지하고, Step별 grep 명령은 인라인 나열하지 않는다.

| #  | 스킬                    | 영역     | 한줄 설명 | 커버 파일 패턴 |
|----|-------------------------|----------|-----------|----------------|
| 1  | `verify-auth`           | backend  | 서버사이드 인증/인가 + 라우트 선언 순서 + AuditInterceptor `__auditLogged` dedup 불변성 | `apps/backend/src/**/*.controller.ts`, `*/dto/**/*.dto.ts`, `common/interceptors/audit.interceptor.ts`, `common/filters/error.filter.ts` |
| 2  | `verify-zod`            | backend  | Zod 검증 + ErrorCode SSOT + frontend mapper coverage + CAS DTO/서비스 검증 (Step 19, 2026-05-03 verify-cas 흡수). Step 24: sort-mapper default 회귀 spec 자동 등록 — 통합 11 도메인 `describe.each` + notifications/teams 별도 spec, mapper count == covered count 강제, PgDialect.sqlToQuery 패턴 (2026-05-09 three-low-tech-debt-closure r2) | `*/dto/**/*.dto.ts`, `common/pipes/*.ts`, `apps/frontend/lib/errors/*-errors.ts`, `apps/backend/src/common/__tests__/sort-mapper-defaults.spec.ts`, `apps/backend/src/modules/**/__tests__/*-sort-mapper.spec.ts` |
| 3  | `verify-ssot`           | both     | SSOT import + 임계값/상수/Record satisfies 검증 (Phase 2.2 split → 4 references: permissions-roles / domain-status-literals / threshold-numbers / record-satisfies). Step 60: SystemHealthProvider 컨트랙트 우회 검출 (2026-05-06 system-health-data-source-ssot). Step 61: EquipmentTabFooterLink SSOT — equipment 4 tab footer 인라인 className 회귀 차단 (2026-05-09 phase-c-followup-closure r3). Step 62: EQUIPMENT_STATUS_TONE exhaustive Record + TONE_TO_SEMANTIC 어댑터 StatusBadge 소비 회귀 차단 (2026-05-12 qr-visual-redesign). Step 64: packages/schemas → shared-constants production import 0건 + SCHEMA_VALIDATION_RULES 단방향 wire — 의존 그래프 최하층 invariant (2026-05-13 checkouts-sprint4-followups-sh1-sh7) | `apps/backend/src/**/*.ts`, `apps/frontend/**/*.ts(x)`, `scripts/check-*.mjs`, `package.json`, `packages/schemas/src/**/*.ts`, `packages/shared-constants/src/validation-rules.ts`, `components/equipment/EquipmentTabFooterLink.tsx`, `components/ui/StatusBadge.tsx` |
| 4  | `verify-hardcoding`     | both     | API 경로/queryKeys/매직넘버/PII/도메인 경로 하드코딩 탐지 + cache-invalidation SSOT | `apps/frontend/lib/api/**`, `apps/backend/src/**/*.service.ts`, `apps/frontend/components/**`, `lib/brand-assets/**`, `lib/analytics/**` |
| 5  | `verify-frontend-state` | frontend | TanStack Query + dynamic import + cache invalidation + CAS frontend (Step 39/40, 2026-05-03 verify-cas 흡수) (Phase 2.4 split → 3 references: tanstack-query-cas / dynamic-import-ssr / cache-invalidation). Step 41: toCsvParam SSOT — lib/api+lib/utils API 파라미터 조립 레이어 `.join(',')` 인라인 0건 + 단일 export 보장 (2026-05-08). Step 42: RejectModal `mode='domain'` 위임 패턴 — 인라인 반려 UI(`showRejectInput`) 금지 + try-catch handleRejectConfirm 패턴 (2026-05-09). Step 43: useEquipmentCalibrations dual-variant hook SSOT — `calibrationApi.getEquipmentCalibrations`/`getCalibrationHistory` 직접 호출 차단 + cache config compete 회귀 가드 (2026-05-09 phase-c-followup-closure r2). Step 46: useOptimisticMutation `undoWindowMs` 호출자는 fire-and-forget 강제 — `await mutation.mutateAsync` 차단 + dialog state owner는 mutate 직전 즉시 close (race-safe) (2026-05-12 checkouts-sprint4-followups-s1-s3-s8). Step 47: pre-upload orphan cleanup `submittedRef`+`deleteOrphan` 3-piece 패턴. Step 48: SSR-safe `useReducedMotion` — useEffect 외부 matchMedia 직접 접근 금지 (2026-05-12 qr-visual-redesign) | `apps/frontend/components/**`, `apps/frontend/hooks/**`, `apps/frontend/lib/checkouts/**`, `apps/frontend/lib/api/query-csv.ts`, `apps/frontend/lib/utils/*-filter-utils.ts`, `lib/utils/checkout-return-context.ts`, `hooks/use-undoable-state.ts`, `components/approvals/RejectModal.tsx`, `hooks/use-equipment-calibrations.ts`, `components/checkouts/EquipmentConditionForm.tsx`, `components/checkouts/ReturnInspectionForm.tsx`, `components/mobile/AutoProgressCountdown.tsx` |
| 6  | `verify-nextjs`         | frontend | Next.js 16 패턴 (await params, useActionState, React 19 deprecated 이벤트 타입) | `apps/frontend/app/**/page.tsx`, `layout.tsx`, `error.tsx`, `apps/frontend/components/**/*.tsx` |
| 7  | `verify-filters`        | frontend | URL-driven 필터 SSOT (filter-utils, hooks, page.tsx server parsing, PAGE_SIZE_OPTIONS) | `*-filter-utils.ts`, `use-*-filters.ts`, `page.tsx` |
| 8  | `verify-design-tokens`  | frontend | Design Token 3-Layer + ARIA/WCAG + motion (Phase 2.1 split → 4 references: primitives / aria-wcag / component-tokens / motion). Step 53: design-token 파일 내 `bg-brand-* text-white` 직접 조합 → `getSemanticSolidBgClasses()` SSOT 경유 필수 (2026-05-09) | `lib/design-tokens/**`, `apps/frontend/components/**`, `styles/globals.css`, `connection-banner.tsx` |
| 9  | `verify-security`       | both     | Helmet CSP + Security Headers + scope ErrorCode 403 강제 + SECURITY_AUDITABLE_CODES SSOT + enforceXxxAccess spec 뮤테이션 커버리지(Step 16, 2026-05-03) + system_error_events PII deny-list(Step 17, 2026-05-06 system-health-data-source-ssot). Step 18: common/security/* 레이어 PII deny-list + fire-and-forget + Symbol DI 토큰 + @Optional inject 패턴 일반화 (2026-05-09 three-low-tech-debt-closure). Step 21: MetricsService 보안 Counter ↔ alert.rules.yml + runbook + baseline measurement 4종 세트 정합성 — 신규 보안 counter 추가 시 alert rule 누락 차단 (2026-05-09) | `helmet-config.ts`, `next.config.js`, `**/*.controller.ts`, `**/__tests__/*.controller.spec.ts`, `lib/config/api-config.server.ts`, `common/constants/security-auditable-codes.ts`, `common/filters/error.filter.ts`, `common/system-health/contract.ts`, `common/security/**/*.ts`, `apps/backend/src/common/metrics/metrics.service.ts`, `infra/monitoring/prometheus/alert.rules.yml`, `docs/operations/prometheus-alert-rules.md` |
| 10 | `verify-i18n`           | frontend | i18n parity + ESLint shared-component domain ns rule + audit SSOT enum 동기화 + structural namespaces + ADR-0008 tErrors 3-param 주입 탐지(Step 21, 2026-05-09) + i18n-parity automation spec 존재 + SUPPORTED_LOCALES SSOT 경유(Step 22, 2026-05-12 shortcuts-context-multi-tab-i18n-parity) + spec 파일 inline type-only import babel-jest 호환(Step 23, 2026-05-12) | `apps/frontend/messages/{en,ko}/*.json`, `lib/navigation/route-metadata.ts`, `packages/schemas/src/enums/audit.ts`, `scripts/check-i18n-call-sites.mjs`, `apps/frontend/eslint.config.mjs`, `apps/frontend/lib/errors/*-errors.ts`, `apps/frontend/lib/__tests__/i18n-parity.test.ts`, `apps/frontend/**/__tests__/*.test.ts(x)` |
| 11 | `verify-sql-safety`     | backend  | SQL 안전성 (LIKE 이스케이프, N+1, COUNT(DISTINCT) fan-out, RBAC INNER JOIN) | `apps/backend/src/modules/**/*.service.ts` |
| 12 | `verify-e2e`            | e2e      | E2E 테스트 패턴 + 워크플로우 커버리지 (Step 28, 2026-05-03 verify-workflows 흡수) + bulk-action mock + EXT 분리 (Step 29, 2026-05-06 bulk-selection-tabs-integration sprint) (Phase 2.5 split → 2 references: auth-fixtures / locator-patterns + 기존 workflows-coverage 보존) | `apps/frontend/tests/e2e/**`, `apps/backend/test/**`, `apps/backend/test/helpers/test-auth.ts`, `test-fixtures.ts` |
| 13 | `verify-seed-integrity` | backend  | 시드 인프라 3자 SSOT 삼각형 정합성 (seed-data ↔ seed-test-new ↔ verification.ts) | `database/seed-data/**/*.seed.ts`, `seed-test-new.ts`, `verification.ts` |
| 14 | `verify-cache-events`   | backend  | 이벤트 기반 캐시 무효화 SSOT (registry coverage, 리스너 async, emit/emitAsync 일관성, BFF 집계 무효화 체인 — Step 6, 2026-05-09 inbound-overview-bff-extraction) | `cache-event.registry.ts`, `cache-event-listener.ts`, `cache-invalidation.helper.ts`, `cache-patterns.ts` |
| 15 | `verify-handover-qr`    | both     | QR + Handover 통합 (2026-05-03 verify-qr-ssot + verify-handover-security 통합). Section A: QR URL/설정/액션 SSOT, Section B: 직접 스캔 인수인계 (confirm_handover 라우팅, PURPOSE_BY_STATUS mirror 금지, attachment fail-close 3-layer). 2026-05-09 토큰 메커니즘 제거. Step 16: QR_ACTION_GROUP/QR_ACTION_GROUP_ORDER SSOT 인라인 그룹 분기 금지. Step 17: HandoverItem Zod schema 다중 핸드오버 SSOT (packages/schemas/qr-handover.ts). Step 18: LABEL_SIZE_PRESETS.recommendedForKey i18n parity 7 preset (2026-05-12 qr-visual-redesign) | `qr-url.ts`, `qr-config.ts`, `qr-access.ts`, `EquipmentActionSheet.tsx`, `qr-access.service.ts`, `checkouts.service.ts`, `packages/schemas/src/qr-handover.ts`, `HandoverPickerSheet.tsx` |
| 16 | `verify-checkout-fsm`   | both     | Checkout FSM SSOT 아키텍처 (Dependency Inversion, assertFsmInvariants, scope→FSM→reason→time-window→domain 5단계 fail-close) (Phase 2.3 split → 3 references: fsm-core / scope-identity / nextstep-progress-ui). Step 53: StepperHeader CONDITION_CHECK_STEP_VALUES SSOT 소비 — 인라인 4-step 배열 금지 (2026-05-12 qr-visual-redesign) | `packages/schemas/src/fsm/**`, `checkouts.service.ts`, `checkouts.controller.ts`, `checkout-api.ts`, `NextStepPanel.tsx`, `ProgressFlowSection.tsx`, `checkout-scope.util.ts`, `components/checkouts/StepperHeader.tsx` |
| 17 | `verify-routing-origin` | both     | Same-Origin Reverse-Proxy(ADR-0006) 정합 (api-routing.ts SSOT / next.config.js / nginx lan.conf+template / proxy.ts, env 절대 URL 잠입, BACKEND ∩ NEXTAUTH disjoint, SW NetworkOnly `/api/*` 룰). 2026-05-05 추가: csrf-invariants.json 무결성($schema/version/adrRef/4 키 + 양 스크립트 import — Step 12) + smoke/trace 2-script CLI 계약 일관성(`--dry-run` env-optional / live env-required — Step 13) + redaction SSOT(`redactionPatterns` JSON SSOT, raw token 0 — Step 14) | `lib/api/api-routing.ts`, `next.config.js`, `infra/nginx/**`, `apps/frontend/proxy.ts`, `scripts/onprem-verify.mjs`, `scripts/diagnostics/**` |
| 18 | `verify-click-feedback` | frontend | Click-Feedback 5-Layer (FEEDBACK_KEYS SSOT [가-힣], loading.tsx a11y, 409 retry ToastAction, motion-safe spinner, NavLink invisible overlay) | `apps/frontend/app/**/loading.tsx`, `apps/frontend/hooks/**`, `apps/frontend/components/**`, `lib/i18n/feedback-keys.ts`, `messages/{ko,en}/feedback.json` |
| 19 | `verify-bulk-action-bar` | frontend | BulkActionBar 패턴 SSOT (count chip aria-live, role=toolbar, indeterminate Radix, focus management, IME guard, 도메인 wrapper 신설 패턴 — Step 10, applyGroupToggle SSOT — Step 11; Step 3 Esc는 선택적 UX 강화로 정책 명시 — 2026-05-06 bulk-selection-tabs-integration sprint) | `apps/frontend/components/common/BulkActionBar.tsx`, `apps/frontend/components/approvals/BulkActionBar.tsx`, `apps/frontend/components/checkouts/CheckoutBulkActionBar.tsx`, `apps/frontend/lib/checkouts/group-selection.ts`, BulkActionBar 사용 컴포넌트 |

> **Phase 1+2 분리/통합 이력 (2026-05-03)**:
> - **통합** (-3 스킬): verify-cas → verify-zod Step 19 + verify-frontend-state Step 39·40 / verify-workflows → verify-e2e Step 28 / verify-qr-ssot + verify-handover-security → verify-handover-qr
> - **분리** (5 mega-skill → +16 references): verify-design-tokens (4 refs) / verify-ssot (4 refs) / verify-checkout-fsm (3 refs) / verify-frontend-state (3 refs) / verify-e2e (2 refs)
>
> **관리 메모**:
> - `docs/operations/quality-audit-routes.json` (Lighthouse/a11y 감사 대상 라우트 SSOT) — verify-e2e Step 27 + verify-hardcoding Step 34에서 검증
> - Backend controller/service pagination 기본값·최대 clamp는 `DEFAULT_PAGE_SIZE`/`MAX_PAGE_SIZE` SSOT — verify-ssot Step 59에서 검증
> - **commit pipeline tooling SSOT** (verify-implementation #23~#26, 2026-05-06~07 commit-pipeline-safety + commit-pipeline-safety-should-followups sprint + 시니어 #2/#3/#4 라운드):
>   - `scripts/verify-lint-ruleset-parity.mjs` — lintstaged ↔ lint config 3 도메인 (backend/frontend/packages) parity. `PARITY_SPEC` SSOT, `lintCiScriptName: null` 분기로 packages 우아하게 처리. pre-push `_t "parity"` step.
>   - `scripts/precommit-staged-guard.mjs` — multi-session 인덱스 흡수 race 차단 (`GUARD_CONFIG` SSOT, ADR-0007).
>   - `commitlint.config.js` `SCOPE_LIST` ↔ **3-way SSOT 정합** (filesystem `apps/backend/src/modules/*` + `BACKEND_MODULE_SCOPES` + `CLAUDE.md ### Backend Modules (N)` docs) 자동 동기화. CLAUDE.md docs cross-check는 markdown table parser 기반 (heading 카운트 + `\| \`<scope>\` \|` row 추출). `scripts/__tests__/commitlint-config.spec.mjs` 19 cases SSOT — pre-push `_t "root-spec"` step (`node --test --test-concurrency=4`) 자동 실행.
>   - `scripts/hook-timing.mjs` — opt-in (`EMS_HOOK_TIMING=1`) hook 실행 시간 추적 wrapper. default no-op. **Log rotation**: `TIMING_LOG_MAX_BYTES = 5MB` 초과 시 `.1` 단일 백업 rolling (atomic rename, race 안전). pre-commit/pre-push 모든 step `_t <label> <cmd>` 통합. 회귀 spec: `scripts/__tests__/hook-timing.spec.mjs` 9 cases (default no-op / exit code 전파 / TIMING JSON / LOG append / rotation 4).

## 자동화 스크립트 (ts-morph / 정적 분석 승격)

verify-* 스킬의 grep 기반 검사를 ts-morph 또는 Node TS 스크립트로 승격하여 pre-push hook에서 자동 실행 가능하도록 한다. grep 패턴은 false positive 위험이 있으나, AST/타입 기반 분석은 정확도와 성능 모두 우수.

| 스크립트 | 검증 대상 | 명령어 |
|---|---|---|
| `apps/frontend/scripts/verify-design-tokens.ts` | BRAND_COLORS_HEX ↔ BRAND_CLASS_MATRIX symmetric 키 동기화 + globals.css `--color-brand-*` @theme bridge + `--brand-color-*` runtime var 양측 정의 + `bg-brand-${...}` dynamic interpolation 탐지 + `transition-all` 금지 + theme-key drift (verify-design-tokens 일부 invariant 승격) | `pnpm --filter frontend verify:design-tokens` |
| `apps/backend/scripts/verify-e2e-actor-alignment.ts` | TestRole 4-place SSOT (CANONICAL_ROLE / TEST_USERS / TEST_USER_IDS / TEST_USER_DETAILS 동시 갱신) + fixture 권한 격리 + scope spec actor 정합 (verify-e2e Step 23/24/25 승격) | `pnpm --filter backend verify:e2e-actors` |

> **승격 정책**: 자동화 스크립트가 추가되면 해당 verify-* SKILL.md에 "(자동화: 스크립트 X로 승격)" 표기 권장. 승격 후에도 grep step은 회귀 탐지용으로 유지 가능.
> **pre-push 통합 권장**: `.husky/pre-push` 또는 lint-staged에 추가하여 정적 invariant 강제.

## 워크플로우

### Step 1: 세션 변경사항 분석

git diff/log로 변경 파일 수집, 디렉토리 기준 그룹화.

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 1

### Step 2: 등록된 스킬과 변경 파일 매핑

스킬 테이블의 패턴과 대조하여 파일→스킬 매핑 구축. UNCOVERED 파일 식별.

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 2

### Step 3: 영향받은 스킬의 커버리지 갭 분석

누락 파일 참조, 오래된 탐지 명령어, 새 패턴, 삭제된 파일, 변경된 값 점검.

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 3

### Step 4: CREATE vs UPDATE 결정

- 기존 스킬 도메인 관련 → UPDATE
- 3+ 관련 파일이 공통 규칙 공유 → CREATE
- 그 외 → 면제

`AskUserQuestion`으로 확인.

### Step 5: 기존 스킬 업데이트

추가/수정만 (기존 검사 제거 금지). Related Files, 탐지 명령어, 워크플로우 단계 추가.

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 5

### Step 6: 새 스킬 생성

1. 패턴 이해 → 2. 이름 확인 (`verify-` 접두사, kebab-case) → 3. SKILL.md 생성 → 4. 연관 파일 업데이트 (manage-skills, verify-implementation, CLAUDE.md)

**상세:** [references/workflow-details.md](references/workflow-details.md) Step 6

### Step 7: 검증

SKILL.md 재읽기, 마크다운 형식, 파일 참조, 탐지 명령어 드라이런, 테이블 동기화.

### Step 8: 자동화 스크립트 승격 검토 (Phase 3 패턴)

새 verify-* 스킬 생성 또는 기존 grep 검사가 false positive로 잡힐 때, ts-morph 스크립트로 승격 가능 여부 평가:

- AST 또는 type-check로 invariant 표현 가능?
- pre-push hook에서 < 5초 실행 가능?
- 승격 시 verify-* SKILL.md에 "(자동화: 스크립트 X로 승격)" 표기

승격 사례 (참조):
- verify-design-tokens 일부 invariant → `apps/frontend/scripts/verify-design-tokens.ts` (Phase 3, 2026-05-03)
- verify-e2e Step 23/24/25 → `apps/backend/scripts/verify-e2e-actor-alignment.ts` (2026-05-01)

### Step 9: 요약 보고서

분석 파일 수, 업데이트/생성 스킬, 영향없는 스킬, 미커버 변경사항, 자동화 승격 후보 출력.

## Related Files

| File | Purpose |
|------|---------|
| `.claude/skills/verify-implementation/SKILL.md` | 통합 검증 스킬 (실행 대상 목록 관리) |
| `.claude/skills/manage-skills/SKILL.md` | 이 파일 (등록된 검증 스킬 목록 관리) |
| `CLAUDE.md` | 프로젝트 지침 (Skills 섹션 관리) |
| `docs/references/skills-index.md` | 스킬 인덱스 (한줄 요약 + 스코프) |
| `apps/frontend/scripts/verify-design-tokens.ts` | ts-morph 승격 자동화 스크립트 (Phase 3, 2026-05-03) |
| `apps/backend/scripts/verify-e2e-actor-alignment.ts` | ts-morph 승격 자동화 스크립트 (verify:e2e-actors) |

## 예외사항

1. **Lock 파일 및 생성된 파일** — 스킬 커버리지 불필요
2. **일회성 설정 변경** — 버전 범프 등 새 스킬 불필요
3. **문서 파일** — 코드 패턴이 아님
4. **테스트 픽스처 파일** — 프로덕션 코드 아님
5. **영향받지 않은 스킬** — 검토 불필요
6. **CLAUDE.md 자체** — 문서 업데이트
7. **벤더/서드파티 코드** — 외부 규칙
8. **CI/CD 설정** — 인프라, 검증 스킬 불필요
