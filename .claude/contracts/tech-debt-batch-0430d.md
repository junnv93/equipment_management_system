# Contract: tech-debt-batch-0430d

## Task

tech-debt-tracker 잔여 Open 항목 11건 일괄 처리:
- MEDIUM: CheckoutGroupCard setQueryData 제거, dependabot 정책 보강, file-upload/form-template spec TSC 정합화
- LOW: MobileNav 리스트 시맨틱, ApprovalStepIndicator startNodeLabel 토큰, verify-implementation SKILL.md 3 step append
- SHOULD (Sprint 4.5 deferral): settings 이중 스피너 3건, useRowSelection IME 가드, RejectModal charsRemaining

## Scope (변경 대상)

### Backend
- `apps/backend/src/common/file-upload/__tests__/file-upload.service.spec.ts` (보존, 필요 시 보강)
- `apps/backend/src/modules/reports/__tests__/form-template.service.spec.ts` (TSC 잔여 정밀 수정)

### Frontend
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` (setQueryData 2건 제거)
- `apps/frontend/components/layout/MobileNav.tsx` (`<ul role="list">/<li>`)
- `apps/frontend/components/approvals/ApprovalStepIndicator.tsx` (aria-label on first node)
- `apps/frontend/components/approvals/RejectModal.tsx` (chars remaining counter)
- `apps/frontend/lib/design-tokens/components/approval.ts` (startNodeLabel token)
- `apps/frontend/hooks/use-bulk-selection.ts` 또는 키보드 핸들러 (IME 가드 — pre-flight 결과에 따라 결정)
- `apps/frontend/app/(dashboard)/settings/admin/calibration/CalibrationSettingsContent.tsx`
- `apps/frontend/app/(dashboard)/settings/admin/system/SystemSettingsContent.tsx`
- `apps/frontend/app/(dashboard)/settings/display/DisplayPreferencesContent.tsx`
- `apps/frontend/messages/ko/approvals.json`, `apps/frontend/messages/en/approvals.json`

### Config / Skills / Docs
- `.github/dependabot.yml` (검증/보강)
- `.claude/skills/verify-implementation/SKILL.md` (Items 6, 7, 9 step append)
- `.claude/exec-plans/tech-debt-tracker.md` (11항목 archive)

## MUST Criteria

| #   | Criterion                                                  | Pass Condition                                                                                                                       |
|-----|------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| M1  | Backend tsc                                                | `pnpm --filter backend exec tsc --noEmit` exit 0                                                                                     |
| M2  | Frontend tsc                                               | `pnpm --filter frontend exec tsc --noEmit` exit 0                                                                                    |
| M3  | Backend tests                                              | `pnpm --filter backend run test` exit 0 (file-upload.service.spec + form-template.service.spec 포함)                                  |
| M4  | Frontend tests                                             | `pnpm --filter frontend run test` exit 0 (CheckoutGroupCard 영향 테스트 포함)                                                          |
| M5  | CheckoutGroupCard setQueryData 0건                         | `grep -c "queryClient\.setQueryData" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` == 0                                   |
| M6  | onError 롤백 시맨틱 보존                                   | approveMutation + borrowerApproveMutation onError에서 스냅샷 복원이 `setQueriesData` 또는 `invalidateQueries`로 일관 동작 (UI 즉시 원복 가능)|
| M7  | CAS 409 detail 캐시 제거 보존                              | `removeQueries({ queryKey: queryKeys.checkouts.resource.detail(...) })` 양쪽 mutation onError에 보존                                   |
| M8  | dependabot.yml YAML 유효성                                 | `node -e "require('js-yaml').load(require('fs').readFileSync('.github/dependabot.yml','utf8'))"` 통과                                  |
| M9  | dependabot semver-major ignore 보존                        | 기존 ≥9건 ignore 룰 보존 (react/react-dom/next/next-auth/next-intl/tailwindcss/drizzle-orm/drizzle-kit/zod 최소)                         |
| M10 | dependabot versioning policy 명시                          | `versioning-strategy` 키 또는 `lockfile-only` 정책 npm ecosystem에 명시 (1건 이상)                                                       |
| M11 | form-template.service.spec.ts TSC                          | line 257/266 영역 createdAt 누락 에러 없음 (또는 spec 자체에 TSC 에러 없음 — `mockFormTemplateRow` 헬퍼 createdAt/updatedAt 포함 보장)        |
| M12 | file-upload.service.spec.ts 존재                           | `apps/backend/src/common/file-upload/__tests__/file-upload.service.spec.ts` 존재 + jest run PASS                                       |
| M13 | MobileNav 리스트 시맨틱                                    | `<ul role="list">` ≥1 + 각 NavLink가 `<li>` 자식 (SR list 인식 보장)                                                                   |
| M14 | ApprovalStepIndicator startNodeLabel 토큰                  | `APPROVAL_STEPPER_TOKENS.startNodeLabel` export ≥1 + first step `aria-label` 적용 (disposalSteps + planSteps)                          |
| M15 | i18n parity (startNodeLabel)                               | ko/en `approvals.steps.startNodeLabel` 키 양쪽 존재                                                                                    |
| M16 | verify-implementation SKILL.md step 3건                    | spec helper return type / 언더스코어 prefix param / BulkActionBar actions slot 3 step append                                            |
| M17 | Settings 이중 스피너 0건 (3 파일)                          | `grep -c "Loader2" <each settings file>` == 0 (3건 모두) + Button `loading={mutation.isPending}` 단독 책임                               |
| M18 | RejectModal charsRemaining 카운터                          | Textarea 아래 char counter 표시 element 1건 + i18n 키 ko/en parity                                                                      |
| M19 | RejectModal aria-live 적합성                               | char counter는 `aria-live="polite"` (assertive 금지) + min length error는 기존 `role="alert"` 보존                                       |
| M20 | SSOT 우회 없음                                             | 신규 코드에 role/permission/URL/queryKeys 리터럴 없음. queryKeys → `lib/api/query-config.ts` 경유. 도메인 enum → schemas 경유.              |
| M21 | 메모리 룰 (setQueryData)                                   | useOptimisticMutation 또는 신규 mutation에서 `setQueryData` 신규 호출 0건 (CheckoutGroupCard 외 다른 신규 코드 포함)                        |
| M22 | i18n 하드코딩 0건                                          | charsRemaining/startNodeLabel/loadingLabel 모두 i18n 키 경유. 한국어/영어 인라인 문자열 0건.                                              |
| M23 | tech-debt-tracker 동기화                                   | 처리한 11항목 archive (체크 또는 별도 섹션 이동) + 본 batch 라인 추가                                                                    |

## SHOULD Criteria

| #  | Criterion                                                                                            |
|----|------------------------------------------------------------------------------------------------------|
| S1 | RejectModal charsRemaining는 max에 도달할수록 색상 변경 (warning ≥90%, critical ≥100%) — design token 경유 |
| S2 | useRowSelection IME 가드: pre-flight grep ≥1 매치 시 `event.isComposing` 가드 추가, 0건 시 N/A 명시 + tracker 기록 |
| S3 | Settings Button `loadingPosition`: `"replace"` 채택 (CLS 0) — 또는 `"start"` 명시                                |
| S4 | dependabot.yml `lockfile-only` 정책 도입 검토 결과 plan에 기록 (채택/미채택 + 사유)                                |
| S5 | MobileNav `<ul>` 외 nav 직속 `<div key=section>` 보존 (섹션 그룹 — 시맨틱 정합 + 기존 디자인 보존)                  |
| S6 | startNodeLabel은 disposalSteps + planSteps 양쪽에 적용 (한쪽만 적용 금지)                                          |
| S7 | verify-implementation 신규 step 3건은 warning-level (fail gate 아님) 명시                                          |
| S8 | CheckoutGroupCard 변경 후 manual smoke: 승인 mutation 실패 → UI 즉시 원복 (refetch 대기 X) 동작 확인                |

## OUT-OF-SCOPE

- BulkRejectDialog 신설 (Sprint 4.5 D2 delegation 결정 보존)
- 도메인 정책 결정 필요 항목 (quality-approve-comment-policy, ar13-lab-manager-self-inspection)
- 외부 트리거 의존 항목 (legacy-sw-unregister, Sentry, redis-prod-failover-runbook, feature-flag-rollback)
- 디자이너 결정 의존 (sidebar-eq-monogram-design-decision)
- SSOT/도메인 enum/Migration SQL 변경 0건
- recharts 등 미사용 dep 제거 (별도 cleanup batch)
- ApprovalStepIndicator visual 변형 (token 추가/aria-label 추가만, motion/색상 변경 없음)

## Verification Commands

```bash
# Pre-flight
grep -n "setQueryData" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
grep -rln 'loading={isPending}' apps/frontend/app/\(dashboard\)/settings/
grep -rn "key === 'a'\|isComposing" apps/frontend --include="*.ts*"

# Backend
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend run test -- file-upload.service.spec
pnpm --filter backend run test -- form-template.service.spec
pnpm --filter backend run test

# Frontend
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter frontend run test

# Config
node -e "require('js-yaml').load(require('fs').readFileSync('.github/dependabot.yml','utf8'))" && echo "YAML OK"
grep -c "version-update:semver-major" .github/dependabot.yml

# Verification grep gates
grep -c "queryClient\.setQueryData" apps/frontend/components/checkouts/CheckoutGroupCard.tsx  # 0
grep -nE '<ul[^>]*role="list"' apps/frontend/components/layout/MobileNav.tsx  # ≥1
grep -n "startNodeLabel" apps/frontend/lib/design-tokens/components/approval.ts  # ≥1
grep -n "startNodeLabel" apps/frontend/messages/ko/approvals.json apps/frontend/messages/en/approvals.json  # 2
grep -c "Loader2" apps/frontend/app/\(dashboard\)/settings/admin/calibration/CalibrationSettingsContent.tsx  # 0
grep -c "Loader2" apps/frontend/app/\(dashboard\)/settings/admin/system/SystemSettingsContent.tsx  # 0
grep -c "Loader2" apps/frontend/app/\(dashboard\)/settings/display/DisplayPreferencesContent.tsx  # 0
grep -n "charsRemaining\|자 남음\|characters remaining" \
  apps/frontend/messages/ko/approvals.json apps/frontend/messages/en/approvals.json  # ≥2

# Pre-push gate
.husky/pre-push
```

## Notes for Implementer

- **수술적 변경 원칙**: 인접 코드 리팩토링/개선 금지. 본 contract MUST 충족만.
- **0430c와의 차별점**:
  - Item 4 MobileNav는 0430c에서 누락된 파일 (DashboardShell + NavRow만 처리됨)
  - Item 5 startNodeLabel은 SR-only aria-label (0430c는 시각적 `▸`)
  - Item 8 settings 3 파일은 0430c에서 누락 (Auth만 처리됨)
- **N/A 처리 허용 조건**:
  - Item 3 form-template TSC 에러: 사전 tsc run에서 에러 없음 확인 시 N/A
  - Item 10 IME 가드: pre-flight grep 0건 시 N/A + tracker 기록
- **메모리 룰 인용**: "useOptimisticMutation onSuccess에서 setQueryData 금지 — TData와 TCachedData 타입 불일치 75%, .map crash". CheckoutGroupCard onError도 동일 위험 — `setQueriesData`(키 패턴 매칭) 일관 사용 권장.
- **CAS 409 보존**: detail 캐시 `removeQueries` 호출은 메모리 룰 ("CAS 409 발생 시 backend detail 캐시 반드시 삭제")로 필수 보존.
