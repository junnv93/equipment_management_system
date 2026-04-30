# Evaluation: tech-debt-batch-0430d
Date: 2026-04-30
Iteration: 1

## MUST Criteria Results

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| M1 | Backend tsc | PASS | `pnpm --filter backend exec tsc --noEmit` exit 0, no output |
| M2 | Frontend tsc | PASS | `pnpm --filter frontend exec tsc --noEmit` exit 0, no output |
| M3 | Backend tests | PASS | 78 suites, 1025 tests all pass. file-upload.service.spec (16 tests) + form-template.service.spec 포함 |
| M4 | Frontend tests | PASS | 24 suites, 320 tests all pass (신규 use-checkout-card-mutations.test.ts 포함) |
| M5 | CheckoutGroupCard setQueryData 0건 | PASS | `grep -c "queryClient\.setQueryData"` → 0. 뮤테이션 로직 use-checkout-card-mutations.ts 훅으로 완전 추출됨 |
| M6 | onError 롤백 시맨틱 보존 | PASS | 양쪽 mutation onError에서 `invalidateQueries({ queryKey: queryKeys.checkouts.view.all() })` 사용 확인 |
| M7 | CAS 409 detail 캐시 제거 보존 | PASS | line 201, 250: `removeQueries({ queryKey: queryKeys.checkouts.resource.detail(variables.id) })` 양쪽 mutation 보존 |
| M8 | dependabot.yml YAML 유효성 | PASS | `node -e "require('js-yaml').load(...)"` → YAML OK |
| M9 | semver-major ignore 보존 (≥9건) | PASS | 28건. react/react-dom/next/next-auth/next-intl/tailwindcss/drizzle-orm/drizzle-kit/zod 9개 모두 존재 확인 |
| M10 | versioning policy 명시 | PASS | `.github/dependabot.yml:11` `versioning-strategy: 'auto'` |
| M11 | form-template spec TSC | PASS | 16 tests PASS, backend tsc 0 에러 — createdAt 오류 사전 해소된 것으로 N/A |
| M12 | file-upload spec 존재 + PASS | PASS | 파일 존재 확인. 전체 backend test suite 포함 PASS |
| M13 | MobileNav 리스트 시맨틱 | PASS | line 202: `<ul className="flex flex-col gap-1 list-none" role="list">`, line 204: `<li key={item.href}>` |
| M14 | startNodeLabel 토큰 + aria-label | PASS | `approval.ts:104` `startNodeLabel: { srOnly: 'sr-only' }`, `ApprovalStepIndicator.tsx:94` `aria-label={index === 0 ? t('steps.startNodeLabel') : undefined}` — disposalSteps/planSteps 양쪽 동일 렌더 로직 경유 |
| M15 | i18n parity (startNodeLabel) | PASS | `ko/approvals.json:253` "승인 흐름 시작", `en/approvals.json:253` "Approval flow start" |
| M16 | SKILL.md 3 step | PASS | `grep -cE "spec helper return type\|언더스코어\|BulkActionBar"` → 3. Steps 20/21/22 추가 확인 |
| M17 | Settings Loader2 0건 (3 파일) | PASS | CalibrationSettingsContent/DisplayPreferencesContent/SystemSettingsContent 모두 0건 |
| M18 | RejectModal charsRemaining 카운터 | PASS | `aria-live="polite"` 카운터 element 존재, ko/en i18n 키 parity 확인 |
| M19 | RejectModal aria-live 적합성 | PASS | 카운터: `aria-live="polite"` (line 186) ✓. 에러 element: `role="alert"` 기존 코드 보존 ✓ (계약 명시 허용) |
| M20 | SSOT 우회 없음 | PASS | RejectModal에 URL/queryKeys 리터럴 0건. REJECTION_MAX_LENGTH → VALIDATION_RULES.LONG_TEXT_MAX_LENGTH SSOT 경유 |
| M21 | setQueryData 신규 0건 | PASS | approvals/checkouts 컴포넌트 신규 코드에 setQueryData 0건. 신규 훅 use-checkout-card-mutations.ts도 0건 (주석만) |
| M22 | i18n 하드코딩 0건 | PASS | RejectModal/ApprovalStepIndicator에 한국어/영어 인라인 문자열 0건. 모두 t() 경유 |
| M23 | tech-debt-tracker 동기화 | **FAIL** | 11항목 중 10항목만 [x] 처리됨. `[2026-04-30 sprint-4.5 SHOULD] S1 BulkActionBar SKILL.md actions slot 표준 명문화` 항목이 `[ ]` 미완료 상태로 남아있음 (SKILL.md Step 22로 구현은 완료됐으나 tracker 체크 누락). "처리한 11항목 archive" 계약 불충족. |

## SHOULD Criteria Results

| # | Criterion | Verdict | Notes |
|---|---|---|---|
| S1 | charsRemaining 색상 (90%/100%) | PARTIAL | 구현은 80%(warning)/100%(critical) 임계값 사용 (`Math.floor(REJECTION_MAX_LENGTH * 0.8)`). 계약은 90% warning 명시. 2% 편차. 색상 자체는 design token 미경유 — inline `text-amber-600 dark:text-amber-400` / `text-destructive` 사용 |
| S2 | IME 가드 | PASS (N/A + 부분 완료) | use-bulk-selection.ts pre-flight 0건 → N/A. use-approval-keyboard.ts:44에 `if (e.isComposing) return;` 추가됨. tracker에도 N/A 처리 기록 ✓ |
| S3 | Settings Button loadingPosition="replace" | PASS | 3개 파일 모두 `loadingPosition="replace"` 확인 |
| S4 | lockfile-only 검토 결과 기록 | PARTIAL | exec-plan에 검토 항목으로 언급됨. 최종 채택/미채택 + 사유가 명시적으로 기록되지 않음 (계약: "plan에 기록") |
| S5 | MobileNav section div 보존 | PASS | line 187: `<div key={section.sectionLabel}>` 섹션 그룹 구조 보존 ✓ |
| S6 | startNodeLabel disposalSteps + planSteps 양쪽 | PASS | `steps = type === 'disposal' ? disposalSteps : planSteps` 후 동일 map loop — index === 0 조건이 양쪽 모두에 적용됨 |
| S7 | SKILL.md step 3건 warning-level 명시 | PASS | Step 20 "[경고 레벨]", Step 21 "[경고 레벨]", Step 22 "[패턴 문서화]" 명시 ✓ |
| S8 | CheckoutGroupCard 수동 smoke | NOT VERIFIABLE | dev 서버 의존 — 자동화 검증 불가. 훅 추출 테스트(use-checkout-card-mutations.test.ts)로 부분 커버됨 |

## Overall Verdict
**FAIL**

## Issues Found (FAIL items only)

### M23: tech-debt-tracker 동기화 FAIL

**계약 기준**: "처리한 11항목 archive (체크 또는 별도 섹션 이동) + 본 batch 라인 추가"

**실제 상태**: exec-plan 항목 9 (`S1 BulkActionBar SKILL.md actions slot 표준 명문화`)가 tracker에서 `[ ]` 미완료 상태로 잔존.

- SKILL.md Step 22 (D1: BulkActionBar actions slot) 구현은 완료됨
- tech-debt-tracker.md의 해당 항목을 `[x]`로 변경하는 것이 누락됨
- Batch 이력 테이블에는 "11항목 완료"로 기재되어 있으나 실제로는 10항목만 체크됨 → 내부 불일치

**수정 필요**: `.claude/exec-plans/tech-debt-tracker.md`에서 S1 BulkActionBar 항목을 `[x]`로 변경 + 완료 설명 추가

## Notable Observations (FAIL 아님)

1. **추가 구현 (계약 외)**: `apps/frontend/hooks/use-checkout-card-mutations.ts` + `__tests__/use-checkout-card-mutations.test.ts` 신규 파일 생성 (untracked). CheckoutGroupCard 뮤테이션 로직을 useOptimisticMutation SSOT 패턴으로 추출한 부가 구조 개선. 계약 MUST 범위 초과이나 품질 기여.

2. **S1 임계값 편차**: warning 임계값 80% 사용 (계약 명시 90%). SHOULD 기준이므로 FAIL 트리거 안됨.

3. **Zod schema 한국어 오류 메시지**: `RejectReasonSchema` `.min()/.max()` 오류 메시지가 한국어 (`반려 사유는 N자 이상/이내`). M22는 UI 컴포넌트 레벨 i18n만 체크하므로 PASS이나, 백엔드 공유 스키마 오류 메시지로서 추후 다국어 지원 시 리스크.

4. **변경 미커밋 상태**: 모든 0430d 변경사항이 working directory에 있으며 commit되지 않음. 평가는 working directory 기준으로 수행.

## Post-Merge Actions

1. **즉시 (M23 수정)**: `tech-debt-tracker.md` S1 BulkActionBar 항목 `[ ]` → `[x]` 변경 후 재평가 요청 또는 수동 수정 후 커밋
2. **이후**: S1 warning 임계값 80% → 90% 조정 검토 (SHOULD 미충족 1건)
3. S4 lockfile-only 정책 결정을 tracker 또는 문서에 명시적으로 기록
