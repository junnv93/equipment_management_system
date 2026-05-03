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

## 등록된 검증 스킬

| 스킬                    | 설명                                   | 커버 파일 패턴                                                         |
| ----------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `verify-cas`            | CAS(Optimistic Locking) 패턴 검증      | `apps/backend/src/modules/**/*.service.ts`, `*/dto/**/*.dto.ts`       |
| `verify-auth`           | 서버 사이드 인증/인가 + 라우트 선언 순서 검증 (Step 15: FileInterceptor 비업로드 권한 오용 탐지, Step 16: 백엔드 controller role 리터럴 직접 비교 탐지, Step 17: `__auditLogged` dedup 플래그 불변성 — AuditInterceptor `= true` 마킹 + GlobalExceptionFilter 플래그 체크 양쪽 존재 강제, Guard-level 403 미감사/이중감사 방지) | `apps/backend/src/**/*.controller.ts`, `*/dto/**/*.dto.ts`, `apps/backend/src/common/interceptors/audit.interceptor.ts`, `apps/backend/src/common/filters/error.filter.ts`, `apps/backend/src/common/utils/audit-entity-id.util.ts`            |
| `verify-zod`            | Zod 검증 패턴 검증 (Step 13: `.default(N)` 보장 필드는 DTO 클래스 non-optional, Step 15: frontend `< N` 하드코딩 ↔ backend Zod `.min(N)` SSOT 동기화 강제 — REJECTION_REASON_MIN_LENGTH 동기화 + `.trim()`/`.max()` defense-in-depth 강제, Step 16: ErrorCode SSOT 강제 + service fail-close 비대칭 차단 + frontend mapper coverage — `code: '[A-Z_]+'` 인라인 string literal 0건 강제(격상 완료: disposal/calibration-plan/equipment(services+controller+interceptor+dto)), service layer rejectionReason/revocationReason fail-close 도메인 간 강도 일관성(Step 16 command 3b: revokeApproval REVOCATION_REASON_MIN_LENGTH 2026-05-03), `lib/errors/<domain>-errors.ts` mapper SSOT 존재 + onError 호출처 적용 강제(한국어 backend 메시지 노출 0), 시스템 전체 inline count: 0건 (2026-05-03 backend-errorcode-full-closure 전멸 완료 — 회귀 탐지 전용), Step 16 명령 5c: mapper I18N_VARS SSOT 파라미터 주입 — `{ min: VALIDATION_RULES.* }` 하드코딩 숫자 0건(CHECKOUT_ERROR_I18N_VARS 패턴, 2026-05-03), Step 16 명령 8 (2026-05-02 tier-2-rejectmodal-ssot iter 2 WARN-H5 closure): mapper Partial Record completeness — reject 흐름 ErrorCode (`*RejectionReasonRequired`/`*InvalidStatusTransition`/`*OnlyPendingCanReject`/`*InvalidTransition`)가 도메인 mapper에 등재 강제, ErrorCode enum + errorCodeToStatusCode 등록만 있고 mapper 누락 시 silent fallback (generic error.message 노출) 차단, Step 16 명령 9 (2026-05-02 equipment-domain-errorcode-closure): EquipmentErrorCode → specific errors.json routing 정합성 — mapBackendErrorCode 등재 코드가 EquipmentErrorCode enum 값과 1:1 매핑, errors.json dead code 방지, Step 17: `.trim().min(N)` 경계 케이스 spec 대칭성 — trim→reject(`' '+str(N-1)+' '`→fail) + trim→accept(`' '+str(N)+' '`→pass) 양방향 필수 + `.trim().min()` 순서 증명(2026-05-02), Step 18: `z.string().uuid()` 직접 사용 금지 → `uuidString()` SSOT 경유 필수 — Zod v4 RFC 9562 strict seed UUID 거부 방지(2026-05-03)) | `*/dto/**/*.dto.ts`, `apps/backend/src/common/pipes/*.ts`, `apps/backend/src/modules/{equipment,calibration-plans}/**`, `apps/frontend/lib/errors/{disposal,calibration-plan,equipment,non-conformance,cables,test-software,software-validation,self-inspection,intermediate-inspection,checkout,notification,team,user}-errors.ts`, `apps/frontend/components/{equipment/disposal,calibration-plans}/**` |
| `verify-ssot`           | SSOT 임포트 패턴 검증 (Step 27: UserSelectableCheckoutPurpose — CreateCheckoutDto.purpose 서브셋 타입, Step 28: useDateFormatter SSOT — date-fns 직접 사용 금지, Step 29: prebuild guard 스크립트 존재+package.json prebuild 훅 연결, Step 30: 상태 순서 매핑 키 enum Computed Property Name 경유 필수, Step 31: computeUrgency SSOT — 인라인 시간 상수 긴급도 계산 금지, Step 32: config 객체 파생 boolean 필드 → 수치 SSOT 단일화 — multiStep boolean 재도입 탐지, Step 33: TAB_META capability guard 완전성 — canReject !== false 4-path 패턴, 미가드 onReject/onBulkReject 직접 전달 탐지, Step 34: 로컬 인터페이스명 packages 동명 타입 충돌 금지, Step 35: 대시보드 임계값 SSOT — `dashboard-thresholds.ts` 우회 금지, Step 36: 반출 도메인 D-day 4-tier 임계값 SSOT — `checkout-thresholds.ts` 단일 출처, 대시보드 모듈과 의도적 분리, 6-tier legacy 회귀 방지, Step 37: useEffectiveRole SSOT — session.user.role 직접 참조 금지, Step 38: BackendService ConfigService SSOT — process.env 직접 접근 금지, Step 39: shared-constants const array → z.enum SSOT 패턴 — 인라인 z.enum(['...']) 금지, Step 40: domain enum 분류 매핑 `as const satisfies Record<EnumType, X>` 강제 — `Set<EnumType>` 약타입 금지, Step 41: Hero KPI 선택 로직 SSOT — `selectHeroVariant` 우회 inline 분기 금지, Step 42: 테스트 파일 hardcoded threshold vs SSOT 토큰 import 강제 — `toBe(N)` 매직넘버 + SSOT 미import 탐지, Step 43: `@deprecated` export type/const alias 외부 소비처 0건 정리 — 누적 SSOT 분산 방지, Step 44: Supply-Chain SSOT — raw uuid import 금지 + pnpm.overrides caret 잠금 (IdentifierService 단일 진입점, `>=` 패턴 0건), Step 45: LENDER_APPROVAL_PENDING_STATUSES SSOT 체인 — FSM 도출 승인 대기 status 배열 인라인 재정의 금지, ['pending','borrower_approved'] 리터럴 0건, Step 46: 목적별 폼 설정 SSOT — `as const satisfies Record<CheckoutPurpose, ...>` 패턴, 인라인 목적 분기 boolean(isCalibrationRequired 등) 재정의 금지, Step 47: `isPurposeCompatibleWithEquipment` SSOT — USER_SELECTABLE_PURPOSES.includes() 가드 필수(시스템 전용 purpose false-positive block 방지), Step 48: `switch + assertNever(x: never): never` exhaustiveness — discriminated union 핸들러 if-else 금지, Step 49: UI 도메인 타입 파일 SSOT + 위임 re-export 패턴 — `lib/types/checkout-ui.ts` SSOT 정의 + 컴포넌트 `export type { X }` 위임만 허용(컴포넌트 내 `export interface X` 직접 정의 금지), Step 50: `components/shared/` eslint-disable `self-audit-exception` 마커 강제 — 마커 없는 `no-restricted-syntax` disable 0건(승인 예외는 `-- self-audit-exception: <사유>` 명시 필수), Step 51: `CheckoutDirectionValues` SSOT — `direction: 'outbound'`/`'inbound'` 리터럴 인라인 금지(CheckoutDirectionValues.OUTBOUND/INBOUND 경유 필수, satisfies Record<string, CheckoutDirection> 제약), Step 22f: ESLint dynamic import `ImportExpression[source.value=]` selector 강제 — `CallExpression[callee.type='Import']` silent-fail 패턴 0건, Step 53: 백엔드-프론트 공유 API 응답 타입 → packages/schemas SSOT — `CheckoutSummary` 등 백엔드 getSummary() 반환 타입과 프론트 props 타입이 동일 인터페이스를 공유해야 하며, 프론트 `checkout-api.ts`는 `export type { X }` 위임 re-export만 허용, Step 54: Analytics SSOT — `lib/analytics/track.ts` 단일 진입점, `window.dispatchEvent('app:analytics')` 직접 호출 + 외부 SDK 직접 import 0건, Step 55: useRowSelection SSOT — BulkActionBar 사용 컴포넌트에서 `useState<string[]>` row selection 금지(`useRowSelection` 필수), Step 56: calculateDaysRemaining SSOT — `dday-utils.ts` 외부 인라인 D-day 산술(`setHours(0,0,0,0)` / `86400000`) 0건, Step 58: `VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH` SSOT — `.max(200,)` 매직넘버 DTO 인라인 금지(2026-05-03)) | `apps/backend/src/**/*.ts`, `apps/frontend/**/*.ts(x)`, `scripts/check-*.mjs`, `package.json` |
| `verify-hardcoding`     | SSOT 하드코딩 탐지 (Step 2b: checkouts queryKeys view/resource 계층, Step 17b: 프론트엔드 optimistic fallback `pageSize` 하드코딩 — `DEFAULT_PAGE_SIZE` SSOT 강제, Step 25: DISPLAY_LIMITS SSOT — `.slice(0, N)` 매직넘버 탐지, Step 26: 컴포넌트 비-JSX 함수 내 한국어 문자열 조합, Step 27: SelectItem value 속성 enum SSOT — 도메인 리터럴 인라인 금지, Step 28: 인라인 도메인 경로 — href/router.push/replace/backUrl 모두 FRONTEND_ROUTES 미경유 금지, Step 29: 백엔드 시간 윈도우 상수 `*_WINDOW_MS` 로컬 선언 탐지 — shared-constants SSOT 승격 요구, Step 30: 외부 브랜드 자산 `lib/brand-assets/` 모듈 분리 강제 — 컴포넌트 인라인 SVG 금지, Step 32: analytics track() 호출 시 PII 키(userId/email/firstName/lastName 등) 직접 전달 금지 — 익명화된 카운터/분류값만 허용, Step 33: `useOptimisticMutation` `invalidateKeys` 인라인 배열 → `*CacheInvalidation.APPROVE_KEYS/REJECT_KEYS` 클래스 SSOT 강제 — `cache-invalidation.ts` 경유 필수, Step 35: data-migration preview window size는 `DATA_MIGRATION_PREVIEW_PAGE_SIZE` SSOT 경유) | `apps/frontend/lib/api/**`, `apps/backend/src/**/*.service.ts`, `apps/frontend/lib/config/dashboard-config.ts`, `apps/frontend/lib/config/data-migration-preview.ts`, `apps/frontend/components/**`, `apps/frontend/lib/brand-assets/**`, `apps/frontend/lib/analytics/**`, `apps/frontend/lib/api/cache-invalidation.ts`        |
| `verify-click-feedback` | Click-Feedback 5-Layer 아키텍처 준수 검증 — loading.tsx a11y(Step 3), FEEDBACK_KEYS SSOT(Step 1: [가-힣] Unicode 범위), 409 retry ToastAction(Step 4), motion-safe:animate-spin(Step 7), 훅 기본값 Korean(Step 11), ListPageSkeleton srLabel 독립성(Step 12), NavLink invisible overlay 패턴(Step 13), Button loading 후 manual Loader2 이중 스피너 탐지(Step 14). MUST Steps 1-4,7,10-14. | `apps/frontend/app/**/loading.tsx`, `apps/frontend/hooks/**`, `apps/frontend/components/**`, `apps/frontend/components/navigation/nav-link.tsx`, `lib/i18n/feedback-keys.ts`, `messages/{ko,en}/feedback.json` |
| `verify-frontend-state` | 프론트엔드 상태 관리 패턴 검증 (Step 21: runtime feature flag로 union 타입 내로잉 금지, Step 21확장: navigator.onLine 직접 사용 금지 — useOnlineStatus() SSOT 훅 경유, Step 22: bulk 뮤테이션 `Promise.allSettled` 병렬 — `for...of` 순차 금지, Step 23: TanStack v5 `onError` snapshot rollback — `getQueriesData`+`forEach setQueryData` 허용 컨텍스트, Step 25: useEffect dep array TDZ — useQuery 선언 이전 위치 금지, Step 31: Nested interactive 차단 — `<a>` in `<a>` / Link in Link 금지(NavRowWithSecondaryAction sibling-anchor 패턴), Step 32: useEffect deps 안정화 useRef 패턴 — `t`/`toast` stable ref deps 외부화 + eslint-disable react-hooks 0건, Step 33: TableRow onClick router.push 네비게이션 금지 — NavLink invisible overlay 패턴 사용, Step 34: 다중 다이얼로그 상태 discriminated union `ActiveDialog` 패턴 — isOpen+target+comment 3-tuple 반복 금지, Step 35: bulk approve/reject `runWithConcurrency` worker pool 필수 — `Promise.allSettled` 직접 호출 금지(slow outlier가 전체 배치 지연 방지, 동시성 BULK_CONCURRENCY_LIMIT=5 유지). **예외(2026-04-30)**: backend bulk endpoint 제공 도메인은 `isCheckoutCategory` 등 분기로 단일 HTTP 호출 위임 허용(Sprint 4.5 D2 delegation), Step 36: 카운트 기반 `!!count` 방어 가드 — `{someCount && <JSX/>}` 패턴(count===0일 때 React가 "0" 텍스트 노드 렌더) 금지, Step 37: sessionStorage TTL + try/catch + one-shot 패턴 — `setItem`/`getItem`/`removeItem` try/catch wrap(private mode silent fallback) + TTL timestamp 비교(stale context 회피) + restore 후 자동 removeItem(one-shot, 2026-04-30 Sprint 4.5 U-07), Step 38: useUndoableState SSOT — 컴포넌트 내 pastRef/futureRef 인라인 undo/redo 스택 선언 금지 + useUndoableState 위임 필수(2026-05-02)) | `apps/frontend/components/**`, `apps/frontend/hooks/**`, `apps/frontend/lib/checkouts/**`, `apps/frontend/lib/utils/checkout-return-context.ts`, `apps/frontend/hooks/use-undoable-state.ts`  |
| `verify-nextjs`         | Next.js 16 패턴 검증 (Step 4b: React 19 deprecated 이벤트 타입 — FormEvent → SyntheticEvent\<HTMLFormElement\>) | `apps/frontend/app/**/page.tsx`, `layout.tsx`, `error.tsx`, `apps/frontend/components/**/*.tsx`            |
| `verify-filters`        | URL-driven 필터 SSOT 패턴 검증 (Step 10: checkout purpose 필터 타입 — `CheckoutPurpose \| 'all'` + enum 검증, Step 11: IMPORT_SUBTAB_STATUS_GROUPS SSOT 위치 + 인라인 EquipmentImportStatus 배열 금지 — checkout-filter-utils.ts 외 재정의 0건, InboundTab 내 EIV 인라인 배열 0건, Step 12: equipment URL `pageSize`는 `PAGE_SIZE_OPTIONS` 허용값만 통과) | `*-filter-utils.ts`, `use-*-filters.ts`, `page.tsx` |
| `verify-design-tokens`  | Design Token 3-Layer 아키텍처 검증 (Step 33: DASHBOARD_ENTRANCE/DASHBOARD_MOTION 인라인 딜레이 금지, Step 34: WAI-ARIA grid 3단계 패턴, Step 35: CHECKOUT_ITEM_ROW_TOKENS zone key satisfies, Step 36: WORKFLOW_PANEL_TOKENS.actor satisfies + WorkflowPanelActorVariant, Step 37: Layer 3 토큰 파일 내 ANIMATION_PRESETS 인라인 우회 금지, Step 38: AlertBanner severity → ARIA role 분기, Step 39: getPageContainerClasses() variant 필수 인수 — 빈 호출 금지, Step 40: hover-inline 버튼 `approveIcon`/`rejectIcon` 토큰 경유 필수, Step 41: 단일 `role="tablist"` + `className="contents"` ARIA tablist 패턴, Step 42: NEXT_STEP_PANEL_TOKENS 토큰 체인 정합, Step 43: 대시보드 dynamic() loading skeleton 커버리지, Step 44: SURFACE_INLINE_ACTION_TOKENS 4-way 동기화 + label-ko/label-mono utility, Step 45: SIDEBAR_ROW_TOKENS Layer 3 — sibling-anchor 컴포넌트 토큰 우회 금지(NavRowWithSecondaryAction collapsedDot/secondaryHitArea/hoverGroup 인라인 0건), Step 48: ConnectionBanner kind→role 동적 분기 — BannerSpec.role 필드 존재 + offline→alert/sw-update→status 일관성 + 렌더에서 정적 role 하드코딩 0건, Step 49: Dialog 내 필수 입력 검증 ARIA 패턴 — aria-required+aria-invalid+aria-describedby 3종 세트, 에러 p에 role=alert, confirm disabled=!value.trim() touched 가드 금지, Step 50: 내비게이션 리스트 시맨틱 — list-none 컨테이너에 `<ul role="list">` + `<li>` 필수(Safari VoiceOver WCAG 1.3.1, MobileNav.tsx 2026-04-30), Step 51: `text-[10px]` arbitrary size → `MICRO_TYPO.badge` 토큰 경유 필수(approval.ts 2026-04-30)) | `lib/design-tokens/**`, `apps/frontend/components/**`, `styles/globals.css`, `apps/frontend/components/layout/connection-banner.tsx` |
| `verify-security`       | 보안 설정 검증 (Step 12: server-only 설정 파일 `import 'server-only'` 빌드타임 경계 강제 — api-config.server.ts 등 서버 전용 설정 파일의 번들러 차단 보장, Client 컴포넌트에서 api-config.server import 0건 확인, Step 13: GlobalExceptionFilter APP_FILTER DI 등록 — main.ts `useGlobalFilters(new GlobalExceptionFilter())` 직접 등록 0건 + app.module.ts APP_FILTER provider 존재, Step 14: SECURITY_AUDITABLE_CODES SSOT — security-auditable-codes.ts 외 로컬 `new Set<ErrorCode>` 재정의 0건, filter/interceptor 양쪽 import 확인, Step 15: scope/소유권 위반 ErrorCode HTTP 403 강제 — `*NotSubmitter`/`*OnlyRequesterCan` 패턴은 BadRequestException 0건, errorCodeToStatusCode 403 매핑, SECURITY_AUDITABLE_CODES 등록 3중 확인(2026-05-02 inspection/equipment-import 3건 수정 사례)) | `helmet-config.ts`, `next.config.js`, `**/*.controller.ts`, `apps/frontend/lib/config/api-config.server.ts`, `apps/backend/src/common/constants/security-auditable-codes.ts`, `apps/backend/src/common/filters/error.filter.ts` |
| `verify-i18n`           | i18n 번역 + routeMap↔navigation.json + audit SSOT enum 동기화 검증 (Step 15: commentRequired=true ↔ commentDialogTitleKey/commentPlaceholderKey i18n 존재 검증, Step 16: 호출지 ↔ messages JSON parity 정적 검증 + common.json 구조 검증 — `check-i18n-call-sites.mjs`로 useTranslations/getTranslations 호출 키 ↔ ko/en JSON parity 자동 검증 + atom 회귀 메커니즘 차단(common.json root level은 sub-namespace만 허용), Step 17: `CROSS_CUTTING_NAMESPACES`=['common','errors'] 상수 + `checkStructuralNamespaces()` 함수 존재 확인 — navigation/auth/notifications는 flat-by-design 의도적 제외, Step 18: `components/shared/` 도메인 namespace 결합 차단 — `SHARED_COMPONENT_DOMAIN_NS_RULE` ESLint 게이트 존재 + `components/shared/**` glob 적용 + negative lookahead 5-namespace 완전성 확인, Step 19: ESLint typed linting 블록 inner ignores에 `**/*.stories.{ts,tsx}` 포함 확인 — global ignores와 독립 동작하므로 명시적 추가 필수) | `apps/frontend/messages/{en,ko}/*.json`, `lib/navigation/route-metadata.ts`, `packages/schemas/src/enums/audit.ts`, `scripts/check-i18n-call-sites.mjs`, `apps/frontend/components/**/*.{ts,tsx}`, `apps/frontend/eslint.config.mjs` |
| `verify-sql-safety`     | SQL 안전성 검증                        | `apps/backend/src/modules/**/*.service.ts`                             |
| `verify-e2e`            | E2E 테스트 패턴 검증 (Step 4: waitForTimeout 대신 event-based wait — waitFor({state:'detached'})/expect(modal).not.toBeVisible(), Step 5: ARIA role locator 허용 예외 — progressbar/dialog/toolbar/checkbox/menuitem는 ARIA 역할 자체 검증 목적 허용, Step 20d: apiGetWithToken/apiPatchWithToken role vs token 헬퍼 분리 패턴, Step 20e: 로그인 폼 자격증명 DEV_*_PASSWORD 환경변수+fallback SSOT, Step 21: test.use() describe 스코프 강제 — test() 내부 호출은 silently ignored(fail-closed.spec.ts FC-13~20 패턴, 2026-04-30), Step 22: goto/reload 후 networkidle + waitForFunction 중복 탐지(legacy-sw-cleanup.spec.ts TC-01, 2026-04-30), Step 23: TestRole 4-place SSOT 정합성 — TestRole 유니언 추가 시 CANONICAL_ROLE/TEST_USERS/TEST_USER_IDS/TEST_USER_DETAILS 4곳 동시 갱신 필수(test-auth.ts, 2026-05-01), Step 24: Fixture 권한 격리 — createTestEquipment 등 setup fixture는 자체 `loginAs(app, 'systemAdmin')` 발급 + 호출부 token 인자 의존 금지(test-fixtures.ts, UL-QP-18 직무분리 commit 77cb3f37 회귀 방지), Step 25: e2e spec actor token 적절성 — site-permissions/role-constraint/permission spec은 'systemAdmin' actor 사용 금지(scope 검증 dead code화 위험, 도메인 역할 'admin'/'manager'/'user' 사용 필수), Step 26a: 도메인 e2e helper SSOT 분리 — workflow-helpers.ts 누적(≥1500L) 회피 + `<domain>-helpers.ts` 패턴 (inspection-template-helpers.ts 사례, 2026-05-02), Step 26b: prefill 폼 value-based selector — `input[value=""]` 위치 의존 selector 0건(inspectionDate 등 다른 빈 input과 충돌), Step 26c: backend hook fail-soft 회귀 가드 — DB 직접 검증(findCurrentTemplateId 등) — UI 검증만으로는 silent fail catch 불가, Step 26d: 도메인 메커니즘 변경 시 legacy spec rewrite — 의도(회귀 가드) 유지+메커니즘만 정합화 (WF-19d.spec.ts 2026-05-02 사례), Step 26e: intermediate/self 양면 페어링 — 같은 backend hook 도메인 페어 e2e 양면 spec 필수(wf-20c-self-inspection-template-badge.spec.ts 2026-05-02)) | `tests/e2e/**/*.spec.ts`, `tests/e2e/shared/**`, `tests/e2e/workflows/helpers/**`, `global-setup.ts`, `apps/backend/test/helpers/test-auth.ts`, `apps/backend/test/helpers/test-fixtures.ts`, `apps/backend/test/*.e2e-spec.ts`    |
| `verify-seed-integrity` | 시드 인프라 3자 SSOT 삼각형 정합성     | `database/seed-data/**/*.seed.ts`, `seed-test-new.ts`, `verification.ts` |
| `verify-workflows`      | 크리티컬 워크플로우 E2E 커버리지 검증 (wf-ap* 시리즈 네이밍 허용 — 승인 UI 전용 wf-ap01/wf-ap02 등) | `docs/workflows/critical-workflows.md`, `tests/e2e/workflows/**/*.spec.ts` |
| `verify-cache-events`   | 이벤트 기반 캐시 무효화 아키텍처 검증  | `cache-event.registry.ts`, `cache-event-listener.ts`, `cache-invalidation.helper.ts`, `cache-patterns.ts` |
| `verify-handover-security` | QR 기반 인수인계 토큰 보안 검증 — 시크릿 분리, jti 소비, TTL SSOT | `HandoverTokenService`, `OneTimeTokenService`, handover 컨트롤러 |
| `verify-qr-ssot`        | QR URL/설정/액션 SSOT 경유 검증 — 인라인 URL·경로 하드코딩 탐지 | `qr-url.ts`, `qr-config.ts`, `qr-access.ts`, QR 관련 서비스/컴포넌트 |

> 2026-05-03 관리 메모: `docs/operations/quality-audit-routes.json`를 Lighthouse/a11y 감사 대상 라우트 SSOT로 추가했다.
> 관련 변경은 `verify-e2e` Step 27(공개 a11y config 경계)과 `verify-hardcoding` Step 34(audit route literal 중복 금지)에서 검증한다.
> 2026-05-03 관리 메모: backend controller/service pagination 기본값·최대 clamp는 `DEFAULT_PAGE_SIZE`/`MAX_PAGE_SIZE` SSOT를 사용한다.
> 관련 변경은 `verify-ssot` Step 59에서 검증한다.
| `verify-checkout-fsm`   | Checkout FSM SSOT 아키텍처 검증 — Dependency Inversion(UserRole import 금지), assertFsmInvariants, CheckoutPermissionKey 동기화, assertFsmAction HTTP 의미론(403/400 분리), controller guard ↔ FSM 정렬, writeTransitionAudit 캡슐화, 예외 계층 일관화, lenderTeam identity-rule 강제(Step 18), NO_EQUIPMENT 가드 배치(Step 19, ≥4건), rejectReturn checkTeamPermission unconditional(Step 20), firstEquip 취득 패턴 items[0] 기준(Step 22), rejectReturn reason 검증 순서 scope/FSM 이후(Step 23), checkout-api.ts nextStep 타입 동기화(Step 24), borrower identity-rule 백엔드 전용(Step 25), handleNextStepAction FRONTEND_ROUTES 완전 매핑(Step 26), findCheckoutEntity 분리(Step 28), findOne userPermissions 필수(Step 29), FSM drift safeParse(Step 30), findOne CheckoutWithMeta 단일 반환(Step 31), EXPECTED_ENTRY_COUNT 동적 table test(Step 32), rental-phase.ts SSOT exhaustiveness guard(Step 33), resolveActorVariant 순수 함수 SSOT + data-variant/data-actor-variant 속성(Step 34), roleToActorVariant+ActorVariant schemas SSOT+isMyTurn UserRoleValues.SYSTEM_ADMIN(Step 35), reachedStepIndex 3분기+computeReachedStepIndex terminatedFromStatus 위임(Step 36), terminatedFromStatus terminal 저장 패턴(Step 37), revokeApproval isRevocation 마커(Step 38), useCheckoutNextStep hook terminatedFromStatus passthrough(Step 39), compact canAct 분기 이중 렌더 금지(Step 40), ProgressStepDescriptor SSOT + deriveProgressStepState 5-state exhaustive(done/current/late/future/terminated) + TerminationKind + descriptor 클램프(Step 41), findAll+findOne user.team 양측 완전성 — team.site findAll/findOne 동기화 + 캐스트 0건(Step 45), ESCAPE_ACTIONS 집합 불변성{cancel/reject/reject_return/borrower_reject}+getNextStep 4단계 우선순위(Step 46), checkout-scope.util outbound=case 1+3 불변성(requesterIn outbound 미사용, isPending 0건)(Step 47), handleNextStepAction availableToCurrentUser early-return+canCancel 독립 버튼+meta.nextStep wiring(Step 48), steps.indexOf fallback 금지 — computeStepIndex(status, purpose) SSOT 경유 필수(Step 49), rental returnCheckout purpose-aware validation — workingStatusChecked 서버 도출(priorChecks.length>0) + DTO 검증 면제 + every(normal) 금지(Step 50), KPI 카드 value-filterStatus 상태 집합 정합성 — `CHECKOUT_STATUS_GROUPS` SSOT 경유 필수, getSummary() 필드명이 클릭 필터와 동일 집합 참조 보장, 로컬 재집계 0건(Step 51), revokeApproval scope→FSM→reason→time-window→domain 5단계 fail-close 순서 검증 — reason이 FSM 이전 역전 0건(Step 52, 2026-05-03) | `packages/schemas/src/fsm/checkout-fsm.ts`, `packages/schemas/src/fsm/rental-phase.ts`, `packages/schemas/src/fsm/progress-step.ts`, `packages/schemas/src/checkout.ts`, `checkouts.service.ts`, `checkouts.controller.ts`, `apps/frontend/lib/api/checkout-api.ts`, `apps/frontend/lib/api/approvals-api.ts`, `apps/frontend/hooks/use-checkout-progress-steps.ts`, `apps/frontend/components/checkouts/CheckoutProgressStepper.tsx`, `apps/frontend/components/checkouts/ProgressFlowSection.tsx`, `CheckoutDetailClient.tsx`, `apps/frontend/components/shared/NextStepPanel.tsx`, `packages/db/src/schema/checkouts.ts`, `apps/backend/src/modules/checkouts/checkout-scope.util.ts` |

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

### Step 8: 요약 보고서

분석 파일 수, 업데이트/생성 스킬, 영향없는 스킬, 미커버 변경사항 출력.

## Related Files

| File | Purpose |
|------|---------|
| `.claude/skills/verify-implementation/SKILL.md` | 통합 검증 스킬 (실행 대상 목록 관리) |
| `.claude/skills/manage-skills/SKILL.md` | 이 파일 (등록된 검증 스킬 목록 관리) |
| `CLAUDE.md` | 프로젝트 지침 (Skills 섹션 관리) |

## 예외사항

1. **Lock 파일 및 생성된 파일** — 스킬 커버리지 불필요
2. **일회성 설정 변경** — 버전 범프 등 새 스킬 불필요
3. **문서 파일** — 코드 패턴이 아님
4. **테스트 픽스처 파일** — 프로덕션 코드 아님
5. **영향받지 않은 스킬** — 검토 불필요
6. **CLAUDE.md 자체** — 문서 업데이트
7. **벤더/서드파티 코드** — 외부 규칙
8. **CI/CD 설정** — 인프라, 검증 스킬 불필요
