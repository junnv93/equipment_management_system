# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).
완료 항목 및 빈 sprint 헤더는 본 문서에서 제거한다.


## Open

### 2026-05-11 software-design-review-p0-p1-p2 후속 (SHOULD S-4)

> **2026-05-11 sprint `software-design-review-p0-p1-p2` closure** (Mode 1 harness, iter 1 PASS, MUST 16/16). DESIGN_REVIEW.md 전수 closure: P0(stepper / 검증상태 컬럼+BFF 확장 / 시멘틱 토큰) + P1(모바일 카드 fallback / P-number 셀 통합 / dialog max-w-2xl + sub-tabs / 빈 상태 EmptyState SSOT wrapper) + P2(raw 색상 토큰화 / xl 와이드 2-column / 행 클릭 패턴 통일).

- [ ] **[2026-05-11 software-design-review S-4] 🟢 LOW software-validation-stepper-e2e** — Playwright e2e: `tests/e2e/features/software/validation-stepper.spec.ts` (페이지 로드 후 stepper 단계 노출 + draft 상태 stepper hide + rejected terminated marker). + `list-validation-status.spec.ts` (TestSoftwareListContent의 "검증 상태" 컬럼 6분류 렌더링: 미검증/draft/submitted/approved/quality_approved/rejected). 본 sprint는 manual 검증으로 대체. 트리거: e2e 인프라 후속 sprint.

### 2026-05-12 qr-visual-redesign 시니어 자기감사 후속 (SHOULD G-2~G-12)

> **2026-05-12 sprint `qr-visual-redesign` 시니어 자기감사 라운드 #2**. Evaluator PASS + iter 1 fix 후에도 시스템 깊이 일관성 12 갭 식별. G-1 (machine-verified isolation) 즉시 처리. G-2~G-12 후속 등록 — MEMORY `feedback_evaluator_pass_senior_self_audit.md` + `feedback_repeated_self_audit.md` 패턴.

- [ ] **[2026-05-12 qr-visual-redesign G-2] 🔴 HIGH verify-implementation-run-full-13-skills** — `verify-implementation` skill 전체 13 verify-* 실행 + `review-architecture` 실행. Contract M-17/M-18 정식 통과 증명. 현재 SKIP 상태. 트리거: 본 sprint PR 머지 전 별도 검증 패스 필수.
- [ ] **[2026-05-12 qr-visual-redesign G-3] 🔴 HIGH commit-da1dbc0e-isolate-software-files** — `da1dbc0e` commit이 lint-staged 흡수로 다른 세션 software/* 4파일 + 1 design-token 파일 포함. PR 분리 옵션: (a) commit `da1dbc0e` interactive rebase 분리 — `test-software.service.ts` + `software-api.ts` + `software.ts` + `software.json` ko/en 을 별도 commit으로 추출하여 `software-design-review-p0-p1-p2` PR에 포함 / (b) PR 머지 전 cherry-pick로 isolated branch에서 검증. 트리거: 다음 commit pipeline 사고 발생 시 우선순위 격상.
- [ ] **[2026-05-12 qr-visual-redesign G-4] 🟡 MED text-mono-ssot-unify** — `.text-mono` (globals.css util class) vs `getManagementNumberClasses()` (brand.ts 헬퍼) 분기 SSOT. 통합 결정 필요: (1) `.text-mono` 단일화 후 `getManagementNumberClasses()` deprecated → 모든 호출자 마이그레이션 / (2) 두 SSOT 명시 분기 사유 문서화 (헬퍼는 + tracking-wider, util은 size only). 트리거: design token consolidation sprint.
- [ ] **[2026-05-12 qr-visual-redesign G-5] 🟡 MED dead-i18n-tone-keys-usage** — `qr.statusBadge.tone.{ok,warn,urgent,mute}` 4 키가 코드에서 미사용 (M-16 fix용 더미). 조치 옵션: (a) `StatusBadge` aria-label에 `t(\`tone.\${tone}\`)` 통합 — screenreader가 톤 의미 인식 / (b) tooltip text에 사용 / (c) contract M-16 수정 요청 후 키 제거. 트리거: a11y review sprint.
- [ ] **[2026-05-12 qr-visual-redesign G-6] 🟡 MED abnormal-photo-per-card-inline** — Contract TASK 5/6 "abnormal 카드 *내부*에 사진 영역 인라인" 정확 충족 미흡. 현 구현: hasAbnormal 시 통합 `<div>` 한 곳 (다중 항목 abnormal 동시 입력 trade-off). 항목별 카드 내부 사진 첨부 + 사진 그리드 통합 라이브러리 (DocumentRef SSOT) 도입 시 정확 일치. 트리거: 점검 폼 UX 후속.
- [ ] **[2026-05-12 qr-visual-redesign G-7] 🟢 LOW oklch-precision-restore** — 프롬프트 원문 `oklch(0.62 0.17 38)` vs 구현 HSL `17 67% 51%` 근사. codebase 기존 brand-color-* 패턴이 HSL 채널 형식 — 일관성 trade-off. WCAG AA 대비비는 양쪽 통과. oklch native CSS 지원 확대 시 마이그레이션. 트리거: design system v2 sprint.
- [ ] **[2026-05-12 qr-visual-redesign G-8] 🟢 LOW autoprogress-raf-css-transition** — `AutoProgressCountdown` rAF 매 frame `setElapsed` → 60fps × 2s = 120 re-renders. ref + `style.strokeDashoffset` 직접 변경 + CSS `transition` 일임으로 React reconciliation 0회. 시각 동기화 의도지만 모바일 저전력 환경 영향. 트리거: 성능 회귀 발견 시.
- [ ] **[2026-05-12 qr-visual-redesign G-9] 🟢 LOW status-badge-memo** — `StatusBadge` EQUIPMENT_STATUS_TONE + TONE_TO_SEMANTIC + BRAND_CLASS_MATRIX 3-hop lookup. O(1) lookup × O(N) 카드 = N hops. 재렌더링이 잦은 위치(QR 랜딩 카드는 단일 인스턴스라 무관)에서 영향. `React.memo` + status-only props 캐싱 검토. 트리거: profiler에서 hot path 발견 시.
- [ ] **[2026-05-12 qr-visual-redesign G-10] 🟢 LOW drizzle-stub-helper-extraction** — `qr-access.service.spec.ts` 의 `makeDbStub` fluent chain stub — 다음 Drizzle method 추가 시 stub 갱신 필요. `apps/backend/src/common/__tests__/drizzle-stub.ts` SSOT로 추출 + Repository pattern (Unit of Work) 도입 검토. 트리거: 백엔드 test infra sprint.
- [ ] **[2026-05-12 qr-visual-redesign G-11] 🟢 LOW handover-picker-formatter-i18n** — `HandoverPickerSheet.toLocaleDateString()` 브라우저 locale 의존 — 한국 사용자 + en locale 시 'M/D/YYYY'. `useFormatter()` (next-intl) 경유 또는 명시 locale 인자 사용. 트리거: i18n a11y full pass.
- [ ] **[2026-05-12 qr-visual-redesign G-12] 🟢 LOW label-preview-row-mini-qr-accuracy** — `EquipmentQRButton LabelPreviewRow` mini QR placeholder 3-bar grey rect → 4×4 module grid SVG (실제 QR 시각화). 사용자 사이즈 비교 시 정확성 향상. 트리거: design polish sprint.

### 2026-05-11 qr-visual-redesign 후속 (SHOULD S-1~S-8)

> **2026-05-11 sprint `qr-visual-redesign` closure** (Mode 2 Full harness, iter 1 fix loop, MUST 22/25 PASS — M-1 병렬 세션 격리 / M-16 fix / M-25 fix). 8 TASK 전체 (액션 그룹·상태 4-tier·다중 핸드오버·자동 진행·정상 우선·사진 인접화·PDF 시각화·디자인 토큰).

- [ ] **[2026-05-11 qr-visual-redesign S-1] 🟡 MED qr-landing-regression-e2e** — Playwright e2e for 6 회귀 시나리오. 시나리오: available+시험소일치→request_checkout primary / checked_out+본인→mark_returned primary / lender_checked+본인 borrower→auto-progress / 2 lender_checked→picker / non_conforming→urgent tone / 다음 교정 D-7→CalibrationDueBadge. 트리거: e2e 인프라 후속 sprint.
- [ ] **[2026-05-11 qr-visual-redesign S-2] 🟢 LOW storybook-status-badge** — StatusBadge (4 tones × 8 statuses) + HandoverPickerSheet + AutoProgressCountdown + CalibrationDueBadge Storybook entries. 트리거: Storybook 도입 sprint.
- [ ] **[2026-05-11 qr-visual-redesign S-3] 🟢 LOW rtl-spec-handover-picker-statusbadge** — HandoverPickerSheet.test.tsx + StatusBadge.test.tsx 신규. M-25 CalibrationDueBadge 10/10 패턴 차용. 트리거: 추가 RTL 커버리지 sprint.
- [ ] **[2026-05-11 qr-visual-redesign S-4] 🟢 LOW orphan-photo-cron-defense** — 백엔드 cron `condition_check_photo` + null FK + 24h sweep. 현재 frontend `documentApi.deleteOrphan` (best-effort) + `useEffect cleanup` 1중 안전망. 2중 안전망 필요. 트리거: 운영 안정성 sprint.
- [ ] **[2026-05-11 qr-visual-redesign S-5] 🟢 LOW visual-regression-baseline-refresh** — 4-tier 색 분리 + 그룹 렌더로 기존 시각 baseline 만료. 트리거: visual regression CI 도입 시.
- [ ] **[2026-05-11 qr-visual-redesign S-6] 🟢 LOW handover-checkout-id-deprecation-cleanup** — `QRAccessResult.handoverCheckoutId` 1 release 후 제거. 모든 호출자가 `handovers[].id` 사용 확인 후 backend interface + frontend type + controller wire 제거. 트리거: 다음 sprint 이후.
- [ ] **[2026-05-11 qr-visual-redesign S-7] 🟢 LOW touch-target-44-to-48-audit** — `--touch-target-min` 44→48px 상향 영향 audit (모바일 시트/액션 외 hit-area). 트리거: design QA pass.
- [ ] **[2026-05-11 qr-visual-redesign S-8] 🟢 LOW equipment-status-tone-ux-review** — `EquipmentStatus` 8 values tone 매핑 UX 팀 검토 (spare/inactive=mute, temporary=warn 적정성). 트리거: UX 팀 design review.

### 2026-05-10 checkouts-sprint4-ux-u02-u08 후속 (SHOULD S-1~S-9 → 3건 closure)

> **2026-05-10 sprint `checkouts-sprint4-ux-u02-u08` closure** (Mode 2 Full harness, iter 2 PASS, MUST 44/44). U-02~U-06+U-08 UX 6개 기능 통합.
>
> **2026-05-12 후속 sprint `checkouts-sprint4-followups-s1-s3-s8` closure** (Mode 1 harness, iter 2 PASS, MUST 8/8 + SHOULD-A/D/E PASS, commit `f3391602`): S-1+S-3+S-8 통합. tsc EXIT=0, 24/24 jest tests PASS. 라운드 #2 자기검토에서 추가 갭 #1 (settings shortcut layout) closure, #2/#3은 후속 등록 (G-15/G-16). 신규 SSOT: `lib/checkouts/undo-constants.ts` + `lib/shortcuts/overrides.ts` + `use-bulk-undo-toast.tsx` (jest ESM axios chain 회피).

- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-1] shortcuts-settings-page**~~ — closure `f3391602`.
- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-2] 🟢 LOW revoke-window-extended-toast** — revoke-approval 5분 보상 경로 UI (창 만료 후 철회 불가 안내). 트리거: 반출 상세 후속 UX sprint.
- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-3] bulk-undo-toast**~~ — closure `f3391602`.
- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-4] 🟢 LOW reject-preset-admin-ui** — 반려 사유 프리셋 Admin CRUD UI. 현재는 backend seed 고정값. 트리거: 관리자 설정 화면 sprint.
- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-5] 🟢 LOW fuzzy-search-lib-decision** — fuse.js vs 자체 fuzzy 번들 크기 비교 후 결정. 현재 NFD+lowercase 자체 구현 (`lib/utils/fuzzy-search.ts`). 트리거: bundle 최적화 sprint.
- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-6] 🟢 LOW destination-inline-create** — CheckoutDestinationCombobox에서 새 목적지 인라인 등록 폼. 현재는 `+ Add new` 옵션이 값만 삽입. 트리거: 반출 생성 UX 후속.
- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-7] 🟢 LOW saved-views-team-share** — Saved Views 팀 공유 (현재 localStorage만). 서버 저장 API 설계 필요. 트리거: 협업 기능 sprint.
- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-8] qr-drawer-code-split**~~ — closure `f3391602`.
- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-9] 🟢 LOW saved-views-dnd-storybook** — `SavedViewsToolbar` 드래그 정렬 Storybook entry. 트리거: Storybook 도입 sprint.

### 2026-05-12 checkouts-sprint4-followups-s1-s3-s8 라운드 #2 자기검토 후속 (G-15~G-17)

> 본 sprint iter 2 PASS 후 라운드 #2 자기검토에서 식별. G-1(Provider scope) 즉시 closure (settings/shortcuts/layout.tsx), 나머지 3건 후속 등록.

- [ ] **[2026-05-12 followups G-15] 🟡 MED shortcuts-context-api-consistency** — `ShortcutsSettingsContent.tsx`가 `KeyboardShortcutsContext`의 `setOverride`/`clearOverride`/`resetAllOverrides` 사용 안 하고 `lib/shortcuts/overrides.ts` helper 직접 호출. settings/shortcuts/layout.tsx로 Provider mount 후에는 Context API 사용 가능 → 같은 탭 내 즉시 sync 보장. 트리거: 단축키 도메인 다음 enhancement sprint.
- [ ] **[2026-05-12 followups G-16] 🟡 MED shortcut-overrides-multi-tab-sync** — `KeyboardShortcutsProvider`에 `window.addEventListener('storage')` listener 미등록. 한 탭에서 변경 시 다른 탭에서 navigate 없이 즉시 반영 안 됨. 추가 시 ~7 라인. 트리거: multi-tab UX 후속 sprint.
- [ ] **[2026-05-12 followups G-17] 🟢 LOW i18n-parity-automation-spec** — 본 sprint 8+ 키 추가 PASS, 회귀 차단 자동 spec 없음. 모든 도메인 `messages/ko/*.json` vs `messages/en/*.json` 키 sorted equality 검증 jest spec 신설. 트리거: i18n governance sprint.

### 2026-05-10 large-component-refactor 후속 (SHOULD S-2, S-5, S-1)

> **2026-05-10 sprint `large-component-refactor` closure (Mode 2 Full harness, iter 1 PASS, MUST 16/16)**. EquipmentForm(1418→543) + InspectionFormDialog(1362→577) + NCDetailClient(1104→499). 총 11개 신규 파일 (6 hooks + 13 sections).

- [ ] **[2026-05-10 large-component-refactor S-2] 🟢 LOW dynamic-import-location-ssot** — `EquipmentForm.tsx`에 `CalibrationInfoSection` + `StatusLocationSection` 2개 dynamic import 잔류. 나머지 5개는 `HistoryAttachmentStep.tsx`로 이동됨. 모든 dynamic import를 leaf-section으로 이동하면 EquipmentForm이 순수 orchestrator가 됨. 트리거: EquipmentForm 리팩토링 후속 sprint.
- [ ] **[2026-05-10 large-component-refactor S-5] 🟢 LOW inspection-basic-info-context-coupling** — `InspectionBasicInfoSection.tsx`가 `useInspectionForm()` 컨텍스트를 직접 호출(`isMasterPrefilledField`). 계산된 props 수신 패턴 위반 — 부모가 `inspectionCycleIsPrefilled: boolean`, `calibrationValidityPeriodIsPrefilled: boolean` 전달하도록 분리 권장. 트리거: InspectionFormDialog 리팩토링 후속 sprint.
- [ ] **[2026-05-10 large-component-refactor S-1] 🟢 LOW section-file-line-count-reduction** — 6개 파일이 권장 200 lines 초과: InspectionItemsSection(230), NCInfoCards(260), InspectionBasicInfoSection(180), MeasurementEquipmentSection(103). 특히 InspectionItemsSection의 item card rendering 서브컴포넌트(`InspectionItemCard`) 추출 고려. 트리거: 후속 점검 폼 리팩토링.

### 2026-05-10 sticky-header-css-var-ssot 후속 (SHOULD S-4)

> **2026-05-10 sprint `sticky-header-css-var-ssot` closure** (Mode 1 harness, iter 2 PASS, MUST 12/12). 본 sprint scope 외 발견 후속 1건만 잔여.

- [ ] **[2026-05-10 sticky-header-css-var-ssot S-4] 🟢 LOW css-var-z-sticky-ssot-extension** — `--z-sticky` (bulk-action-bar.ts:18) Tailwind class string literal 만 존재 + globals.css `:root` 정의 0 + JS setProperty 호출 0 (현재는 fallback `20`만 사용). `CSS_VAR_NAMES` 확장 후보로 등록. 트리거: (1) JS 측에서 z-index 동적 변경 필요 발생 시점 / (2) globals.css `:root` 에 `--z-sticky` 정의 추가 결정 시점. 둘 중 먼저 발생 시점에 `CSS_VAR_NAMES.zSticky: '--z-sticky'` 추가 + bulk-action-bar.ts SSOT 주석 갱신. 현재는 over-engineering (단일 string literal 1 location, 동적 호출 0).

### 2026-05-07 calibration-cert-phase-a-architecture-closure (Mode 2 atomic, 옵션 C closure)

> Phase A 사용자-facing 마감 후(commit `80e77488`까지) 시니어 자기 감사로 식별된 *시스템 전반 일관성* 갭 6건. **2026-05-07 sprint `calibration-cert-phase-a-architecture-closure` 옵션 C closure + 2026-05-08 후속 sprint `phase-a-arch-followup` 흡수** — Gap 1 (sub-route) ✅ + Gap 2a/2b (FilterChip 컴포넌트 추출 + CalibrationContent 마이그레이션) ✅ + Gap 3 (design token) ✅ + Gap 4 (useEquipment 별도 fetch) ✅ + Gap 5 (entityIdPath) ✅ + Gap 6a/6b (RTL specs Dialog + Content) ✅ + 자기검토 #2 sub-route navigation-metadata SSOT ✅. archive batch `calibration-cert-phase-a-architecture-closure (+ followup)`.
>
> 자기검토 #3 라운드 5건 (4 valid + 1 STALE) — **2026-05-08 sprint `phase-c-followup-closure` 통합 closure** (Mode 2 Full harness, commit `0587277c`) + **2026-05-09 라운드 #2 systemic gap 2건 closure** (commit `e410f275` — sentinel `_all` 통일 + BasicInfoTab hook) + **2026-05-09 라운드 #3 systemic SSOT closure** (commit `a0ecb671` — EquipmentTabFooterLink 컴포넌트 + 메인 calibration sentinel `_all` 5 필터 통일). archive batch `phase-c-followup-closure (+ r2/r3)`.
>
> 잔여 (자기검토 #3 architectural decision 대기): Tab vs Sub-route 중복 architecture (Option A~D 결정 후 별도 sprint trigger). **2026-05-09 sprint `tab-subroute-architecture-decision-closure` closure** — ADR-0009 Option C 공식 채택 + CalibrationHistorySection SSOT fix + 5 tab JSDoc 보강.

### 2026-05-09 verify-impl-preexisting-ssot-closure 후속 (Step 28)

> **2026-05-09 sprint `tech-debt-5items-closure` closure**: step28-S-1 MaintenanceHistoryTab brand 인라인 리터럴 ✅ (MAINTENANCE_TIMELINE_TOKENS 신설 + 4건 교체). disposal-zod S-2 discriminatedUnion ✅ (다른 세션). approvals srp-final S-2/S-3 ✅ (다른 세션). bulk-tabs filtersKey memo ✅. Mode 2 harness PASS (iter 2, MUST 17/17). archive batch `tech-debt-5items-closure`.

### 2026-05-09 three-low-tech-debt-closure 후속 (SHOULD)

> **2026-05-09 sprint `sort-rejection-cluster-prometheus` closure (Mode 1, iter 1 PASS)**: S-1 + S-3 통합 closure. `SortRejectionRedisRateLimiterService` 신설 (Redis Lua atomic + in-memory fallback, `sr:` key prefix). `SortRejectionTelemetryService` in-memory 상태 제거 → rateLimiter DI + async fire-and-forget. `MetricsService` `sort_rejection_total{route,reason}` + `sort_rejection_drops_total{reason}` Counter 추가. 21 tests PASS, 15/15 MUST + 3/3 SHOULD. archive batch `sort-rejection-cluster-prometheus`.

### 2026-05-08 zod-i18n-mapper-hub-closure 후속 (SHOULD S-4)

> **2026-05-09 sprint `zod-hub-should-s4-followups` closure (Round #2 + #3 확장)**: 1라운드 alert-rule + e2e-toast ✅ + ESLint [SKIP-trigger-not-met]. **시니어 자기검토 라운드 #2** 운영 maturity 3건 closure (annotations + 운영 문서 + promtool). **라운드 #3** systemic gap 3건 closure (alertmanager Slack 템플릿 runbook 노출 + en locale e2e + NC seed helper partial). 분리 등록 3건 잔여 (실 playwright 실행 / threshold baseline / NC seed full migration) 아래 명시. archive batch `zod-hub-should-s4-followups (+ r2/r3)`.

- [SKIP-trigger-not-met] **[2026-05-08 zod-hub S-4 후속] 🟢 LOW zod-fallback-eslint-custom-rule-migration** ⏸ 트리거 미충족 (2026-05-09 평가) — 4 조건 현황: (1) **신규 도메인 mapper 추가 횟수 (2026-05-08~)**: 0/3 ❌ — `zod-i18n-mapper-hub-closure` ratification 후 신규 mapper 0건. (2) **ts-morph spec 회귀 검출 능력**: 17 도메인 100% 커버, jest 실행 < 1s — 충분 ✅. (3) **ESLint custom rule 도입 비용**: TS AST 기반 rule + 단위 테스트 + plugin 등록 ≥ 100 LOC + 유지보수 부채 — 상당 ⚠️. (4) **편집기 실시간 피드백 가치**: 신규 mapper 추가 시점에만 의미. 현 워크플로 (`pnpm test` 자동 실행) 와의 격차 < 5초 — 한계적 ⚠️. → 1/4 충족 + over-engineering risk → SKIP. ts-morph spec SSOT 유지. 재검토 트리거: 신규 도메인 mapper 추가 3회 이상 누적 시. `commit-pipeline-safety S-4` (2026-05-06) `[SKIP-trigger-not-met]` 패턴 답습.

### 2026-05-09 zod-hub-should-s4-followups 라운드 #2/#3 후속

> **라운드 #3 closure (사용자 #3차 "타협 X" 압력 대응)**: 갭-D (en parity e2e) ✅ + 갭-E partial (helper 추출 + zod-fail-toast 마이그레이션, nc-rejection-flow 보존) + 갭 alertmanager template runbook 노출 ✅. 분리 등록 3건 잔여 (아래).


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

### 2026-05-06 commit-pipeline-safety SHOULD 후속

> **2026-05-06~07 closure sprint** (`commit-pipeline-safety-should-followups` + 시니어 #3 라운드 `commit-pipeline-safety-should-followups-r3`): S-2/S-3/S-5 + 자기검토 #2 갭 (BACKEND_MODULE_SCOPES 24→26 + fs-based sync spec) + 시니어 #3 라운드 (timing-log rotation + CLAUDE.md backend modules count update).
> S-4 SKIP (트리거 미충족 정직 처리).
> 관련 산출물: `scripts/verify-lint-ruleset-parity.mjs` (packages 도메인 추가),
> `commitlint.config.js` (SCOPE_LIST SSOT 26 backend + 19 meta = 45),
> `scripts/__tests__/commitlint-config.spec.mjs` (fs ↔ SCOPE_LIST 1:1 자동 검증 spec + markdown table parser fs-sync spec),
> `scripts/hook-timing.mjs` (opt-in 측정 + `rotateTimingLogIfNeeded`),
> `.husky/pre-commit` + `.husky/pre-push` (timing wrapper 통합).

- [SKIP-trigger-not-met] **[2026-05-06 commit-pipeline S-4] 🟢 LOW git-worktree-per-session-adr** ⏸ 트리거 미충족 (2026-05-06 검증) — ADR-0007 §Trigger Conditions 4 조건 현황: (1) **race incident**: 본 월 2건 < 3건 임계값 ❌, (2) **commit 흡수 사고 main 진입**: 0건 (push 전 검증으로 차단됨) ❌, (3) **동시 세션 정기**: 통상 1-2개 < 3개 임계값 ❌, (4) **`verify-lint-ruleset-parity` parity 회귀**: 0회 (도입 후 fail 0) ❌. 0/4 충족 — ADR-0008 신설 비용 (worktree 동기화 모델 + hook 격리 재설계) 대비 실익 0. 현 ADR-0007 hook 가드 + memory feedback (`feedback_lintstaged_other_session_files.md`) 정책으로 충분. 재검토 트리거: 위 4 조건 중 1개라도 충족 시 ADR-0008 sprint 시작. 참조: [`docs/adr/0007-multi-session-working-tree-safety.md`](../../docs/adr/0007-multi-session-working-tree-safety.md#trigger-conditions-for-reconsideration).

