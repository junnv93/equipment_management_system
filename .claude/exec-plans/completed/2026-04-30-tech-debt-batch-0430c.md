# Tech Debt Batch 0430c — 즉시 실행 항목 일괄 처리

> **세션 ID:** tech-debt-batch-0430c
> **출처:** `.claude/exec-plans/tech-debt-tracker.md` Open 항목 중 트리거 비-의존 + 도메인 정책 결정 비-필요 항목 10건
> **계약:** `.claude/contracts/tech-debt-batch-0430c.md`
> **선행 batch:** tech-debt-batch-0430 (Phase A~G 완료), tech-debt-batch-0430b

## 0. Scope

| # | 그룹 | 항목 ID | 우선도 |
|---|---|---|---|
| 1 | A | `dependabot-yml-policy` | MEDIUM |
| 2 | B | `file-upload-form-template-spec-신설` | MEDIUM |
| 3 | B | `fsm-response-interceptor-guard` | LOW |
| 4 | B | `dashboard-spec-helper-return-type-policy` | LOW |
| 5 | C | `second-skip-link-row1` | LOW |
| 6 | C | `sidebar-row-container-li-semantics` | LOW |
| 7 | D | `visual-double-spinner-auth-settings` | LOW |
| 8 | D | `stepper-disposal-start-node-label` | LOW |
| 9 | D | `stepper-step-transition-animation` | LOW |
| 10 | E | `fail-closed-e2e-matrix-expansion` | LOW |

### Non-Goals (의도적 제외)

- 도메인 정책 결정 필요: `quality-approve-comment-policy`, `ar13-lab-manager-self-inspection`
- 트리거 조건부 항목 (40+건): 조건 미충족 → 보존
- 외부 인프라 의존: `legacy-sw-unregister-e2e-verification`, Sentry
- 디자이너/사용자 결정: `sidebar-eq-monogram-design-decision`
- SSOT/도메인 enum/Migration SQL 변경 0건 (수술적 변경 원칙)

## 1. API 버전 준수 원칙 (최우선)

- **React 19**: `useActionState` 사용, `useFormState` 금지
- **Next.js 16**: `proxy` 함수명, `params`/`searchParams` → `await props.params` 패턴
- **next-intl**: `useTranslations` (복수형), `useTranslation` 단수 금지 (`client.ts` 삭제됨)
- **ShadcnUI Button**: `loading` prop + `loadingLabel` 사용, 내부 `<Loader2>` 중복 금지

## 2. Phase 0 — 위치 확정 (선행 필수)

```bash
# fail-closed.spec.ts 위치
find apps -type f -name "*fail-closed*spec*" -o -name "*fail-closed*test*"

# settings 이중 스피너 후보
grep -rln 'loading={isPending}' apps/frontend/app/\(dashboard\)/settings/ \
  apps/frontend/components/settings/
# → 내부 <Loader2>도 동시 보유하는 파일만 선별

# MobileNav 존재 여부
find apps/frontend -name "MobileNav.tsx" -o -name "*mobile*nav*"
```

**FAIL-FAST:** fail-closed.spec.ts 미발견 시 항목 #10만 N/A 처리, 나머지 9건 진행.

## 3. Phase 1 — Dependabot 정책 강화 (항목 #1)

**파일:** `.github/dependabot.yml`

변경:
1. `versioning-strategy: 'auto'` — npm ecosystem 블록에 추가 (caret 잠금 정책 보존)
2. semver-major ignore 추가 (9건):
   - `react`, `react-dom` (Next.js 16 + RSC 호환성)
   - `next` (App Router 16→17 별도 마이그레이션)
   - `next-auth` (v5+ `auth()` API 변경)
   - `next-intl` (locale 라우팅 ABI)
   - `tailwindcss` (v4 ESM/Lightning CSS 마이그레이션)
   - `drizzle-orm`, `drizzle-kit` (스키마/마이그레이션 형식 호환성)
   - `zod` (v4 schema API 변경)
   - `@playwright/test` (storageState/fixture 호환성)
   - `pg` (Drizzle 호환 매트릭스 의존)

```bash
# 검증
node -e "require('js-yaml').load(require('fs').readFileSync('.github/dependabot.yml','utf8'))" && echo "YAML OK"
grep -c "versioning-strategy" .github/dependabot.yml   # ≥ 1
grep -c "version-update:semver-major" .github/dependabot.yml  # 기존 + 9 추가
```

## 4. Phase 2 — Backend 테스트 신설 (항목 #2)

### file-upload.service.spec.ts (12 케이스 최소)

**경로:** `apps/backend/src/common/file-upload/file-upload.service.spec.ts`

테스트 매트릭스:
1. validateFile — 빈 buffer, 10MB 초과, allow-list 외 MIME
2. Magic bytes — PDF/JPEG mismatch, PNG/ZIP mismatch, DOCX/plain mismatch, CSV skip
3. saveFile — SHA-256 일치, sanitizeKey path traversal, IdentifierService 경유
4. storage upload 실패 → InternalServerErrorException

Mock: `STORAGE_PROVIDER` jest.fn + `createMockIdentifierService()` (기존 헬퍼 사용)
실제 `crypto.createHash`는 mock 안 함 (fileHash 실값 비교).

### form-template.service.spec.ts (14 케이스 최소)

**경로:** `apps/backend/src/modules/reports/form-template.service.spec.ts`

테스트 매트릭스:
1. `findCurrentByName`/`getCurrentByName`/`getById` — 정상/없음/아카이브
2. `createFormTemplateVersion` — FORM_CATALOG 미존재, 중복 formNumber, 정상 흐름, 크기<4096, 시그니처 불일치, DB 트랜잭션 실패→orphan 방지
3. `replaceCurrentFile` — 없음, 정상, DB 실패→cleanup
4. `getTemplateBuffer` — cache hit/miss

Mock: `DRIZZLE_INSTANCE` + `STORAGE_PROVIDER` + `CACHE_SERVICE` + `createMockIdentifierService()`

참조 패턴: `dashboard.service.spec.ts`의 `createQueryChain` 헬퍼 (transaction은 callback 즉시 실행 패턴)

```bash
pnpm --filter backend run test -- file-upload.service.spec
pnpm --filter backend run test -- form-template.service.spec
grep -c "createMockIdentifierService" \
  apps/backend/src/common/file-upload/file-upload.service.spec.ts \
  apps/backend/src/modules/reports/form-template.service.spec.ts  # ≥ 2
```

## 5. Phase 3 — FSM Response Interceptor Guard (항목 #3)

**신설:** `apps/backend/src/common/interceptors/fsm-meta-guard.interceptor.ts`
**수정:** `apps/backend/src/modules/checkouts/checkouts.controller.ts` (`@UseInterceptors` 추가)
**신설 (spec):** `apps/backend/src/common/interceptors/fsm-meta-guard.interceptor.spec.ts`

책임:
- `next.handle().pipe(tap(...))` — 응답 후 tap으로 검사
- 단건 Checkout 응답에서 `meta` 누락, `meta.availableActions`/`meta.nextStep` drift 감지
- `Logger.warn`만 발행, 예외 throw 0건 (defense-in-depth만)
- `NextStepDescriptorSchema.safeParse` 사용 (`@equipment-management/schemas`)
- 컨트롤러 레벨 `@UseInterceptors` 등록 (전역 등록 금지 — noise 차단)

unit spec 3 케이스:
- meta 누락 → Logger.warn 1회 + payload 통과
- nextStep invalid → Logger.warn 1회
- 정상 payload → Logger.warn 0회

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- fsm-meta-guard
grep -n "FsmMetaGuardInterceptor" apps/backend/src/modules/checkouts/checkouts.controller.ts  # ≥ 1
```

## 6. Phase 4 — spec helper 정책 확인 (항목 #4)

`dashboard.service.spec.ts:326` `setupHealthMocks`가 이미 `: void` 만족하는지 확인.
만족 시: `.claude/skills/verify-implementation/SKILL.md`에 spec helper return type grep step 보강.
미만족 시: `: void` 명시 추가.

```bash
grep -n "setupHealthMocks" apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts
```

## 7. Phase 5 — 두 번째 Skip Link (항목 #5)

**수정 파일:**
- `apps/frontend/components/layout/SkipLink.tsx` — 기존 props BC 보존, 사용처에서 2회 사용 가능
- `apps/frontend/components/layout/DashboardShell.tsx` — `#dashboard-row1` SkipLink 추가
- `apps/frontend/messages/ko/navigation.json` — `layout.skipToDashboard` 키 추가
- `apps/frontend/messages/en/navigation.json` — 동일 키 영문
- `apps/frontend/app/(dashboard)/page.tsx` 또는 `DashboardRow1` root — `id="dashboard-row1"` + `tabIndex={-1}`

ko: `"대시보드 본문으로 건너뛰기"`, en: `"Skip to dashboard content"` (i18n parity)
DOM 순서: Tab 1 → `#main-content`, Tab 2 → `#dashboard-row1`, Tab 3 → 사이드바

```bash
pnpm --filter frontend run tsc --noEmit
grep "skipToDashboard" apps/frontend/messages/ko/navigation.json apps/frontend/messages/en/navigation.json  # 2건
grep -rn 'id="dashboard-row1"' apps/frontend/  # ≥ 1
```

## 8. Phase 6 — 사이드바 `<ul><li>` 시맨틱 (항목 #6)

**수정 파일:**
- `apps/frontend/components/layout/DashboardShell.tsx` — nav 내 `<div className="flex flex-col gap-1">` → `<ul className="flex flex-col gap-1" role="list">`
- `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` — outermost `<div>` → `<li>` (분기 3 모두)
- MobileNav.tsx (Phase 0에서 존재 확인 시) — 동일 적용

`role="list"` 필수 (Safari/iOS list-style: none 시 SR list 미인식 방어).
CSS 영향 0 (globals.css `ul { list-style: none; padding: 0 }`).
`memo()` 래핑 보존.

```bash
pnpm --filter frontend run tsc --noEmit
grep -nE '<ul[^>]*role="list"' apps/frontend/components/layout/DashboardShell.tsx  # ≥ 1
grep -c "<li" apps/frontend/components/layout/NavRowWithSecondaryAction.tsx  # ≥ 2
```

## 9. Phase 7 — 이중 스피너 제거 (항목 #7)

**수정 파일 (5건):** AzureAdButton.tsx, LoginForm.tsx, settings 파일 3건 (Phase 0 grep 확정)

패턴:
- 기존: `<Button loading={isPending}>...{isPending && <Loader2 />}...</Button>`
- 변경: `<Button loading={isPending} loadingLabel={t('submitting')}>{children}</Button>`
- Button 컴포넌트가 spinner 단독 책임, `<Loader2>` 내부 중복 제거
- `loadingLabel`은 i18n 키로 (하드코딩 금지)
- AzureAdButton: `loadingPosition="replace"` 검토 — logo+text 영역 전체를 spinner로 swap (CLS 0)
- LoginForm `isSuccess` 분기(`<CheckCircle2>`)는 변경 없음 — `isPending` 분기만 정리

```bash
grep -c "Loader2" apps/frontend/components/auth/AzureAdButton.tsx  # 0
grep -c "Loader2" apps/frontend/components/auth/LoginForm.tsx  # 0
grep -c "loading={isPending}" apps/frontend/components/auth/{AzureAdButton,LoginForm}.tsx  # ≥ 2 (보존)
```

## 10. Phase 8 — ApprovalStepIndicator 개선 (항목 #8 + #9)

**수정 파일:**
- `apps/frontend/lib/design-tokens/approvals.ts` (또는 토큰 파일) — 신규 토큰 2종 추가
- `apps/frontend/components/approvals/ApprovalStepIndicator.tsx` — 토큰 적용

토큰 신설:
- `APPROVAL_STEPPER_TOKENS.startNodeLabel` — `'absolute -top-2 -left-2 text-[10px] text-muted-foreground'`
- `APPROVAL_STEPPER_TOKENS.transition` — `'motion-safe:transition-[border-color,background-color,color] motion-safe:duration-200 motion-reduce:transition-none'`

disposalSteps `index === 0`에만 `▸` 마이크로 라벨 (aria-hidden="true").
planSteps에 미적용.
`transition: all` / `transition-all` 사용 0건 (명시 속성 리스트만).

```bash
pnpm --filter frontend run tsc --noEmit
grep -n "startNodeLabel\|APPROVAL_STEPPER_TOKENS" apps/frontend/lib/design-tokens/approvals.ts  # ≥ 2
grep -c "duration-200\|motion-reduce" apps/frontend/components/approvals/ApprovalStepIndicator.tsx  # ≥ 1
```

## 11. Phase 9 — fail-closed E2E 매트릭스 확장 (항목 #10)

**수정:** `<Phase 0 확정 경로>/fail-closed.spec.ts` (12 → 20 케이스)

8 케이스 추가:
1. lab_manager + BORROWER_APPROVED → 최종승인 button 가시성
2. lab_manager + LENDER_CHECKED → 수령확인 가시성
3. technical_manager + BORROWER_RETURNED → 반입승인 가시성
4. admin + OVERDUE → cancel/reminder 가시성
5. test_engineer + PENDING_BORROWER_APPROVAL → cancel 가시성
6-8. Negative 3건 — 권한 없는 role × status 액션 0건

`CHECKOUT_STATUS_VALUES`를 `@equipment-management/schemas`에서 import (하드코딩 금지).
중첩 for-of 또는 `test.each` 패턴.

```bash
grep -cE "^\s*test\(" <fail-closed.spec.ts 경로>  # ≥ 20
pnpm --filter frontend run test:e2e -- fail-closed
```

## 12. Phase 10 — 통합 검증

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend run lint
.husky/pre-push
```

## 13. Build Sequence 체크리스트

- [ ] Phase 0: 위치 확정 (fail-closed + settings grep)
- [ ] Phase 1: dependabot.yml versioning-strategy + 9 ignore
- [ ] Phase 2: file-upload.spec (12) + form-template.spec (14)
- [ ] Phase 3: FsmMetaGuardInterceptor + controller + spec
- [ ] Phase 4: dashboard helper 정책 확인 + verify-implementation 스킬 보강
- [ ] Phase 5: SkipLink #2 + dashboard-row1 ID + i18n ko/en
- [ ] Phase 6: `<ul><li>` 시맨틱 (DashboardShell + NavRow + MobileNav)
- [ ] Phase 7: 이중 스피너 5파일 제거
- [ ] Phase 8: ApprovalStepIndicator startNodeLabel + 200ms transition
- [ ] Phase 9: fail-closed 12→20 케이스
- [ ] Phase 10: 통합 tsc + test + lint
- [ ] wrap-up: tech-debt-tracker 10항목 archive, plan/contract archive 이동
