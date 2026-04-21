---
slug: backend-ssot-values-eslint
date: 2026-04-21
mode: 2
status: active
---

# Exec Plan: backend-ssot-values-eslint

## Summary

프론트엔드에서 완성된 status 리터럴 → *StatusValues/*Values SSOT 전환을 백엔드와 schemas 패키지에 확장.
5종 Values 객체 신설 + 백엔드 ESLint `no-restricted-syntax` 룰 신설 + 백엔드 서비스 코드 24곳 리터럴 교체.

## Phase 1: Schemas Values 객체 5종 신설

파일: `packages/schemas/src/enums/values.ts`

**목표**: 기존 24개 Values 객체와 동일 패턴으로 5종 신설.

- `CalibrationStatusValues`: SCHEDULED/IN_PROGRESS/COMPLETED/FAILED/CANCELLED (5개) — `CalibrationStatus from '../calibration'`
- `AttachmentTypeValues`: INSPECTION_REPORT/HISTORY_CARD/OTHER (3개) — `AttachmentType from '../equipment-attachment'`
- `TimelineEntryTypeValues`: DAMAGE/MALFUNCTION/CHANGE/REPAIR/CALIBRATION_OVERDUE/REPAIR_RECORD/NON_CONFORMANCE (7개) — `TimelineEntryType from '../equipment-history'`
- `RequestTypeValues`: CREATE/UPDATE/DELETE (3개) — `RequestType from '../equipment-request'`
- `SelfInspectionStatusValues`: DRAFT/SUBMITTED/APPROVED/REJECTED (4개) — `SelfInspectionStatus from './self-inspection'`

규약: `as const satisfies Record<string, <Type>>`, JSDoc `@example` 포함

배럴 자동 재수출: `enums/index.ts:20 → export * from './values'` → `src/index.ts:33 → export * from './enums'`. 추가 파일 수정 불필요.

## Phase 2: 백엔드 ESLint 룰 신설

파일: `apps/backend/.eslintrc.js`

**목표**: `.status`/`.approvalStatus`/`.returnApprovalStatus` property 대상 domain literal 하드코딩 차단.

- 글로벌 `rules` 블록에 `no-restricted-syntax` 추가 (no-restricted-imports 바로 아래)
- selector: property name `/^(status|approvalStatus|returnApprovalStatus)$/` + value 정규식(active/approved/draft/pending/... 전체 domain 리터럴)
- **controller override 함정**: ESLint overrides는 글로벌 룰을 병합 아닌 대체. controller override의 `no-restricted-syntax` 배열에 domain literal selector도 포함시켜야 함.
- `overrides` 배열 끝에 seed/test override 추가: `src/database/seed-data/**/*.ts` + `**/__tests__/**/*.spec.ts` 대상 `no-restricted-syntax: off`

## Phase 3: 백엔드 서비스 코드 리터럴 교체 (10개 파일)

### 3.1 `apps/backend/src/common/file-upload/document.service.ts`
- import에 `ValidationStatusValues` 추가
- L660: `validation.status !== 'draft'` → `ValidationStatusValues.DRAFT`

### 3.2 `apps/backend/src/database/utils/verification.ts`
- import에 `CheckoutStatusValues`, `CalibrationApprovalStatusValues` 추가
- L144: `c.approvalStatus === 'pending_approval'` → `CalibrationApprovalStatusValues.PENDING_APPROVAL`
- L176: `c.status === 'pending'` → `CheckoutStatusValues.PENDING`
- L152, 184 raw SQL 문자열은 변경 금지

### 3.3 `apps/backend/src/modules/self-inspections/self-inspections.service.ts` (7곳)
- import에 `SelfInspectionStatusValues` 추가
- L246, 335, 540: `'draft'` → `SelfInspectionStatusValues.DRAFT`
- L371, 415, 459, 541: `'submitted'` → `SelfInspectionStatusValues.SUBMITTED`
- L497, 542: `'rejected'` → `SelfInspectionStatusValues.REJECTED`

### 3.4 `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts` (8곳)
- import에 `InspectionApprovalStatusValues` 추가
- L324, 413, 627: `'draft'` → `InspectionApprovalStatusValues.DRAFT`
- L445, 549, 628: `'submitted'` → `InspectionApprovalStatusValues.SUBMITTED`
- L477: `'reviewed'` → `InspectionApprovalStatusValues.REVIEWED`
- L516: `'submitted' && 'reviewed'` → 해당 Values 상수
- L588: `'rejected'` → `InspectionApprovalStatusValues.REJECTED`
- L629: `'rejected'` → `InspectionApprovalStatusValues.REJECTED`

### 3.5 `apps/backend/src/modules/equipment/services/equipment-approval.service.ts` (3곳)
- import에 `RequestTypeValues` 추가
- L440: `'create'` → `RequestTypeValues.CREATE`
- L446: `'update'` → `RequestTypeValues.UPDATE`
- L462: `'delete'` → `RequestTypeValues.DELETE`

### 3.6 Promise.allSettled 예외 처리 (도메인 값 아님)
- `calibration.service.ts:474`: `// eslint-disable-next-line no-restricted-syntax -- Promise.allSettled result status`
- `dashboard.service.ts:650~666`: `/* eslint-disable/enable no-restricted-syntax -- Promise.allSettled */` 블록
- `docx-xml-helper.ts:512`: `// eslint-disable-next-line no-restricted-syntax -- Promise.allSettled outcome.status`

## Phase 4: 검증

```bash
pnpm tsc --noEmit
pnpm --filter backend run lint
pnpm --filter backend run test
pnpm --filter frontend run lint

# 잔존 스캔
rg "(\.status|\.approvalStatus|\.returnApprovalStatus)\s*(===|!==)\s*'" apps/backend/src \
  --glob '!**/__tests__/**' --glob '!**/seed-data/**'
```
