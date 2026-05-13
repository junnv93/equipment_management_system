# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).
완료 항목 및 빈 sprint 헤더는 본 문서에서 제거한다.


## Open

### 2026-05-13 env-ssot-and-spec-migration 후속 (verify-implementation 발견)

> **2026-05-13 sprint `env-ssot-and-spec-migration`** (PR-2/PR-3) + `env-sync-guard` Mode 1 harness PASS. verify-implementation 드라이런에서 pre-existing 2건 발견.

- [ ] **[2026-05-13 drizzle-stub-migration-remaining] 🟢 LOW 7개 spec 파일 drizzle-stub SSOT 마이그레이션** — `verify-ssot Step 65` 전체 범위 검사에서 `mockReturnThis` 잔존 7파일 발견: `disposal.service.spec.ts`(2) / `saved-views.service.spec.ts`(2) / `versioned-base.service.spec.ts`(6) / `checkouts.service.spec.ts`(1) / `non-conformances.service.spec.ts`(14) / `notification-recipient-resolver.spec.ts`(10) / `monitoring.service.spec.ts`(1 — Drizzle 체인 아닌 setContext, 별도 검토). 각 파일 `createDrizzle*Chain` SSOT 함수로 교체. 트리거: 해당 서비스 spec 수정 시 또는 전체 spec 정규화 sprint.
- [ ] **[2026-05-13 equipment-spec-as-any-170] 🟢 LOW equipment.service.spec.ts:170 `as any` 제거** — 교정 주기 테스트 `createDto as any` (eslint-disable 동반). `initialLocation` 미포함 DTO가 CreateEquipmentDto 타입과 불일치. 수정: `initialLocation?: string` optional 확인 후 cast 제거 또는 `undefined` 명시 전달. 트리거: equipment spec 재작업 또는 type strict sprint.

### 2026-05-13 dependabot-cascade-followups 시니어 자기검토 PPR + typeof guard 후속

> **2026-05-13 verify-nextjs Step 9·10 신규 등록** 후 기존 코드베이스 드라이런 결과. admin/layout.tsx + audit-logs/page.tsx는 본 세션 closure. 나머지는 pre-existing.

- [ ] **[2026-05-13 ppr-layout-software] 🟠 MED software/layout.tsx async → PPR-compatible 전환** — `apps/frontend/app/(dashboard)/software/layout.tsx:6` `export default async function SoftwareLayout` — PPR 정적 셸 파괴. admin/layout.tsx 패턴(sync outer + Suspense + async inner)으로 전환 필요. 트리거: software 섹션 PPR 성능 최적화 sprint.
- [ ] **[2026-05-13 typeof-guard-pages] 🟠 MED 6개 server component session.user.role 직접 캐스팅 수정** — verify-nextjs Step 10 위반 6건: `calibration/register/page.tsx:16`, `admin/data-migration/page.tsx:16`, `admin/monitoring/page.tsx:16`, `software/layout.tsx:13`, `admin/rejection-presets/page.tsx:23`, `admin/approvals/page.tsx:119`. `const role = session.user.role; typeof role !== 'string' || !hasPermission(role as UserRole, ...)` 패턴으로 일괄 수정. 트리거: 보안 hardening sprint 또는 위 파일 수정 시.


### 2026-05-12 ultrareview-shield-followups 후속 (SH-1~SH-4)

> 본 sprint(`ultrareview-shield-wrapper` + `ultrareview-shield-followups`) T-1/T-2 closure (2026-05-13 batch archive). 라운드 #3 식별 후속 4건 잔여 + cross-domain dependabot-cascade T-3 별도 처리.

- [ ] **[2026-05-12 ultrareview-shield-followups SH-1] 🟢 LOW shield-lock-contention-spec** — 동시 두 shield 실행 시 `flock(1)` 단일 인스턴스 보호 spec 부재. `scripts/__tests__/ultrareview-shield.spec.mjs` 에 시나리오 추가: child shield A 가 SHIELD_LOCK 보유 중일 때 child shield B 즉시 FAIL exit 1 + stderr "다른 ultrareview-shield 인스턴스" 메시지 검증. 트리거: 회귀 차단 강화.
- [ ] **[2026-05-12 ultrareview-shield-followups SH-2] 🟢 LOW shield-sigint-trap-spec** — SIGINT/SIGTERM 시 trap restore_files 발화 spec 부재. 현 spec 은 정상 종료만 검증. Node test runner 가 `kill -INT <pid>` 후 정상 복원 + /tmp 잔존 0 검증 필요. 트리거: 신호 처리 회귀 차단.
- [ ] **[2026-05-12 ultrareview-shield-followups SH-3] 🟢 LOW shield-tmp-residual-gc** — SIGKILL (-9) 시 trap 우회로 `/tmp/ur-shield-*` 잔존 가능. 다음 shield 실행 시 자동 정리하는 best-effort GC 추가 검토 (timestamp > 1시간 디렉토리 sweep). 현재는 사용자 수동 정리 책임. 트리거: 운영 사고 발생 시.
- [ ] **[2026-05-12 ultrareview-shield-followups SH-4] 🟢 LOW preflight-perf-budget-baseline** — gitleaks 36분 → 12초 가속 후 baseline 측정. CI/pre-push 에서 `pnpm ur:preflight` p95 budget (예: ≤30초) regression 감지. 트리거: build-dir allowlist 회귀 시 즉시 발견.

### 2026-05-12 section-autonomy-followup 후속

> **2026-05-12 sprint `section-autonomy-followup` closure (Mode 2 Full harness, MUST 21/21 PASS)**. Section autonomy 4원칙 (no orchestrator dynamic / props-in-jsx-out / 200 line soft / Provider-free) 도입.

- [ ] **[2026-05-12 section-autonomy-followup F-1] 🟢 LOW leaf-section-rtl-spec-backfill** — 6 신규 sub-component (InspectionItemCard, NCBasicInfoCard, NCRepairCard, NCCalibrationCard, StatusLocationStep, CalibrationStep) Provider-free testable. props-only render 스펙 작성 권장. 트리거: 다음 frontend test infra sprint.
- [ ] **[2026-05-12 section-autonomy-followup F-2] 🟢 LOW verify-section-autonomy-skill-trigger** — section autonomy 4원칙 ts-morph 기반 invariant 검증 skill 신설 검토. 본 sprint에서는 over-engineering으로 skip. 트리거: section autonomy 회귀 2건 이상 발생 시.


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



### 2026-05-03 calibration-design-review-phase1 SHOULD 후속 (미완료)
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-plan-item-comments** — 교정계획 상세 항목별 검토 의견 저장/해결 API와 inline comment UI 필요. 현재 상세 메타/결재 맥락만 반영. 트리거: 교정계획 상세 리뷰 UX Sprint.

