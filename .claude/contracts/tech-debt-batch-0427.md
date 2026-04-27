---
slug: tech-debt-batch-0427
date: 2026-04-27
tracker: .claude/exec-plans/tech-debt-tracker.md
---

# Contract: Tech Debt Batch 0427

## 범위

tech-debt-tracker.md Open 항목 중 즉시 구현 가능한 항목을 일괄 처리.
외부 의존성(Sentry, 디자인팀, TTY, 시간 조건)이 없는 항목만 대상.

## MUST (루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | BulkActionBar.tsx:6이 `@/lib/design-tokens/components/bulk-action-bar` 직접 경로 대신 `@/lib/design-tokens` barrel 사용 | `grep 'design-tokens/components/bulk-action-bar' components/common/BulkActionBar.tsx` → 0 결과 |
| M2 | `workflow-panel.ts` blocked action에 `FOCUS_TOKENS.classes.default` 포함 | grep 확인 |
| M3 | `workflow-panel.ts` critical urgency container가 `animate-pulse-hard` 대신 `animate-pulse-soft` 사용 | grep 확인 |
| M4 | ExportFormButton이 `canAct: boolean` prop을 받고 내부 `useAuth()` 호출 제거 | grep `useAuth` ExportFormButton.tsx → 0 결과 |
| M5 | 8개 ExportFormButton call site 전체에 `canAct={can(Permission.EXPORT_REPORTS)}` 전달 | grep `<ExportFormButton` 각 파일 확인 |
| M6 | PageHeader OnboardingHintBanner가 `canShowPrimaryAction?: boolean` prop으로 권한 판단 | grep `useAuth` PageHeader.tsx → 0 결과 |
| M7 | CheckoutsContent.tsx onboardingHint에 `canShowPrimaryAction={can(Permission.CREATE_CHECKOUT)}` 전달 | grep 확인 |
| M8 | CheckoutGroupCard.tsx:125 `as 'calibration' \| 'repair' \| 'rental'` 리터럴 캐스트 → `UserSelectableCheckoutPurpose` | grep 확인 |
| M9 | CheckoutListSkeleton.tsx Skeleton에 `CHECKOUT_LOADING_SKELETON_TOKENS.base` 클래스 적용 | grep 확인 |
| M10 | IncidentHistoryTab.tsx:676 `text-brand-info font-medium` → 토큰 사용 | grep 확인 |
| M11 | VisualTableEditor.tsx:184 `focus:ring-2` → `focus-visible:ring-2` | grep 확인 |
| M12 | NonConformancesContent MiniWorkflow에 sr-only 현재 단계 텍스트 추가 | grep `sr-only` NonConformancesContent.tsx |
| M13 | tsc --noEmit PASS (frontend + backend) | `pnpm --filter frontend run tsc --noEmit && pnpm --filter backend run tsc --noEmit` |
| M14 | backend unit tests PASS | `pnpm --filter backend run test` |

## SHOULD (이연 가능)

| # | Criterion | Note |
|---|-----------|------|
| S1 | NC i18n `list.chip.arrow` 키 추가 | aria-hidden 요소이므로 기능 영향 없음 |
| S2 | checkouts.controller.ts reject-return 주석 | 문서화 개선 |
| S3 | borrowerReject (d) 추가 테스트 | 기존 3케이스 존재, 4번째 추가 |

## 아카이브 대상 (이미 해결됨)

다음 항목은 실제 코드 확인 결과 이미 처리됨:
1. SOFTWARE_VALIDATION 이벤트 5개 → cache-event.registry.ts L359-391에 이미 등록
2. rejectReturnMutation onErrorCallback → CheckoutDetailClient.tsx L362에 이미 setReturnRejectReason('') 존재
3. EquipmentImportDetail role 리터럴 → 이미 `can(Permission.APPROVE_EQUIPMENT_IMPORT)` 사용
4. checkout-fsm.test.ts 13건 실패 → 643건 전체 PASS
5. borrowerApprove/Reject 단위 테스트 (a)(b)(c) → 이미 spec 파일에 존재 (borrowerApprove 4케이스, borrowerReject 3케이스)
