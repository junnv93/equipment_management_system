---
name: verify-implementation
description: Runs all verify-* skills sequentially to produce a unified verification report. Use instead of running individual verify skills one by one. Run before PR creation, after feature implementation, or during code review. Trigger on: "전체 검증", "통합 검증", "PR 준비", "full verification", "run all checks", "verify everything".
disable-model-invocation: true
argument-hint: '[선택사항: 특정 verify 스킬 이름]'
---

# 구현 검증

## 목적

프로젝트에 등록된 모든 `verify-*` 스킬을 순차적으로 실행하여 통합 검증을 수행합니다.
이 스킬은 **순수 실행기**입니다. verify-* 스킬의 생성/수정/삭제는 `/manage-skills`가 담당합니다.

## 실행 시점

- 새로운 기능을 구현한 후
- Pull Request를 생성하기 전
- 코드 리뷰 중

## 실행 대상 스킬

| #  | 스킬                    | 영역     | 설명                                                    |
|----|-------------------------|----------|---------------------------------------------------------|
| 1  | `verify-auth`           | backend  | 인증/인가 — req.user.userId, @RequirePermissions         |
| 2  | `verify-zod`            | backend  | Zod 검증 — ZodValidationPipe, Query targets, `.trim().min(N)` 경계 케이스 대칭성(Step 17, 2026-05-02), revocationReason fail-close SSOT(Step 16 cmd 3b, 2026-05-03), mapper I18N_VARS 숫자 하드코딩 0건(Step 16 cmd 5c, 2026-05-03), `z.string().uuid()` 직접 사용 금지 → `uuidString()` SSOT(Step 18, 2026-05-03), CAS DTO/서비스 검증(Step 19, 2026-05-03 verify-cas 흡수), Backend Zod issues array i18n routing(Step 22, 2026-05-08 ADR-0008), 도메인 mapper hub fallback ts-morph 정적 spec(Step 23, 2026-05-08), Sort-mapper default 회귀 spec 자동 등록 — 13 mapper count == covered (통합 11 + 별도 2) + PgDialect.sqlToQuery + JSON.stringify(queryChunks) 안티패턴 차단(Step 24, 2026-05-09 three-low-tech-debt-closure r2)              |
| 3  | `verify-ssot`           | both     | SSOT 임포트 소스 — 로컬 재정의 금지, config 파생 boolean → 수치 SSOT(Step 32), isPurposeCompatibleWithEquipment USER_SELECTABLE_PURPOSES guard(Step 47), switch+assertNever exhaustiveness(Step 48), UI 도메인 타입 SSOT+위임 re-export(Step 49), Visual layer ↔ domain SSOT 분리 named constant(Step 52, Sprint 4.5 U-09), ESLint ImportExpression dynamic import selector(Step 22f), useRowSelection SSOT(Step 55), calculateDaysRemaining SSOT(Step 56), `EXTENDED_TEXT_MAX_LENGTH` SSOT — `.max(200)` 매직넘버 금지(Step 58, 2026-05-03), backend pagination default/max clamp SSOT(Step 59, 2026-05-03) |
| 4  | `verify-hardcoding`     | both     | 하드코딩 탐지 — API 경로, queryKeys, 환경변수, optimistic fallback `pageSize`(Step 17b), `useOptimisticMutation` `invalidateKeys` 인라인 배열 → `*CacheInvalidation` 클래스 SSOT(Step 33)             |
| 5  | `verify-frontend-state` | frontend | 상태 관리 — TanStack Query, 동적 import, ActiveDialog discriminated union(Step 34), runWithConcurrency worker pool + backend bulk endpoint delegation 예외(Step 35), sessionStorage TTL+try/catch+one-shot(Step 37, Sprint 4.5 U-07), useUndoableState SSOT — 인라인 pastRef/futureRef 선언 금지(Step 38, 2026-05-02), 프론트엔드 mutation version 전달(Step 39, 2026-05-03 verify-cas 흡수), useCasGuardedMutation + 2-step Dialog AP-4 confirm 진입 전 version 재조회(Step 40, 2026-05-03 verify-cas 흡수), RejectModal `mode='domain'` 위임 패턴 — 인라인 반려 UI 금지(Step 42, 2026-05-09), useSafeTimeout SSOT — 신규 수동 타이머 배열 패턴 금지(Step 44, 2026-05-09)  |
| 6  | `verify-nextjs`         | frontend | Next.js 16 패턴 — await params, useActionState            |
| 7  | `verify-filters`        | frontend | URL-driven 필터 SSOT, 교정 result 타입 SSOT chain(Step 13, 2026-05-09)                                     |
| 8  | `verify-design-tokens`  | frontend | Design Token 3-Layer, Dialog ARIA 입력 검증 패턴(Step 49), 내비게이션 list 시맨틱 `<ul role="list">` + `<li>`(Step 50) |
| 9  | `verify-security`       | both     | 보안 — Helmet CSP, Security Headers, scope 위반 ErrorCode 403+감사등록 3중 확인(Step 15), enforceXxxAccess 컨트롤러 spec 뮤테이션 커버리지(Step 16, 2026-05-03), system_error_events PII deny-list(Step 17, 2026-05-06), common/security/* 레이어 PII deny-list + fire-and-forget + Symbol DI 토큰 + @Optional inject 패턴 일반화(Step 18, 2026-05-09 three-low-tech-debt-closure) |
| 10 | `verify-i18n`           | frontend | i18n — en/ko 키 쌍, 동적 키 커버리지, audit SSOT enum 동기화, CROSS_CUTTING_NAMESPACES+checkStructuralNamespaces 스크립트 구조(Step 17), SHARED_COMPONENT_DOMAIN_NS_RULE ESLint 게이트(Step 18), typed linting block stories ignores(Step 19), domain mapper `errors.title/errors.genericError` baseline 키 존재(Step 20), ADR-0008 tErrors 3-param 주입 탐지 — 2-param `map*ErrorToToast` 호출 0건 강제(Step 21, 2026-05-09) |
| 11 | `verify-sql-safety`     | backend  | SQL 안전성 — LIKE 이스케이프, N+1                          |
| 12 | `verify-e2e`            | e2e      | E2E 테스트 패턴 + 아키텍처 커버리지, test.use() describe 스코프 강제(Step 21), TestRole 4-place SSOT(Step 23), fixture 권한 격리(Step 24), scope spec actor 정합(Step 25) — Steps 23/24/25는 `pnpm --filter backend run verify:e2e-actors` pre-push 자동 승격, 도메인 e2e helper SSOT 분리(Step 26a)+value-based selector for prefilled forms(26b)+backend hook fail-soft 회귀 가드(26c)+legacy spec rewrite 정합화(26d)+intermediate/self 양면 페어링(26e), 워크플로우 E2E 커버리지 — critical-workflows.md 대비 테스트 매핑(Step 28, 2026-05-03 verify-workflows 흡수), bulk-action spec — mock wiring + 실제 backend integration EXT 분리(Step 29, 2026-05-06 bulk-selection-tabs-integration sprint) |
| 13 | `verify-seed-integrity` | backend  | 시드 인프라 3자 SSOT 정합성 (seed-data↔seed-test-new↔verification) |
| 14 | `verify-cache-events`   | backend  | 이벤트 기반 캐시 무효화 — 레지스트리 커버리지, 리스너 async, SSOT 패턴 |
| 15 | `verify-handover-qr`    | both     | QR + Handover 통합 — QR URL/설정/액션 SSOT(qr-url.ts/qr-config.ts/qr-access.ts) + Handover/OneTimeToken 보안(시크릿 분리, jti nonce 소비, TTL SSOT, 권한 가드, 토큰 영속화 금지, dev 엔드포인트 이중 가드). 2026-05-03 verify-qr-ssot + verify-handover-security 통합 |
| 16 | `verify-checkout-fsm`   | both     | Checkout FSM — Dependency Inversion, assertFsmInvariants, CheckoutPermissionKey 동기화, NO_EQUIPMENT 가드(Step 19 ≥4건), rejectReturn checkTeamPermission unconditional(Step 20), firstEquip 취득 패턴 items[0] 기준(Step 22), rejectReturn reason 검증 순서 scope/FSM 이후(Step 23), checkout-api.ts nextStep 타입 동기화(Step 24), borrower identity-rule(Step 25), findCheckoutEntity 분리(Step 28), findOne userPermissions 필수(Step 29), FSM drift safeParse(Step 30), findOne CheckoutWithMeta 단일 반환(Step 31), 280 table test 존재(Step 32), ESCAPE_ACTIONS 집합 불변성+4단계 우선순위(Step 46), outbound=case 1+3 불변성(Step 47), availableToCurrentUser guard+canCancel 독립 버튼(Step 48), revokeApproval scope→FSM→reason→time-window→domain 5단계 fail-close 순서(Step 52, 2026-05-03) |
| 17 | `verify-routing-origin` | both     | Same-Origin Reverse-Proxy(ADR-0006) 정합 — api-routing.ts SSOT / next.config.js / nginx lan.conf+template / proxy.ts, env 절대 URL 잠입, BACKEND ∩ NEXTAUTH disjoint, SW NetworkOnly `/api/*` 룰. 2026-05-05 추가: csrf-invariants.json 무결성($schema/version/adrRef/4 키 + 양 스크립트 import — Step 12) + smoke/trace 2-script CLI 계약 일관성(`--dry-run` env-optional / live env-required — Step 13) + redaction SSOT(`redactionPatterns` JSON SSOT, raw token 0 — Step 14) |
| 18 | `verify-click-feedback` | frontend | Click-Feedback 5-Layer — FEEDBACK_KEYS SSOT, loading.tsx a11y, 409 retry, useDebouncedSearch/useAutoSave/useExportAction 패턴, motion-safe spinner |
| 19 | `verify-bulk-action-bar` | frontend | BulkActionBar 패턴 SSOT — count chip aria-live, role=toolbar, indeterminate Radix, focus management, IME guard, generic/common + approvals wrapper 분리, 도메인 wrapper 신설 패턴(Step 10), applyGroupToggle SSOT(Step 11), Step 3 Esc 단축키는 선택적 UX 강화로 정책 명시 — 2026-05-06 bulk-selection-tabs-integration sprint |
| 20 | _(경고 W1) spec helper return type_   | both     | **[경고 레벨]** `grep -rn "^  function\|^function\|^const.*=.*=>" apps --include="*.spec.ts" \| grep -vE ":\s*(void\|Promise<\|[A-Za-z\[<])" \| grep -E "make\|setup\|create"` — spec 파일 내 `make*`/`setup*`/`create*` 헬퍼 함수 중 명시 return type 없음 탐지. 자동 실패 아님 — manual review 후 `: void`/`: ReturnType<...>` 명시 권고. 참고: `dashboard.service.spec.ts:326` 동일 패턴. |
| 21 | _(경고 W2) 언더스코어 prefix param_   | backend  | **[경고 레벨]** `grep -rnE "\(_[a-z][a-zA-Z0-9]*[,)]" apps/backend/src/modules --include="*.service.ts"` — service 메서드 파라미터 `_paramName` (의도 미사용 표시, underscore-prefix). silent-loss 잠재 위험 (예: `software_validations` approve comment 유실 사례). 0건 이면 PASS. ≥1건이면 각 케이스 intent 확인 권고. |
| 22 | _(문서 D1) BulkActionBar actions slot_   | frontend | **[패턴 문서화]** BulkActionBar `actions?: React.ReactNode` slot은 도메인 무관 generic 컴포넌트에서 도메인 버튼을 주입하는 SSOT 패턴. 위반 패턴: BulkActionBar 내부에 도메인 버튼 하드코딩 / variant prop으로 도메인 분기. grep 확인: `grep -rn "BulkActionBar" apps/frontend/components --include="*.tsx" \| grep -v "actions="`. 참조: `components/common/BulkActionBar.tsx`. |
| 23 | `verify-lint-ruleset-parity` (script)   | tooling  | **[script SSOT]** `scripts/verify-lint-ruleset-parity.mjs` — lintstaged ↔ lint:ci(backend) / lint(frontend) / lintstaged(packages) glob coverage + critical rule 등록 정합성. `PARITY_SPEC.{backend,frontend,packages}` SSOT. 신규 critical rule 추가 시 SSOT 만 갱신. **packages 도메인** (2026-05-06 commit-pipeline-safety-should-followups sprint 추가): `lintCiScriptName: null` 분기로 lint script 부재 도메인 우아하게 처리 (step 3 skip), critical rules `@typescript-eslint/no-explicit-any` / `no-unused-vars` / `ban-ts-comment` 검증. pre-push 게이트 통합 (`.husky/pre-push` `_t "parity"` step). 검증: `pnpm verify:lint-ruleset-parity` 24 checks PASS (3 도메인). 회귀 spec: `scripts/__tests__/verify-lint-ruleset-parity.spec.mjs` (10 cases, EMS_PARITY_DOMAINS env 단일 도메인 격리). |
| 24 | `precommit-staged-guard` (hook)         | tooling  | **[hook SSOT]** `scripts/precommit-staged-guard.mjs` — multi-session 인덱스 흡수 race 차단 (`GUARD_CONFIG` SSOT). 모든 commit에서 `git diff --cached --stat` 자동 출력 (인지 강제) + `EMS_PRECOMMIT_STRICT=1` opt-in 차단 (≥11 staged 또는 mtime spread ≥30분). pre-commit step 0. 30ms 실측. ADR-0007 정책 기반. 회귀 spec: `scripts/__tests__/precommit-staged-guard.spec.mjs` (6 cases) — 2026-05-06 commit-pipeline-safety sprint. |
| 25 | `commitlint-config-sync` (script + spec) | tooling  | **[script SSOT]** `commitlint.config.js` `SCOPE_LIST` (Object.freeze + module.exports 노출) ↔ **3-way SSOT 정합** (① `apps/backend/src/modules/*` filesystem ② `BACKEND_MODULE_SCOPES` commitlint config ③ `CLAUDE.md ### Backend Modules (N)` docs) 자동 동기화. 새 backend 모듈 추가 시 spec FAIL 로 자동 회귀 차단 (commit-msg hook 의 scope-enum reject + docs drift silent miss 양쪽 차단). META_SCOPES ↔ BACKEND_MODULE_SCOPES 중복 차단. **CLAUDE.md docs cross-check**: markdown table parser — heading `### Backend Modules (N)` 카운트 + `\| \`<scope>\` \|` 형식 row 추출 + `BACKEND_MODULE_SCOPES` set equality. 신규 룰: `scope-enum` (SCOPE_LIST 참조) / `subject-case` (start-case/pascal-case/upper-case 시작 차단, 중간 PascalCase identifier 허용) / `body-max-line-length=100` / `body-leading-blank=warn` / `footer-leading-blank=warn` / `header-case=[0,...]` (severity 0 비활성). pre-push 자동 실행 (`_t "root-spec" node --test --test-concurrency=4`, ~4초). 회귀 spec: `scripts/__tests__/commitlint-config.spec.mjs` (19 cases — SSOT immutable / JSON 직렬화 / filesystem 1:1 sync / **CLAUDE.md docs 1:1 sync** / META·BACKEND 중복 차단 / commitlint CLI valid PASS × 2 + PascalCase 중간 PASS / invalid scope·subject-case·type-case·type FAIL × 4) — 2026-05-06 commit-pipeline-safety-should-followups sprint + 시니어 자기검토 #2/#3 라운드 발견. |
| 26 | `hook-timing-wrapper` (script SSOT)     | tooling  | **[script SSOT]** `scripts/hook-timing.mjs` — opt-in (`EMS_HOOK_TIMING=1`) hook 실행 시간 추적 wrapper. default no-op (overhead < 5ms/step, Node startup 포함 ~3ms). `EMS_HOOK_TIMING=1` 시 stderr JSON-line `{"step":"<label>","ms":N,"exit":code,"ts":"<iso>"}` / `EMS_HOOK_TIMING_LOG=1` 추가 시 `.husky/.timing-log.jsonl` append (gitignored). 자식 exit code transparent 전파 + signal 종료 시 silent pass 차단 (R1 위험 회귀 가드) + spawn 실패 시 exit 127. **Log rotation** (운영 회귀 차단, 시니어 #3 라운드 추가): `TIMING_LOG_MAX_BYTES = 5MB` 초과 시 append 직전 `.1` 단일 백업 rolling (산업 표준 logrotate minimal 구현, atomic rename, race 안전). `.husky/pre-commit` 6 step + `.husky/pre-push` 8+ step 모두 `_t <label> <cmd>` 헬퍼로 통합. macOS / Linux / WSL2 호환 (Node 내장만 사용). 회귀 spec: `scripts/__tests__/hook-timing.spec.mjs` (9 cases — default no-op / exit code 7·1 propagation / EMS_HOOK_TIMING JSON / LOG file append + JSONL 표준 / rotation 발동·미발동·단일 백업 덮어쓰기 / LOG 단독 TIMING 가드) — 2026-05-06 commit-pipeline-safety-should-followups sprint + 시니어 #3 라운드. |

## 워크플로우

### Step 1: 실행 대상 결정

인수가 제공되면 해당 스킬만, 아니면 `git diff` + `git status`로 변경 영역에 맞는 스킬만 필터링.

상세: [references/implementation-workflow.md](references/implementation-workflow.md) Step 1

### Step 2: 검증 실행

1~3개: 순차 실행. 4개 이상: 영역별 그룹 Agent 병렬 실행 (최대 3개 동시).

상세: [references/implementation-workflow.md](references/implementation-workflow.md) Step 2

### Step 3: 통합 보고서

```markdown
## 구현 검증 보고서

| 검증 스킬      | 상태            | 이슈 수 | 상세    |
| -------------- | --------------- | ------- | ------- |
| verify-<name>  | PASS / X개 이슈 | N       | 상세... |

**발견된 총 이슈: X개**
```

### Step 4~6: 수정 적용 및 재검증

이슈 발견 시 사용자에게 전체/개별/스킵 옵션을 제시하고, 수정 후 재검증합니다.

상세: [references/implementation-workflow.md](references/implementation-workflow.md) Step 4~6

### Step 7: 실행 이상 감지

Related Files 미존재, grep 0건, 미등록 스킬 등 이상 감지 시 `/manage-skills` 실행 권장.

상세: [references/implementation-workflow.md](references/implementation-workflow.md) Step 7

## 예외사항

1. **등록된 스킬이 없는 프로젝트** — 안내 메시지 표시 후 종료
2. **스킬의 자체적 예외** — 각 verify 스킬의 Exceptions 섹션에 정의된 패턴은 이슈로 보고하지 않음
3. **verify-implementation 자체** — 실행 대상에 자기 자신을 포함하지 않음
4. **manage-skills** — `verify-`로 시작하지 않으므로 실행 대상 아님
5. **review-architecture** — `verify-`로 시작하지 않으므로 실행 대상 아님

## Related Files

| File | Purpose |
|---|---|
| `.claude/skills/manage-skills/SKILL.md` | 스킬 유지보수 (실행 대상 스킬 목록 관리) |
| `CLAUDE.md` | 프로젝트 지침 |
