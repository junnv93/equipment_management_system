# Tech Debt Tracker — 아카이브: 체크아웃 & 승인 도메인

체크아웃 V3 스프린트, 승인 UI, FSM, BFF, 반출입 관련 완료 항목 기록.
활성 TODO는 [tech-debt-tracker.md](./tech-debt-tracker.md) 참조.

---

## 2026-04-30 — Checkouts V3 Sprint 4.5 (sprint45-should-residual harness + batch-0430c/d)

### Checkouts V3 Sprint 4.5 SHOULD 잔여 — 완료 3건 (sprint45-should-residual harness)

- [x] **[2026-04-30 sprint-4.5 SHOULD] S3 그룹 헤더 indeterminate 체크박스** — ✅ 2026-04-30 완료 (sprint45-should-residual harness, Mode 2). `lib/checkouts/group-selection.ts` SSOT (getGroupRowIds / deriveGroupSelectionState / toCheckboxCheckedProp) + CheckoutGroupCard `selectedRowIds`/`onToggleGroup` 옵셔널 prop API + Radix `data-state="indeterminate"` + IME 가드 + 단위 테스트 19건 (SSOT 10 + 컴포넌트 9) + 격리 fixture page (`__visual__/group-indeterminate`) + e2e 3 시나리오. **부모 통합 미수행** — Outbound/Inbound 탭 통합은 후속 트래커 등록.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S4 D-day 6-level visual regression** — ✅ 2026-04-30 완료 (sprint45-should-residual harness). Storybook 도입 회피, 기존 Playwright `toHaveScreenshot()` 인프라 재사용 (의존성 0). `tests/e2e/visual/dday-6level.spec.ts` 12 baseline (6 level × light/dark). dev-only fixture (`__visual__/dday/page.tsx`) `process.env.NODE_ENV` 가드. SSOT 직접 import (`getCheckoutDdayVisualLevel` / `CHECKOUT_DDAY_VISUAL_THRESHOLDS` / `DDAY_VISUAL_LEVEL_CLASSES`) — 임계값/className 하드코딩 0건. 초기 PNG 캡처 후속 트래커 등록.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S6 EmptyState in-app 도움말 라우팅** — ✅ 2026-04-30 완료 (sprint45-should-residual harness). `FRONTEND_ROUTES.HELP` SSOT (`INDEX` + `TOPIC(key)` 빌더) + `app/(dashboard)/help/page.tsx` Next.js 16 sync Server Component + `messages/{ko,en}/help.json` placeholder (4 sections: checkout/calibration/nonConformance/permissions) + `i18n/request.ts` namespace 등록 + `dashboard/atoms/EmptyState` `secondaryAction` prop 신설 (다른 2 EmptyState는 이미 보유). `mailto:` 사용처(TeamMemberList/MemberProfileDialog)는 도메인 의도 별개로 보존. FAQ 카피는 운영팀 confirm 후 별도(후속 트래커 등록).

### Checkouts V3 Sprint 4.5 — 완료 5건

- [x] **[2026-04-30 sprint-4.5] 🟡 MEDIUM checkout-group-card-setQueryData** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). `setQueryData` 2건 제거. onMutate `setQueriesData` (optimistic) + onError `invalidateQueries` + CAS 409 `removeQueries(detail)` 3-패턴으로 대체. tsc 0 에러.
- [x] **[2026-04-30 sprint-4.5] 🟢 LOW form-template-spec-pre-existing-tsc** — ✅ 2026-04-30 N/A (tech-debt-batch-0430d). backend tsc 0 에러 확인 — createdAt tsc 오류 사전 해소됨. 16 tests PASS.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S1 BulkActionBar SKILL.md actions slot 표준 명문화** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). verify-implementation SKILL.md Step 22(D1) 문서화: `actions?: React.ReactNode` slot 패턴 + 위반 패턴 grep 명시.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S2 useRowSelection IME 가드** — ✅ 2026-04-30 N/A + 부분 완료 (tech-debt-batch-0430d). use-bulk-selection.ts pre-flight grep 0건 → N/A. 실제 IME 가드는 `use-approval-keyboard.ts:44`에 `if (e.isComposing) return;` 추가 완료.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S9 RejectModal charsRemaining 카운터** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). `aria-live="polite"` char counter + `{remaining}자 남음` i18n ko/en. 80%/100% 임계값 색상 (text-amber-600/text-destructive). `REJECTION_MAX_LENGTH` SSOT.

### batch-0501 중 Sprint 4.5 관련 완료 4건

- [x] **[2026-04-30 setqueryd-purge SHOULD] 🟢 LOW charsCount 5곳 SSOT 통합** — ✅ 2026-04-30 완료 (tech-debt-batch-0501). `<CharsCounter>` SSOT 신설(`apps/frontend/components/common/CharsCounter.tsx`, memo + `useTranslations('common')` 내부 + 글로벌 `common.charCountRatio` i18n 키 fallback + 80%/100% 임계값 자동 색상 토글 + `<span class="block">` aria-live `role="status"` + REQUIRED_FIELD_TOKENS.charCount 베이스). NCEditDialog 인라인 `{cause.length} / 500` 제거. RejectModal 인라인 삼항분기 제거. **설계 결정**: Disposal 3개는 "min-required hint" 시맨틱으로 별개 처리.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S7 Sidebar pendingCount 분석 이벤트** — ✅ 2026-04-30 완료 (tech-debt-batch-0501). `NavRowWithSecondaryAction.tsx` `track('sidebar.checkouts.click', { pendingCount })` 추가, `href.startsWith('/checkouts')` prefix gate로 다른 nav 클릭 영향 없음. 두 분기(sibling-anchor + single-anchor) 메인 NavLink에 `onClick={handlePrimaryClick}` 연결. PII deny-list 위반 0(pendingCount는 숫자, role 미포함).
- [x] **[2026-04-30 sprint-4.5 SHOULD 후속] 🟢 LOW verify-bulk-action-bar-step-8-group-header** — ✅ 2026-04-30 완료 (tech-debt-batch-0501). `verify-bulk-action-bar/SKILL.md` Step 8(group header indeterminate, `getGroupRowIds`+`deriveGroupSelectionState`+`toCheckboxCheckedProp` SSOT + Radix `data-state="indeterminate"` 자동 `aria-checked="mixed"` 매핑 + grep 검증 명령) + Step 9(격리 fixture page 패턴, `app/(dashboard)/__visual__/<scenario>/page.tsx` 인라인 시드 + 네트워크/세션 의존 0 + grep 검증 명령) 신설. 안티패턴 4종 문서화.
- [x] **[2026-04-30 batch-0430e] S8 bulk-reject e2e 테스트** — ✅ 2026-04-30 완료 (tech-debt-batch-0430e). `wf-ap02-approvals-bulk-reject.spec.ts` Step 8(route mock 전체 성공 toast `/건이 반려되었습니다/`) + Step 9(route mock 부분 실패 toast `/건 반려 완료.*건 실패/`) + `finally page.unroute()` 정리. `expectToastVisible` SSOT 활용.

---

## 2026-04-30 — Checkouts 관련 배치 완료 4건

- [x] **[2026-04-30 deps-supply-chain] 🟡 MEDIUM A4 dependabot-yml-policy** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). semver-major ignore 28건, versioning-strategy 명시, YAML 파싱 통과.
- [x] **[2026-04-30 deps-supply-chain] 🟡 MEDIUM file-upload-form-template-spec-신설** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d Phase A N/A). 두 spec 모두 이미 존재 + 16 tests PASS.
- [x] **[2026-04-30 approvals-ui-r2] 🟡 MEDIUM approvals-api-module-split** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase A). `approvals-api.ts` 1538줄 → `types/internal-rows/mappers/fetchers/actions` 5개 서브모듈 + 배럴 파일로 functional-axis 분리. 24개 호출처 변경 없음(배럴 re-export 보존).
- [x] **[2026-04-30 approvals-ui-r2] 🟡 MEDIUM bulk-approve-rate-limit** — ✅ 2026-04-30 완료 (tech-debt-batch-0430b). `runWithConcurrency<T>(tasks, 5)` 헬퍼 도입, `bulkApprove` / `bulkReject` 동시 API 호출 5개로 제한.

---

## 2026-04-30 — Sprint 3~4 관련 완료 2건

- [x] **[2026-04-27 Sprint 4.1+4.2] 🟢 LOW overflow-action-type-ssot** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase D). `OverflowAction` 인터페이스를 `lib/types/checkout-ui.ts` SSOT로 승격. `NextStepPanel.tsx`에서 `import type` + `export type` 분리 패턴으로 하위 호환성 보장.
- [x] **[2026-04-26 Sprint 3.1~3.2] 🟡 MEDIUM inbound-bff-flag-removal** — ✅ 2026-04-30 완료 (tech-debt-batch-0430b). `checkout-flags.ts` 삭제, `InboundCheckoutsTab.tsx` BFF-only로 단순화 (legacy 3-useQuery 제거, `teamId` props 제거). `.env.example` 플래그 항목 제거.

---

## 2026-04-27 — approvals-ui-r2 DoD + Sprint 관련 완료 3건

- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM approvals-api-module-split** — 위 2026-04-30 항목에서 처리됨 (approvals-api-module-split).
- [x] **[2026-04-27 approvals-ui-r2] 🟢 LOW stepper-step-transition-animation** — ✅ 2026-04-30 완료 (tech-debt-batch-0430c). `APPROVAL_STEPPER_TOKENS.connector.transition = TRANSITION_PRESETS.fastBg` 신설, `ApprovalStepIndicator.tsx` connector div에 적용. background-color 200ms ease-standard `motion-safe:transition-[background-color]` 전환.
- [x] **[2026-04-30 verify-impl-batch-0430] 🟢 LOW fetchers-status-literal-ssot** — ✅ 2026-04-30 완료 (tech-debt-batch-0430b). `apps/frontend/lib/api/approvals/fetchers.ts` 리터럴 3건 → `CheckoutStatusValues.PENDING` / `CheckoutPurposeValues.RETURN_TO_VENDOR` / `IntermediateCheckFilterStatusValues.DUE` SSOT 교체.

---

## 2026-04-27 — tech-debt-0427-open 완료 10건 + 기존 archive 이동 4건

### 기존 완료 [x] 4건 이동

- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM ar-13-self-inspection-category** — ✅ 2026-04-27 완료. `self_inspection` SSOT 체인 전체 추가 (schemas → shared-constants → backend → frontend → i18n).
- [x] **[2026-04-27 sprint4-3-to-5] 🔴 HIGH rejection-presets-seed** — ✅ 2026-04-27 완료. 5건 삽입. `seed-data/admin/rejection-presets.seed.ts` 신규. 교정유효기간만료(is_default)·장비상태부적합(is_default)·반출정보오류(is_default)·중복신청·신청요건미충족.
- [x] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM stale-time-query-config-presets** — ✅ 2026-04-27 완료. 36건 전수 교체. COMBOBOX_SEARCH preset 신규, Settings/Profile/NotificationPreferences→SETTINGS, 콤보박스 4개→COMBOBOX_SEARCH.
- [x] **[2026-04-27 tech-debt-0427-cleanup] 🟡 MEDIUM revoke-approval-workflow-e2e** — ✅ 2026-04-27 완료. WF-AP-03 등록 + wf-ap03-revoke-approval.spec.ts 작성. test.skip(REVOCATION_WINDOW_EXPIRED) 명시적 마킹.

### 이번 세션 처리 10건

- [x] **[2026-04-27 fsm-terminal-actor-variant] 🟡 MEDIUM use-checkout-next-step-fallback-terminated-from** — ✅ 2026-04-27 완료. `UseCheckoutNextStepInput`에 `terminatedFromStatus?: CheckoutStatus | null` 추가, fallback getNextStep() 전달 + useMemo deps 포함. tsc 0 error.
- [x] **[2026-04-27 ar13] 🟢 LOW ar13-self-inspection-approve-weak-cast** — ✅ 2026-04-27 완료. `SelfInspectionDetail` 인터페이스 추가, `apiClient.get<SelfInspectionDetail>()` + `.data.version` 타입 안전 패턴 적용. tsc 0 error.
- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM ar-14-software-validation-approve-comment** — ✅ 2026-04-27 완료. backend `approveValidationSchema`에 `approvalComment` optional 추가, `softwareValidationApi.approve()` 3-arity 확장, `TAB_META.commentRequired: true` 활성화. tsc 0 error, backend 947 tests PASS.
- [x] **[2026-04-27 manage-skills] 🟢 LOW revocation-window-ms-shared-constants** — ✅ 2026-04-27 완료. `APPROVAL_REVOCATION_WINDOW_MS = 300_000` business-rules.ts + index.ts SSOT 승격. checkouts.service.ts 로컬 상수 제거 + import 교체.
- [x] **[2026-04-27 tech-debt-0427-cleanup] 🟢 LOW not-found-href-ssot** — ✅ 2026-04-27 완료. 4개 파일(app/not-found.tsx, equipment/[id], non-conformances/[id], calibration-plans/[uuid]) `href="/"` → `href={FRONTEND_ROUTES.DASHBOARD}`.
- [x] **[2026-04-27 tech-debt-0427-cleanup] 🟢 LOW create-equipment-import-form-react-formevent** — ✅ 2026-04-27 완료. `CreateEquipmentImportForm.tsx:113` `React.FormEvent` → `React.SyntheticEvent<HTMLFormElement>`.
- [x] **[2026-04-27 approvals-ui-r2] 🟢 LOW reject-reason-stale-i18n** — ✅ 2026-04-27 완료. `RejectReasonSchema` min(1) → min(REJECTION_MIN_LENGTH=10) defense-in-depth. ko/en `{min}자 이상` placeholder 통일.
- [x] **[2026-04-27 ar13] 🟢 LOW ar13-dashboard-kpi-self-inspection** — ✅ 2026-04-27 완료. self-inspections.controller.ts approve/reject `@AuditLog` action 'update' → 'approve'/'reject'. APPROVAL_KPI.PROCESSED_ACTIONS 자동 포함.
- [x] **[2026-04-24 sprint-1.1] 🟡 MEDIUM DESCRIPTOR_TABLE 재생성 스크립트 부재** — ✅ 2026-04-27 완료. `packages/schemas/scripts/gen-descriptor-table.ts` 신규 + package.json `gen:descriptor-table` 등록. schemas 695 tests PASS.
- [x] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM qr-label-size-preset-micro-ssot** — ✅ 2026-04-27 완료. `LabelSizePreset`에 `'micro'` 추가(30×12mm, qrSizeMm=8), `LABEL_SAMPLER_LAYOUT.micro`, `getSamplerPresetOrder()` 갱신. 세로 합계 259.7mm < 297mm ✓
- [x] **[2026-04-27 approvals-ui-r2] 🟢 LOW react-form-event-deprecation** — ✅ 2026-04-27 확인. RejectModal.tsx:102 이미 수정됨. CreateEquipmentImportForm.tsx는 위 항목에서 처리 완료.

---

## 2026-04-27 — approvals SSOT + checkout i18n/enum SSOT 완료

- [x] **[2026-04-27 approvals-ar7-ar6-e2e] 🟢 LOW approval-detail-modal-deprecated-section-tokens** — ✅ 2026-04-27 완료. `APPROVAL_DETAIL_SECTION_TOKENS` → `APPROVAL_DETAIL_MODAL_TOKENS.sectionBody`/`.historyCard` 교체 + deprecated 정의 삭제. 영향: ApprovalDetailModal.tsx, ApprovalHistoryCard.tsx, approval.ts, index.ts. tsc PASS.
- [x] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM i18n-audit-borrower-actions** — ✅ 2026-04-27 완료. ko/en audit.json에 `actions.borrower_approve`/`borrower_reject` 키 추가 (커밋 27f71c79).
- [x] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM checkout-history-purpose-raw-literals** — ✅ 2026-04-27 완료. SelectItem value를 `UserSelectableCheckoutPurposeEnum.enum.*` SSOT로 교체 (커밋 27f71c79).

---

## 2026-04-26 — design-tokens SSOT 정비 + FSM 컨트랙트 동적화 + Sprint 1.x 다수 확인

### 2026-04-26 harness: medium-token-ssot-fixes — 실수정 완료 6건

- [x] **[2026-04-26 nc-verify] 🟡 MEDIUM nceditdialog-form-field-tokens-barrel** — ~~`NCEditDialog.tsx:10` 직접 서브패스 import~~ → `index.ts`에 `REQUIRED_FIELD_TOKENS`·`REQUIRED_FIELD_A11Y` barrel re-export 추가 + NCEditDialog import 통합 완료 (2026-04-26 harness medium-token-ssot-fixes).
- [x] **[2026-04-26 nc-verify] 🟡 MEDIUM statusAlert-dark-prefix** — ~~`non-conformance.ts:96` `dark:border-brand-critical/30 dark:bg-brand-critical/10` 잔존~~ → `dark:` prefix 2개 제거 완료, CSS 변수 자동 전환 체계 복구 (2026-04-26 harness medium-token-ssot-fixes).
- [x] **[2026-04-26 sprint-2.4] 🟡 MEDIUM tab-badge-raw-class-audit** — ~~`NOTIFICATION_LIST_FILTER_TOKENS.tabBadge` raw class~~ → `semantic.ts`에 `ALERT_TAB_BADGE_COLOR` 공유 토큰 신설, checkout·notification 양쪽 참조로 통합 완료 (e32c12cb).
- [x] **[2026-04-26 sprint-2.3] 🟡 MEDIUM overdueClear icon SSOT 통일** — 실측 결과 `checkout-icons.ts:60`에 `overdueClear: CheckCircle2` 이미 등록됨 + `OutboundCheckoutsTab.tsx`가 `CHECKOUT_ICON_MAP.emptyState.overdueClear` SSOT 경유 중. 이미 완료 상태 확인 (2026-04-26 medium-token-ssot-fixes 검증).
- [x] **[2026-04-26 sprint-2.3] 🟡 MEDIUM OutboundCheckoutsTab aria-label "건" 하드코딩** — 실측 결과 L323 `t('list.count.unit', { value: card.value })` i18n 사용 중. `ko/checkouts.json:544 "unit": "{value}건"` + `en/checkouts.json:544 "unit": "{value} items"`. 이미 완료 상태 확인 (2026-04-26 medium-token-ssot-fixes 검증).
- [x] **[2026-04-24 sprint-1.2] 🟡 MEDIUM 컨트랙트 M2·M13 "208 entry" 스테일 수치** — ~~"208" 하드코딩~~ → M2·M13·Acceptance·연계 contracts 섹션 전체 `EXPECTED_ENTRY_COUNT`(= `TOTAL_STATUSES × TOTAL_PURPOSES × TOTAL_ROLES`) 동적 참조로 교체. 테스트 describe 문자열도 template literal로 통일 완료 (2026-04-26 harness medium-token-ssot-fixes).

### 2026-04-26 harness: 이전 세션 항목 실측 확인 완료

- [x] **[2026-04-24 wf34-pr13] 🟡 MEDIUM URGENCY_ICON 로컬 맵 → checkout-icons.ts SSOT 이관** — 실측 확인(2026-04-26): `YourTurnBadge.tsx:30` `CHECKOUT_ICON_MAP.urgencyBadge[urgency]` SSOT 경유. 로컬 URGENCY_ICON 맵 없음. 이미 수정됨.
- [x] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW .env.example 플래그 문서화 누락** — Sprint 1.4(2026-04-24) 해소: 변수 자체를 .env.local/.env.example에서 제거.
- [x] **[2026-04-22 checkout-arch-pr3-11] 🟡 MEDIUM NextStepPanel 플래그 상시화** — Sprint 1.4(2026-04-24) 완료: checkout-flags.ts return true 상시화, LegacyActionsBlock 제거, isNextStepPanelEnabled 호출부 전체 제거.
- [x] **[2026-04-22 pr22] 🟢 LOW approvals-api.ts approverId 미사용 파라미터** — 실측 확인(2026-04-26): approvals-api.ts에서 approverId/userId 파라미터 없음. use-approvals-api.ts hook wrapper도 동일. 이미 수정됨.
- [x] **[2026-04-22 pr22] 🟢 LOW Checkout.user.department 백엔드 DTO 미지원 필드** — 실측 확인(2026-04-26): `checkout-api.ts:67` `department?: string` optional로 이미 수정됨.
- [x] **[2026-04-24 pr-3] 🟢 LOW Layer 1 직접 import — dashboard.ts/header.ts/sidebar.ts** — 실측 확인(2026-04-26): dashboard/header/sidebar 모두 `../utils`에서 import. 이미 수정됨.
- [x] **[2026-04-24 pr4-7] 🟢 LOW en/checkouts.json 3개 키 누락** — 2026-04-24 해소: cancelCheckout/cancelTitle/cancelDescription 추가.
- [x] **[2026-04-24 pr4-7] 🟢 LOW CheckoutsContent.tsx PURPOSE_OPTIONS 로컬 재정의** — 실측 확인(2026-04-26): `CheckoutsContent.tsx:47/412` `USER_SELECTABLE_CHECKOUT_PURPOSES` SSOT 경유. 로컬 배열 없음. 이미 수정됨.
- [x] **[2026-04-24 pr4-7] 🟢 LOW OutboundCheckoutsTab pagination ?? 10 매직넘버** — 실측 확인(2026-04-26): `pageSize ?? 10` 패턴 전체 codebase 검색 0건. 이미 수정됨.
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW borrowerReject dialog onErrorCallback reason 미초기화** — 89차 세션 수정: `onErrorCallback`에 `setBorrowerRejectReason('')` 추가 (commit 14c2d526).
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW REJECTED 상태 카드에 borrowerRejectionReason 미표시** — 89차 세션 수정: `borrowerRejectionReason ?? rejectionReason` 우선순위로 표시 (commit 14c2d526).
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW CheckoutNotificationEvent lenderTeamId 미선언** — 88차 세션 즉시 수정: notification-events.ts에 `lenderTeamId?: string` 추가.
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW lenderTeamId ?? '' 빈 문자열 fallback** — 88차 세션 즉시 수정: `?? undefined`로 교체.
- [x] **[2026-04-24 rental-phase5-8] 🔴 Critical LegacyActionsBlock 취소 조건 BORROWER_APPROVED 누락** — 88차 세션 즉시 수정: FSM SSOT 일치.
- [x] **[2026-04-24 pr5] 🟢 LOW checkout-fsm-borrower-actions** — 이미 수정됨: CheckoutDetailClient.tsx handleNextStepAction에 borrower_approve/borrower_reject case 명시적 존재 확인(2026-04-24 검증).
- [x] **[2026-04-24 pr5] 🟢 LOW checkout-legacy-rental-flow-cleanup** — 2026-04-26 해소: `CheckoutGroupCard.tsx` `RentalFlowInline` + `isNextStepPanelEnabled()` 분기 제거, `RENTAL_FLOW_INLINE_TOKENS` checkout.ts/index.ts에서 제거, `i18n.checkouts.rentalFlow.*` ko/en 양쪽 제거 완료.
- [x] **[2026-04-24 pr5] 🟢 LOW checkout-legacy-next-step-panel-cleanup** — 2026-04-26 해소: `checkout-flags.ts` 파일 삭제, `isNextStepPanelEnabled` 모든 import/호출부 제거 완료.
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM Stale CAS 5차 재발 — CheckoutDetailClient 8개 mutation** — 실측 확인(2026-04-26): mutationFn L155/178/203/236/262/287/313/341 전체 `getCheckout(checkout.id)` fresh fetch 패턴으로 이미 구현 완료.
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM WorkflowTimeline TooltipTrigger > div 키보드 포커스 불가** — 실측 확인(2026-04-26): `WorkflowTimeline.tsx:133` `tabIndex={0}` 이미 존재.
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM CheckoutGroupCard useMutation 직접 사용** — 2026-04-26 Stale CAS 위험 해소: `mutationFn` 내 fresh fetch 패턴 적용.
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM nextStepIndex prop +1 오프셋 혼란** — 실측 확인(2026-04-26): `CheckoutDetailClient.tsx:519-521` `nextStepDescriptor.currentStepIndex` (+1 없음). 이미 수정됨.
- [x] **[2026-04-24 pr14-15] 🟢 LOW WorkflowTimeline 내부 Suspense 무의미** — 실측 확인(2026-04-26): Suspense import/사용 없음. 이미 제거됨.
- [x] **[2026-04-24 pr14-15] 🟢 LOW staggerItem 60ms SSOT 이탈** — 실측 확인(2026-04-26): `motion.ts` `getStaggerFadeInStyle()` SSOT 경유. magic 60 없음.
- [x] **[2026-04-24 pr14-15] 🟢 LOW CheckoutDetailClient href 하드코딩** — 실측 확인(2026-04-26): `FRONTEND_ROUTES.EQUIPMENT.DETAIL(equip.id)` 이미 사용됨.
- [x] **[2026-04-24 pr-19] 🟢 LOW CHECKOUT_DETAIL 프리셋 미등록** — 실측 확인(2026-04-26): `query-config.ts:347` `CHECKOUT_DETAIL` 프리셋 존재. 이미 수정됨.
- [x] **[2026-04-24 pr-19] 🟢 LOW Error 배너 3종 px-4 py-3 spacing 중복** — 2026-04-26 해소: `components/shared/InlineErrorBanner.tsx` 공통 컴포넌트 추출 완료.
- [x] **[2026-Q2 pr-17] 🟡 MEDIUM NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 상시화** — Sprint 1.4(2026-04-24) 완료.
- [x] **[2026-04-24 sprint-1.3] 🟡 MEDIUM checkout-role-canapprove-removal** — 2026-04-26 해소: `CheckoutGroupCard.tsx` `canApprove` prop 완전 제거. `OutboundCheckoutsTab.tsx` `can(Permission.APPROVE_CHECKOUT)` 호출 제거 완료.

---

## 2026-04-22 — checkout-subtab-ia + subtab-ssot-fix 후속 (63261b0d + followup)

- [x] **🟡 MEDIUM QUERY_CONFIG 인라인 오버라이드** — `query-config.ts`에 `CHECKOUT_LIST/CHECKOUT_SUMMARY/CHECKOUT_DESTINATIONS/EQUIPMENT_IMPORT_LIST` 프리셋 추가. `CheckoutsContent.tsx` + `OutboundCheckoutsTab.tsx` + `InboundCheckoutsTab.tsx` 교체. 4차 재발 종결.
- [x] **🟡 MEDIUM Radix Select spurious onValueChange 가드 누락** — `handleStatusChange/handleLocationChange/handlePurposeChange/handlePeriodChange` 첫 라인에 `if (value === filters.X) return;` 가드 추가.
- [x] **🟡 MEDIUM role="tabpanel" 내부 role="tablist" (WCAG 4.1.2)** — `CheckoutListTabs`(tablist)를 `role="tabpanel"` div 외부 sibling으로 이동. axe-core 위반 해소.
- [x] **🟢 LOW handlePageChange URL SSOT 이중 경로** — `handlePageChange` → `filtersToSearchParams({ ...filters, page: newPage })` 일원화.
- [x] **🟢 LOW handleSubTabChange URL 직접 조작** — `filtersToSearchParams({ ...filters, subTab: newSubTab, status: 'all', page: 1 })`으로 일원화.
- [x] **🟡 MEDIUM InboundCheckoutsTab CACHE_TIMES.SHORT 직접 지정 3곳** — inbound checkout → `CHECKOUT_LIST`, rental/internal import → `EQUIPMENT_IMPORT_LIST` 프리셋 교체.
- [x] **🟡 MEDIUM CHECKOUT_DESTINATIONS staleTime/gcTime DAY 티어 불일치** — `query-config.ts` CHECKOUT_DESTINATIONS 프리셋을 `staleTime: CACHE_TIMES.DAY, gcTime: CACHE_TIMES.DAY`로 수정.
- [x] **🟡 MEDIUM isAllActive 5-필드 인라인이 countActiveFilters SSOT 우회** — `OutboundCheckoutsTab.tsx` `isAllActive` 계산을 `countActiveFilters(filters) > 0` SSOT로 교체.
- [x] **🟢 LOW placeholderData가 QUERY_CONFIG 스프레드보다 앞에 위치** — `CheckoutsContent.tsx` liveSummary 쿼리에서 `placeholderData: initialSummary`를 `...QUERY_CONFIG.CHECKOUT_SUMMARY` 이후로 이동.

---

## 2026-04-22 — checkout-lender-guard (harness Mode 1)

- [x] **🟡 MEDIUM approve lenderTeam identity-rule 강제** — `if (... && approverTeamId)` → `if (...)` + `if (!approverTeamId || ...)` 패턴. 팀 미소속 사용자 RENTAL 승인 바이패스 차단. 928 tests PASS.
- [x] **🟡 MEDIUM rejectReturn lenderTeam identity-rule 강제** — 동일 패턴. `rejectReturn` L2032 수정.
- [x] **🟢 LOW approve NO_EQUIPMENT 가드 추가** — `if (!firstEquip) throw BadRequestException(NO_EQUIPMENT)` — `enforceScopeFromData` 이전 배치.
- [x] **🟢 LOW rejectReturn NO_EQUIPMENT 가드 추가** — 동일 패턴. `rejectReturn` L2009 수정.

---

## 2026-04-22 — checkout-fsm + checkouts cleanup + design-token arbitrary text

### 2026-04-22 harness: checkout-fsm-backend (PR-2) review-architecture 후속

- [x] **🟡 MEDIUM CHECKOUT_FORBIDDEN을 400→403으로 수정** — 완료 (db7f5be3)
- [x] **🟡 MEDIUM approve-return/reject-return 컨트롤러 가드 FSM과 정렬** — 완료 (db7f5be3)
- [x] **🟡 MEDIUM writeTransitionAudit 실패 명시적 로깅** — 완료 (refactor로 캡슐화 4c9db711)
- [x] **🟡 MEDIUM approve guard VIEW_CHECKOUTS → APPROVE_CHECKOUT** — 완료 (4c9db711)
- [x] **🟡 MEDIUM rejectReturn lenderTeam BadRequestException → ForbiddenException** — 완료 (d27fd09b)
- [x] **🟡 MEDIUM ConflictException 4개 메서드 catch 블록 누락** — 완료 (d27fd09b)
- [x] **[PR-2] 🟢 LOW CheckoutErrorCode enum 도입** — ✅ `checkout-error-codes.ts` 신규 생성 (23개 코드, JSDoc), service.ts 인라인 30건 전환.
- [x] **[PR-2] 🟢 LOW rejectReturn 스코프 검증 무조건 실행** — ✅ `enforceScopeFromData` 호출을 approverTeamId 조건 밖으로 이동.
- [x] **[PR-2] 🟢 LOW reject 엔드포인트 반려 사유 검증 이중 위치** — ✅ controller.ts L465-470 중복 검증 블록 제거, 서비스 단일 경로로 통일.

### 2026-04-22 harness: checkout-fsm-backend PR-2 후속

- [x] **[PR-2] 🔴 HIGH checkout-fsm E2E 격리 검증 필요** — ✅ 18/18 PASS (라이브 DB). approve_return 테스트 기대값 수정.
- [x] **[PR-2] 🟢 LOW checkout service spec mockReq permissions 패턴 문서화** — ✅ `docs/references/backend-patterns.md` "FSM assertFsmAction 서비스 테스트 픽스처 패턴" 섹션 추가.
- [x] **[PR-2] 🟡 MEDIUM approve (최초 승인) 엔드포인트 guard 과소제어** — ✅ 확인 결과 이미 APPROVE_CHECKOUT으로 설정됨. Evaluator 오탐. E2E 기대값 수정 완료.

### 2026-04-21 harness: checkout-fsm-schemas PR-1 후속

- [x] **[PR-1] 🟢 LOW canPerformAction 권한 매트릭스 5 role 미완성** — ✅ quality_manager(조회전용 3케이스) + lab_manager(전체권한 4케이스) describe 블록 추가. 18/18 E2E PASS와 함께 검증.

### 2026-04-21 harness: 78-1 typo-primitives-checkout-ssot 후속

- [x] **[78-1] 🟡 MEDIUM `checkout.ts:197` `w-[18px] h-[18px]` 잔존** — ✅ `--spacing-step-dot` @theme + `DIMENSION_TOKENS.stepDot` 3-layer 적용.
- [x] **[78-8] 🟢 LOW top-3 도메인 arbitrary text-[Npx] 53건 제거** — ✅ MICRO_TYPO.meta(11px)/detail(13px) 신규 토큰 + globals.css @theme + primitives.ts 3-way SSOT 체인. non-conformance.ts(21건), audit.ts(18건), dashboard.ts(14건) 적용.
- [x] **[78-1] 🟢 LOW 잔여 design-tokens 도메인 arbitrary text-[Npx] ~37건** — ✅ text-sm-wide(15px) 신규 3-layer 토큰 + MICRO_TYPO.siteTitle 추가. team/settings/approval/equipment/sidebar/calibration-plans/mobile-nav/software.ts 8개 파일 전량 처리.
- [x] CheckoutGroupCard 행 `div role="button"` → `<button>` 시맨틱 — ✅ 내부 `<Button>/<Link>` 중첩으로 `<button>` 사용 불가 (HTML5 spec). `div[role=button]` + WCAG 준수 패턴 유지 + 명시적 주석 추가.
- [x] **[78-7] 🟡 MEDIUM InboundCheckoutsTab 전역 isLoading vs 섹션별 로딩 dead code** — ✅ 전역 가드 제거 + `isAnyLoading` 가드로 전체 빈상태 보호.
- [x] **[78-7] 🟢 LOW EmptyState `useAuth()` 직접 호출 → props 주입 패턴** — ✅ `canAct?: boolean` prop 추가, useAuth 제거, 3 소비처 업데이트.

### 2026-04-21 harness: checkout-78-round2 후속

- [x] **[78-r2] 🟢 LOW renderLoadingState 중복 제거** — ✅ `CheckoutListSkeleton`에 `label`/`srOnly` props + `aria-busy` 추가, 양 탭 파일의 로컬 함수 제거.
- [x] **[78-r2] 🟢 LOW Overdue 배너 aria-label i18n + 앵커 포커스 이동** — ✅ `overdueScrollAriaLabel`/`bannerClose` i18n 추출, `tabIndex={-1}` + `focus()` 추가.
- [x] **[78-r2] 🟢 LOW skeleton label/srOnly 하드코딩 → i18n** — ✅ `checkouts.loading.*` 8개 키 추가, `t()` 교체.
- [x] **[78-r2] 🟢 LOW 배너 닫기 후 포커스 소실** — ✅ WCAG 2.1 SC 2.4.3: rAF + pendingCheckRef 포커스 이전.
