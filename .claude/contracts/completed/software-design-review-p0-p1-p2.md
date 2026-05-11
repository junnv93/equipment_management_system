# Contract — Software Design Review P0/P1/P2 Closure

> Slug: `software-design-review-p0-p1-p2`
> Mode: Mode 1 (Lightweight) — 단일 도메인 + 신규 SSOT 컴포넌트는 기존 패턴 추종
> 입력: `c:/Users/kmjkd/Downloads/DESIGN_REVIEW.md` + 와이어프레임 HTML
> 시작일: 2026-05-11

## Scope

DESIGN_REVIEW.md의 P0(3건) + P1(4건) + P2(3건) 전수 closure. 단편 임시방편 거부. 기존 SSOT 패턴(EmptyState / ProgressStep / 디자인 토큰)을 100% 추종하여 신규 SSOT 분산 0건.

대상 파일 (11):
- `apps/frontend/lib/design-tokens/components/software.ts` — 신규 토큰
- `apps/frontend/app/(dashboard)/software/TestSoftwareListContent.tsx`
- `apps/frontend/app/(dashboard)/software-validations/SoftwareValidationsListContent.tsx`
- `apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx`
- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/ValidationDetailContent.tsx`
- `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationCreateDialog.tsx`
- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/ValidationApprovalInfoCard.tsx`
- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/ValidationBasicInfoCard.tsx`
- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/ValidationVendorInfoCard.tsx`
- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/ValidationSelfTestInfoCard.tsx`
- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/ValidationDocumentsSection.tsx`

신규 파일 (5):
- `apps/frontend/components/software/SoftwareValidationStepper.tsx` — P0-1 stepper
- `apps/frontend/hooks/use-software-validation-progress-steps.ts` — adapter hook
- `apps/frontend/components/software/SoftwareEmptyState.tsx` — 도메인 wrapper (CheckoutEmptyState 패턴)
- `apps/frontend/components/shared/ResponsiveListFallback.tsx` — md breakpoint SSOT
- `packages/schemas/src/fsm/software-validation-step.ts` — software stepper descriptor SSOT

Backend 변경 (1):
- `apps/backend/src/modules/test-software/test-software.service.ts` — `findAll` 에 `software_validations` LEFT JOIN으로 `latestValidationStatus` 추가
- `apps/frontend/lib/api/software-api.ts` — TestSoftware 타입에 `latestValidationStatus` 추가

i18n (2):
- `apps/frontend/messages/ko/software.json` + `apps/frontend/messages/en/software.json` — 동일 키 parity

## MUST Criteria (실패 시 loop 차단)

### M-1. SSOT 정합성 (신규 컴포넌트는 기존 패턴 추종)
- **검증**: `grep -rn "from '@/components/shared/EmptyState'" apps/frontend/components/software/SoftwareEmptyState.tsx` → 1+ 매치 (EmptyState SSOT 재사용 확인)
- **검증**: `grep -rn "PROGRESS_STEP_STATES\|ProgressStepState" apps/frontend/components/software/SoftwareValidationStepper.tsx packages/schemas/src/fsm/software-validation-step.ts` → 둘 다 매치 (state SSOT 재사용)
- **검증**: 새 stepper 컴포넌트가 `getSemanticBadgeClasses` 또는 `text-brand-*` 토큰만 사용 (raw `text-yellow-600` 등 0건). `grep -E "text-(yellow|blue|green|red)-[0-9]" apps/frontend/components/software/SoftwareValidationStepper.tsx` → 0 hits
- **금지**: 새 generic `Stepper` / `EmptyStateCTA` / `MobileCardListFallback` 신설. 기존 SSOT 우회 시 FAIL.

### M-2. P0-2 디자인 토큰 신설
- `apps/frontend/lib/design-tokens/components/software.ts` 에 `SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS` export 존재
- 5개 키 모두 매핑: `draft / submitted / approved / quality_approved / rejected`
- `as const satisfies Record<ValidationStatus, string>` 컴파일타임 exhaustive 보장
- `apps/frontend/lib/design-tokens/index.ts` 에서 re-export
- **검증**: `grep -c "SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS" apps/frontend/lib/design-tokens/index.ts` → ≥1

### M-3. P0-3 backend BFF 확장
- `test-software.service.ts findAll` 응답에 `latestValidationStatus: ValidationStatus | null` 필드 포함 (LEFT JOIN으로 software_validations.status 가져옴)
- `TestSoftwareWithManagers` 타입에 `latestValidationStatus?: ValidationStatus | null` 추가
- `apps/frontend/lib/api/software-api.ts` `TestSoftware` 인터페이스에 동일 필드 추가
- **검증**: `grep -n "latestValidationStatus" apps/backend/src/modules/test-software/test-software.service.ts apps/frontend/lib/api/software-api.ts` → 양쪽 매치
- **검증**: `pnpm --filter backend run tsc --noEmit && pnpm --filter frontend run tsc --noEmit` → exit 0

### M-4. P0-3 frontend 컬럼 노출
- `TestSoftwareListContent.tsx` 테이블에 "검증 상태" 컬럼 추가
- `SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS` 사용
- 6분류: `미검증(latestValidationId === null)` + draft/submitted/approved/quality_approved/rejected
- **금지**: 인라인 `text-yellow-600` 등 raw 색상

### M-5. P0-1 stepper 통합
- `ValidationDetailContent.tsx` 헤더 직후에 `<SoftwareValidationStepper />` 배치
- 4단계: `submitted → approved → quality_approved` (rejected는 terminated 표시)
- adapter hook `use-software-validation-progress-steps`가 `validation` 객체 → `SoftwareValidationStepDescriptor[]` 변환
- **a11y**: `<ol role="list">` + `aria-current="step"` (current 단계만) + 각 step의 sr-only 상태 텍스트
- **반응형**: `grid-cols-N` 동적 — `style={{ gridTemplateColumns }}`로 JIT 안전

### M-6. P1-1 모바일 카드 fallback (두 list)
- `TestSoftwareListContent` + `SoftwareValidationsListContent` 양쪽에 `<ResponsiveListFallback>` 적용
- `md` breakpoint 기준 (Tailwind `md:hidden` / `hidden md:block`)
- 모바일 카드: P-number(font-mono text-[11px]) + 이름(font-semibold) + 검증상태 + 가용여부
- **검증**: `grep -c "ResponsiveListFallback\|md:hidden\|hidden md:block" apps/frontend/app/\(dashboard\)/software/TestSoftwareListContent.tsx` → ≥1

### M-7. P1-2 P-number / 이름 셀 통합
- `TestSoftwareListContent` 테이블의 managementNumber + name 두 컬럼이 1셀로 stacked (data-testid 또는 `flex flex-col` 패턴)
- 컬럼 헤더 1개 줄어듬 (총 컬럼 수 9 → 8 또는 9 unchanged + 검증상태 추가)

### M-8. P1-3 ValidationCreateDialog 안정화
- `DialogContent className`이 `validationType`에 따라 분기되지 않음 (단일 클래스명 또는 항상 같은 max-w-*)
- self 타입 폼은 sub-tabs(`Tabs`) 또는 `Accordion`으로 분할
- **검증**: `grep -c "max-w-md\|max-w-3xl" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/_components/ValidationCreateDialog.tsx` → 둘 다 동시 존재 0건 (한 가지 사이즈만)

### M-9. P1-4 빈 상태 EmptyState 적용 (도메인 wrapper)
- `SoftwareEmptyState.tsx` 신규 — `EmptyState` SSOT 재사용 + primaryAction 포함 (CTA)
- 두 list + DocumentTable + ValidationDocumentsSection 빈 상태 모두 `SoftwareEmptyState` 사용
- 인라인 `<div className="flex flex-col ... <Package /> <p>...` 직접 빈 상태 0건
- **검증**: `grep -rn "Package className=\"mb-3 h-10 w-10\"\|FileCheck className=\"mb-3 h-10 w-10\"" apps/frontend/app/\(dashboard\)/software*` → 0 hits

### M-10. P2-1 raw Tailwind 색상 시멘틱 토큰화
- `apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx` + `apps/frontend/app/(dashboard)/software-validations/SoftwareValidationsListContent.tsx` STATUS_ICON에서 raw 색상 제거
- 대체: `text-brand-warning` / `text-brand-info` / `text-brand-ok` / `text-brand-critical` / `text-muted-foreground`
- **검증**: `grep -E "text-(yellow|blue|green|red)-[0-9]+0" apps/frontend/app/\(dashboard\)/software*` → 0 hits

### M-11. dt/dd 위계 강화 (스니펫 5)
- `ValidationApprovalInfoCard` + `ValidationBasicInfoCard` + `ValidationVendorInfoCard` + `ValidationSelfTestInfoCard` 의 dt/dd 패턴 통일
- dt: `text-[11px] font-medium uppercase tracking-wider text-muted-foreground`
- dd: `mt-1 text-sm font-medium text-foreground`
- **검증**: `grep -c "uppercase tracking-wider text-muted-foreground" apps/frontend/app/\(dashboard\)/software/\[id\]/validation/\[validationId\]/_components/Validation*InfoCard.tsx` → ≥4 (4개 카드)

### M-12. i18n parity (ko/en 동일 키)
- 신규 키: `validation.steps.submitted` / `validation.steps.approved` / `validation.steps.qualityApproved` / `validation.steps.pending` / `validation.steps.rejected` / `validation.steps.ariaLabel`
- 신규 키: `validation.empty.title` / `validation.empty.description` / `validation.empty.cta`
- 신규 키: `list.empty.cta` / `list.empty.description`
- 신규 키: `list.columns.validationStatus` / `validation.notValidated`
- ko/en 양쪽에 동일 키 1:1 존재
- **검증**: `node -e "const ko=Object.keys(require('./apps/frontend/messages/ko/software.json'));const en=Object.keys(require('./apps/frontend/messages/en/software.json'));console.log('ko==en:', JSON.stringify(ko)===JSON.stringify(en));"` (top-level diff) — 또는 deep walker 결과 동등

### M-13. Next.js 16 deprecated API 0건
- 본 sprint에서 신규 작성하는 모든 파일이 deprecated API 미사용:
  - `useFormState` 사용 0 (대체: `useActionState`)
  - sync `params`/`searchParams` 직접 접근 0 (Promise + await)
  - `middleware.ts` 컨벤션 0 (proxy 사용)
- **검증**: `grep -rn "useFormState\|export async function middleware" apps/frontend/components/software/ apps/frontend/hooks/use-software-validation-progress-steps.ts packages/schemas/src/fsm/software-validation-step.ts` → 0 hits

### M-14. 빌드 / 타입 / 테스트
- `pnpm --filter backend run tsc --noEmit` → exit 0
- `pnpm --filter frontend run tsc --noEmit` → exit 0
- `pnpm --filter backend run build` → exit 0
- `pnpm --filter frontend run build` → exit 0 (production build 정합)
- `pnpm --filter backend run test -- --testPathPattern=test-software` → 기존 테스트 파괴 0

### M-15. 하드코딩 0
- 새로 생긴 모든 색상은 brand 토큰 또는 `getSemantic*` 헬퍼만 사용
- 새로 생긴 i18n 텍스트는 ko/en 양쪽에 동일 키 추가, 컴포넌트 내 한국어/영어 리터럴 0
- **검증**: `grep -rE "(['\"])(?:[ㄱ-힣]|[A-Z][a-z]{3,})" apps/frontend/components/software/SoftwareValidationStepper.tsx apps/frontend/components/software/SoftwareEmptyState.tsx apps/frontend/hooks/use-software-validation-progress-steps.ts` → 한국어 리터럴 0 (i18n key 형식 'validation.steps.*' 만)

### M-16. 접근성 (WCAG)
- Stepper: `<ol role="list">`, 각 `<li>` `aria-current="step"` (current만), 색상으로만 단계 의미 전달 금지 → sr-only 텍스트 동반
- EmptyState: `role="status"` (variant=neutral) 또는 `role="alert"` (variant=error) 자동 분기 — 기존 EmptyState 동작 보존
- Stepper 애니메이션: `motion-safe:` prefix로 reduced-motion 사용자 보호 (CheckoutProgressStepper 패턴 추종)

## SHOULD Criteria (실패해도 loop 차단 안 함, tech-debt 등록)

### S-1. P2-2 ValidationDetail 와이드 그리드 재배치
- `xl:grid-cols-2` 적용 (BasicInfo + Approval = 좌측 / Vendor or Self + Documents = 우측)
- 미적용 시 tech-debt-tracker.md 등록

### S-2. P2-3 행 클릭 패턴 통일
- `TestSoftwareListContent`의 `absolute inset-0` 오버레이 vs `SoftwareValidationsListContent`의 `onClick window.location.href` 통일
- 권장 패턴: `<TableRow>` 내부 `NavLink` 오버레이 (TestSoftwareListContent 기존 패턴 사용) — 두 페이지 일치
- 미적용 시 tech-debt 등록

### S-3. moduleResponsiveListFallback 사용처 확장
- ResponsiveListFallback이 SSOT로 신설되면 향후 다른 list 페이지(checkouts, equipment)에도 점진 적용 가능 — 본 sprint는 software 도메인만

### S-4. e2e 테스트 (playwright)
- `tests/e2e/features/software/validation-stepper.spec.ts` — 페이지 로드 후 stepper의 단계 노출 검증
- `tests/e2e/features/software/list-validation-status.spec.ts` — 목록 검증 상태 컬럼 렌더링
- 본 sprint에서는 manual 검증으로 대체 가능 (e2e 인프라 영향 없음)

## Verification Commands

```bash
# 1. 타입/빌드
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run build
pnpm --filter frontend run build

# 2. 테스트
pnpm --filter backend run test -- --testPathPattern=test-software
pnpm --filter frontend run test 2>/dev/null | tail -20

# 3. SSOT verify skills
# (verify-implementation skill 또는 직접 grep)
grep -E "text-(yellow|blue|green|red)-[0-9]+" \
  apps/frontend/app/\(dashboard\)/software*/**/*.tsx \
  apps/frontend/components/software/**/*.tsx 2>/dev/null

# 4. i18n parity
diff \
  <(node -e "const o=require('./apps/frontend/messages/ko/software.json'); function w(o,p){Object.entries(o).forEach(([k,v])=>{const n=p?p+'.'+k:k; if(v&&typeof v==='object')w(v,n); else console.log(n)})} w(require('./apps/frontend/messages/ko/software.json'))" | sort) \
  <(node -e "function w(o,p){Object.entries(o).forEach(([k,v])=>{const n=p?p+'.'+k:k; if(v&&typeof v==='object')w(v,n); else console.log(n)})} w(require('./apps/frontend/messages/en/software.json'))" | sort)
```

## Rationale (왜 이 contract인가)

- **SSOT 정합성 (M-1)**: 코드베이스에 EmptyState / ProgressStepDescriptor / brand 토큰 SSOT가 강력히 정착. 새 generic 신설은 분산을 야기. 도메인 wrapper만 신설.
- **Backend 확장 필수 (M-3)**: P0-3 검증 상태 컬럼은 단순 frontend 작업 아님. 현재 list BFF는 `latestValidationId`만 노출. status를 같이 노출해야 N+1 query 회피.
- **i18n parity (M-12)**: 새 키만 추가하고 ko/en 한쪽만 작성하면 fallback 동작 안 함. 1:1 동등 강제.
- **deprecated API 차단 (M-13)**: 사용자가 명시 — Next.js 16 최신 API.
- **단편 임시방편 거부 (M-1, M-15)**: raw 색상 / 하드코딩 / 단일 페이지 wrapper 모두 회귀 위험. 토큰화 + i18n + SSOT 강제.
