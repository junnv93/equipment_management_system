---
slug: backend-ssot-values-eslint
type: contract
created: 2026-04-21
---

# Contract: backend-ssot-values-eslint

## Scope

백엔드 + schemas 패키지 status 리터럴 SSOT 완성 (*StatusValues/*Values 패턴) + 백엔드 ESLint 회귀 방지 룰.

## MUST Criteria

- M1: `@equipment-management/schemas`에서 아래 Values 객체 5종 모두 export됨:
  - `CalibrationStatusValues` (SCHEDULED/IN_PROGRESS/COMPLETED/FAILED/CANCELLED)
  - `AttachmentTypeValues` (INSPECTION_REPORT/HISTORY_CARD/OTHER)
  - `TimelineEntryTypeValues` (DAMAGE/MALFUNCTION/CHANGE/REPAIR/CALIBRATION_OVERDUE/REPAIR_RECORD/NON_CONFORMANCE)
  - `RequestTypeValues` (CREATE/UPDATE/DELETE)
  - `SelfInspectionStatusValues` (DRAFT/SUBMITTED/APPROVED/REJECTED)
- M2: 모든 신규 Values 객체가 `as const satisfies Record<string, <Type>>` 타입 가드 적용됨
- M3: `apps/backend/.eslintrc.js`에 `no-restricted-syntax` 룰 존재 — `.status`/`.approvalStatus`/`.returnApprovalStatus` property 대상 domain literal 감지
- M4: `pnpm --filter backend run lint` → 0 errors
- M5: `pnpm tsc --noEmit` → 0 errors (전체 monorepo)
- M6: `pnpm --filter backend run test` → PASS
- M7: `document.service.ts:660` `'draft'` 리터럴 없음 → `ValidationStatusValues.DRAFT` 사용
- M8: `verification.ts` L144, L176의 `'pending_approval'`/`'pending'` 리터럴 없음 → Values 상수 사용
- M9: controller override가 기존 emitAsync selector + 신규 domain literal selector 배열로 포함됨 (override 덮어쓰기 함정 방지)
- M10: `pnpm --filter frontend run lint` → 0 errors (회귀 없음)

## SHOULD Criteria

- S1: 백엔드 서비스 코드(seed-data/spec 제외) 내 `.status`/`.approvalStatus` domain literal 비교 0건
- S2: Promise.allSettled의 `r.status === 'fulfilled'|'rejected'` 사용처에 eslint-disable 주석 존재 (calibration.service.ts, dashboard.service.ts, docx-xml-helper.ts)
- S3: `apps/backend/.eslintrc.js` overrides에 `src/database/seed-data/**` + `**/__tests__/**/*.spec.ts` 대상 `no-restricted-syntax: off` 존재

## Non-Goals

- `document.service.ts` 함수 인자 패턴 (`eq(documents.status, 'active' as DocumentStatus)`) — 다음 PR
- `packages/db/src/schema/**` drizzle column default (`.default('active')` 등)
- raw SQL 문자열 (`"approval_status = 'pending_approval'"`)

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter backend run lint
pnpm --filter backend run test
pnpm --filter frontend run lint

rg "(\.status|\.approvalStatus|\.returnApprovalStatus)\s*(===|!==)\s*'" apps/backend/src \
  --glob '!**/__tests__/**' --glob '!**/seed-data/**'
```
