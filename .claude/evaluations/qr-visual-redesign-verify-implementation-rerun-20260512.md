# qr-visual-redesign verify-implementation rerun (2026-05-12)

Sprint: `qr-visual-redesign` merged via `99d61436` (from `c01452f3` base).

---

## 1. Build / tsc / Test Results

| Check | Result |
|---|---|
| `apps/backend` tsc --noEmit | ✅ EXIT 0 |
| `apps/frontend` tsc --noEmit | ✅ EXIT 0 |
| backend spec `qr-access` (3 tests) | ✅ 3/3 PASS |
| frontend RTL `CalibrationDueBadge` (10 tests) | ✅ 10/10 PASS |

---

## 2. 13 Sub-skill Results

| # | Skill | Status | Notes |
|---|---|---|---|
| 1 | verify-ssot | ⚠️ MEDIUM | `qr-handover.ts:44` `z.string().uuid()` 직접 사용 (`uuidString()` SSOT 경유 필수, Step 18). `CalibrationDueBadge` inline `getDaysUntil` — `calculateDaysRemaining` SSOT 미경유(Step 56), `now` 주입 testability 사유로 borderline. |
| 2 | verify-hardcoding | ✅ PASS | API 경로 모두 `API_ENDPOINTS` 경유. `deleteOrphan` → `API_ENDPOINTS.DOCUMENTS.DETAIL(id)`. queryKeys 하드코딩 없음. |
| 3 | verify-zod | ⚠️ MEDIUM | `packages/schemas/src/qr-handover.ts:44` — `z.string().uuid()` 직접 사용 → `uuidString()` 교체 필요 (verify-zod Step 18). 나머지 스키마(HandoverTypeEnum, HandoverLastCheckSchema, HandoverItemSchema)는 올바름. |
| 4 | verify-i18n | ✅ PASS | `ko/qr.json` ↔ `en/qr.json` 키 완전 일치(0 미스). `ko/checkouts.json` ↔ `en/checkouts.json` 키 완전 일치. `getSamplerPresetOrder()` ↔ i18n 7키 동기화 PASS. |
| 5 | verify-frontend-state | ✅ PASS | `useState<string[]>` row selection 패턴 없음. 새 컴포넌트 모두 서버 계산 `allowedActions` props 기반 렌더. `useSafeTimeout` 인라인 패턴 없음. |
| 6 | verify-design-tokens | ✅ PASS | `StatusBadge` → `TONE_TO_SEMANTIC` + `getSemanticBadgeClasses` 경유. `brand.ts`에 `urgent`/`mute` 행 추가. `CSS_VAR_NAMES` 11엔트리 (`brandUrgent`, `brandMute`, `touchTargetMin` 등). `globals.css` 9 CSS 변수 추가 + `.text-mono` 클래스. |
| 7 | verify-handover-qr | ⚠️ LOW | Step 12 PASS: `confirm_handover` → `CHECK_WITH_STEP` + `assertNever` 존재. Step 13 PASS: `PURPOSE_BY_STATUS` 프론트 mirror 0건. Step 14 PASS: 4-layer fail-close 모두 존재. Step 15 PASS: 토큰 잔재 0건. Step 3/5: `EquipmentQRButton.tsx:62` — preview 비율 계산에 `93.5` 매직넘버 (`LABEL_SIZE_PRESETS.xl.widthMm` 사용 권장, LOW). |
| 8 | verify-routing-origin | ✅ PASS | `document-api.ts deleteOrphan` → `API_ENDPOINTS.DOCUMENTS.DETAIL` 경유. 신규 endpoint 없음. `window.location.origin` 1건은 `auth-utils.ts` 기존 파일 (스프린트 외). |
| 9 | verify-click-feedback | ✅ PASS | `AutoProgressCountdown` — `aria-live="polite"` + `aria-label` 존재. `HandoverPickerSheet` — router.push 전용(mutation 없음), 별도 loading state 불필요. |
| 10 | verify-checkout-fsm | ✅ PASS | `StepperHeader` 4-step SSOT 사용. `EquipmentConditionForm` `normal` 기본값. `ReturnInspectionForm` StepperHeader 통합. `ConditionCheckStep` 스키마 import. |
| 11 | verify-nextjs | ✅ PASS | 신규 컴포넌트 모두 'use client' 적절. 서버 컴포넌트/클라이언트 경계 유지. `await params` 패턴 없는 신규 page 없음. |
| 12 | verify-security | ✅ PASS | `findByManagementNumber` → `@RequirePermissions(Permission.VIEW_EQUIPMENT)` 존재. `req.user.userId` 서버 추출. 글로벌 `JwtAuthGuard` APP_GUARD 등록 확인. `QRAccessService.resolveHandoverActions` userId는 컨트롤러에서 `req.user` 전달. |
| 13 | verify-bulk-action-bar | ✅ N/A | 이번 스프린트 파일에 BulkActionBar 없음. |

---

## 3. Sprint-scope Findings 요약

| Priority | Location | Rule | Detail |
|---|---|---|---|
| MEDIUM | `packages/schemas/src/qr-handover.ts:44` | verify-zod Step 18 | `z.string().uuid()` → `uuidString()` SSOT 미경유. Zod v4 RFC 9562 엄격 검증으로 개발 seed UUID 거부 위험. |
| MEDIUM (borderline) | `apps/frontend/components/calibration/CalibrationDueBadge.tsx:36-41` | verify-ssot Step 56 | 인라인 `getDaysUntil` D-day 계산 (midnight normalization). `calculateDaysRemaining` 미경유. `now` 파라미터 테스트 주입 사유 있음 — `calculateDaysRemaining`가 `now` 미지원이라 직접 사용 불가. tech-debt LOW 등록 권고. |
| LOW | `apps/frontend/components/equipment/EquipmentQRButton.tsx:62,65` | verify-handover-qr Step 3/5 | `93.5` 매직넘버 preview 계산 → `LABEL_SIZE_PRESETS.xl.widthMm` 참조 권고. |

---

## 4. 결론

- **HIGH findings: 0건**
- **MEDIUM findings: 2건** (z.uuid SSOT 위반 + D-day 인라인 계산 borderline)
- **LOW findings: 1건** (preview 매직넘버)
- **tsc: backend + frontend 모두 EXIT 0**
- **spec: 3+10 = 13 테스트 모두 PASS**
- **13 sub-skill PASS: 11 PASS, 1 MEDIUM⚠️ (verify-zod), 1 MEDIUM⚠️ (verify-handover-qr LOW), 1 N/A**

G-2 (equipmentApi return type drift)은 이미 스프린트에서 수정 완료 확인.
주요 아키텍처 패턴(QR SSOT, 인수인계 서버 판정, 다중 handover picker, 디자인 토큰 3-layer) 모두 정합.
