# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).
완료 항목 및 빈 sprint 헤더는 본 문서에서 제거한다.


## Open

### 2026-05-12 ultrareview-shield-wrapper 후속 (2건)

> **2026-05-12 sprint `ultrareview-shield-wrapper` closure** (Mode 1 harness, iter 2 PASS, MUST 12/12 + SHOULD S-1/S-2/S-4 PASS). `pnpm ur:shield` 신설로 preflight Gate 1 dev `.env` 자동 격리/복원. SSOT 단방향(preflight `--list-patterns`) + `flock` + `trap EXIT` + `/tmp` 격리. 사고 학습 후속 2건 등록.

- [ ] **[2026-05-12 ultrareview-shield T-1] 🟠 HIGH ultrareview-shield-self-test-isolation** — 평가/검증 단계에서 실데이터(`.env`) 영향 회피. `scripts/__tests__/ultrareview-shield.spec.mjs` integration spec 신설: `child_process.spawn`으로 shield 실행 + fake `.env` (`mktemp` 임시 디렉토리 + dummy content) + 격리/복원 자동 검증 + `/tmp/ur-shield-*` 잔존 0 확인. shield 자체에 `--self-test` 모드 추가 (실 working tree 손대지 않음). 트리거: 본 sprint 후속 즉시 권장 (사고 재발 차단).
- [ ] **[2026-05-12 ultrareview-shield T-2] 🟡 MED ultrareview-preflight-gitleaks-allowlist** — preflight 검사 2/3 (gitleaks) FAIL 분리 처리. `.env` 격리 후에도 working tree 다른 secret 출처가 gitleaks 잡힘. `gitleaks detect --no-git --source . --verbose --config .gitleaks.toml` 직접 실행하여 출처 식별 + `.gitleaks.toml` allowlist 또는 `.gitleaksignore` fingerprint 보강. 트리거: ultrareview 실 사용 직전 sprint. **[2026-05-12 진단] preflight `EXIT=1` 재현 확인 — 검사 1/3(`.env.test`, `apps/frontend/.env.local`, `apps/backend/.env` 3종 존재, ur:shield로 격리 가능) + 검사 2/3(gitleaks 의심 패턴, T-2 본 트리거). 첫 진단 PASS 오판은 `gitleaks ... | tail` pipeline의 종료 코드가 tail로 가려진 측정 오류 — 향후 진단은 `gitleaks detect --no-git --source . --verbose --config .gitleaks.toml` 직접 실행 (pipe 금지). 별도 후속: preflight 자체 성능 (node_modules 포함 15~36분 소요) → paths allowlist 추가 검토.**

### 2026-05-11 software-design-review-p0-p1-p2 후속 (SHOULD S-4 + 시니어 자기검토 #3 갭 A2/A3)

> **2026-05-11 sprint `software-design-review-p0-p1-p2` closure** (Mode 1 harness, iter 1 PASS, MUST 16/16 + 시니어 자기검토 라운드 #3 7건 즉시 fix + review-architecture APPROVED WITH GAPS). DESIGN_REVIEW.md 전수 closure: P0(stepper / 검증상태 컬럼+BFF 확장 / 시멘틱 토큰) + P1(모바일 카드 fallback / P-number 셀 통합 / dialog max-w-2xl + sub-tabs / 빈 상태 EmptyState SSOT wrapper) + P2(raw 색상 토큰화 / xl 와이드 2-column / 행 클릭 패턴 통일). **2026-05-12 시니어 자기검토 #3** 7갭 즉시 fix: dt/dd ddPreWrap 토큰 / backend type 일관성 / stepper actor user lookup (BFF JOIN x3) / use-approvals-bulk-mutations readonly drift / e2e spec 2종 / production build / review-architecture (controller return type / late state subset / per-field 주석). 잔여 SHOULD 3건만 deferred.


- [ ] **[2026-05-12 software-design-review A2] 🟢 LOW sw-validation-cache-event-redundancy** — `software-validations.service`에서 status 전이(`submit`/`approve`/`qualityApprove`/`reject`) 시 NOTIFICATION_EVENTS + CACHE_EVENTS 양쪽이 동일 SW_VALIDATION 패턴으로 emit → registry가 같은 키 3× 무효화. 의미상 NOTIFICATION_EVENTS는 알림용, CACHE_EVENTS는 캐시 정책용으로 책임 분리되어야 함. 옵션: (a) registry에서 dedupe (b) NOTIFICATION_EVENTS 리스너에서 cache invalidation 분리. 트리거: cache-event 정책 전반 리뷰 sprint.

- [ ] **[2026-05-12 software-design-review A3] 🟢 LOW sw-validations-spec-actor-assertions** — `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts` `findOne` 테스트가 `submitterName`/`technicalApproverName`/`qualityApproverName` LEFT JOIN 필드 미검증. drizzle-stub의 `from().leftJoin().leftJoin().leftJoin().where().limit()` chain mock 갱신 필요. 트리거: backend test infra sprint.

- [ ] **[2026-05-12 software-design-review A6] 🟢 LOW sw-validation-stepper-storybook** — `SoftwareValidationStepper` Storybook entry — 4 state(done/current/future/terminated) × 3 step + actor name with/without 변형. 트리거: Storybook 도입 sprint.

### 2026-05-12 qr-visual-redesign 시니어 자기감사 후속 (SHOULD G-2~G-12)

> **2026-05-12 sprint `qr-visual-redesign` 시니어 자기감사 라운드 #2**. Evaluator PASS + iter 1 fix 후에도 시스템 깊이 일관성 12 갭 식별. G-1 (machine-verified isolation) 즉시 처리. G-2~G-12 후속 등록 — MEMORY `feedback_evaluator_pass_senior_self_audit.md` + `feedback_repeated_self_audit.md` 패턴.

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
>
> **2026-05-12 후속 sprint `checkouts-sprint4-followups-s2-s4-s5-s6` closure** (Mode 2 Full harness, iter 1 PASS, MUST 21/21, commit `9787d245`): S-2 + S-4 + S-5 + S-6 통합. backend tsc EXIT=0 / frontend tsc EXIT=0 / lint EXIT=0 / jest 23/23 PASS. SSOT 신설: `VALIDATION_RULES.DESTINATION_MAX_LENGTH(255)` + `SORT_ORDER_MAX(9999)` + 4 endpoint (REJECTION_PRESETS_*) + audit `rejection_preset` entity + `REJECTION_PRESET_IS_DEFAULT` ErrorCode. ADR-0011 (fuzzy-search 자체 구현 유지, 4 정량 트리거). DB: 0058 manual SQL migration (ADR-0010). i18n admin namespace 신설 + i18n loader 등록. S-2 CheckoutDetailClient 통합은 후속 분리.

- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-2] revoke-window-extended-toast**~~ — closure `9787d245`.
- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-4] reject-preset-admin-ui**~~ — closure `9787d245`.
- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-5] fuzzy-search-lib-decision**~~ — closure `9787d245` (ADR-0011 자체 구현 유지).
- [x] ~~**[2026-05-10 checkouts-sprint4-ux-u02-u08 S-6] destination-inline-create**~~ — closure `9787d245`.
- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-7] 🟢 LOW saved-views-team-share** — Saved Views 팀 공유 (현재 localStorage만). 서버 저장 API + 권한 모델 + DB 스키마 + 새 모듈 = 단독 Mode 2 sprint. 트리거: 협업 기능 sprint.
- [ ] **[2026-05-10 checkouts-sprint4-ux-u02-u08 S-9] 🟢 LOW saved-views-dnd-storybook** — `SavedViewsToolbar` 드래그 정렬 Storybook entry. **차단**: Storybook 미설치 (`NextStepPanel.stories.tsx` orphan). 트리거: Storybook 도입 sprint 선행 후 일괄 처리.

### 2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 후속 (SH-1~SH-6)

> 본 sprint commit 후 등록된 SHOULD/EXT 항목. e2e 시나리오 3건 (Mode 2 file budget 25-30 유지를 위해 분리), 운영 안정성 후속 3건.

- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-1] 🟡 MED rejection-presets-admin-e2e** — admin CRUD happy path Playwright e2e. POST/PATCH/DELETE/PATCH(reorder) 4 endpoint + isDefault 보호 + 권한 거부 redirect 시나리오. 트리거: e2e 인프라 후속 sprint.
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-2] 🟡 MED revocation-window-e2e** — `RevocationWindowCountdown` 5분 만료 시나리오 (clock mock + disabled 상태 검증 + 사유 dialog 통합). 트리거: e2e 인프라 후속 sprint.
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-3] 🟢 LOW destination-create-e2e** — CheckoutDestinationCombobox 등록 모드 + 중복 차단 + maxLength 경계 e2e. 트리거: 반출 생성 e2e sprint.
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-4] 🟢 LOW rejection-presets-sortorder-index** — `rejection_presets.sort_order` DB index. 현재 행 적어 미적용. 트리거: 1000+ rows 도달 시 (admin entity 특성상 미도달 가능성 큼).
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-5] 🟢 LOW revocation-window-server-time-skew** — `useRevocationWindow` client `Date.now()` 기반. clock skew > 5초 환경에서 ±5초 오차. server-time endpoint 또는 `Date` header 활용 검토. 트리거: 다국어 다중 zone 서비스 또는 사용자 환경 clock issue 보고.
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-6] 🟢 LOW destination-entity-promotion** — `destination` varchar(255) → 별도 테이블 승격 검토 (autocomplete 풍부화 + 분석용). 트리거: destination 분석 요구 또는 dataset > 500 도달.
- [ ] **[2026-05-12 checkouts-sprint4-followups-s2-s4-s5-s6 SH-7] 🟢 LOW checkout-detail-revocation-integration** — `RevocationWindowCountdown` 컴포넌트 작성 완료, `CheckoutDetailClient` 통합 (status === APPROVED 이고 approverId === currentUserId 가드) 후속 sprint. 트리거: 반출 상세 다음 enhancement sprint.

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

