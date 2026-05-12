# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).
완료 항목 및 빈 sprint 헤더는 본 문서에서 제거한다.


## Open

### 2026-05-12 dependabot-cascade-sync 후속 (3건)

> **2026-05-12 sprint `dependabot-cascade-sync`** 머지 cascade 처리 + 라운드 #2 자기검토 closure. 7 PR 머지 (#202 npm-check-updates / #198 actions-cache / #200 docker/build-push-action / #197 download-artifact / #199 pnpm/action-setup / #211 upload-artifact / #203 next-auth) + 3 PR close (#220 42-pkg group / #218/#217 Node 26 non-LTS). 라운드 #2 자기검토 5갭 — 갭 1 NC mutations spec / 갭 2 `.env.test` 모순 / 갭 3 dependabot.yml domain 분할 / 갭 5 admin 가드 false alarm 즉시 closure. 후속 3건 등록.

- [ ] **[2026-05-12 dependabot-cascade T-1] 🟠 HIGH node-lts-migration-20-to-22-24** — PR #218/#217 close 사유 (Node 26 non-LTS, LTS 시작 2026-10) 후속. 단계 마이그레이션: Node 20 (Active LTS, EOL 2026-04) → Node 22 (Active LTS, EOL 2027-04) → Node 24 (Active LTS). toolchain coordination 필요: (a) `package.json` engines.node bump (b) Docker base image bump (apps/backend/docker/Dockerfile + apps/frontend/Dockerfile) (c) GitHub Actions `setup-node` action 버전 (d) `@types/node` matching bump (e) e2e local + CI 풀 regression. 트리거: Node 20 EOL 임박 (2026-04 후). dependabot.yml `ignore` 가 major bump 자동 차단 — manual sprint.
- [ ] **[2026-05-12 dependabot-cascade T-2] 🟡 MED admin-layout-defense-in-depth** — 라운드 #2 갭 5 (false alarm 확인 후속). 모든 `/admin/*` page 가드 존재 (hasPermission/APPROVAL_ROLES/deprecated-redirect) 하지만 page-level 단일 가드라 신규 페이지 추가 시 누락 위험. 대응: (a) `apps/frontend/app/(dashboard)/admin/layout.tsx` 신설 — generic admin role 가드 (Permission.VIEW_ADMIN_DASHBOARD 또는 admin role 화이트리스트). page-level specific permission은 유지 (defense-in-depth). (b) `verify-implementation` SKILL.md에 "admin/*/page.tsx 가드 필수" rule 추가 — static check. 트리거: 신규 admin 페이지 sprint 직전 또는 정기 보강.
- [ ] **[2026-05-12 dependabot-cascade T-3] 🟢 LOW ultrareview-preflight-env-test-redefinition** — `.gitignore` 정합화 (line 42 `.env.test` 제거 — 갭 2 closure)로 `scripts/ultrareview-preflight.mjs:59`의 `.env.test` 'gitignore 대상' 등록이 stale. 재정의: 루트 `.env.test`은 tracked cross-PC fixture (dummy values, 보안 가치 0) — preflight 격리 대상에서 제외하거나 dummy 검증으로 분류 변경. 트리거: ultrareview-shield-followups sprint 마무리 단계 또는 secret 격리 정책 재검토 시.

### 2026-05-12 ultrareview-shield-wrapper 후속 (2건)

> **2026-05-12 sprint `ultrareview-shield-wrapper` closure** (Mode 1 harness, iter 2 PASS, MUST 12/12 + SHOULD S-1/S-2/S-4 PASS). `pnpm ur:shield` 신설로 preflight Gate 1 dev `.env` 자동 격리/복원. SSOT 단방향(preflight `--list-patterns`) + `flock` + `trap EXIT` + `/tmp` 격리. 사고 학습 후속 2건 등록.

- [x] **[2026-05-12 ultrareview-shield T-1] 🟠 HIGH ultrareview-shield-self-test-isolation** ✅ closure (sprint `ultrareview-shield-followups`, 2026-05-12) — shield 자체 `--self-test` 모드 신설 (`mktemp -d ur-shield-selftest-*` fixture + SSOT 단방향 fake 파일 derive + inner shield 호출 + SHA256 hash invariant + `/tmp/ur-shield-*` 잔존 0 자체 검증). `scripts/__tests__/ultrareview-shield.spec.mjs` integration spec 신설 (6 scenarios: happy / 자식 실패 exit 1·7 / 격리 대상 0 빈 fixture / SSOT 단방향 단언 — spec 자체 `.env` 인라인 패턴 0 / `--self-test` smoke). `.husky/pre-push` root spec 게이트 통합. shield `SHIELD_PREFLIGHT` + `SHIELD_LOCK` env override 추가로 spec/self-test가 실 lock 미경쟁. self-test EXIT 0 + working tree git diff 0 invariant.
- [x] **[2026-05-12 ultrareview-shield T-2] 🟡 MED ultrareview-preflight-gitleaks-allowlist** ✅ closure (sprint `ultrareview-shield-followups`, 2026-05-12) — 진단 결과 20 finding 트리아지: 4건 `.env` (root) **실 secret** (DB_PASSWORD/INTERNAL_API_KEY/AZURE_AD_CLIENT_SECRET/teams-webhook) + 16건 placeholder/test fixture. **핵심 fix**: `.env` (root, suffix 없음)이 `DANGEROUS_PATTERNS`에 누락된 보안 갭 → preflight 추가 + shield가 자동 격리. allowlist 단순 추가는 진짜 secret 은폐가 되므로 거부, preflight 패턴 확장이 정답. `.gitleaks.toml` `[allowlist].paths` 확장 — (a) build dir 7종 + lockfile 3종으로 **gitleaks 36분 → 12초** (180배 가속) (b) placeholder docs 6종 (c) e2e fake JWT path allowlist. **시니어 라운드 #3 아키텍처 개선** — `scripts/lib/scan-exclusion-paths.mjs` SSOT 신설 (`SCAN_EXCLUDED_DIRS` + `GITLEAKS_EXCLUDED_DIRS` derived). preflight `findGlobFiles` 인라인 `node_modules/.git/dist` 제거 → SSOT import. `scripts/__tests__/scan-exclusion-paths-sync.spec.mjs` 신설 — SSOT ↔ `.gitleaks.toml` allowlist 미러 invariant (둘 중 한 곳만 갱신 시 FAIL). `package.json` `ur:preflight` + `ur:selftest` npm script alias 추가 (발견 가능성 ↑). `pnpm ur:preflight` 3 gate 모두 EXIT 0.

#### Cross-domain decision — dependabot-cascade T-3 처리 정책 명시

dependabot-cascade T-3 (`.env.test` reclassify) 가 본 sprint 마무리 단계를 trigger 로 명시했지만, **본 sprint 에선 처리 안 함** — 사유: (a) `scripts/ultrareview-preflight.mjs:60` `.env.test` reason 텍스트 1줄 변경은 documentation-only 이며 실 동작 영향 0 (shield 가 여전히 격리). (b) 도메인 격리 — dependabot-cascade session 이 `.gitignore` 정합화 main work 진행 중. 우선 단방향 dependency: 본 sprint 의 `.gitleaks.toml` allowlist 가 `.env.test` 처리에 의존하지 않음. T-3 의 trigger 는 단순 cleanup 권장 — 다른 sprint 에서 진행 권장.

#### Follow-up SHOULD (시니어 라운드 #3 식별 — 본 sprint 외 처리)

- [ ] **[2026-05-12 ultrareview-shield-followups SH-1] 🟢 LOW shield-lock-contention-spec** — 동시 두 shield 실행 시 `flock(1)` 단일 인스턴스 보호 spec 부재. `scripts/__tests__/ultrareview-shield.spec.mjs` 에 시나리오 추가: child shield A 가 SHIELD_LOCK 보유 중일 때 child shield B 즉시 FAIL exit 1 + stderr "다른 ultrareview-shield 인스턴스" 메시지 검증. 트리거: 회귀 차단 강화.
- [ ] **[2026-05-12 ultrareview-shield-followups SH-2] 🟢 LOW shield-sigint-trap-spec** — SIGINT/SIGTERM 시 trap restore_files 발화 spec 부재. 현 spec 은 정상 종료만 검증. Node test runner 가 `kill -INT <pid>` 후 정상 복원 + /tmp 잔존 0 검증 필요. 트리거: 신호 처리 회귀 차단.
- [ ] **[2026-05-12 ultrareview-shield-followups SH-3] 🟢 LOW shield-tmp-residual-gc** — SIGKILL (-9) 시 trap 우회로 `/tmp/ur-shield-*` 잔존 가능. 다음 shield 실행 시 자동 정리하는 best-effort GC 추가 검토 (timestamp > 1시간 디렉토리 sweep). 현재는 사용자 수동 정리 책임. 트리거: 운영 사고 발생 시.
- [ ] **[2026-05-12 ultrareview-shield-followups SH-4] 🟢 LOW preflight-perf-budget-baseline** — gitleaks 36분 → 12초 가속 후 baseline 측정. CI/pre-push 에서 `pnpm ur:preflight` p95 budget (예: ≤30초) regression 감지. 트리거: build-dir allowlist 회귀 시 즉시 발견.

### 2026-05-11 software-design-review-p0-p1-p2 후속 (SHOULD S-4 + 시니어 자기검토 #3 갭 A2/A3)

> **2026-05-11 sprint `software-design-review-p0-p1-p2` closure** (Mode 1 harness, iter 1 PASS, MUST 16/16 + 시니어 자기검토 라운드 #3 7건 즉시 fix + review-architecture APPROVED WITH GAPS). DESIGN_REVIEW.md 전수 closure: P0(stepper / 검증상태 컬럼+BFF 확장 / 시멘틱 토큰) + P1(모바일 카드 fallback / P-number 셀 통합 / dialog max-w-2xl + sub-tabs / 빈 상태 EmptyState SSOT wrapper) + P2(raw 색상 토큰화 / xl 와이드 2-column / 행 클릭 패턴 통일). **2026-05-12 시니어 자기검토 #3** 7갭 즉시 fix: dt/dd ddPreWrap 토큰 / backend type 일관성 / stepper actor user lookup (BFF JOIN x3) / use-approvals-bulk-mutations readonly drift / e2e spec 2종 / production build / review-architecture (controller return type / late state subset / per-field 주석). 잔여 SHOULD 3건만 deferred.


- [x] **[2026-05-12 software-design-review A2] 🟢 LOW sw-validation-cache-event-redundancy** ✅ closure (sprint `sw-validation-event-channel-separation`, 2026-05-12) — calibration 도메인 채널 책임 분리 패턴 정합 채택. `cache-event.registry.ts`에서 NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_* 4 entry 제거 + 부팅타임 `validateDualChannelExclusivity()` invariant 추가 (`cache-event-listener.ts`) — 동일 도메인 actions+patterns가 양 채널에 등록되면 NestJS bootstrap 시 fail-fast. `verify-cache-events` Step 7 + spec 5종 추가. 이제 status 전이당 invalidation: service-local (sync) + CACHE_EVENTS channel (cross-domain dashboard) 2-layer로 안정화, 양 채널 회귀 영구 차단.

- [x] **[2026-05-12 software-design-review A3] 🟢 LOW sw-validations-spec-actor-assertions** ✅ closure (sprint `sw-validation-event-channel-separation`, 2026-05-12) — `software-validations.service.spec.ts` findOne 테스트 강화. `MOCK_VALIDATION_WITH_ACTORS` fixture 추가 + 2 새 spec (actor 풍부화 확인 / LEFT JOIN null 정합). `createSelectChain` 헬퍼가 이미 `leftJoin` mock 지원하므로 drizzle-stub 자체 수정 불필요 (line 80).

- [ ] **[2026-05-12 software-design-review A6] 🟢 LOW sw-validation-stepper-storybook** ⏸ WON'T-DO (현 sprint) — `SoftwareValidationStepper` Storybook entry는 Storybook 인프라가 본 프로젝트에 미설치 (`apps/frontend/.storybook` 부재, `apps/frontend/package.json`에 `storybook`/`@storybook/*` 의존성 0건). Storybook 도입은 단독 sprint 필요 (의존성 + config + decorator + theme provider wiring + CI integration + chromatic 등). 본 sprint에서는 차단 사유만 명시. 트리거: Storybook 도입 sprint (전제 조건 미충족 상태).

### 2026-05-12 qr-visual-redesign 시니어 자기감사 후속 (SHOULD G-2~G-12)

> **2026-05-12 sprint `qr-visual-redesign` 시니어 자기감사 라운드 #2**. Evaluator PASS + iter 1 fix 후에도 시스템 깊이 일관성 12 갭 식별. G-1 (machine-verified isolation) 즉시 처리.
>
> **2026-05-12 후속 sprint `qr-visual-redesign-followups-g4-g12` closure** (Mode 2 Full harness, iter 1 PASS, MUST 28/28 + contract rev-2 명칭 정합). G-4~G-12 9건 통합 closure: G-4 text-mono SSOT 통일 (헬퍼는 `.text-mono` + tracking-wider 합성 진입점) / G-5 statusBadge tone aria-label 통합 + 8 status RTL spec / G-6 ConditionItemCard `abnormalSlot` prop + AbnormalDetailsInlineSlot 인라인 / G-7 brand-color-* 14개 + site 3개 + weak 2개 oklch 마이그레이션 (CSS Color 4 정확 변환 + WCAG AA 검증 산출물 `docs/design/oklch-migration-2026-05-12.md`) + design-tokens 6 파일 `hsl()` wrapper 0 / G-8 AutoProgressCountdown rAF 제거 + ref + CSS transition + 1s tick / G-9 React.memo StatusBadge + displayName / G-10 `apps/backend/src/common/__tests__/drizzle-stub.ts` SSOT 신설 + qr-access/audit 2 spec 마이그레이션 / G-11 toLocaleDateString locale 인자 7 site (HandoverPickerSheet + form-templates 3 + NCBanner + monitoring) + verify-hardcoding Step 37 / G-12 4x4→7x7 module grid SVG mini QR. 다중 세션 격리 (sw-validation-event-channel-separation / saved-views / cache-event-r2 / ultrareview-shield) 효과 검증. 시각 회귀 0 (oklch hex 좌표 동일).

- [x] ~~**[2026-05-12 qr-visual-redesign G-4] 🟡 MED text-mono-ssot-unify**~~ ✅ closure — 헬퍼 옵션 2 채택 (헬퍼 = `.text-mono` + tracking-wider 합성 진입점, EquipmentCardGrid `text-xs + tracking-wider` 중복 제거).
- [x] ~~**[2026-05-12 qr-visual-redesign G-5] 🟡 MED dead-i18n-tone-keys-usage**~~ ✅ closure — 옵션 (a) StatusBadge aria-label에 `t(\`tone.${tone}\`)` 통합 + 8 status × tone RTL spec.
- [x] ~~**[2026-05-12 qr-visual-redesign G-6] 🟡 MED abnormal-photo-per-card-inline**~~ ✅ closure — ConditionItemCard `abnormalSlot` prop + `AbnormalDetailsInlineSlot` 컴포넌트. 첫 abnormal 항목 카드 *내부* 인라인 (외관 > 작동 > 부속 우선순위, 부속만 abnormal 시 fallback 영역). 데이터 모델 0 변경 (서버 payload `attachmentIds` 그대로).
- [x] ~~**[2026-05-12 qr-visual-redesign G-7] 🟢 LOW oklch-precision-restore**~~ ✅ closure — brand-color-* 14 + site 3 + weak 2 = 모두 oklch (정확 hex→sRGB→linear→oklab→oklch 변환). globals.css :root + .dark + @theme alias + alpha 합성(`color-mix(in oklch, ... NN%, transparent)`) + design-tokens 6 ts 파일 동시 마이그레이션. `hsl(var(--brand-color-*))` 0건. WCAG AA 산출물 `docs/design/oklch-migration-2026-05-12.md` (13 color × 3 bg pairing 대비비 표).
- [x] ~~**[2026-05-12 qr-visual-redesign G-8] 🟢 LOW autoprogress-raf-css-transition**~~ ✅ closure — `requestAnimationFrame` + `setElapsed` 제거. `circleRef` + `style.strokeDashoffset` 직접 + CSS `transition: stroke-dashoffset ${durationMs}ms linear` 일임. 카운트다운 텍스트 `setInterval(1000ms)` (2-3 re-renders / 2s, 기존 120 → 60배 감소). reduced-motion 분기 보존.
- [x] ~~**[2026-05-12 qr-visual-redesign G-9] 🟢 LOW status-badge-memo**~~ ✅ closure — `React.memo(StatusBadgeImpl)` + `StatusBadge.displayName = 'StatusBadge'`.
- [x] ~~**[2026-05-12 qr-visual-redesign G-10] 🟢 LOW drizzle-stub-helper-extraction**~~ ✅ closure — `apps/backend/src/common/__tests__/drizzle-stub.ts` SSOT 신설 (`createDrizzleSelectChain` + `createDrizzleInsertChain` + `createDrizzleUpdateChain` + `createSequentialDrizzleStub` 4 export, JSDoc 가이드 + 두 패턴 — audit-style sequential mockReturnValueOnce + qr-access-style sequential rows). 두 spec 마이그레이션 (qr-access.spec / audit.service.spec). 24/24 jest tests PASS.
- [x] ~~**[2026-05-12 qr-visual-redesign G-11] 🟢 LOW handover-picker-formatter-i18n**~~ ✅ closure — 7 site locale 인자 추가 (HandoverPickerSheet / FormTemplateHistoryDialog / FormTemplatesTable / FormTemplatesArchivedTable(3) / NonConformanceBanner / MonitoringDashboardClient). `verify-hardcoding` Step 37 (locale safety) 신설 — RepairHistoryTimeline `ko-KR` 하드코딩만 allow-list (S-5 후속). `toLocaleString()` 숫자 포맷은 본 sprint 범위 외 (별도 후속).
- [x] ~~**[2026-05-12 qr-visual-redesign G-12] 🟢 LOW label-preview-row-mini-qr-accuracy**~~ ✅ closure — `PREVIEW_QR_PATTERN` 7×7 deterministic module grid SVG (finder pattern 3 모서리 흉내 + 16 data module). `currentColor` 적용으로 foreground 토큰 자동 적응. 3-bar placeholder 제거 — 라벨 텍스트 line hint는 미세화 (`h-[3px]`/`h-[2px]` + foreground opacity 단계).

### 2026-05-11 qr-visual-redesign 후속 (SHOULD S-1~S-8)

> **2026-05-11 sprint `qr-visual-redesign` closure** (Mode 2 Full harness, iter 1 fix loop, MUST 22/25 PASS — M-1 병렬 세션 격리 / M-16 fix / M-25 fix). 8 TASK 전체 (액션 그룹·상태 4-tier·다중 핸드오버·자동 진행·정상 우선·사진 인접화·PDF 시각화·디자인 토큰).

- [x] **[2026-05-11 qr-visual-redesign S-1] 🟡 MED qr-landing-regression-e2e** — ✅ closure 2026-05-12 (batch-1): `apps/frontend/tests/e2e/features/equipment/qr/regression-scenarios.spec.ts` 신규 — 시나리오 1/5/6 active + 2/3/4 `test.skip` (fixture setup 헬퍼 부재 사유 명시, 후속 sprint 트리거: `createCheckoutForUser` / `transitionToLenderChecked` / `multipleHandoverFixture` 도입 시 unskip).
- [ ] **[2026-05-11 qr-visual-redesign S-2] 🟢 LOW storybook-status-badge** — ⏸ **WON'T-DO** (batch-1 2026-05-12) — `apps/frontend/.storybook` 부재 + `package.json` 의존성 0. 트리거: Storybook 도입 sprint.
- [x] **[2026-05-11 qr-visual-redesign S-3] 🟢 LOW rtl-spec-handover-picker-statusbadge** — ✅ closure 2026-05-12 (batch-1): `StatusBadge.test.tsx` (g4-g12 base 4 + batch-1 추가 6 case = 10+ 충족) + `HandoverPickerSheet.test.tsx` 7 case 신규 = 24 tests PASS. CalibrationDueBadge.test.tsx 10/10 패턴 차용.
- [x] **[2026-05-11 qr-visual-redesign S-4] 🟢 LOW orphan-photo-cron-defense** — ✅ closure 2026-05-12 (batch-1): `OrphanPhotoCleanupScheduler` 신설 (`@Cron(EVERY_HOUR)` + 9 다형성 FK NULL 가드 + 24h 마진 + `document_type=condition_check_photo` SSOT + `status!=deleted`). `DocumentService.sweepOrphanConditionCheckPhotos` 메서드 + 배치 100 + 연속 실패 2회 abort. `MetricsService.incrementOrphanPhotoSweep('deleted'|'errors'|'skipped')` + `orphan_photo_sweep_total{result}` Prometheus Counter. 5/5 scheduler spec PASS.
- [ ] **[2026-05-11 qr-visual-redesign S-5] 🟢 LOW visual-regression-baseline-refresh** — ⏸ **WON'T-DO** (batch-1 2026-05-12) — Visual regression CI 미도입 (기존 `dday-6level.spec.ts` 1건만 존재, baseline 시스템/snapshot 워크플로 부재). 트리거: visual regression CI 도입 sprint.
- [x] **[2026-05-11 qr-visual-redesign S-6] 🟢 LOW handover-checkout-id-deprecation-cleanup** — ✅ closure 2026-05-12 (batch-1): production 코드 9 호출자 (backend 4 + frontend 5) + JSDoc 정리 = `handoverCheckoutId` 0건 (`grep -rn` CLEAN). `QRAccessResult` interface + `deprecatedHandoverCheckoutIdLogged` ref + log 블록 + spec backward-compat assertion 모두 제거. backend test 회귀 0. 옛 handover token API (`issueHandoverToken` / `handover_tokens`) production 0건 재확인 (M-15 영구 차단).
- [x] **[2026-05-11 qr-visual-redesign S-7] 🟢 LOW touch-target-44-to-48-audit** — ✅ closure 2026-05-12 (batch-1): `docs/exec-plans/audits/2026-05-12-touch-target-44-to-48-audit.md` 작성. 사용처 7 production 컴포넌트 모두 모바일/QR 경로 한정. desktop 영향 **0건**. WCAG SC 2.5.5 Level AAA / Material 48dp / iOS HIG 44pt 모두 충족. production 코드 변경 0.
- [ ] **[2026-05-11 qr-visual-redesign S-8] 🟢 LOW equipment-status-tone-ux-review** — ⏸ **WON'T-DO** (batch-1 2026-05-12) — 외부 UX 팀 design review 의존 (자동화 불가). 트리거: UX design review 라운드 진입 시.

### 2026-05-10 checkouts-sprint4-ux-u02-u08 후속 (SHOULD S-1~S-9 → 3건 closure)

> **2026-05-10 sprint `checkouts-sprint4-ux-u02-u08` closure** (Mode 2 Full harness, iter 2 PASS, MUST 44/44). U-02~U-06+U-08 UX 6개 기능 통합.
>
> **2026-05-12 후속 sprint `checkouts-sprint4-followups-s1-s3-s8` closure** (Mode 1 harness, iter 2 PASS, MUST 8/8 + SHOULD-A/D/E PASS, commit `f3391602`): S-1+S-3+S-8 통합. tsc EXIT=0, 24/24 jest tests PASS. 라운드 #2 자기검토에서 추가 갭 #1 (settings shortcut layout) closure, #2/#3은 후속 등록 (G-15/G-16). 신규 SSOT: `lib/checkouts/undo-constants.ts` + `lib/shortcuts/overrides.ts` + `use-bulk-undo-toast.tsx` (jest ESM axios chain 회피).
>
> **2026-05-12 후속 sprint `checkouts-sprint4-followups-s2-s4-s5-s6` closure** (Mode 2 Full harness, iter 1 PASS, MUST 21/21, commit `9787d245`): S-2 + S-4 + S-5 + S-6 통합. backend tsc EXIT=0 / frontend tsc EXIT=0 / lint EXIT=0 / jest 23/23 PASS. SSOT 신설: `VALIDATION_RULES.DESTINATION_MAX_LENGTH(255)` + `SORT_ORDER_MAX(9999)` + 4 endpoint (REJECTION_PRESETS_*) + audit `rejection_preset` entity + `REJECTION_PRESET_IS_DEFAULT` ErrorCode. ADR-0011 (fuzzy-search 자체 구현 유지, 4 정량 트리거). DB: 0058 manual SQL migration (ADR-0010). i18n admin namespace 신설 + i18n loader 등록. S-2 CheckoutDetailClient 통합은 후속 분리.

- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-2] revoke-window-extended-toast**~~ — closure `9787d245`.
- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-4] reject-preset-admin-ui**~~ — closure `9787d245`.
- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-5] fuzzy-search-lib-decision**~~ — closure `9787d245` (ADR-0011 자체 구현 유지).
- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-6] destination-inline-create**~~ — closure `9787d245`.
- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-7] 🟢 LOW saved-views-team-share**~~ — closure (sprint `saved-views-team-share`, 2026-05-13). 새 backend 모듈 `saved-views` + DB 0059 manual SQL migration + scope 트리아드(PRIVATE/TEAM/GLOBAL) + CAS + RBAC + audit `saved_view` + SSOT 6위치 + frontend TanStack Query 마이그레이션 + 명시 import banner. 28/28 jest PASS, tsc EXIT=0.
- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-9] 🟢 LOW saved-views-dnd-storybook** — `SavedViewsToolbar` 드래그 정렬 Storybook entry. **차단**: Storybook 미설치 (`NextStepPanel.stories.tsx` orphan). 트리거: Storybook 도입 sprint 선행 후 일괄 처리.

### 2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 후속 (SH-1~SH-7)

> 본 sprint commit 후 등록된 SHOULD/EXT 항목. e2e 시나리오 3건 (Mode 2 file budget 25-30 유지를 위해 분리), 운영 안정성 후속 3건.
>
> **2026-05-12 후속 sprint `checkouts-sprint4-followups-sh1-sh7` closure** (Mode 1 harness, MUST 충족, commits `d8c5fda2` SH-7 통합 + `47efc4e9` SH-1/2/3 specs): SH-1+SH-2+SH-3+SH-7 4건 통합. tsc EXIT=0 / lint-staged EXIT=0 (self-audit + i18n parity 0건). Playwright list 81 tests in 4 files 인식. 신규 SSOT: `revokeApprovalWithReason` API client function (backend revoke-approval.dto 정합 — version + reason 필수). i18n: revokeApprovalSuccess/Error ko+en parity. **architectural fix**: 기존 `revokeApproval(checkoutId)` body 없는 호출 — backend ZodValidationPipe 항상 400 → `use-undo-toast` 자동 트리거 broken 발견. 본 sprint scope에서 정책 결정 (system reason vs 별도 `/undo-approval` endpoint) 분리 → SH-8 신규 tech-debt 등록.

- [x] ~~**[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-1] rejection-presets-admin-e2e**~~ — closure `47efc4e9`. systemAdmin 4 endpoint + isDefault 보호 + testOperator 권한 거부 redirect 7 step 검증.
- [x] ~~**[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-2] revocation-window-e2e**~~ — closure `47efc4e9`. `page.clock.install` + `fastForward(APPROVAL_REVOCATION_WINDOW_MS + 1000)` 5분 가속, 활성/만료 swap 검증.
- [x] ~~**[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-3] destination-create-e2e**~~ — closure `47efc4e9`. browse/create 모드 분기 + DESTINATION_MAX_LENGTH 경계 + 중복 차단 5 step.
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-4] 🟢 LOW rejection-presets-sortorder-index** — `rejection_presets.sort_order` DB index. 현재 행 적어 미적용. 트리거: 1000+ rows 도달 시 (admin entity 특성상 미도달 가능성 큼).
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-5] 🟢 LOW revocation-window-server-time-skew** — `useRevocationWindow` client `Date.now()` 기반. clock skew > 5초 환경에서 ±5초 오차. server-time endpoint 또는 `Date` header 활용 검토. 트리거: 다국어 다중 zone 서비스 또는 사용자 환경 clock issue 보고.
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-6] 🟢 LOW destination-entity-promotion** — `destination` varchar(255) → 별도 테이블 승격 검토 (autocomplete 풍부화 + 분석용). 트리거: destination 분석 요구 또는 dataset > 500 도달.
- [x] ~~**[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-7] checkout-detail-revocation-integration**~~ — closure `d8c5fda2`. CheckoutDetailClient + RevocationWindowCountdown 통합 (status === APPROVED + approverId === currentUserId 가드), revokeMutation useOptimisticMutation, invalidateQueries 전용.

### 2026-05-13 checkouts-sprint4-followups-sh1-sh7 라운드 #2 시니어 자기검토 closure (G-1~G-7)

> 본 sprint Evaluator PASS 후 사용자 압력 "타협 X / 시스템 전반 / 단편적 X" 로 라운드 #2 자기검토 진행. 7갭 식별, 5갭 즉시 closure (commit `e176b514`), 2갭 신규 tech-debt 등록.
>
> **commit `e176b514` closure 내용**:
> - G-1 `revokeApproval` API 단일화 — `revokeApprovalWithReason` 함수 제거, 단일 `revokeApproval(checkoutId, params)` 시그니처.
> - G-2 schema-infer SSOT 승격 — `packages/schemas/src/revoke-approval.ts` 신설, `revokeApprovalSchema` + `RevokeApprovalInput` + `SYSTEM_UNDO_REVOCATION_REASON` 상수. backend dto 와 frontend API client 양쪽 단일 import. `SCHEMA_VALIDATION_RULES` 에 `REVOCATION_REASON_MIN_LENGTH` + `LONG_TEXT_MAX_LENGTH` 승격, shared-constants 단방향 wire (의존 그래프 보존).
> - G-3 / SH-8 closure — `use-undo-toast` 가 `getCheckout` 으로 fresh version 확보 + `SYSTEM_UNDO_REVOCATION_REASON` 전달. sprint 4 commit `c01452f3` 잔존 broken state 해소 — 5초 undo 토스트 실제 동작.
> - G-4 admin `data-testid` 신설 — `rejection-presets-admin` / `rejection-preset-add` / `rejection-preset-row-{id}` + `data-is-default`. e2e i18n 텍스트 의존 0.
> - G-5 SH-2 e2e deep-test — dialog open + min-length 검증 + submit + backend status PENDING 응답 검증 step 추가.

- [x] ~~**[2026-05-12 checkouts-sprint4-followups-sh1-sh7 SH-8] use-undo-toast-revoke-policy**~~ ✅ closure `e176b514`. 라운드 #2 자기검토에서 architectural fix 채택 — frontend system reason 옵션 (b) 채택. `SYSTEM_UNDO_REVOCATION_REASON` SSOT 상수 (packages/schemas) + `getCheckout` 으로 fresh version 확보. UL-QP-18 정책 "철회 시 사유 필수" 는 시스템 자동 트리거에도 시스템 명시 사유로 충족.

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

