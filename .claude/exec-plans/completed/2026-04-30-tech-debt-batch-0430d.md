# tech-debt-batch-0430d

## 메타
- 날짜: 2026-04-30
- 모드: Mode 2 (Generator → Evaluator harness)
- 슬러그: tech-debt-batch-0430d
- 선행: tech-debt-batch-0430 (A~G), tech-debt-batch-0430b, tech-debt-batch-0430c
- 출처: `.claude/exec-plans/tech-debt-tracker.md` Open 항목 잔여분

## 0. 범위 요약

| # | 그룹 | 항목 ID | 우선도 |
|---|---|---|---|
| 1 | A | `checkout-group-card-setQueryData` | MEDIUM |
| 2 | C | `dependabot-yml-policy` (보강) | MEDIUM |
| 3 | A | `file-upload-form-template-spec-신설` (TSC 잔여) | MEDIUM |
| 4 | D | `mobilenav-list-semantics` | LOW |
| 5 | D | `stepper-start-node-label-token` | LOW |
| 6 | E | verify-implementation: spec helper return type step | LOW |
| 7 | E | verify-implementation: 언더스코어 prefix param check | LOW |
| 8 | F | `visual-double-spinner-settings-only` | LOW |
| 9 | F | S1 BulkActionBar actions slot SKILL.md 문서화 | LOW |
| 10 | F | S2 useRowSelection IME 가드 | LOW |
| 11 | F | S9 RejectModal charsRemaining 카운터 | LOW |

### Non-Goals (의도적 제외)

- 외부 트리거(prod 배포/사용자 발생) 의존 항목 — 보존
- SSOT 재정의/도메인 enum 변경 — 수술적 변경 원칙
- Migration SQL 신규 — 0건
- bulkRejectDialog 신설 — Sprint 4.5 D2 delegation 결정 보존(기존 RejectModal mode='bulk' 활용)

## 1. API 버전 준수 원칙

- React 19: `useActionState`, `useFormState` 금지
- Next.js 16: `proxy` 함수명, `await props.params`
- next-intl: `useTranslations` (복수형)
- ShadcnUI Button: `loading`/`loadingPosition`/`loadingLabel` SSOT
- TanStack Query 메모리 룰: `setQueryData` 금지 (CheckoutGroupCard onError 롤백 제외 — 스냅샷 복원은 허용)

## 2. Phase 0 — Pre-flight 위치 확정

```bash
# CheckoutGroupCard setQueryData 라인 확정
grep -n "setQueryData" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# → 206, 263 (onError 스냅샷 복원 — invalidateQueries 전환 검토)

# Settings 이중 스피너 후보
grep -rln 'loading={isPending}' \
  apps/frontend/app/\(dashboard\)/settings/admin/calibration/ \
  apps/frontend/app/\(dashboard\)/settings/admin/system/ \
  apps/frontend/app/\(dashboard\)/settings/display/

# RejectModal char counter 패턴 grep
grep -rn "charsRemaining\|자 남음\|자 남았\|글자 남" apps/frontend/components --include="*.tsx"

# MobileNav 시맨틱 현황
grep -nE "<ul|<li|<div className" apps/frontend/components/layout/MobileNav.tsx | head -20
```

## 3. Phase A — Backend Specs (Item 3)

**목표:** `file-upload.service.spec.ts` 정합성 확인 + `form-template.service.spec.ts` TSC 잔여 에러 해소.

### 파일

- `apps/backend/src/common/file-upload/__tests__/file-upload.service.spec.ts` (이미 존재 — 보강 검토)
- `apps/backend/src/modules/reports/__tests__/form-template.service.spec.ts` (TSC 잔여 라인 257/266 정밀 진단)

### 달성 기준

- `pnpm --filter backend exec tsc --noEmit` 0 에러
- `pnpm --filter backend run test -- file-upload.service.spec` PASS
- `pnpm --filter backend run test -- form-template.service.spec` PASS
- `createdAt`/`updatedAt` 필드 누락 없는 mock row 헬퍼 SSOT (이미 `makeMockFormTemplateRow`에 포함되어 있음 — 호출처 확인)
- `createMockIdentifierService()` SSOT 헬퍼 사용 유지

### 참고

- 0430c 시점 두 spec 신설 완료. 본 batch는 **잔여 TSC/test 실패만** 정밀 수정. spec 본문 재작성 금지(수술적).
- TSC 에러 0건이면 본 Phase는 N/A 처리하고 다음 Phase로 진행.

## 4. Phase B — Frontend Query Fix (Item 1: CheckoutGroupCard setQueryData)

**목표:** `queryClient.setQueryData` 2건을 메모리 룰 준수 패턴으로 전환.

### 파일

- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` (lines 206, 263)

### 달성 기준

- `setQueryData` 호출 0건 (lines 206, 263 onError 롤백)
- 롤백 시맨틱 보존: 스냅샷 복원 → `setQueriesData`로 일관 (이미 onMutate에서 사용) **또는** `invalidateQueries({ queryKey: queryKeys.checkouts.view.all() })` 후 server refetch
- 핵심: TData/TCachedData 타입 불일치로 인한 `.map` crash 위험 제거. 롤백 데이터 타입이 `PaginatedResponse<Checkout, CheckoutSummary>`로 명확하므로 `setQueriesData`(전체 view 키 패턴) 일관 사용 우선.
- queryKeys SSOT (`lib/api/query-config.ts`) 경유: `queryKeys.checkouts.view.all()`, `queryKeys.checkouts.resource.detail(id)`
- CAS 409 분기 동작 보존: detail 캐시 `removeQueries` 유지(메모리 룰: CAS 409 시 detail 삭제 필수)
- approveMutation, borrowerApproveMutation 양쪽 동일 패턴 적용

### 참고

- 사용 패턴 가이드: `setQueriesData` (multi-key 패턴 매칭) 또는 `invalidateQueries`. 단건 캐시 직접 set은 금지.
- 메모리 룰 인용: "TData ≠ TCachedData crash 75%". context 스냅샷이 `PaginatedResponse` 타입으로 보존돼있어도 단일 키 set이 위험.

## 5. Phase C — Config (Item 2: dependabot)

**목표:** dependabot.yml 정책 검토 + 누락된 ecosystem 가드 보강.

### 파일

- `.github/dependabot.yml`

### 달성 기준

- `versioning-strategy` 정책 명시 (이미 `'auto'` — 문서 주석 보강만 검토)
- `lockfile-only` 채택 여부 결정: caret(`^X.Y.Z`) 잠금 정책과 병행 가능한지 검증. 채택 시 dependabot이 `package.json`을 수정하지 않고 lockfile만 업데이트 → caret 잠금 보존 강화. 채택 불가 시 현 `'auto'` 유지 + 추가 ignore 룰만 보강.
- npm + github-actions + docker(3건) 4 ecosystems 일관성 검토
- `node -e "require('js-yaml').load(...)"` YAML 파싱 통과
- 기존 9건 semver-major ignore 보존 (모두 0430c에서 이미 추가)
- 신규 추가 검토 후보 (없으면 N/A): `eslint`, `prettier`, `vitest` 등 toolchain 메이저

### 참고

- 0430c에서 이미 9건 ignore + `versioning-strategy: 'auto'` 추가. 본 batch는 **검증 + 미커버 ecosystem 보강만**.

## 6. Phase D — Frontend A11y (Items 4, 5)

**목표:** MobileNav 리스트 시맨틱 + ApprovalStepIndicator 시작 노드 SR 라벨 토큰화.

### Item 4 — MobileNav.tsx

**파일:**
- `apps/frontend/components/layout/MobileNav.tsx`

**달성 기준:**
- 섹션 내부 `<div className="flex flex-col gap-1">` (line 202) → `<ul role="list" className="flex flex-col gap-1 list-none">`
- 각 `<NavLink>` 래퍼를 `<li key={item.href}>`로 감쌈 (NavLink 자체는 a 태그이므로 li > NavLink 구조)
- 섹션 외곽 `<div key={section.sectionLabel}>` 그대로 유지(섹션 그룹). nav 직속 자식은 li 아닌 div 보존(섹션 헤더 + ul 혼재 구조).
- DashboardShell.tsx:259-266 패턴과 시맨틱 정합 (role="list" 명시 — Safari VO list-style:none 방어)
- `memo(NavLink)` 보존
- `pnpm --filter frontend run tsc --noEmit` PASS

### Item 5 — APPROVAL_STEPPER_TOKENS.startNodeLabel

**파일:**
- `apps/frontend/lib/design-tokens/components/approval.ts` (`APPROVAL_STEPPER_TOKENS` 객체)
- `apps/frontend/components/approvals/ApprovalStepIndicator.tsx`
- `apps/frontend/messages/ko/approvals.json`
- `apps/frontend/messages/en/approvals.json`

**달성 기준:**
- `APPROVAL_STEPPER_TOKENS.startNodeLabel: { srOnly: 'sr-only' }` 신설 (text-[0px] 불필요 — sr-only 단독으로 충분)
- 첫 step 노드(`index === 0`)에 `aria-label={t('steps.startNodeLabel')}` 속성 추가
- i18n 키 신설: `approvals.steps.startNodeLabel` (ko: "승인 흐름 시작", en: "Approval flow start") — i18n parity 보장
- disposalSteps + planSteps 양쪽에 적용 (0430c는 disposalSteps의 시각적 `▸` 마이크로 라벨만 — 본 batch는 SR 라벨 추가)
- 기존 stepper visual 변형 0건 (token만 추가, 컴포넌트는 aria-label만 추가)

## 7. Phase E — SKILL.md Updates (Items 6, 7, 9)

**목표:** verify-implementation SKILL.md에 3개 점검 step 추가.

### 파일

- `.claude/skills/verify-implementation/SKILL.md` (단일 edit 다수 step 추가)

### 달성 기준

본 skill은 **orchestrator** 성격. 신규 step 3건은 본 skill의 "Related Files" 또는 신규 references/ 파일에 누적. SKILL.md 본문이 1개 edit으로 수정되도록 단일 위치에 묶음.

#### Step #X — Spec helper return type 점검 (Item 6)

```bash
grep -rn "^  function\|^function\|^const.*= (.*) => {" apps --include="*.spec.ts" \
  | grep -vE ":\s*(void|Promise<[A-Za-z]|[A-Za-z\[<])" \
  | grep -vE "//\s*@ts-"
```

타깃: `makeMock*`, `setup*`, `create*` 패턴 spec 헬퍼 중 명시 return type 누락 탐지. 경고 레벨.

#### Step #Y — 언더스코어 prefix param 점검 (Item 7)

```bash
grep -rnE "\(_[a-z][a-zA-Z0-9]*[:,)]" apps/backend/src/modules --include="*.service.ts" \
  | grep -v "spec.ts"
```

타깃: service 메서드 파라미터에 `_paramName` (의도적 unused). silent-loss 잠재 위험. 경고 레벨, manual review 권장.

#### Step #Z — BulkActionBar actions slot 패턴 (Item 9)

문서 주석 형태로 추가 (검증 grep 없음 — pattern documentation):

```
- BulkActionBar `actions?: React.ReactNode` slot은 도메인 무관 generic 컴포넌트에서 도메인 버튼을 주입하는 SSOT 패턴.
- 위반 패턴: BulkActionBar 내부에 도메인 버튼 하드코딩 / variant prop으로 도메인 분기.
- 참조: components/common/BulkActionBar.tsx (actions slot 위치).
```

### 참고

- 본 skill의 step 번호는 기존 step 매트릭스 끝에 append (orchestrator 변경 최소화).
- 신규 step은 모두 **warning-level** (fail gate 아님).
- references/implementation-workflow.md에 상세 grep 패턴 분리 가능(선택).

## 8. Phase F — UX Polish (Items 8, 10, 11)

### Item 8 — Settings 이중 스피너 (3 파일)

**파일:**
- `apps/frontend/app/(dashboard)/settings/admin/calibration/CalibrationSettingsContent.tsx` (lines 222-228)
- `apps/frontend/app/(dashboard)/settings/admin/system/SystemSettingsContent.tsx` (lines 299-305)
- `apps/frontend/app/(dashboard)/settings/display/DisplayPreferencesContent.tsx` (lines 300-306)

**달성 기준:**
- `<Loader2>` JSX 인라인 + `loading={mutation.isPending}` 동시 사용 0건
- Button SSOT props 사용: `loading={mutation.isPending}` + `loadingPosition="replace"` (또는 `"start"`) + `loadingLabel={t('saving')}` 단일 책임
- 자식 텍스트는 정상 상태 본문만 (`{t('save')}` 등) — `isPending` 분기 swap 제거
- `Loader2` import 제거 (other 사용처 없으면)
- 0430c Auth 패턴(AzureAdButton/LoginForm)과 일관
- `pnpm --filter frontend run tsc --noEmit` PASS

### Item 10 — useRowSelection IME 가드

**파일:**
- `apps/frontend/hooks/use-bulk-selection.ts` (`useRowSelection`/`useBulkSelection`)
- 또는 키보드 단축키 핸들러가 별도 파일에 있다면 해당 파일

**달성 기준:**
- Pre-flight grep으로 단축키 핸들러 위치 확인: `grep -rn "key === 'a'\|key === 'A'\|Shift" apps/frontend --include="*.ts*"`
- 결과 0건이면: 본 hook은 키보드 단축키를 직접 핸들하지 않음. 본 Item은 N/A 처리. 단축키 처리 컴포넌트 식별 후 IME 가드 추가 또는 skip.
- 결과 ≥1건이면: 해당 핸들러에 `if (event.isComposing || event.nativeEvent?.isComposing) return;` 가드 추가. 한국어 IME 입력 도중 A/Shift+A 단축키 fire 방지.
- IME 가드 위치는 keydown 이벤트 핸들러 최상단 (다른 modifier check 전).

### Item 11 — RejectModal charsRemaining

**파일:**
- `apps/frontend/components/approvals/RejectModal.tsx` (lines 162-186)
- `apps/frontend/messages/ko/approvals.json`, `apps/frontend/messages/en/approvals.json`
- 신규 max length 상수 또는 schema 확인: `RejectReasonSchema` (apps/frontend/lib/api/approvals-api.ts)

**달성 기준:**
- `REJECTION_MAX_LENGTH` 상수 SSOT 확인 (없으면 추가 검토 — RejectReasonSchema의 `.max(N)` 추출)
- Textarea 아래 char counter `<p>` 추가: `t('rejectModal.charsRemaining', { remaining: REJECTION_MAX_LENGTH - reason.length })`
- i18n 키 신설:
  - ko: `"{remaining}자 남음"` 또는 `"{count}/{max}자"`
  - en: `"{remaining} characters remaining"` 또는 `"{count}/{max}"`
- aria-live="polite" + role="status" (input 진행 중 SR 알림 — assertive 금지)
- `min` hint와 `chars remaining` 동시 표시 (기존 `minLengthHint` p 보존)
- char count는 max에 가까울수록 색상 변경(예: `text-brand-warning` ≥ 90%, `text-brand-critical` ≥ 100%) — 옵션, 미적용 가능
- mode='single' + mode='bulk' 양쪽 동일 카운터 표시

## 9. 검증 명령

```bash
# Phase A 후
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend run test -- file-upload.service.spec
pnpm --filter backend run test -- form-template.service.spec

# Phase B 후
grep -c "queryClient.setQueryData" apps/frontend/components/checkouts/CheckoutGroupCard.tsx  # 0
pnpm --filter frontend exec tsc --noEmit

# Phase C 후
node -e "require('js-yaml').load(require('fs').readFileSync('.github/dependabot.yml','utf8'))"
grep -c "version-update:semver-major" .github/dependabot.yml  # 기존 ≥9 보존

# Phase D 후
grep -nE '<ul[^>]*role="list"' apps/frontend/components/layout/MobileNav.tsx  # ≥1
grep -n "startNodeLabel" apps/frontend/lib/design-tokens/components/approval.ts  # ≥1
grep -n "approvals.steps.startNodeLabel\|steps.startNodeLabel" \
  apps/frontend/messages/ko/approvals.json apps/frontend/messages/en/approvals.json  # 2건

# Phase E 후
grep -cE "spec helper return type|언더스코어|BulkActionBar.*actions slot" \
  .claude/skills/verify-implementation/SKILL.md  # ≥3

# Phase F 후
grep -c "Loader2" apps/frontend/app/\(dashboard\)/settings/admin/calibration/CalibrationSettingsContent.tsx  # 0
grep -c "Loader2" apps/frontend/app/\(dashboard\)/settings/admin/system/SystemSettingsContent.tsx  # 0
grep -c "Loader2" apps/frontend/app/\(dashboard\)/settings/display/DisplayPreferencesContent.tsx  # 0
grep -n "isComposing" apps/frontend/hooks/use-bulk-selection.ts  # ≥1 OR N/A 명시
grep -n "charsRemaining\|자 남음\|characters remaining" \
  apps/frontend/messages/ko/approvals.json apps/frontend/messages/en/approvals.json  # ≥2

# 통합
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend run test
pnpm --filter frontend run lint
```

## 10. 트리거 기반 항목 (이번 배치 제외)

| 항목 ID | 제외 사유 |
|---|---|
| `bulkRejectDialog 신설` | Sprint 4.5 D2 delegation으로 회피 결정 보존 (`project_checkouts_v3_sprint45_20260430.md`) |
| `quality-approve-comment-policy` | 도메인 정책 결정 필요 (사용자/QM 입력 필요) |
| `ar13-lab-manager-self-inspection` | 도메인 워크플로 결정 필요 |
| `legacy-sw-unregister-e2e-verification` | 외부 인프라(prod) 의존 |
| Sentry/observability 항목 | 외부 SaaS 결정 의존 |
| `sidebar-eq-monogram-design-decision` | 디자이너/사용자 결정 |
| `redis-prod-failover-runbook` | prod 환경 + 운영 결정 |
| `feature-flag-rollback` | 도구 도입 결정 |
| 미사용 dep removal (recharts) | 별도 cleanup batch (verify-hardcoding Step 검토 후) |

## 11. Build Sequence 체크리스트

- [ ] Phase 0: pre-flight grep 4건 — 위치/존재 확정
- [ ] Phase A: form-template TSC 잔여 진단 + 해소 (또는 N/A 명시)
- [ ] Phase B: CheckoutGroupCard onError 롤백 setQueryData → setQueriesData/invalidateQueries
- [ ] Phase C: dependabot.yml 검증 + 누락 ecosystem 추가(있으면)
- [ ] Phase D: MobileNav `<ul role="list">/<li>` + startNodeLabel 토큰 + i18n ko/en
- [ ] Phase E: SKILL.md 3 step append (Items 6, 7, 9)
- [ ] Phase F: 3 settings 이중 스피너 제거 + IME 가드(또는 N/A) + RejectModal charsRemaining + i18n
- [ ] 통합 검증: 6 명령 (tsc x2, test x2, lint, YAML)
- [ ] tech-debt-tracker 11항목 archive
- [ ] plan/contract → completed/ 이동
