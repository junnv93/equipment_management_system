# Tech Debt Tracker — 아카이브: ErrorCode SSOT & Defense-in-Depth

ErrorCode enum SSOT, FSM 상태 전이, Zod defense-in-depth, 서비스 fail-close 완료 항목 기록.
활성 TODO는 [tech-debt-tracker.md](./tech-debt-tracker.md) 참조.

---

## 2026-05-02 — tier-2 SSOT 시스템 전반 sprint 완료

### tier-2-rejectmodal-ssot-integration — 완료 (Mode 2 harness, 2 iter PASS)

- [x] **[2026-05-02 system-arch] 🟡 MEDIUM tier-2-rejectmodal-ssot-integration** — ✅ 완료. 7 backend 도메인 reject DTO Zod 격상 (`.trim().min(REJECTION_REASON_MIN_LENGTH).max(LONG_TEXT_MAX_LENGTH)`) + service-layer fail-close (7 ErrorCode enum 신설) + 6 frontend reject Dialog → `RejectModal SSOT(mode='domain')` 통합 + 7 frontend mapper(per-domain) + i18n 4 namespace 통합(`errors.rejectionReasonRequired` + `{min}` 파라미터). **iter 2 보강**: FSM 상태 전이 7개 ErrorCode 추가 (`EquipmentImportOnlyPendingCanReject`, `CalibrationOnlyPendingCanReject`, `CalibrationFactorOnlyPendingCanReject`, `SoftwareValidationInvalidStatusTransition`, `IntermediateInspectionInvalidStatusTransition`, `SelfInspectionInvalidStatusTransition`, `NonConformanceInvalidTransition`). 결과: backend 1119/1119 tests + frontend 405/405 tests + tsc 0. **Out of Scope**: ① calibration-factor frontend reject UI (별도 sprint에서 완료) ② approve/create 인라인 코드 격상 (도메인별 별도 sprint).
- [x] **[2026-05-02 tier-2-rejectmodal 후속] 🟡 MEDIUM tier-2-calibration-factor-reject-ui-build** — ✅ 완료 (commit dea5c0db). `CalibrationFactorsClient.tsx` pending 테이블에 `APPROVE_CALIBRATION_FACTOR` 권한 기반 approve/reject 버튼 추가. `useOptimisticMutation + RejectModal mode='domain' + mapCalibrationFactorErrorToToast + getCalibrationActionButtonClasses` 5-layer 패턴 적용. `calibration.errors.title` i18n 키 누락도 동시 수정. tsc 0 errors, pre-push 497 tests PASS.

### disposal-service-fail-close — 완료 (Mode 1 harness, 1 iter PASS)

- [x] **[2026-05-01 disposal-zod] 🟢 LOW disposal-comment-reject-fail-close-service-layer** — ✅ 완료 (2026-05-02). `approveDisposal()` reject 분기에 BadRequestException(code: DISPOSAL_REJECT_COMMENT_REQUIRED) 추가. `'승인 단계에서 반려'` false-security fallback 제거. `approvalComment` trim+null 정규화. 신규 `disposal.service.spec.ts` 31 tests (Zod boundary 17 + service fail-close 9 + approve 정규화 5) 회귀 차단. defense-in-depth 의미적 완결성: Zod layer + service layer 동일 invariant.

### error-codes-ssot-system-wide — 완료 항목 3건

- [x] **[2026-05-02 error-codes-ssot] ✅ DONE audit-log-fail-close-integration** — 이미 구현됨 확인 (commit c8faf22f). `GlobalExceptionFilter`에 `AuditService` DI, `SECURITY_AUDITABLE_CODES` Set(31개 ErrorCode), `maybeAuditSecurityEvent` fire-and-forget 비동기 감사 로그, `__auditLogged` dedup 플래그, `audit-entity-id.util.ts` UUID 추출 헬퍼, `error.filter.spec.ts` unit test. tech-debt 항목 생성(error-codes-ssot sprint) 시점보다 선행 구현 확인으로 closure.
- [x] **[2026-05-02 error-codes-ssot] ✅ DONE tier-2-error-codes-equipment-domain-migration** — equipment 도메인 인라인 → ErrorCode enum 격상 완전 종결. service 51건(199dc407) + controller 7건(equipment-controller-errorcode-ssot) + interceptor/pipe 3건(equipment-domain-errorcode-closure) = 61건 전환. 5-layer defense-in-depth 완성.
- [x] **[2026-05-02 equipment-domain-errorcode-closure] ✅ DONE calibration-factor-approve-ui-approver-comment** — UL-QP-18 정책 확인: 승인 코멘트는 선택사항. backend Zod `z.string().optional()` + DTO `approverComment?: string` + frontend DTO `approverComment?: string` 일관 처리 완료. 런타임 400 버그 해소.
