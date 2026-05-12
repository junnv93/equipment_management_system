# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).
완료 항목 및 빈 sprint 헤더는 본 문서에서 제거한다.


## Open

### 2026-05-13 qr-visual-redesign-followups-g4-g12 라운드 #3 후속 (pre-existing 회귀 + scope 외)

> **2026-05-13 sprint `qr-visual-redesign-followups-g4-g12-round3` closure**. g4-g12 라운드 #2 자기검토 8 갭 closure 중 pre-existing 회귀 등록 + scope 외 후속 분리.

- [ ] **[2026-05-13 round3 PR-1] 🟠 HIGH checkouts-rejection-presets-updated-at-regression** — `apps/backend/src/modules/checkouts/checkouts.service.ts:3620, 3707` 가 `rejectionPresets.updatedAt` 컬럼 참조. 스키마(`packages/db/src/schema/rejection-presets.ts`) 에는 미존재 — pre-existing 회귀. 도입 commit `9787d245` (checkouts-sprint4-followups-s2-s4-s5-s6 sprint). backend build EXIT 1. **Fix**: (a) 스키마에 `updated_at` 컬럼 추가 + manual SQL migration, 또는 (b) service에서 컬럼 참조 제거 + 사용 의도 재검토. 트리거: backend build 회복.
- [ ] **[2026-05-13 round3 PR-2] 🟡 MED frontend-env-internal-backend-url-ssot** — `apps/frontend/.env.local` 의 `INTERNAL_BACKEND_URL` 누락 + `NEXT_PUBLIC_API_URL` 절대 URL ADR-0006 위반. 본 round3 sprint 에서 임시 수정 (`INTERNAL_BACKEND_URL=http://localhost:3001` 추가 + `NEXT_PUBLIC_API_URL=` 빈값). `.env.example` SSOT 정합 검증 + dev/CI 환경 합치 검증 후속 필요. 트리거: ADR-0006 환경 검증 sprint.
- [ ] **[2026-05-13 round3 PR-3] 🟡 MED equipment-service-spec-monolithic-mockdb-migration** — `apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts:40-65` monolithic mockDb 패턴 (mockReturnThis 단일 객체). drizzle-stub SSOT (createDrizzleSelectChain/Insert/Update) 와 다른 valid 스타일. 마이그레이션은 spec 60+ assertion 변경 필요로 본 sprint scope 외. 트리거: backend test infra 정합화 sprint.

### 2026-05-12 ultrareview-shield-followups 후속 (SH-1~SH-4)

> 본 sprint(`ultrareview-shield-wrapper` + `ultrareview-shield-followups`) T-1/T-2 closure (2026-05-13 batch archive). 라운드 #3 식별 후속 4건 잔여 + cross-domain dependabot-cascade T-3 별도 처리.

- [ ] **[2026-05-12 ultrareview-shield-followups SH-1] 🟢 LOW shield-lock-contention-spec** — 동시 두 shield 실행 시 `flock(1)` 단일 인스턴스 보호 spec 부재. `scripts/__tests__/ultrareview-shield.spec.mjs` 에 시나리오 추가: child shield A 가 SHIELD_LOCK 보유 중일 때 child shield B 즉시 FAIL exit 1 + stderr "다른 ultrareview-shield 인스턴스" 메시지 검증. 트리거: 회귀 차단 강화.
- [ ] **[2026-05-12 ultrareview-shield-followups SH-2] 🟢 LOW shield-sigint-trap-spec** — SIGINT/SIGTERM 시 trap restore_files 발화 spec 부재. 현 spec 은 정상 종료만 검증. Node test runner 가 `kill -INT <pid>` 후 정상 복원 + /tmp 잔존 0 검증 필요. 트리거: 신호 처리 회귀 차단.
- [ ] **[2026-05-12 ultrareview-shield-followups SH-3] 🟢 LOW shield-tmp-residual-gc** — SIGKILL (-9) 시 trap 우회로 `/tmp/ur-shield-*` 잔존 가능. 다음 shield 실행 시 자동 정리하는 best-effort GC 추가 검토 (timestamp > 1시간 디렉토리 sweep). 현재는 사용자 수동 정리 책임. 트리거: 운영 사고 발생 시.
- [ ] **[2026-05-12 ultrareview-shield-followups SH-4] 🟢 LOW preflight-perf-budget-baseline** — gitleaks 36분 → 12초 가속 후 baseline 측정. CI/pre-push 에서 `pnpm ur:preflight` p95 budget (예: ≤30초) regression 감지. 트리거: build-dir allowlist 회귀 시 즉시 발견.

### 2026-05-13 cache-event-arch-r3 라운드 #3 closure

> **2026-05-13 sprint `cache-event-arch-r3`** (Mode 1 harness) — `cache-event-channel-architecture-r2` 시니어 자기검토 라운드 #3 6갭 통합 closure. 단편 fix 회피, 시스템 전반 개선.


### 2026-05-11 software-design-review-p0-p1-p2 후속 (A6 WON'T-DO 잔여)

> 본 sprint A2/A3 closure (2026-05-13 batch archive — `sw-validation-event-channel-separation` 정합). A6은 Storybook 인프라 미설치로 차단.

- [ ] **[2026-05-12 software-design-review A6] 🟢 LOW sw-validation-stepper-storybook** ⏸ WON'T-DO (현 sprint) — `SoftwareValidationStepper` Storybook entry는 Storybook 인프라가 본 프로젝트에 미설치 (`apps/frontend/.storybook` 부재, `apps/frontend/package.json`에 `storybook`/`@storybook/*` 의존성 0건). Storybook 도입은 단독 sprint 필요 (의존성 + config + decorator + theme provider wiring + CI integration + chromatic 등). 본 sprint에서는 차단 사유만 명시. 트리거: Storybook 도입 sprint (전제 조건 미충족 상태).

### 2026-05-11 qr-visual-redesign 후속 (WON'T-DO 3건 잔여)

> 본 sprint S-1/S-3/S-4/S-6/S-7 closure (2026-05-13 batch archive — `qr-visual-redesign-followups-batch-1`). S-2/S-5/S-8은 Storybook 인프라 / visual regression CI / 외부 UX 의존으로 WON'T-DO.

- [ ] **[2026-05-11 qr-visual-redesign S-2] 🟢 LOW storybook-status-badge** — ⏸ **WON'T-DO** (batch-1 2026-05-12) — `apps/frontend/.storybook` 부재 + `package.json` 의존성 0. 트리거: Storybook 도입 sprint.
- [ ] **[2026-05-11 qr-visual-redesign S-5] 🟢 LOW visual-regression-baseline-refresh** — ⏸ **WON'T-DO** (batch-1 2026-05-12) — Visual regression CI 미도입 (기존 `dday-6level.spec.ts` 1건만 존재, baseline 시스템/snapshot 워크플로 부재). 트리거: visual regression CI 도입 sprint.
- [ ] **[2026-05-11 qr-visual-redesign S-8] 🟢 LOW equipment-status-tone-ux-review** — ⏸ **WON'T-DO** (batch-1 2026-05-12) — 외부 UX 팀 design review 의존 (자동화 불가). 트리거: UX design review 라운드 진입 시.

### 2026-05-10 checkouts-sprint4-ux-u02-u08 후속 (S-9 + 라운드 #2 G-5 잔여)

> 본 sprint S-2/S-4/S-5/S-6/S-7 closure (2026-05-13 batch archive — `checkouts-sprint4-followups-s2-s4-s5-s6` + `saved-views-team-share` 정합). S-9는 Storybook 미설치 차단.

- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-9] 🟢 LOW saved-views-dnd-storybook** — `SavedViewsToolbar` 드래그 정렬 Storybook entry. **차단**: Storybook 미설치 (`NextStepPanel.stories.tsx` orphan). 트리거: Storybook 도입 sprint 선행 후 일괄 처리.
- [ ] **[2026-05-13 saved-views-team-share 라운드 #2 G-5] 🟢 LOW saved-views-orphan-team-cleanup** — 팀 삭제 시 `team_id=NULL`이 된 TEAM scope row 가 unreachable 상태(enforceReadScope `row.teamId === actor.teamId` 불일치). cleanup script: `UPDATE saved_views SET scope='PRIVATE' WHERE scope='TEAM' AND team_id IS NULL` 또는 admin migration 도구. 운영 빈도 낮으나 데이터 무결성 갭. 트리거: 첫 팀 삭제 incident 또는 운영 안정성 sprint.

### 2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 후속 (SH-4/5/6 잔여)

> 본 sprint SH-1/2/3/7 closure (2026-05-13 batch archive — `checkouts-sprint4-followups-sh1-sh7` 정합). SH-4/5/6은 트리거(DB rows 1000+ / clock skew incident / dataset > 500) 미도달로 대기.

- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-4] 🟢 LOW rejection-presets-sortorder-index** — `rejection_presets.sort_order` DB index. 현재 행 적어 미적용. 트리거: 1000+ rows 도달 시 (admin entity 특성상 미도달 가능성 큼).
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-5] 🟢 LOW revocation-window-server-time-skew** — `useRevocationWindow` client `Date.now()` 기반. clock skew > 5초 환경에서 ±5초 오차. server-time endpoint 또는 `Date` header 활용 검토. 트리거: 다국어 다중 zone 서비스 또는 사용자 환경 clock issue 보고.
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-6] 🟢 LOW destination-entity-promotion** — `destination` varchar(255) → 별도 테이블 승격 검토 (autocomplete 풍부화 + 분석용). 트리거: destination 분석 요구 또는 dataset > 500 도달.

### 2026-05-13 checkouts-sprint4-followups-sh1-sh7 후속 (G-6/G-7 잔여)

> 본 sprint 라운드 #2 자기검토 5갭(G-1~G-5) + SH-8 closure (2026-05-13 batch archive). G-6/G-7은 LOW 후속 sprint 트리거 대기. verify-ssot Step 64 신규 등록 (commit `f75b23f1`).

- [ ] **[2026-05-13 checkouts-sprint4-followups-sh1-sh7 G-6] 🟢 LOW revoke-mutation-tdata-typing** — `revokeMutation` `useOptimisticMutation<void, string, Checkout>` 시그니처 — mutationFn 반환 void 라 onSuccessCallback 에서 data 사용 불가. 다른 mutation (approveMutation, rejectMutation 등) 은 `Checkout` 반환 일관. revokeApproval 도 backend 가 updated checkout 반환하므로 `await revokeApproval()` → `await checkoutApi.getCheckout()` 으로 fresh entity fetch 후 반환하는 패턴 일관성 검토. 트리거: useOptimisticMutation 시그니처 정합 sprint.
- [ ] **[2026-05-13 checkouts-sprint4-followups-sh1-sh7 G-7] 🟢 LOW revocation-invalidate-keys-specialization** — revokeMutation 의 `invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS` 재사용 — revocation 은 dashboard pending counts / approval timeline / 본인 처리 이력 별도 효과. `CheckoutCacheInvalidation.REVOCATION_KEYS` 신설 + audit timeline 캐시 invalidate 추가 검토. 트리거: dashboard counts mismatch 보고 또는 cache invalidation SSOT sprint.

### 2026-05-12 checkouts-sprint4-followups-s1-s3-s8 라운드 #2 자기검토 후속 (G-15~G-17)

> 본 sprint iter 2 PASS 후 라운드 #2 자기검토에서 식별. G-1(Provider scope) 즉시 closure (settings/shortcuts/layout.tsx), 나머지 3건 후속 등록.
>
> **2026-05-12 후속 sprint `shortcuts-context-multi-tab-i18n-parity` closure** (Mode 1 harness, iter 1 PASS, MUST 11/11 + SHOULD 5/5 PASS): G-15/G-16/G-17 통합 처리. tsc EXIT=0, lint EXIT=0, 775/775 jest tests PASS (신규 65 cases). 라운드 #2 자기검토에서 R-1 (Context value useMemo) + R-2 (Cheatsheet prop drilling 제거) 즉시 closure. 라운드 #3 점검 시스템적 갭 0건. 신규 SSOT: `useKeyboardShortcutsContext` 훅 (KeyboardShortcutsContext.tsx) + storage event listener SSOT (Provider) + 25-도메인 자동 enumeration i18n-parity spec.

- [ ] **[2026-05-12 shortcuts-context-multi-tab-i18n-parity R-3] 🟢 LOW i18n-parity-array-policy** — `extractKeyPaths` 가 배열을 leaf 로 처리. 현재 i18n 구조에 배열 없음 (silent miss 위험 0). 배열 i18n 구조 도입 시 spec 보강 필요 (recursion 또는 명시적 throw). 트리거: i18n 구조에 배열 사용 도입 시점.
- [ ] **[2026-05-12 shortcuts-context-multi-tab-i18n-parity R-4] 🟢 LOW use-keyboard-shortcuts-scope-dead-code** — `apps/frontend/hooks/use-keyboard-shortcuts-scope.ts` 호출자 0 (dead code). JSDoc "graceful degradation" 의도 명시. 라운드 #4 에서 Context default=undefined 표준화로 반환 type 자동 `KeyboardShortcutsContextValue | undefined` 화 — TypeScript 가 호출자 nullish check 강제. 후속: (a) 진짜 graceful 의도 호출자 발생 시 활용 예시 docstring 보강 / (b) 의도 부재 확인 시 hook 삭제. 트리거: 단축키 도메인 다음 enhancement sprint 또는 dead-code sweep.

### 2026-05-12 section-autonomy-followup 후속

> **2026-05-12 sprint `section-autonomy-followup` closure (Mode 2 Full harness, MUST 21/21 PASS)**. Section autonomy 4원칙 (no orchestrator dynamic / props-in-jsx-out / 200 line soft / Provider-free) 도입.

- [ ] **[2026-05-12 section-autonomy-followup F-1] 🟢 LOW leaf-section-rtl-spec-backfill** — 6 신규 sub-component (InspectionItemCard, NCBasicInfoCard, NCRepairCard, NCCalibrationCard, StatusLocationStep, CalibrationStep) Provider-free testable. props-only render 스펙 작성 권장. 트리거: 다음 frontend test infra sprint.
- [ ] **[2026-05-12 section-autonomy-followup F-2] 🟢 LOW verify-section-autonomy-skill-trigger** — section autonomy 4원칙 ts-morph 기반 invariant 검증 skill 신설 검토. 본 sprint에서는 over-engineering으로 skip. 트리거: section autonomy 회귀 2건 이상 발생 시.
- [ ] **[2026-05-12 section-autonomy-followup F-3] 🟢 LOW visual-table-editor-graceful-no-op-adr** — VisualTableEditor가 `useInspectionForm()` 호출하지만 graceful no-op (`NO_OP_VALUE`, form-context.tsx L391-419)로 4-5 layer prop drilling 회피. "graceful no-op consumer 예외" 패턴 ADR 정식화. 트리거: 동일 패턴 다른 leaf section 재사용 검토 시.

### 2026-05-10 sticky-header-css-var-ssot 후속 (SHOULD S-4)

> **2026-05-10 sprint `sticky-header-css-var-ssot` closure** (Mode 1 harness, iter 2 PASS, MUST 12/12). 본 sprint scope 외 발견 후속 1건만 잔여.

- [ ] **[2026-05-10 sticky-header-css-var-ssot S-4] 🟢 LOW css-var-z-sticky-ssot-extension** — `--z-sticky` (bulk-action-bar.ts:18) Tailwind class string literal 만 존재 + globals.css `:root` 정의 0 + JS setProperty 호출 0 (현재는 fallback `20`만 사용). `CSS_VAR_NAMES` 확장 후보로 등록. 트리거: (1) JS 측에서 z-index 동적 변경 필요 발생 시점 / (2) globals.css `:root` 에 `--z-sticky` 정의 추가 결정 시점. 둘 중 먼저 발생 시점에 `CSS_VAR_NAMES.zSticky: '--z-sticky'` 추가 + bulk-action-bar.ts SSOT 주석 갱신. 현재는 over-engineering (단일 string literal 1 location, 동적 호출 0).

### 2026-05-09 zod-hub-r3 system-wide alert maturity 후속

- [ ] **[2026-05-09 zod-hub-r3] 🟡 MEDIUM system-wide-alert-runbook-backfill** — 라운드 #3 alertmanager Slack 템플릿이 `Annotations.runbook`/`runbook_url` 노출하도록 갱신 완료. 그러나 기존 11 alerts (HighCPUUsage / CriticalCPUUsage / HighMemoryUsage / CriticalMemoryUsage / HighDiskUsage / CriticalDiskUsage / ContainerRestarting / ContainerHighMemory / BackendDown / HighErrorRate / HighResponseTime) 는 runbook annotation 미보유 — 템플릿 가드 (`{{ if .Annotations.runbook }}`) 로 빈 출력 방지하나 **운영 maturity 갭 system-wide**. 11 alerts 각각 runbook (즉시 행동 + 단기 완화) + runbook_url (`docs/operations/prometheus-alert-rules.md` anchor) 추가 필요. 본 sprint 는 ZodValidation 2건만 closure — system-wide 일관성은 별도 sprint scope. 트리거: 첫 번째 기존 alert 발생 후 운영자가 runbook 부재로 어려움 호소 시 또는 운영 maturity 강화 sprint.

### 2026-04-30 sprint45-should-residual 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW help-faq-content-authoring** — `messages/{ko,en}/help.json` 4 섹션 (checkout/calibration/nonConformance/permissions) placeholder만 등록. 운영팀과 협의 후 실제 FAQ 카피 작성 + 섹션 anchor 키 동기화. `feedback_no_fabricate_domain_data.md` 정책에 따라 카피 생성 금지 — 사용자/운영팀 입력 후 별도 작업. 트리거: 운영팀 FAQ 콘텐츠 공급.

### 2026-05-05 bulk-selection-tabs-integration 후속 (Mode 2 harness 발견)

- [ ] **[2026-05-05 bulk-tabs scope 후속] 🟡 MEDIUM inbound-bulk-receive-integration** — InboundCheckoutsTab standard 섹션 receive flow bulk 통합. UL-QP-18 receive workflow 정의 + 권한 매트릭스(borrower 측 receive scope) 확정 후 별도 sprint. 트리거: receive UX 운영 요구사항 발생.


### 2026-05-09 drizzle-policy-csp-spec-closure 후속 (SHOULD)

- [ ] **[2026-05-09 drizzle-policy-csp S-16/S-19] 🟢 LOW csp-violation-spec-runtime-verification** — `apps/frontend/tests/e2e/security/csp-violation.spec.ts` 의 TC-3 (legacy + Reporting API payload 양 shape) + TC-4 (real DOM violation 트리거) 의 **실 Playwright chromium 실행 검증** 미수행. 본 sprint 는 정적 검증(grep + lint + tsc + backend test)까지만 완료. 환경 부담: dev 서버(frontend + backend) + storageState fixture(`auth.setup.ts` 사전 실행) + 실 브라우저 launch. 실행 명령: `pnpm --filter frontend exec playwright test security/csp-violation --project=chromium --workers=1`. 트리거: 다음 e2e 통합 sprint 또는 CSP 회귀 incident. SHOULD-19 (wall time < 60s) 도 동일 트리거에 흡수.

- [ ] **[2026-05-09 drizzle-policy-csp 시니어 자기검토 #2] 🟡 MEDIUM drizzle-policy-ci-workflow-followup** — `.github/workflows/main.yml` 이 ADR-0010 정책과 정면 충돌하는 `drizzle-kit generate` / `drizzle-kit push` 호출 보유. **L130-141** "Drizzle Schema Drift Check" 가 `drizzle-kit generate --name __drift_check__` 호출 + 에러 메시지 "Run `pnpm --filter backend run db:generate` locally" 안내 (ADR-0010 정반대). **L303-304** 테스트 job 의 `drizzle-kit push --force` 호출 (ADR-0010 금지). 본 ADR sprint scope 외 (CI workflow 변경 blast radius + 테스트 DB 정책 별도 검토 필요)로 분리. **후속 작업**: (a) L130-141 drift check 를 `drizzle-kit check` (journal+SQL 정합성 검증) 로 교체 + 에러 메시지 갱신, (b) L303-304 테스트 job 을 `drizzle-kit migrate` (journal-based 실행) 로 교체, (c) (a)(b) 완료 후 CI 에 `drizzle-kit generate` 호출 차단 grep 추가 (`grep -rn "drizzle-kit generate" apps/ packages/ scripts/ .husky/ .github/ | grep -v "ADR-0010"`). 트리거: 본 sprint commit 후 즉시 또는 첫 회귀 incident 발생 시. 우선순위 MEDIUM (LOW 아닌) 이유: ADR-0010 의 doc-only defense 가 CI 실 실행 환경에서 직접 무력화됨.

- [ ] **[2026-05-09 drizzle-policy-csp 시니어 자기검토 #2] 🟢 LOW drizzle-pre-push-snapshot-guard** — `.husky/pre-push` 에 snapshot 파일 변경 차단 grep 추가 권장. 명령: `git diff origin/main -- 'apps/backend/drizzle/meta/*_snapshot.json' | grep -q . && { echo "❌ snapshot 파일 변경 금지 (ADR-0010)"; exit 1; }`. 본 sprint 는 doc 명시까지만, hook wiring 은 별도. 트리거: ADR-0010 위반 회귀 1건 발생 시 또는 다음 .husky 갱신 sprint.

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.

### 2026-04-22 harness: checkout-lender-guard-p1p3 후속 (verify + review 결과)

- [ ] **[2026-04-22 p1p3] 🟢 LOW RENTAL reject_return 설계 갭 — FSM 명시적 결정 필요** — FSM `reject_return` 전이가 `purposes: CAL_REPAIR`만 허용, RENTAL 제외. RENTAL 반납 검사 실패 시 반려 불가한 도메인 갭. 의도적 설계라면 FSM 주석 추가 권장; RENTAL 반납 반려가 필요하다면 FSM에 rental 추가 + rejectReturn LENDER_TEAM_ONLY 복구 필요. 트리거: 렌탈 워크플로우 설계 검토 시.

### 2026-04-27 harness: dashboard-phase4-6 SHOULD 후속

- [ ] **[2026-04-27 dashboard-phase4-6] 🟢 LOW visual-regression-baseline** — Phase 4.6 스킵. `visual-regression.spec.ts` 미생성 — 5 role × 4 viewport × 3 mode = 60 baseline 스크린샷. 트리거: 디자인 QA Sprint 착수 시 `--update-snapshots`로 초기 캡처.

### 2026-05-06 system-health-data-source-ssot 자기검토 라운드 #2-#3 후속

- [ ] **[2026-05-06 자기검토 #2] 🟢 LOW system-health-stale-polling-window** — `StorageHealthProviderImpl.read()` 가 `MonitoringService.getSystemMetrics().storage` (setInterval 갱신, ~30s 주기) 의존. periodic polling 산업 표준 수용. 트리거: 측정 정확도 critical 운영 요구 시.

### 2026-04-28 dashboard-redesign-phase-e-residual SHOULD 후속 (미완료)

- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW playwright-dashboard-screenshots-baseline** — `dashboard-screenshots.spec.ts` 본 세션에서 helper 추가 + dark/axe scan 보강만 완료. 실제 5 role × 1440 light/dark 30 PNG 캡처는 미실행 (storage state + dev 서버 의존). 트리거: 다음 디자인 QA sprint.

### 2026-05-03 calibration-design-review-phase1 SHOULD 후속 (미완료)

- [ ] **[2026-05-03 calibration-design-review-phase1] 🟢 LOW calibration-form-ocr-template-opinion** — 교정성적서 등록 폼에서 OCR 추출(성적서 이미지 → 자동 입력), 측정값 템플릿(표준 측정 항목 사전 정의), 항목별 의견 저장은 Phase 2 후속 개발 항목. 현재 Phase 1에서 폼 등록 흐름 안내/자동 계산 차기일/결과별 후속 안내까지만 구현. 트리거: 교정 Phase 2 sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟢 LOW calibration-browser-rendering-e2e** — /calibration, /calibration-plans, /calibration-plans/[uuid], /calibration/register 라우트 브라우저 렌더링 런타임 검증 미실시 (Playwright 없음). tsc PASS + 정적 검증만 확인. 트리거: 다음 Playwright E2E sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-measurement-template-ssot** — 장비 분류별 측정 항목/허용오차 템플릿 SSOT와 자동 판정 저장 모델 필요. 현재 결과 segmented UI만 반영. 트리거: 교정성적서 측정값 추적 Sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-plan-item-comments** — 교정계획 상세 항목별 검토 의견 저장/해결 API와 inline comment UI 필요. 현재 상세 메타/결재 맥락만 반영. 트리거: 교정계획 상세 리뷰 UX Sprint.

