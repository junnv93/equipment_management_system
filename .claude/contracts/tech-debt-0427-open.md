# Contract: tech-debt-0427-open
Date: 2026-04-27
Source plan: .claude/exec-plans/active/2026-04-27-tech-debt-0427-open.md

## MUST Criteria

### 빌드 / 타입

- [ ] `pnpm --filter @equipment-management/shared-constants build` exit 0
- [ ] `pnpm --filter @equipment-management/schemas build` exit 0
- [ ] `pnpm --filter backend run tsc --noEmit` 0 error
- [ ] `pnpm --filter frontend run tsc --noEmit` 0 error
- [ ] `pnpm --filter backend run test` PASS (software-validations approve, checkouts revoke 회귀 없음)

### P1-1: use-checkout-next-step-fallback-terminated-from

- [ ] `UseCheckoutNextStepInput` interface에 `terminatedFromStatus?: CheckoutStatus | null` 필드 존재
- [ ] hook 본문 `getNextStep(...)` 호출에 `terminatedFromStatus` 전달
- [ ] `useMemo` deps 배열에 `terminatedFromStatus` 포함

### P1-2: ar13-self-inspection-approve-weak-cast

- [ ] `(selfInspDetail as { version?: number }).version` 패턴 grep 0 hit
- [ ] `(selfInspRejectDetail as { version?: number }).version` 패턴 grep 0 hit
- [ ] approve/reject case 'self_inspection'이 명시적 interface 타입 사용

### P1-3: ar-14-software-validation-approve-comment

- [ ] `approveValidationSchema`에 `approvalComment` 필드 존재 (optional)
- [ ] `softwareValidationApi.approve(id, version, approvalComment?)` 3-arity
- [ ] `TAB_META.software_validation.commentRequired === true`
- [ ] `case 'software_validation'` approve에서 `comment` 전달

### P1-4: revocation-window-ms-shared-constants

- [ ] `packages/shared-constants/src/business-rules.ts`에 `APPROVAL_REVOCATION_WINDOW_MS = 300_000` export
- [ ] `packages/shared-constants/src/index.ts`에 re-export
- [ ] `checkouts.service.ts`에서 `const REVOCATION_WINDOW_MS = 300_000` 로컬 상수 제거
- [ ] `checkouts.service.ts`에 `APPROVAL_REVOCATION_WINDOW_MS` import + 사용

### P1-5: not-found-href-ssot

다음 4개 파일에서 `href="/"` → `href={FRONTEND_ROUTES.DASHBOARD}`:
- [ ] `apps/frontend/app/not-found.tsx`
- [ ] `apps/frontend/app/(dashboard)/equipment/[id]/not-found.tsx`
- [ ] `apps/frontend/app/(dashboard)/non-conformances/[id]/not-found.tsx`
- [ ] `apps/frontend/app/(dashboard)/calibration-plans/[uuid]/not-found.tsx`

### P1-6: React FormEvent deprecation

- [ ] `CreateEquipmentImportForm.tsx` handleSubmit 파라미터가 `React.SyntheticEvent<HTMLFormElement>`
- [ ] 해당 파일에 `React.FormEvent` grep 0 hit

### P1-7: reject-reason-stale-i18n

- [ ] `RejectReasonSchema`가 `.min(REJECTION_MIN_LENGTH)` 사용
- [ ] `RejectReasonSchema`에 `.min(1)` 단독 사용 없음
- [ ] ko `approvals.json` `rejectModal.validation` + `bulk.rejectValidation` 메시지 정확

### P1-9: ar13-dashboard-kpi-self-inspection

- [ ] `self-inspections.controller.ts` approve 메서드 `@AuditLog({ action: 'approve', ... })`
- [ ] `self-inspections.controller.ts` reject 메서드 `@AuditLog({ action: 'reject', ... })`

### P1-10: DESCRIPTOR_TABLE 재생성 스크립트

- [ ] `packages/schemas/scripts/gen-descriptor-table.ts` 파일 존재
- [ ] `packages/schemas/package.json` scripts에 `gen:descriptor-table` 등록
- [ ] schemas 패키지 tests PASS (기존 FSM table test 회귀 없음)

### P1-11: qr-label-size-preset-micro-ssot

- [ ] `LabelSizePreset` type에 `'micro'` 포함
- [ ] `LABEL_SIZE_PRESETS.micro` 정의 존재
- [ ] `LABEL_SAMPLER_LAYOUT.micro` 정의 존재
- [ ] `getSamplerPresetOrder()` return 배열에 `'micro'` 포함

## SHOULD Criteria

- [ ] Tracker 완료 항목 [x] 마킹 정확
- [ ] Archive 이동 항목 원문 보존
- [ ] 변경 파일에 `any` 신규 추가 0건
- [ ] 변경 파일에 `eslint-disable` 신규 추가 0건
- [ ] TAB_META.software_validation 주석 AR-14 반영

## OUT OF SCOPE

- P1-8 ar13-lab-manager-self-inspection (도메인 정책 결정 보류)
- approvals-api-module-split
- role-approval-categories-db-backed
- bulk-approve-rate-limit
- fsm-meta-drift-observability
