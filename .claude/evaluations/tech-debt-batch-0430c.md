---
slug: tech-debt-batch-0430c
iteration: 1
verdict: FAIL
---

## MUST Criteria

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| A1.1 | `pnpm --filter backend exec tsc --noEmit` exit 0 | PASS | Exit 0, no output |
| A1.2 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | PASS | Exit 0, no output |
| A1.3 | `pnpm --filter backend run lint` exit 0 | **FAIL** | `apps/backend/src/modules/reports/__tests__/form-template.service.spec.ts` — 2 ESLint errors: (1) `BadRequestException` imported but never used (line 2, `@typescript-eslint/no-unused-vars`); (2) `makeMockFormTemplateRow` missing return type annotation (line 22, `@typescript-eslint/explicit-function-return-type`). Exit 1. |
| A1.4 | `pnpm --filter frontend run lint` exit 0 | **FAIL** | `apps/frontend/components/dashboard/MyActivityCard.tsx:104:42` — `userName` parameter defined but never used (`@typescript-eslint/no-unused-vars`). The parameter was kept in the function signature after this batch's refactor removed the `aria-label={t('ariaLabel', { name: userName ?? '' })}` usage. Exit 1. |
| A2.1 | `pnpm --filter backend run test` exit 0 | PASS | 44 tests pass across 4 suites (includes new specs) |
| A2.2 | `file-upload.service.spec.ts` + `form-template.service.spec.ts` discovered + PASS | PASS | Both specs discovered and pass (32 tests combined) |
| A2.3 | `fsm-meta-guard.interceptor.spec.ts` 3 cases PASS | PASS | 3/3 pass; `error: (err) => done(err)` present in all subscribe callbacks |
| A3.1 | `useFormState` 신규 사용 0건 | PASS | grep 0건 확인 |
| A3.2 | `middleware` 함수명 신규 사용 0건 | PASS | 변경 파일에서 `export function middleware` 0건; 주석의 `middleware.ts` 언급은 기존 코드 |
| A3.3 | `params`/`searchParams` 직접 접근 0건 | PASS | 변경 파일에서 비 awaited props.params 패턴 0건 |
| A3.4 | `useTranslation` (단수) 신규 import 0건 | PASS | 변경 파일 전부 `useTranslations` 사용 |
| A3.5 | 내부 `<Loader2>` 신규 추가 0건 | PASS | 설정 파일 3개의 기존 Loader2는 이번 배치 이전부터 존재; 이번 배치에서 `loading={mutation.isPending}` prop만 추가된 것으로 확인(ccde0f74). 신규 Loader2 JSX 삽입 0건. |
| A4.1 | `.github/dependabot.yml` `versioning-strategy:` 키 존재 | PASS | 11행: `versioning-strategy: 'auto'` |
| A4.2 | `version-update:semver-major` ignore +9건 이상 | PASS | 이전 버전(78b97374): 6건 → 현재: 24건. 델타 +18건 ≥ 9건 |
| A4.3 | YAML 파싱 가능 | PASS | `node -e "require('js-yaml').load(...)"` 통과 |
| A5.1 | `href="#dashboard-row1"` SkipLink 인스턴스 존재 | PASS | `DashboardShell.tsx:125` — `<SkipLink href="#dashboard-row1" labelKey="layout.skipToDashboard" />` |
| A5.2 | `id="dashboard-row1"` + `tabIndex={-1}` 존재 | PASS | `DashboardClient.tsx:238` — `<div id="dashboard-row1" tabIndex={-1} ...>` |
| A5.3 | i18n 키 ko + en 양쪽 존재 | PASS | `messages/ko/navigation.json:85`, `messages/en/navigation.json:85` 모두 `skipToDashboard` 키 확인 |
| A6.1 | `duration-200` 또는 200ms 토큰 적용 | PASS | `APPROVAL_STEPPER_TOKENS.connector.transition` = `TRANSITION_PRESETS.fastBg` = `getTransitionClasses('fast', ['background-color'])` → `motion-safe:duration-200` 포함 |
| A6.2 | `motion-reduce:transition-none` 가드 존재 | PASS | `getTransitionClasses()` 반환값에 `motion-reduce:transition-none` 자동 포함(motion.ts:70행) |
| A6.3 | `transition-all` / `transition: all` 사용 0건 | PASS | `ApprovalStepIndicator.tsx` 내 해당 패턴 0건 |
| A7.1 | `test(` 호출 수 ≥ 20 | PASS | `fail-closed.spec.ts` 내 `test(` 정확히 20건 |
| A7.2 | `@equipment-management/schemas` 또는 `shared-constants` import 1건 이상 | **FAIL** | `fail-closed.spec.ts`에 `@equipment-management` 패키지 import 0건. 공유 fixture/helper(`auth.fixture.ts`, `shared-test-data.ts`)는 SSOT를 import하지만 spec 파일 자체는 미import. 계약 기준은 "fail-closed E2E spec" 파일 기준. |
| A7.3 | 신규 8 케이스가 describe 블록 또는 매트릭스 패턴 | PASS | FC-13~FC-20 전부 명시적 `test.describe` 블록으로 구조화됨 |
| A8.1 | `packages/schemas/src/**` 수정 0건 | PASS | `git status` 결과 packages/ 디렉터리 내 수정된 파일 0건; `checkout-fsm.ts` 수정(991754ad)은 이번 배치 이전 커밋 |
| A8.2 | `packages/shared-constants/src/**` 수정 0건 | PASS | 현재 working tree에 변경 없음 |
| A8.3 | `file-upload.service.ts` 수정 0건 (spec만 신설) | PASS | `git status` — `file-upload.service.ts` 미수정; spec만 untracked로 신설 |
| A8.4 | `form-template.service.ts` 수정 0건 (spec만 신설) | PASS | `git status` — `form-template.service.ts` 미수정; spec만 untracked로 신설 |
| A8.5 | Migration SQL 신설 0건 | PASS | 변경 파일 목록에 `.sql` 없음 |
| A8.6 | Role/Permission 추가/변경 0건 | PASS | `packages/shared-constants/src` 미수정 |
| A9.1 | body에서 userId 받는 신규 코드 0건 | PASS | 변경 diff에서 `body.userId` / `@Body() ... userId` 패턴 0건 |
| A9.2 | 하드코딩 URL (`'/api/...'`) 신규 0건 | PASS | 변경 diff 검사: 신규 하드코딩 API 경로 0건 |
| A9.3 | Role 리터럴 (`'ADMIN'` 등) 신규 0건 | PASS | 변경 diff 검사: Role 리터럴 신규 추가 0건 |
| A9.4 | `eslint-disable` 신규 추가 0건 | PASS | 변경 diff 검사: eslint-disable 신규 추가 0건 |
| A9.5 | `setQueryData` 신규 추가 0건 | PASS | 변경 diff 검사: setQueryData 신규 추가 0건 |

## SHOULD Criteria

| ID | Criterion | Result | Note |
|----|-----------|--------|------|
| B1.1 | Magic bytes 검증 케이스 ≥ 4 | PASS | PDF/JPEG 불일치, PNG/ZIP 불일치, DOCX/plaintext 불일치, CSV skip = 4건 |
| B1.2 | SHA-256 fileHash 정확성 검증 ≥ 1 (실값 비교) | PASS | `file-upload.service.spec.ts:150` — `createHash('sha256').update(file.buffer).digest('hex')`로 실제값 비교 |
| B1.3 | Path traversal sanitize 케이스 ≥ 1 | PASS | 172행: `sanitizeKey — path traversal 입력 제거` 케이스 존재 |
| B1.4 | IdentifierService mock spy `generateAttachmentId` 호출 검증 ≥ 1 | PASS | 142행: `expect(mockIdentifiers.generateAttachmentId).toHaveBeenCalledTimes(1)` |
| B1.5 | Storage upload 실패 → `InternalServerErrorException` 변환 검증 ≥ 1 | PASS | 193행: `provider.upload 실패 → FileSaveFailed(InternalServerErrorException)` |
| B2.1 | INSERT 2건 검증 (formTemplates + formTemplateRevisions) | **FAIL** | `form-template.service.spec.ts`의 성공 흐름 테스트는 `generateAttachmentId`(1회)와 `storage.upload`(1회)만 검증. `tx.insert`가 formTemplates와 formTemplateRevisions 두 테이블에 각각 호출되었는지(2회) 별도 assertion 없음. |
| B2.2 | ZIP signature 누락 → BadRequestException ≥ 1 | PASS | 195행: `Office MIME + ZIP sig 누락 → InvalidFormat` (BadRequestException 하위) |
| B2.3 | 파일 크기 < 4096 → BadRequestException ≥ 1 | PASS | 185행: `파일 크기 < 4096 → InvalidFormat(BadRequestException)` |
| B2.4 | DB 트랜잭션 실패 → safeDeleteStorage 호출 검증 ≥ 1 | PASS | 217행: `DB 트랜잭션 실패 → safeDeleteStorage 호출` — `mockStorage.delete`가 1회 호출됨 검증 |
| B2.5 | IdentifierService mock spy 검증 ≥ 1 | PASS | 211행: `expect(mockIdentifiers.generateAttachmentId).toHaveBeenCalledTimes(1)` |
| B2.6 | Cache hit/miss 양쪽 커버 | PASS | downloadBuffer describe: cache hit(mockCache.getOrSet override) / cache miss(기본 동작) 양쪽 케이스 |
| B3.1 | `<ul` 1건 + nav 내부 위치 | PASS | `DashboardShell.tsx:252` — nav 내부 `<ul className="flex flex-col gap-1 list-none" role="list">` |
| B3.2 | NavRowWithSecondaryAction outermost가 `<li>` | PASS | `DashboardShell.tsx:254` — `<li key={item.href}>` 래핑 후 `<NavRowWithSecondaryAction>` |
| B3.3 | `role="list"` 명시 | PASS | `DashboardShell.tsx:252` — `<ul ... role="list">` 확인 |
| B3.4 | `memo()` 래핑 보존 | PASS | `NavRowWithSecondaryAction.tsx:54` — `export const NavRowWithSecondaryAction = memo(...)` |
| B3.5 | MobileNav 동일 시맨틱 (존재 시) | **FAIL** | `MobileNav.tsx`는 nav 아이템 목록을 `<div className="flex flex-col gap-1">` + `<NavLink key={item.href} ...>` 구조로 렌더. `<ul>`/`<li>`/`role="list"` 없음. |
| B4.1 | AzureAdButton 내부 `<Loader2` JSX 0건 | PASS | `AzureAdButton.tsx` 전체에서 `Loader2` 문자열 0건 |
| B4.2 | LoginForm 내부 `<Loader2` JSX 0건 | PASS | `LoginForm.tsx` 전체에서 `Loader2` 문자열 0건 |
| B4.3 | settings 3파일 내부 `<Loader2` JSX 0건 | **FAIL** | 3개 설정 파일 모두 Button에 `loading={mutation.isPending}` 추가됐지만 children 내 `{mutation.isPending ? (<><Loader2 .../><span>저장 중</span></>) : ...}` 조건부 렌더 그대로 유지. Double spinner 패턴 미해소: `CalibrationSettingsContent.tsx:228`, `SystemSettingsContent.tsx:305`, `DisplayPreferencesContent.tsx:306` |
| B4.4 | 5파일 모두 `loading={isPending}` 보존 | PASS | AzureAdButton, LoginForm은 `loading={isPending}`. 설정 3파일은 `loading={mutation.isPending}` 모두 확인 |
| B4.5 | `loadingLabel` prop에 i18n 키 전달 | PASS | AzureAdButton: `loadingLabel={AUTH_CONTENT.button.azureAdLoading}`, LoginForm: `loadingLabel={t('submitting')}` |
| B5.1 | `Logger.warn` 사용 + throw 0건 | PASS | `fsm-meta-guard.interceptor.ts:11` 주석 및 구현: Logger.warn 발행만, 예외 미발생. spec에서 `warnSpy` mock으로 확인 |
| B5.2 | checkouts.controller.ts 클래스 레벨 `@UseInterceptors` 1건 | PASS | `checkouts.controller.ts:99` — `@UseInterceptors(FsmMetaGuardInterceptor)` 클래스 레벨 |
| B5.3 | `NextStepDescriptorSchema.safeParse` 사용 | PASS | `fsm-meta-guard.interceptor.ts:91` — `NextStepDescriptorSchema.safeParse(metaObj.nextStep)` |
| B5.4 | unit spec 3 케이스 모두 PASS | PASS | `fsm-meta-guard.interceptor.spec.ts` — 3/3 PASS |
| B6.1 | `APPROVAL_STEPPER_TOKENS.startNodeLabel` 토큰 정의 | **FAIL** | `approval.ts`에 `startNodeLabel` 토큰 없음. APPROVAL_STEPPER_TOKENS 내 해당 키 미존재. |
| B6.2 | disposalSteps `index === 0`에만 조건부 렌더 | **FAIL** | `ApprovalStepIndicator.tsx`에 `index === 0` 조건부 분기 없음. 시작 노드 라벨 렌더링 로직 미구현. |
| B6.3 | `▸` aria-hidden="true" | **FAIL** | `ApprovalStepIndicator.tsx`에 `▸` 문자 없음. B6.1/B6.2와 동일한 원인: 기능 미구현. |
| B7.1 | verify-implementation 스킬에 spec helper return type grep step 추가 | **FAIL** | `verify-implementation/SKILL.md` 검토 결과 "spec helper return type" 관련 grep 단계 없음. |

## Issues Requiring Fix

### FAIL 1: A1.3 — Backend lint: form-template.service.spec.ts 2 ESLint 오류

파일: `apps/backend/src/modules/reports/__tests__/form-template.service.spec.ts`

1. **Line 2**: `BadRequestException` import를 제거하거나 테스트에서 직접 사용 필요
   - 현재 테스트는 `rejects.toMatchObject({ response: { code: ErrorCode.InvalidFormat } })`로만 검증하고 `BadRequestException` 클래스를 직접 참조하지 않음
   - 수정안: import에서 `BadRequestException` 제거
   
2. **Line 22**: `makeMockFormTemplateRow` 함수에 반환 타입 추가 필요
   - 수정안: `function makeMockFormTemplateRow(overrides: Record<string, unknown> = {}): ReturnType<typeof makeMockFormTemplateRow>` 또는 명시적 반환 타입 인터페이스 정의

### FAIL 2: A1.4 — Frontend lint: MyActivityCard.tsx userName unused variable

파일: `apps/frontend/components/dashboard/MyActivityCard.tsx:104`

이번 배치 리팩터에서 `aria-label={t('ariaLabel', { name: userName ?? '' })}` 사용이 제거되었지만 `userName` 파라미터가 함수 시그니처에 남아있음.

수정안: 파라미터명 앞에 `_` 접두사 추가(`_userName`) 또는 `MyActivityCardProps` 인터페이스와 함께 파라미터 완전 제거.

### FAIL 3: A7.2 — fail-closed.spec.ts에 SSOT import 없음

파일: `apps/frontend/tests/e2e/features/checkouts/fsm/fail-closed.spec.ts`

계약 A7.2는 스펙 파일에 `@equipment-management/schemas` 또는 `@equipment-management/shared-constants` import 1건 이상을 요구하나, 현재 파일은 `import path from 'path'`와 로컬 auth fixture만 import함.

수정안: 예를 들어 `import { CheckoutStatus } from '@equipment-management/schemas'`를 추가하고 spec 내 status 값 검증에 활용. 또는 `FRONTEND_ROUTES`를 `@equipment-management/shared-constants`에서 import하여 URL 검증에 사용.

## SHOULD Debt

(tech-debt-tracker 등재 권고, batch prefix: `tech-debt-batch-0430c`)

| ID | Issue | File | Priority |
|----|-------|------|----------|
| B2.1 | form-template spec에 tx.insert 호출 횟수(2회) + 테이블별 구분 assertion 미추가 | `apps/backend/src/modules/reports/__tests__/form-template.service.spec.ts` | Medium |
| B3.5 | MobileNav nav 아이템 목록 `<ul role="list">` + `<li>` 시맨틱 미적용 (접근성 WCAG 1.3.1) | `apps/frontend/components/layout/MobileNav.tsx` | High |
| B4.3 | settings 3파일 Double spinner 미해소: Button `loading={isPending}` 추가 후 children의 `<Loader2>` 조건부 분기 유지 | `CalibrationSettingsContent.tsx`, `SystemSettingsContent.tsx`, `DisplayPreferencesContent.tsx` | Medium |
| B6 | ApprovalStepIndicator 시작 노드 라벨(`▸` + APPROVAL_STEPPER_TOKENS.startNodeLabel) 미구현 (B6.1~B6.3 전부) | `apps/frontend/components/approvals/ApprovalStepIndicator.tsx` + `approval.ts` | Low |
| B7.1 | verify-implementation SKILL.md에 spec helper 반환 타입 grep step 미추가 | `.claude/skills/verify-implementation/SKILL.md` | Low |
