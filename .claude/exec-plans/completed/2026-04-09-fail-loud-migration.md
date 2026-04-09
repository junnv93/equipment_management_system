# Exec Plan: failLoud 전면 전환 마이그레이션
Date: 2026-04-09
Status: active
Slug: fail-loud-migration

## Context

### 기반 인프라 (완료)
- `apps/backend/src/common/scope/scope-enforcer.ts` — `enforceScope()` 4-case 정책 SSOT
- `SiteScopeInterceptor` — `failLoud?: boolean` 옵션 지원, silent/failLoud 양 모드 동작
- `@CurrentScope()` / `@CurrentEnforcedScope()` parameter decorator
- `reports.controller.ts` 13개 라우트 — 이미 `failLoud: true` 완료 (선례 패턴)

### 문제
현재 31개 `@SiteScoped` 사용처 중 reports.controller 13곳만 `failLoud: true`.
나머지 18개는 silent 모드: cross-site 시도를 ForbiddenException 없이 `req.query` 재작성.
→ OWASP IDOR probing 탐지 불가, audit_logs의 `access_denied` 경로 미트리거.

> tech-debt-tracker.md의 "35개"는 구버전 기록. 현재 코드 기준 31개.

---

## Phase A — 조사 매트릭스 (미전환 18개)

| # | Controller.method | 파일 | 라인 | policy | siteField | 프론트엔드 호출자 | frontend site/teamId 명시 송출? | 위험도 | Phase |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `EquipmentController.findAll` | equipment.controller.ts | 189 | EQUIPMENT_DATA_SCOPE | site | `useEquipmentFilters` | ✅ URL→site/teamId 송출 | LOW | B |
| 2 | `CheckoutsController.findAll` | checkouts.controller.ts | 138 | CHECKOUT_DATA_SCOPE | site | `OutboundCheckoutsTab` | ✅ teamId props, site 인터셉터 위임 | LOW | B |
| 3 | `NonConformancesController.findAll` | non-conformances.controller.ts | 92 | NON_CONFORMANCE_DATA_SCOPE | site | `use-nc-filters` | ✅ URL→site 관리 | LOW | B |
| 4 | `EquipmentImportsController.findAll` | equipment-imports.controller.ts | 95 | EQUIPMENT_IMPORT_DATA_SCOPE | site | `equipment-import-api` | ✅ site/teamId 명시 append | LOW | B |
| 5 | `CalibrationController.findAll` | calibration.controller.ts | 141 | CALIBRATION_DATA_SCOPE | site | `getCalibrationSummary` | ✅ optional site/teamId 명시 | LOW | C |
| 6 | `CalibrationController.findPendingApprovals` | calibration.controller.ts | 164 | CALIBRATION_DATA_SCOPE | site | `getPendingCalibrations` | 조사 필요 | MEDIUM | C |
| 7 | `CalibrationPlansController.findAll` | calibration-plans.controller.ts | 101 | CALIBRATION_PLAN_DATA_SCOPE | **siteId** | `use-calibration-plans-filters` | ✅ siteId/teamId 관리 | LOW | C |
| 8 | `CalibrationPlansController.findExternalEquipment` | calibration-plans.controller.ts | 116 | CALIBRATION_PLAN_DATA_SCOPE | **siteId** | `getCalibrationPlans` | ✅ siteId/teamId 직렬화 | LOW | C |
| 9 | `CalibrationFactorsController.findAll` | calibration-factors.controller.ts | 101 | CALIBRATION_DATA_SCOPE | site | `getCalibrationFactors` | ❌ 미송출 | HIGH | D |
| 10 | `CalibrationFactorsController.findPendingApprovals` | calibration-factors.controller.ts | 124 | CALIBRATION_DATA_SCOPE | site | `getPendingCalibrationFactors` | ❌ 미송출 | HIGH | D |
| 11 | `CalibrationFactorsController.getRegistry` | calibration-factors.controller.ts | 147 | CALIBRATION_DATA_SCOPE | site | `getCalibrationFactorRegistry` | ❌ 미송출 | HIGH | D |
| 12 | `SoftwareTestsController.findByTestSoftware` | software-validations.controller.ts | 67 | TEST_SOFTWARE_DATA_SCOPE | site | `software-api` | 조사 필요 | MEDIUM | D |
| 13 | `SoftwareValidationsController.findPending` | software-validations.controller.ts | 93 | TEST_SOFTWARE_DATA_SCOPE | site | `software-api` | 조사 필요 | MEDIUM | D |
| 14 | `TestSoftwareController.findAll` | test-software.controller.ts | 65 | TEST_SOFTWARE_DATA_SCOPE | site | `TestSoftwareQuery.site` | ⚠️ 필드 존재 | MEDIUM | D |
| 15 | `UsersController.findAll` | users.controller.ts | 92 | USER_DATA_SCOPE | site | `users-api` | ✅ 조건부 송출 | LOW | E |
| 16 | `NotificationsController.findAllAdmin` | notifications.controller.ts | 203 | NOTIFICATION_DATA_SCOPE | **recipientSite** | `notifications-api` | ❌ 미송출 | HIGH | E |
| 17 | `DisposalRequestsController.getPendingReviewRequests` | disposal-requests.controller.ts | 27 | DISPOSAL_DATA_SCOPE | site | `approvals-api` | 조사 필요 | MEDIUM | E |
| 18 | `DisposalRequestsController.getPendingApprovalRequests` | disposal-requests.controller.ts | 48 | DISPOSAL_DATA_SCOPE | site | `approvals-api` | 조사 필요 | MEDIUM | E |

### 위험도 근거
- **LOW**: frontend가 site/teamId를 URL 파라미터로 명시 관리. silent→failLoud 전환 시 흐름 변화 없음
- **MEDIUM**: frontend 송출 여부 불확실. 전환 후 확인 필요
- **HIGH**: frontend API 클라이언트가 site/teamId 미전송. failLoud 전환 시 `enforceScope`가 scope 값 강제 주입으로 동작 동일하나 프론트 일관성 개선 권장

### 특수 siteField
- `calibration-plans` → `siteId`
- `notifications` → `recipientSite`

→ `@CurrentEnforcedScope()` 소비 시 `scope.site`를 비표준 필드에 바인딩하는 처리 필요

---

## Phase B — 핵심 CRUD (LOW × 4)

**대상:**
- equipment.controller.ts:189
- checkouts.controller.ts:138
- non-conformances.controller.ts:92
- equipment-imports.controller.ts:95

**작업:**
- `@SiteScoped({ policy: X })` → `@SiteScoped({ policy: X, failLoud: true })`
- 메서드 시그니처에 `@CurrentEnforcedScope() scope: EnforcedScope` 추가
- service 레이어에서 `req.query.site`/`req.query.teamId` 직접 파싱 제거 → 파라미터 전달

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --grep "equipment|checkout|non-conformance|equipment-import"
```

---

## Phase C — 교정 도메인 (LOW × 4)

**대상:**
- calibration.controller.ts:141, 164
- calibration-plans.controller.ts:101, 116

**특수:** `calibration-plans`는 `siteField: 'siteId'` → EnforcedScope 바인딩 매퍼 필요

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --grep "calibration"
```

---

## Phase D — 소프트웨어·보정계수 (MEDIUM/HIGH × 6)

**대상:**
- calibration-factors.controller.ts:101, 124, 147
- test-software.controller.ts:65
- software-validations.controller.ts:67, 93

**사전 조사 (Generator 착수 전):**
- `calibration-factors-api.ts` 3개 함수 site/teamId 파라미터 추가 여부 결정
- `software-api.ts` 호출자 송출 여부 확인

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --grep "calibration-factor|test-software|software-validation"
```

---

## Phase E — 부가 도메인 (MEDIUM/HIGH × 4)

**대상:**
- users.controller.ts:92
- notifications.controller.ts:203
- disposal-requests.controller.ts:27, 48

**특수:** `notifications`는 `siteField: 'recipientSite'` → EnforcedScope 바인딩 매퍼

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --grep "user|notification|disposal"
```

---

## Phase Z — 완료 기준

- `@SiteScoped` 라우트 `failLoud: true` 비율 100% (18/18)
- silent mutation 경로 미전환 도메인 0건 (`grep -rn "req\.query\[" apps/backend/src/modules/`)
- cross-site 요청 → HTTP 403 + audit_logs `access_denied` 레코드
- 회귀 0: `pnpm --filter backend run test` 전체 PASS

### 의도적 예외 (Out of Scope)
- `reports.controller.ts` 13개: 기완료
- `reports.controller.ts` `exportAuditLogs`: `AUDIT_LOG_SCOPE` 인라인 (none 시 빈 보고서 정책)
