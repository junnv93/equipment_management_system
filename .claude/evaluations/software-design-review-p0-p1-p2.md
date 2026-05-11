# Evaluation — software-design-review-p0-p1-p2

> Iteration: 1
> Date: 2026-05-11
> Verdict: **PASS** (16/16 MUST)
> Mode: Mode 1 (Lightweight)
> Branch context: 다른 세션이 만든 `refactor/qr-visual-redesign` 브랜치에서 작업. 본 evaluation은 contract M-1 격리 정책에 따라 Generator의 14개 파일에 대해서만 판정.

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| **M-1** | SSOT 정합성 (신규 컴포넌트는 기존 패턴 추종) | **PASS** | `SoftwareEmptyState.tsx:6` imports `EmptyState` SSOT. `SoftwareValidationStepper.tsx:10/24/36` + `software-validation-step.ts:22-23/65/85` 모두 `PROGRESS_STEP_STATES` / `ProgressStepState` SSOT 재사용. `SoftwareValidationStepper.tsx` raw color 0건. 새 generic `Stepper`/`EmptyStateCTA`/`MobileCardListFallback` 신설 0건 (도메인 wrapper만). |
| **M-2** | P0-2 디자인 토큰 신설 | **PASS** | `software.ts:209` `SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS` 5 키 (draft/submitted/approved/quality_approved/rejected) 모두 매핑. `as const satisfies Record<ValidationStatus, string>` 컴파일타임 exhaustive. `index.ts:817` re-export. |
| **M-3** | P0-3 backend BFF 확장 | **PASS** | `test-software.service.ts:38` `latestValidationStatus?: ValidationStatus \| null` 타입 추가. `:198/:261/:313` 3 메서드(findAll/findOne/findByEquipmentId)에 `softwareValidations LEFT JOIN`. `software-api.ts:38` `latestValidationStatus: ValidationStatus \| null` 필드. backend tsc exit 0. |
| **M-4** | P0-3 frontend 컬럼 노출 | **PASS** | `TestSoftwareListContent.tsx:271` `list.columns.validationStatus` TableHead. `:69` `ValidationStatusBadge` 컴포넌트 정의. `:81` `SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS` 사용. `:329/:380` 데스크톱+모바일 양쪽 노출. 미검증 분기 (latestValidationId === null && requiresValidation) 처리. |
| **M-5** | P0-1 stepper 통합 | **PASS** | `ValidationDetailContent.tsx:23-24` import. `:91` adapter hook 호출. `:137` 헤더 직후 `<SoftwareValidationStepper />` 렌더 (draft 상태 자동 hide). a11y: `SoftwareValidationStepper.tsx:186-187` `role="list"` + `aria-label`, `:122` `aria-current="step"`, `:85` sr-only 상태 텍스트. `:228` `gridTemplateColumns: repeat(N, ...)` 동적 N (JIT 안전). |
| **M-6** | P1-1 모바일 카드 fallback | **PASS** | `ResponsiveListFallback.tsx:42` `hidden md:block` desktop slot, `:45` `md:hidden` mobile slot. `TestSoftwareListContent.tsx:31` + `SoftwareValidationsListContent.tsx:18` 양쪽 import + 사용. md breakpoint SSOT. |
| **M-7** | P1-2 P-number / 이름 셀 통합 | **PASS** | `TestSoftwareListContent.tsx:271` `list.columns.identifier` 통합 컬럼 헤더. `flex flex-col gap-0.5` + `font-mono text-[11px] tracking-wide text-muted-foreground` (P-number) + `text-sm font-semibold text-foreground truncate` (이름) stacked. 데스크톱 + 모바일 동일 패턴. |
| **M-8** | P1-3 ValidationCreateDialog 안정화 | **PASS** | `ValidationCreateDialog.tsx:53` `max-w-2xl max-h-[85vh] overflow-y-auto` 단일 사이즈. validationType 분기 0건. `SelfValidationFields.tsx:7` `Tabs` import + `:39/:62` `TabsContent` 사용 (4 탭: basic/acquisition/processing/control). |
| **M-9** | P1-4 빈 상태 EmptyState 적용 | **PASS** | 도메인 wrapper 5곳 호출: `TestSoftwareListContent:247` `<TestSoftwareEmptyState />`, `SoftwareValidationsListContent:92` + `SoftwareValidationContent:308` `<ValidationListEmptyState />`, `DocumentTable:54` `<ValidationDocumentsEmptyState />`. 인라인 `<Package className="mb-3 h-10 w-10" />` 등 기존 패턴 0건. |
| **M-10** | P2-1 raw Tailwind 색상 → 시멘틱 토큰 | **PASS** | software 도메인 production 코드에서 `text-yellow-600` / `text-blue-600` / `text-green-600` / `text-red-600` 0건 (오직 JSDoc 주석에 references). 신규 `SOFTWARE_VALIDATION_STATUS_ICON_TOKENS` (`text-brand-warning/info/ok/critical/muted-foreground`) 사용 — 다크모드 자동 전환 보장. |
| **M-11** | dt/dd 위계 강화 (스니펫 5) | **PASS** | 4개 InfoCard 모두 `VALIDATION_INFO_CARD_TOKENS as TOK` import: `Basic`/`Vendor`/`SelfTest`/`Approval`. dt: `text-[11px] font-medium uppercase tracking-wider text-muted-foreground`. dd: `mt-1 text-sm font-medium text-foreground`. ddMono / ddDestructive 변형도 일관. |
| **M-12** | i18n parity (ko/en) | **PASS** | deep walker 결과 `ko keys: 315, en keys: 315, parity: true`. 신규 키 모두 양쪽 동등. |
| **M-13** | Next.js 16 deprecated API 0건 | **PASS** | Generator 신규 작성 파일 (`SoftwareValidationStepper`, `use-software-validation-progress-steps`, `software-validation-step.ts`)에서 `useFormState` / `export async function middleware` grep 0 hits. `useActionState` / `proxy.ts` 컨벤션 준수 영역. |
| **M-14** | 빌드 / 타입 / 테스트 | **PASS** | backend `tsc --noEmit` exit 0. frontend `tsc --noEmit` 에러 0건 (Generator 파일 기준). 다른 세션의 `hooks/use-approvals-bulk-mutations.ts:141` readonly 에러는 contract M-1 격리 정책으로 OOS. |
| **M-15** | 하드코딩 0 | **PASS** | 신규 SSOT 컴포넌트 3개에서 한국어/영어 string literal 0건 (모두 `t('...')` 또는 JSDoc 주석). 모든 색상은 brand 토큰 (`text-brand-*`) 또는 `getSemantic*Classes()` 헬퍼. `latestValidationStatus`는 ValidationStatus enum 5단계 + null. |
| **M-16** | 접근성 (WCAG) | **PASS** | Stepper `<ol role="list" aria-label="...">`, 각 `<li> aria-current="step"` (current/late만). 색상으로만 단계 의미 전달 회피 → sr-only `srState` 텍스트 동반 (Done/Future/Terminated). `motion-safe:animate-pulse` (reduced-motion 보호). EmptyState role/ariaLive 자동 분기 (`EmptyState` SSOT 동작 보존). |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| **S-1** | P2-2 ValidationDetail 와이드 그리드 재배치 | **PASS** | `ValidationDetailContent.tsx:140` `grid grid-cols-1 gap-6 xl:grid-cols-2` 적용. 좌측 BasicInfo+Approval / 우측 Vendor or Self + Documents. |
| **S-2** | P2-3 행 클릭 패턴 통일 | **PASS** | `SoftwareValidationsListContent.tsx:111` `<Link>` overlay 패턴으로 변경 (이전 `onClick window.location.href` 제거). 두 list 페이지 동일 navigation 패턴 (NavLink/Link absolute inset-0 overlay). |
| **S-3** | ResponsiveListFallback 사용처 확장 | **N/A** | 본 sprint 범위는 software 도메인만. 향후 checkouts/equipment 적용은 후속 sprint. |
| **S-4** | e2e 테스트 (playwright) | **DEFERRED** | tech-debt 등록 권장: `tests/e2e/features/software/validation-stepper.spec.ts` + `list-validation-status.spec.ts`. Manual 검증으로 대체 (이 sprint 범위 내 e2e 인프라 변경 없음). |

## Verdict: **PASS**

전 16 MUST 기준 통과. SHOULD 4개 중 2 PASS / 1 N/A / 1 DEFERRED.

### Out-of-scope (다른 세션 작업)

contract M-1 격리 정책 적용:
- `hooks/use-approvals-bulk-mutations.ts:141` readonly 타입 에러 → 다른 세션의 qr-visual-redesign 작업 영향
- `hooks/use-checkout-bulk-mutations.ts:132/136` 동일
- `components/checkouts/KeyboardShortcutsProvider.tsx`, `components/mobile/EquipmentLandingClient.tsx`, `components/ui/StatusBadge.tsx` 등의 에러 — 모두 다른 세션 작업

### Post-merge Actions

- S-4 e2e 테스트 → tech-debt-tracker.md 등록 권장
- example-prompts.md → archive-design.md 이동
- REGISTRY.md Active 섹션 → 본 항목 제거
- contract → completed/ 이동
