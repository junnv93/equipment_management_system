# Contract: tech-debt-batch-0430c

> **Plan:** `.claude/exec-plans/active/2026-04-30-tech-debt-batch-0430c.md`
> **Mode:** Mode 2 (Full Harness)
> **Scope:** 10 즉시 실행 가능 항목 일괄 처리

## A. MUST Criteria

### A1. 빌드/타입 게이트
- **A1.1** `pnpm --filter backend run tsc --noEmit` exit 0
- **A1.2** `pnpm --filter frontend run tsc --noEmit` exit 0
- **A1.3** `pnpm --filter backend run lint` exit 0
- **A1.4** `pnpm --filter frontend run lint` exit 0

### A2. 테스트 게이트
- **A2.1** `pnpm --filter backend run test` exit 0 (기존 + 신설 spec 포함)
- **A2.2** 신설 spec 2건 jest discovery + 모든 케이스 PASS:
  - `apps/backend/src/common/file-upload/file-upload.service.spec.ts`
  - `apps/backend/src/modules/reports/form-template.service.spec.ts`
- **A2.3** `fsm-meta-guard.interceptor.spec.ts` 3 케이스 PASS

### A3. API 버전 준수 (옛날 API 금지)
- **A3.1** `useFormState` 신규 사용 0건 (deprecated — `useActionState` 사용)
- **A3.2** `middleware` 함수명 신규 사용 0건 (Next.js 16 deprecated — `proxy` 사용)
- **A3.3** `params`/`searchParams` 직접 접근 0건 (Next.js 16 — `await props.params` 패턴)
- **A3.4** `useTranslation` (단수형) 신규 import 0건 (deprecated — `useTranslations` 사용)
- **A3.5** 내부 `<Loader2>` 신규 추가 0건 (Button `loading` prop으로 단독 처리)

### A4. Dependabot 정책 (항목 #1)
- **A4.1** `.github/dependabot.yml` `versioning-strategy:` 키가 npm ecosystem 블록에 존재
- **A4.2** `version-update:semver-major` ignore 라인 기존 대비 +9건 이상
- **A4.3** YAML 파싱 가능 (`node -e "require('js-yaml').load(...)"` 통과)

### A5. SkipLink #2 (항목 #5)
- **A5.1** `href="#dashboard-row1"` SkipLink 인스턴스 DashboardShell에 존재
- **A5.2** `id="dashboard-row1"` + `tabIndex={-1}` 가진 element 존재
- **A5.3** i18n 키 ko + en 양쪽 존재 (skipToDashboard 또는 동등 키)

### A6. ApprovalStepIndicator transition (항목 #9)
- **A6.1** `duration-200` 또는 200ms 토큰이 노드 element에 적용
- **A6.2** `motion-reduce:transition-none` 가드 존재
- **A6.3** `transition-all` / `transition: all` 사용 0건

### A7. fail-closed E2E 매트릭스 (항목 #10)
- **A7.1** `test(` 호출 수 ≥ 20 (Phase 0 미발견 시 N/A)
- **A7.2** `@equipment-management/schemas` 또는 `@equipment-management/shared-constants` import 1건 이상
- **A7.3** 신규 8 케이스가 매트릭스 패턴(`for-of`/`test.each`) 또는 명시적 describe 블록

### A8. SSOT/수술적 변경 원칙
- **A8.1** `packages/schemas/src/**` 수정 0건
- **A8.2** `packages/shared-constants/src/**` 수정 0건
- **A8.3** `apps/backend/src/common/file-upload/file-upload.service.ts` 수정 0건 (spec만 신설)
- **A8.4** `apps/backend/src/modules/reports/form-template.service.ts` 수정 0건 (spec만 신설)
- **A8.5** Migration SQL 신설 0건
- **A8.6** Role/Permission 추가/변경 0건

### A9. 보안 회귀 0
- **A9.1** Rule 2: body에서 userId 받는 신규 코드 0건
- **A9.2** 하드코딩 URL (`'/api/...'`) 신규 0건
- **A9.3** Role 리터럴 (`'ADMIN'` 등) 신규 0건
- **A9.4** `eslint-disable` 신규 추가 0건
- **A9.5** `setQueryData` 신규 추가 0건

## B. SHOULD Criteria

### B1. file-upload.service.spec.ts 깊이
- **B1.1** Magic bytes 검증 케이스 ≥ 4
- **B1.2** SHA-256 fileHash 정확성 검증 ≥ 1 (실값 비교)
- **B1.3** Path traversal sanitize 케이스 ≥ 1
- **B1.4** IdentifierService mock spy로 `generateAttachmentId` 호출 검증 ≥ 1
- **B1.5** Storage upload 실패 → `InternalServerErrorException` 변환 검증 ≥ 1

### B2. form-template.service.spec.ts 깊이
- **B2.1** INSERT 2건 검증 (formTemplates + formTemplateRevisions)
- **B2.2** ZIP signature 누락 → BadRequestException ≥ 1
- **B2.3** 파일 크기 < 4096 → BadRequestException ≥ 1
- **B2.4** DB 트랜잭션 실패 → safeDeleteStorage 호출 검증 ≥ 1
- **B2.5** IdentifierService mock spy 검증 ≥ 1
- **B2.6** Cache hit/miss 양쪽 커버

### B3. 사이드바 nav 시맨틱 (항목 #6)
- **B3.1** `<ul` 1건 + nav 내부 위치
- **B3.2** NavRowWithSecondaryAction outermost가 `<li>` (3분기 모두)
- **B3.3** `role="list"` 명시
- **B3.4** `memo()` 래핑 보존
- **B3.5** MobileNav 동일 시맨틱 (존재 시)

### B4. 이중 스피너 제거 (항목 #7)
- **B4.1** AzureAdButton 내부 `<Loader2` JSX 0건
- **B4.2** LoginForm 내부 `<Loader2` JSX 0건
- **B4.3** settings 3파일 내부 `<Loader2` JSX 0건
- **B4.4** 5파일 모두 `loading={isPending}` 보존
- **B4.5** `loadingLabel` prop에 i18n 키 전달

### B5. FSM Response Interceptor (항목 #3)
- **B5.1** `Logger.warn` 사용 + throw 0건
- **B5.2** checkouts.controller.ts 클래스 레벨 `@UseInterceptors` 1건
- **B5.3** `NextStepDescriptorSchema.safeParse` 사용
- **B5.4** unit spec 3 케이스 모두 PASS

### B6. Stepper 시작 노드 라벨 (항목 #8)
- **B6.1** `APPROVAL_STEPPER_TOKENS.startNodeLabel` 토큰 정의
- **B6.2** disposalSteps `index === 0`에만 조건부 렌더
- **B6.3** `▸` aria-hidden="true"

### B7. verify-implementation 스킬 보강 (항목 #4)
- **B7.1** spec helper return type 검증 grep step 추가

## C. Definition of Done

- [ ] A1~A9 모든 MUST PASS
- [ ] B1~B7 SHOULD ≥ 80% 충족
- [ ] tech-debt-tracker.md 10 항목 `[x]` 처리 또는 archive 이동
- [ ] plan + contract → completed/ 이동
- [ ] 부수 발견 항목 tech-debt-tracker에 등재 (batch prefix: `tech-debt-batch-0430c`)
