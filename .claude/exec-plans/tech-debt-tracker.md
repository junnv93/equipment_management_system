# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).
완료 항목 및 빈 sprint 헤더는 본 문서에서 제거한다.


## Open

### 2026-05-13 review-architecture closure 후속 (라운드 #5)

> **2026-05-13** 4 sprint PASS (cache-wholesale-service-local-closure / inbound-overview-cache-coherence / ultrareview-shield-multiuser-race / audit-log-array-entity-id). 시니어 자기검토 R2 commit `7b9d2d23`. 다음 SHOULD 항목은 별도 sprint 분리.

- [ ] **[2026-05-13 cache-invalidation-helper-internal-subprefix] 🟡 MEDIUM helper 내부 wholesale 사용 잔존** — `CacheInvalidationHelper.invalidateAllDashboard()` (line 41) 가 `${DASHBOARD}*` + `${APPROVALS}*` wholesale 사용. R2 에서 `invalidateApprovalCounts()` 만 specific sub-prefix 마이그레이션. DASHBOARD 도메인 sub-prefix 인벤토리 + helper 내부 wholesale 전수 closure 별도 sprint 필요. helper layer 도 ADR-0012 정합 강제하면 audit script 범위 확장 가능.
- [ ] **[2026-05-13 cache-hit-rate-baseline] 🟢 LOW Sprint A SHOULD-3 cache hit rate baseline** — intermediate-inspections CRUD 후 calibration 캐시 hit rate 측정 권장 (Critical §3.2 영향 검증). production monitoring 기반 verify.
- [ ] **[2026-05-13 ur-shield-cache-relocation] 🟢 LOW Sprint C SHOULD-1 격리 위치 마이그레이션** — `/tmp/ur-shield-*` → `$HOME/.cache/ur-shield/` 또는 `$XDG_RUNTIME_DIR` 로 격리 위치 이동. uid filter 만으로 race 해소했으나 근본 격리 위치 분리가 정공법.
- [ ] **[2026-05-13 ur-shield-pid-embed] 🟢 LOW Sprint C SHOULD-2 PID embed + kill -0 검증** — mktemp 에 `${$}` PID 임베드 + GC 전 `kill -0 $pid` 살아있는지 확인. SIGSTOP active 프로세스의 격리본 자기 정리 방지.
- [ ] **[2026-05-13 audit-log-array-per-item-option] 🟢 LOW Sprint E SHOULD-1 per-item N-row audit option** — `@AuditLog({ entityIdPathArray: true })` 옵션으로 bulk operation N row insert 지원. 현재 R1 은 single aggregate (SYSTEM_USER_UUID sentinel + bulk[N] entityName). per-item audit 이 필요한 비즈니스 요구 발생 시 도입.

### 2026-05-13 env-ssot-and-spec-migration 후속 (verify-implementation 발견)

> **2026-05-13 sprint `env-ssot-and-spec-migration`** (PR-2/PR-3) + `env-sync-guard` Mode 1 harness PASS. verify-implementation 드라이런에서 pre-existing 2건 발견.

- [ ] **[2026-05-13 drizzle-stub-migration-remaining] 🟢 LOW 7개 spec 파일 drizzle-stub SSOT 마이그레이션** — `verify-ssot Step 65` 전체 범위 검사에서 `mockReturnThis` 잔존 7파일 발견: `disposal.service.spec.ts`(2) / `saved-views.service.spec.ts`(2) / `versioned-base.service.spec.ts`(6) / `checkouts.service.spec.ts`(1) / `non-conformances.service.spec.ts`(14) / `notification-recipient-resolver.spec.ts`(10) / `monitoring.service.spec.ts`(1 — Drizzle 체인 아닌 setContext, 별도 검토). 각 파일 `createDrizzle*Chain` SSOT 함수로 교체. 트리거: 해당 서비스 spec 수정 시 또는 전체 spec 정규화 sprint.
- [ ] **[2026-05-13 equipment-spec-as-any-170] 🟢 LOW equipment.service.spec.ts:170 `as any` 제거** — 교정 주기 테스트 `createDto as any` (eslint-disable 동반). `initialLocation` 미포함 DTO가 CreateEquipmentDto 타입과 불일치. 수정: `initialLocation?: string` optional 확인 후 cast 제거 또는 `undefined` 명시 전달. 트리거: equipment spec 재작업 또는 type strict sprint.

### 2026-05-12 section-autonomy-followup 후속

> **2026-05-12 sprint `section-autonomy-followup` closure (Mode 2 Full harness, MUST 21/21 PASS)**. Section autonomy 4원칙 (no orchestrator dynamic / props-in-jsx-out / 200 line soft / Provider-free) 도입.

- [ ] **[2026-05-12 section-autonomy-followup F-1] 🟢 LOW leaf-section-rtl-spec-backfill** — 6 신규 sub-component (InspectionItemCard, NCBasicInfoCard, NCRepairCard, NCCalibrationCard, StatusLocationStep, CalibrationStep) Provider-free testable. props-only render 스펙 작성 권장. 트리거: 다음 frontend test infra sprint.
- [ ] **[2026-05-12 section-autonomy-followup F-2] 🟢 LOW verify-section-autonomy-skill-trigger** — section autonomy 4원칙 ts-morph 기반 invariant 검증 skill 신설 검토. 본 sprint에서는 over-engineering으로 skip. 트리거: section autonomy 회귀 2건 이상 발생 시.


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

