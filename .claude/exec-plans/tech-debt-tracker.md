# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Batch 이력

> 2026년 4월 배치 이력 → [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md)

| Batch | 처리일 | 항목 수 | 상태 |
|-------|--------|---------|------|
| disposal-zod-defense-in-depth | 2026-05-01 | 5 | 완료 |
| disposal-service-fail-close | 2026-05-02 | 2 | 완료 |
| error-codes-ssot-system-wide | 2026-05-02 | 15 | 완료 |
| tier-2-rejectmodal-ssot-integration | 2026-05-02 | ~38 | 완료 |
| equipment-reject-zod-fail-close-hardening | 2026-05-02 | 3 | 완료 |
| rejection-reason-notfound-systemic-closure | 2026-05-02 | 16 | 완료 |
| tier2-fsm-invalid-status-transition | 2026-05-02 | 26 | 완료 |
| 2026-05-03 batch (12 sprints) | 2026-05-03 | 12 | 완료 |
| quality-audit-ssot | 2026-05-03 | 11 | 완료 |
| data-migration-preview-windowing | 2026-05-03 | 6 | 완료 |
| security-auditable-revocation-comment | 2026-05-03 | 0 | 완료 |
| calibration-action-button-aria-labels | 2026-05-03 | 4 | 완료 |
| document-file-frontend-error-mapper | 2026-05-03 | 6 | 완료 |
| inspection-template-frontend-error-mapper | 2026-05-03 | 5 | 완료 |
| frontend-test-final-run | 2026-05-03 | 0 | 완료 |
| verify-implementation-orphan-skills-registration | 2026-05-03 | 1 | 완료 |
| disposal-review-calibration-reject-fail-close | 2026-05-03 | 2 | 완료 |
| inspection-template-analytics-events | 2026-05-03 | 4 | 완료 |
| inspection-template-feature-flag | 2026-05-03 | 4 | 완료 |
| lab-manager-explicit-permission-spec-closure | 2026-05-03 | 0 | 완료 |
| create-test-equipment-token-deprecation-closure | 2026-05-03 | 0 | 완료 |
| sidebar-nav-aria-key-literal-union | 2026-05-03 | 3 | 완료 |
| sidebar-row-container-li-semantics | 2026-05-03 | 0 | 완료 |
| disposal-opinion-comment-zod-min10-defense-closure | 2026-05-03 | 1 | 완료 |
| nc-design-review-phases-eslint-disable-cleanup | 2026-05-03 | 1 | 완료 |
| checkouts-pending-hero-priority | 2026-05-03 | 2 | 완료 |
| eslint-require-randomuuid-alias-guard | 2026-05-03 | 1 | 완료 |
| playwright-trace-on-failure-policy | 2026-05-03 | 2 | 완료 |
| second-skip-link-row1-closure | 2026-05-03 | 0 | 완료 |

### 2026-05-03 harness: calibration-design-review-phase1 후속

- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-certificate-ocr-api** — 교정성적서 PDF/OCR 추출 API와 기관별 룰 기반 필드 매핑 필요. 현재 1차 구현은 UI 안내만 반영. 트리거: 교정성적서 등록 정확도 개선 Sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-measurement-template-ssot** — 장비 분류별 측정 항목/허용오차 템플릿 SSOT와 자동 판정 저장 모델 필요. 현재 결과 segmented UI만 반영. 트리거: 교정성적서 측정값 추적 Sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-plan-item-comments** — 교정계획 상세 항목별 검토 의견 저장/해결 API와 inline comment UI 필요. 현재 상세 메타/결재 맥락만 반영. 트리거: 교정계획 상세 리뷰 UX Sprint.
| analytics-events-registry-production-callers | 2026-05-03 | 3 | 완료 |
| checkout-row-onclick-callback | 2026-05-03 | 1 | 완료 |
| charscounter-min-mode-disposal | 2026-05-03 | 7 | 완료 |
| stagger-low-spec-guard | 2026-05-03 | 3 | 완료 |
| groupcard-usecallback-t-scan | 2026-05-03 | 0 | 완료 |
| checkout-zone2-status-truncate-closure | 2026-05-03 | 0 | 완료 |

---

## Open

### 2026-05-01~02 disposal-zod 후속 — RejectModal SSOT 통합 + 시스템 전반 보안 강화 (재구조화)

본 세션은 frontend가 이미 `≥ 10` 강제 중인 disposal/calibration-plan 2개 도메인만 backend Zod 격상 (Tier 1 안전). 시니어 자기검토 결과 단순 도메인별 페어링 sprint(7건)는 단편 누적이라 판단 — 진정한 시스템적 해결은 **RejectModal SSOT 컴포넌트로 통합** + 시스템 전반 Zod 가드 일괄 적용.

#### 시스템적 통합 sprint (Mode 2 권장)

#### 별도 ADR 필요

- [ ] **[2026-05-02 system-arch] 🟡 MEDIUM backend-zod-error-message-i18n-adr** — backend `VM.string.min('field', N)` 응답이 한국어 하드코딩. frontend locale=en이어도 backend 한국어 그대로. 옵션 (a) `Accept-Language` 헤더 기반 backend i18n (b) error code 반환 + frontend 번역 (c) 현 상태 유지(한국 단일 운영 확정). ADR 결정 필요. 트리거: 다국어 운영 결정 시.

### 2026-04-30 sprint45-should-residual 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 sprint-4.5 S3 후속] 🟡 MEDIUM checkouts-tab-bulk-selection-integration** — Outbound/InboundCheckoutsTab 부모에 `useRowSelection` + `BulkActionBar` 도입. CheckoutGroupCard prop API(`selectedRowIds` / `onToggleGroup`)는 본 세션에 신설 + 격리 fixture page로 동작 검증 완료. 부모 통합은 useBulkSelection 신규 도입 + bulk approve/reject/return/cancel 핸들러 다중 도메인 결정 = scope +50% 이상이라 별도 sprint. 파일: `app/(dashboard)/checkouts/tabs/{Outbound,Inbound}CheckoutsTab.tsx`. 트리거: bulk approve/reject 운영 요구사항 발생 시.
- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW help-faq-content-authoring** — `messages/{ko,en}/help.json` 4 섹션 (checkout/calibration/nonConformance/permissions) placeholder만 등록. 운영팀과 협의 후 실제 FAQ 카피 작성 + 섹션 anchor 키 동기화. `feedback_no_fabricate_domain_data.md` 정책에 따라 카피 생성 금지 — 사용자/운영팀 입력 후 별도 작업. 트리거: 운영팀 FAQ 콘텐츠 공급.

### 2026-04-30 Checkouts V3 Sprint 4.5 T1+T2 SHOULD/Architecture Concerns


### 2026-04-30 deps-supply-chain-hardening 후속

#### 후속 (본 세션 2026-04-28에서 발견)

### 2026-04-28 checkouts-phase4-kpi-hierarchy SHOULD 이연 항목


### 2026-04-29 harness: nextauth-csrf-single-origin SHOULD 후속 (ADR-0006 정착 후 deferred)

- [ ] **[2026-04-29 nextauth-csrf §S3] 🟡 MEDIUM docker-compose-lan-prod-manual-verification** — `pnpm compose:lan up -d --build` 후 `curl http://lan-ip:9000/api/auth/csrf` → 200 + JSON 응답 확인. nginx NextAuth handler 분기(infra/nginx/lan.conf:121-159 신규 location 2개) 운영 환경 manual 검증. 트리거: 다음 LAN/prod 배포 직전.
- [ ] **[2026-04-29 nextauth-csrf §J1] 🟢 LOW phase-0-reproduction-actual-network-trace** — Phase 0 reproduction 시나리오 (a) Incognito + chrome://serviceworker-internals (b) Network Initiator stack trace (c) `unset NEXT_PUBLIC_API_URL`은 본 작업의 single-origin 모델로 모두 종결되어 실측 미실행. ADR-0006이 효과를 본 후 정확한 호출 경로(legacy SW vs NextAuth client basePath vs 외부 proxy) 사후 분석 권장. 트리거: 동일 증상 재발 시 디버깅 데이터 수집.

### 2026-04-29 harness: dashboard-low-residual SHOULD 이연 항목 (현 세션)

- [ ] **[2026-04-29 §3.1] 🟢 LOW sidebar-eq-monogram-design-decision** — 명세서 §3.1은 사이드바 상단을 "EQ 모노그램 또는 공급할 자체 로고 SVG, 26px, rounded-md, bg-brand-gradient"로 권고하나 현재 `Wrench` lucide 아이콘 + `bg-ul-red` 32px 사용. 외부 회사 브랜드(UL Solutions)는 이미 제거된 상태이고 Wrench는 "장비 관리" 의미 표현하는 자체 fallback으로 채택된 것으로 추정. **사용자 디자인 결정 필요**: (a) Wrench 유지 (b) EQ 모노그램 적용 (c) 자체 로고 SVG 공급. 파일: `apps/frontend/components/layout/DashboardShell.tsx:209,245`. 트리거: 디자이너 자체 로고 공급 시점 또는 사용자 결정 시.
- [ ] **[2026-04-29 standalone-html] 🟢 LOW standalone-html-1to1-pixel-matching** — `_ _ _standalone_.html`(1.2MB single-file gzipped bundle)은 자체 unzip JS 필요. 정적 grep으로 마크업 비교 불가 → 실제 1:1 픽셀 매칭은 (a) Playwright로 file:// 로드 후 DOM 캡처, (b) bundle JS unzip + 분석 두 방법 중 하나로 sprint 단위 진행 권장. 본 세션은 명세서 ↔ 구현 1:1 매칭(5/5 검증)로 대체 처리. 트리거: 디자인 QA sprint.

- [ ] **[2026-04-27 sprint-3.3] 🟡 MEDIUM sprint-3.3-e2e-profiler-verification** — M12(React DevTools Profiler 수동 QA) + M13(E2E suite-ux 테스트) 미완. E2E 실행으로 클릭 핸들러 동작 변경 없음 확인 필요. 트리거: E2E 전체 배치 실행 시.

### 2026-04-27 harness: approvals-ui-r2 DoD deferred items (contract section 11)

- [ ] **[2026-04-27 ar13] 🟢 LOW ar13-lab-manager-self-inspection** — `lab_manager` 역할이 `ROLE_APPROVAL_CATEGORIES`에 `AC.SELF_INSPECTION` 미포함. 현재 technical_manager만 자체점검 승인 가능. lab_manager의 자체점검 승인 권한 필요 여부 확인 후 `approval-categories.ts` 수정. 트리거: lab_manager 역할 승인 흐름 검토 시. ⚠️ 도메인 정책 결정 보류 (사용자 확인 필요).
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM role-approval-categories-db-backed** — `ROLE_APPROVAL_CATEGORIES` 현재 코드 상수. DB-backed 설정으로 전환 시 운영 유연성 확보. 트리거: 역할별 카테고리 변경 주기가 배포 주기보다 빨라질 때.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-delegation-workflow** — 위임 워크플로우 미구현. 장기 부재자 승인 위임. 트리거: 위임 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-analytics-dashboard** — 월별 처리량/평균 처리시간 대시보드 미구현. 트리거: 관리자 리포팅 요구사항 발생 시.

### 2026-04-26 harness: Sprint 3.1~3.2 BFF + queryKeys 계층 SHOULD 후속

- [ ] **[2026-04-26 sprint-3.1] 🟢 LOW inbound-overview-module-boundary** — `checkoutsService.getInboundOverview()`가 `RentalImportsService`를 직접 주입. 향후 반입 도메인이 별도 모듈로 분리될 경우 circular dependency 가능. BFF Gateway 패턴(독립 BFF 모듈) 검토 필요(S6). 트리거: 반입 도메인 대규모 리팩토링 시.

### 2026-04-26 harness: NC Round-2 (R1a~R5) SHOULD 이연 항목


### 2026-04-26 harness: Sprint 2.4 tab-badge alert variant SHOULD 후속

- [ ] **[2026-04-26 sprint-2.4] 🟢 LOW en-overdueclear-translation-spec** — `en/checkouts.json` `emptyState.overdueClear.title` = `"No Overdue Checkouts"` (현재) vs 컨트랙트 스펙 `"No overdue items"`. 대소문자·의미 불일치. Sprint 2.3 구현 당시 의도적으로 다른 프레이밍 선택. 사용자 확인 후 보정 또는 컨트랙트 업데이트 필요. 트리거: i18n 리뷰 세션.

### 2026-04-26 harness: Sprint 2.1·2.2 Row 토큰 누수 봉합 SHOULD 후속

- [ ] **[2026-04-26 sprint-2.1-2.2] 🟡 MEDIUM purpose-bar-return-to-vendor-color** — `CHECKOUT_ITEM_ROW_TOKENS.purposeBar.return_to_vendor` 현재 `bg-brand-neutral` 가안. 디자인 팀과 return_to_vendor 목적 색상 확정 후 수정 필요. 트리거: 디자인 리뷰 시 또는 return_to_vendor 반출 UI 실제 노출 전.

### 2026-04-24 harness: WF-34 E2E + PR-13 YourTurnBadge 후속 (93차)


### 2026-04-17 harness: QR Phase 1-3 후속 정리

- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — **OUT OF SCOPE (TTY required)** — `pnpm db:generate`는 Drizzle interactive prompt 입력 필요, non-TTY harness 환경에서 실행 불가. TTY 세션에서 수동 실행 필요.

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.

### 2026-04-20 — cplan-export-audit (verify-implementation + review-architecture 후속)


### 2026-04-22 harness: checkout-lender-guard-p1p3 후속 (verify + review 결과)

- [ ] **[2026-04-22 p1p3] 🟢 LOW RENTAL reject_return 설계 갭 — FSM 명시적 결정 필요** — FSM `reject_return` 전이가 `purposes: CAL_REPAIR`만 허용, RENTAL 제외. RENTAL 반납 검사 실패 시 반려 불가한 도메인 갭. 의도적 설계라면 FSM 주석 추가 권장; RENTAL 반납 반려가 필요하다면 FSM에 rental 추가 + rejectReturn LENDER_TEAM_ONLY 복구 필요. 트리거: 렌탈 워크플로우 설계 검토 시.

### 2026-04-24 harness: Sprint 1.3 checkout-meta-fail-closed SHOULD 후속


### 2026-04-27 harness: dashboard-phase4-6 SHOULD 후속

- [ ] **[2026-04-27 dashboard-phase4-6] 🟢 LOW visual-regression-baseline** — Phase 4.6 스킵. `visual-regression.spec.ts` 미생성 — 5 role × 4 viewport × 3 mode = 60 baseline 스크린샷. 트리거: 디자인 QA Sprint 착수 시 `--update-snapshots`로 초기 캡처.

### 2026-04-27 harness: fsm-terminal-actor-variant SHOULD 이연 항목


### 2026-04-28 dashboard-redesign-architectural SHOULD 이연 항목

- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-queue-size-impl** — `apps/backend/src/modules/dashboard/dashboard.service.ts:getSystemHealth()`의 `queueSize`가 0 stub. BullMQ 또는 Redis 큐 도입 시 실측 연결 필요. 현재는 dbResponseMs/storagePct만 overallStatus 판정에 기여. 트리거: BullMQ/큐 인프라 도입 Sprint.
- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-error-source-table** — `errorCount24h`가 audit_logs의 `reject`/`cancel` 비즈니스 거절을 proxy로 사용 중. 진정한 시스템 에러 카운트는 별도 `error_logs` 또는 `system_events` 테이블 + Sentry 통합 필요. 트리거: 운영 모니터링 정비 Sprint.
- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW dashboard-storage-capacity-env** — `DASHBOARD_STORAGE_CAPACITY_BYTES` 기본 100 GiB. 운영 환경별 실제 디스크 capacity로 env 설정 필요 (Docker volume / K8s PV / 호스트 디스크). 트리거: 프로덕션 배포 시 env 설정 체크리스트.

### 2026-04-28 dashboard-redesign-phase-e-residual SHOULD 후속 (미완료)

- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW standalone-html-1to1-matching** — REVIEW_RESULT.md ⚠️ 5항목 (§3.1 EQ 마크 / §3.7 items-stretch / §3.10 debug widget / §A.3.1 미니캘린더 / §A.9.1 skip nav) — Playwright baseline 캡처 + 시각 검수로 1:1 매칭 검증 필요. 트리거: 다음 디자인 QA sprint.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW playwright-dashboard-screenshots-baseline** — `dashboard-screenshots.spec.ts` 본 세션에서 helper 추가 + dark/axe scan 보강만 완료. 실제 5 role × 1440 light/dark 30 PNG 캡처는 미실행 (storage state + dev 서버 의존). 트리거: 다음 디자인 QA sprint.

### 2026-04-28 supply-chain-gate-completion 부수 발견


### 2026-04-28 sidebar-nav-action-pattern SHOULD 후속 (미완료)


### 2026-04-30 sv-system-wide-completion SHOULD 후속


### 2026-05-02 inspection-template 1B-G E2E SHOULD 후속

1B-G Mode 1 harness PASS 후 시니어 자기검토에서 발견된 갭 (RTL test가 분담 또는 차후 e2e 보강).

### 2026-05-03 calibration-design-review-phase1 SHOULD 후속 (미완료)

- [ ] **[2026-05-03 calibration-design-review-phase1] 🟢 LOW calibration-form-ocr-template-opinion** — 교정성적서 등록 폼에서 OCR 추출(성적서 이미지 → 자동 입력), 측정값 템플릿(표준 측정 항목 사전 정의), 항목별 의견 저장은 Phase 2 후속 개발 항목. 현재 Phase 1에서 폼 등록 흐름 안내/자동 계산 차기일/결과별 후속 안내까지만 구현. 트리거: 교정 Phase 2 sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟢 LOW calibration-browser-rendering-e2e** — /calibration, /calibration-plans, /calibration-plans/[uuid], /calibration/register 라우트 브라우저 렌더링 런타임 검증 미실시 (Playwright 없음). tsc PASS + 정적 검증만 확인. 트리거: 다음 Playwright E2E sprint.
