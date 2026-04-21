---
slug: sw-status-ssot-eslint
date: 2026-04-21
mode: 2
status: active
---

# Exec Plan: sw-status-ssot-eslint

## Summary

프론트엔드 전반 `obj.status === '<raw literal>'` 도메인 비교를 SSOT Values 객체로 통합하고, ESLint `no-restricted-syntax` 룰로 회귀 방지.

## Phase 1: SSOT 확장 (DocumentStatusValues 신규)

- `packages/schemas/src/document.ts` — `DocumentStatus` 타입 선언 바로 아래에 추가:
  ```ts
  export const DocumentStatusValues = {
    ACTIVE: 'active',
    SUPERSEDED: 'superseded',
    DELETED: 'deleted',
  } as const satisfies Record<string, DocumentStatus>;
  ```
  `packages/schemas/src/index.ts:16`의 `export * from './document'`으로 자동 배럴 포함.

## Phase 2: 도메인 위반 수정 (6 files / 7 sites)

1. `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
   - L23: `import { type EquipmentImportStatus }` → `import { type EquipmentImportStatus, EquipmentImportStatusValues }`
   - L213, L342: `item.status === 'approved'` → `item.status === EquipmentImportStatusValues.APPROVED`

2. `apps/frontend/components/non-conformances/NCDetailClient.tsx`
   - `@equipment-management/schemas`에서 `NonConformanceStatusValues` import 추가
   - L335: `nc.status === 'open'` → `nc.status === NonConformanceStatusValues.OPEN`

3. `apps/frontend/app/(dashboard)/cables/CableListContent.tsx`
   - L33: 기존 schemas import에 `CableStatusValues` 추가
   - L261: `cable.status === 'active'` → `cable.status === CableStatusValues.ACTIVE`

4. `apps/frontend/app/(dashboard)/cables/[id]/CableDetailContent.tsx`
   - L43: 기존 schemas import에 `CableStatusValues` 추가
   - L213: `cable.status === 'active'` → `cable.status === CableStatusValues.ACTIVE`

5. `apps/frontend/components/equipment/EquipmentCardGrid.tsx`
   - `@equipment-management/schemas`에서 `EquipmentStatusValues` import 추가
   - L205: `equipment.status === 'temporary'` → `equipment.status === EquipmentStatusValues.TEMPORARY`

6. `apps/frontend/components/shared/DocumentRevisionDialog.tsx`
   - `DocumentStatusValues` import 추가 (from `@equipment-management/schemas`)
   - L84, L92, L113, L116: `rev.status === 'active'` → `rev.status === DocumentStatusValues.ACTIVE`

## Phase 3: 합법적 예외 eslint-disable 주석

각 라인 바로 위에 추가: `// eslint-disable-next-line no-restricted-syntax -- Promise.allSettled result status`

- `apps/frontend/lib/utils/document-upload-utils.ts:59`
- `apps/frontend/components/non-conformances/NCDocumentsSection.tsx:78`
- `apps/frontend/components/non-conformances/CreateNonConformanceForm.tsx:145`
- `apps/frontend/app/(dashboard)/equipment/create/CreateEquipmentContent.tsx:115`

로컬 UI 상태 예외:
- `apps/frontend/components/inspections/result-sections/ResultSectionFormDialog.tsx:154`
  - `// eslint-disable-next-line no-restricted-syntax -- UploadedFile local UI state, not domain status`

## Phase 4: ESLint Rule

`apps/frontend/eslint.config.mjs` — `no-restricted-imports` 블록 바로 아래에 추가:

```js
// SSOT 회귀 방지 — obj.status 도메인 리터럴 비교 금지
// Promise.allSettled r.status === 'rejected'|'fulfilled' 또는 로컬 UI 타입은
// eslint-disable-next-line no-restricted-syntax -- <사유> 로 예외 처리
'no-restricted-syntax': [
  'error',
  {
    selector:
      "BinaryExpression[operator=/^(===|!==)$/][left.type='MemberExpression'][left.property.name='status'][right.type='Literal'][right.value=/^(active|approved|canceled|closed|completed|deleted|disposed|draft|inactive|maintenance|open|overdue|pending|quality_approved|rejected|rental|returned|submitted|superseded|temporary)$/]",
    message:
      "Do not compare .status against a raw domain literal. Import the matching *StatusValues constant from '@equipment-management/schemas' (e.g. EquipmentStatusValues.TEMPORARY, CableStatusValues.ACTIVE). For Promise.allSettled or local UI types, add: // eslint-disable-next-line no-restricted-syntax -- <reason>",
  },
],
```

## Verification Commands

```bash
# 1. TypeScript
pnpm tsc --noEmit

# 2. Lint (신규 룰 포함)
pnpm --filter frontend run lint

# 3. 잔존 도메인 리터럴 확인
grep -rn "\.status\s*===\s*'" apps/frontend --include="*.ts" --include="*.tsx" \
  | grep -v "\.next\|tests/e2e\|eslint-disable\|'all'\|'uploading'\|'valid'\|'warning'\|'error'\|'duplicate'\|'fulfilled'\|'number'"
```
