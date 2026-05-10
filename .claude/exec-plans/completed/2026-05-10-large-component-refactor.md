# Exec Plan: Large Component Refactor
- Date: 2026-05-10
- Slug: large-component-refactor
- Mode: 2 (Full Harness)
- Planner: opus
- Estimated changes: ~15 files (3 수정 + 12 신규)

## 설계 철학

3개 거대 컴포넌트(EquipmentForm 1418, InspectionFormDialog 1362, NCDetailClient 1104)를 ≤700 line으로 축소.
기존 패턴(equipment/ *Section.tsx, dynamic import) 준수. 독립 props 인터페이스. 훅 추출은 최소화(반복 패턴만).
수술적 변경 — 요청된 것만, 인접 코드 개선 금지.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| EquipmentForm 임시등록 분리 | TemporaryEquipmentSection (신규) | 170-line 단일 conditional block; mode='temporary' 전용 |
| EquipmentForm confirm dialog | EquipmentApprovalConfirmDialog (신규) | 38-line 독립 Dialog |
| EquipmentForm 이력 핸들러 | use-equipment-history-handlers hook | 4 entity × (add/delete/useQuery/useEffect) 반복 패턴 |
| EquipmentForm submit 파이프라인 | 인라인 유지 | 단일 호출점, 추출 시 12+ 인자 prop drilling |
| InspectionFormDialog 항목 섹션 | InspectionItemsSection (신규) | 163-line 독립 단위 |
| InspectionFormDialog 측정장비 | MeasurementEquipmentSection (신규) | 72-line 독립 표 |
| InspectionFormDialog 헤더 | InspectionDialogHeader (신규) | 44-line 독립 헤더 |
| InspectionFormDialog 프리필 | InspectionPrefillNotices (신규) | 50-line 독립 배너 |
| InspectionFormDialog 확인 다이얼로그 | InspectionConfirmDialogs (신규) | 60-line 2개 AlertDialog |
| NCDetailClient 서브컴포넌트 | 기존 in-file 9개 → 4개 파일 이동 | 이미 분리됨, 파일 분할만 |
| NCDetailClient mutations | use-non-conformance-mutations hook | 4 useCasGuardedMutation 반복 패턴 |

## 작업 순서 (위험도 낮은 것부터)

1. Phase 3 (NCDetailClient) — in-file 컴포넌트 파일 분할만
2. Phase 1 (EquipmentForm) — hook 추출 + section 2개
3. Phase 2 (InspectionFormDialog) — section 5개 (가장 복잡)

---

## Phase 3: NCDetailClient 분리 (목표 ≤700)

### 변경 파일

1. `apps/frontend/components/non-conformances/NCDetailClient.tsx` — 수정 (1104 → ~480)
2. `apps/frontend/components/non-conformances/sections/NCWorkflowTimeline.tsx` — 신규 (~95)
3. `apps/frontend/components/non-conformances/sections/NCInfoCards.tsx` — 신규 (~200)
4. `apps/frontend/components/non-conformances/sections/NCCollapsibleSection.tsx` — 신규 (~60)
5. `apps/frontend/components/non-conformances/sections/NCActionBar.tsx` — 신규 (~70)
6. `apps/frontend/hooks/use-non-conformance-mutations.ts` — 신규 (~115)

### 각 파일이 달성해야 할 것

**NCWorkflowTimeline.tsx**: `WorkflowTimeline` + `StepDate` in-file sub-components 이동. export `WorkflowTimeline` (named).

**NCInfoCards.tsx**: `InfoCards` + `RepairCard` + `CalibrationCard` + `RepairDetail` + `InfoRow` 이동. export `InfoCards` (named, 나머지는 파일 내부).

**NCCollapsibleSection.tsx**: `CollapsibleSection` 이동. export `CollapsibleSection` (named).

**NCActionBar.tsx**: `ActionBar` 이동. export `ActionBar` (named).

**use-non-conformance-mutations.ts**:
- 4개 `useCasGuardedMutation` 패턴 통합
- Signature: `useNonConformanceMutations(ncId, opts?) → { updateMutation, saveMutation, closeMutation, rejectMutation }`
- opts: `{ onSaveSuccess?: () => void, onCloseSuccess?: () => void }`
- 내부: useToast, useTranslations 자체 호출
- `mapNonConformanceErrorToToast` 보존

**NCDetailClient.tsx 수정**:
- 4개 in-file mutations → `useNonConformanceMutations(ncId, { onSaveSuccess, onCloseSuccess })` 1회 호출
- 9개 in-file sub-components → 4개 파일에서 import
- 메인 JSX, dialogs, state 보존
- 결과: ~480 lines

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
wc -l apps/frontend/components/non-conformances/NCDetailClient.tsx
```

---

## Phase 1: EquipmentForm 분리 (목표 ≤700)

### 변경 파일

1. `apps/frontend/components/equipment/EquipmentForm.tsx` — 수정 (1418 → ~580)
2. `apps/frontend/components/equipment/sections/TemporaryEquipmentSection.tsx` — 신규 (~190)
3. `apps/frontend/components/equipment/sections/EquipmentApprovalConfirmDialog.tsx` — 신규 (~50)
4. `apps/frontend/hooks/use-equipment-history-handlers.ts` — 신규 (~240)

### 각 파일이 달성해야 할 것

**TemporaryEquipmentSection.tsx**:
- 임시등록 모드 Card 전체 이동 (equipmentType/owner/usagePeriod/calibrationCertificate 관련)
- Props: equipmentType, setEquipmentType, owner, setOwner, usagePeriodStart, setUsagePeriodStart, usagePeriodEnd, setUsagePeriodEnd, calibrationCertificateFile, setCalibrationCertificateFile, watchedNextCalibrationDate
- useTranslations('equipment'), useToast 자체 호출
- CalibrationValidityChecker import 자체

**EquipmentApprovalConfirmDialog.tsx**:
- confirm Dialog 분리
- Props: open, onOpenChange, isEdit, isLoading, onConfirm

**use-equipment-history-handlers.ts**:
- 4 entity (locationHistory, maintenanceHistory, incidentHistory, calibrationHistory) × (useQuery + useState server copy + useState pending + useEffect sync + add handler + delete handler) 통합
- 파라미터: `{ isEdit: boolean, equipmentUuid: string | undefined }`
- 반환: 모든 history state + handlers + isHistoryLoading
- verify-frontend-state Exception #6 주석 보존

**EquipmentForm.tsx 수정**:
- 이력 관련 useState/useQuery/useEffect/handlers → useEquipmentHistoryHandlers() 1회 호출
- 임시등록 conditional block → `<TemporaryEquipmentSection {...props} />`
- confirm Dialog → `<EquipmentApprovalConfirmDialog {...props} />`
- PendingHistoryData type: hook 파일에서 export + EquipmentForm에서 re-export 유지

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
wc -l apps/frontend/components/equipment/EquipmentForm.tsx
grep -n "export.*PendingHistoryData" apps/frontend/components/equipment/EquipmentForm.tsx apps/frontend/hooks/use-equipment-history-handlers.ts
```

---

## Phase 2: InspectionFormDialog 분리 (목표 ≤700)

### 변경 파일

1. `apps/frontend/components/inspections/InspectionFormDialog.tsx` — 수정 (1362 → ~620)
2. `apps/frontend/components/inspections/sections/InspectionDialogHeader.tsx` — 신규 (~80)
3. `apps/frontend/components/inspections/sections/InspectionPrefillNotices.tsx` — 신규 (~75)
4. `apps/frontend/components/inspections/sections/InspectionItemsSection.tsx` — 신규 (~200)
5. `apps/frontend/components/inspections/sections/MeasurementEquipmentSection.tsx` — 신규 (~90)
6. `apps/frontend/components/inspections/sections/InspectionConfirmDialogs.tsx` — 신규 (~75)

### 각 파일이 달성해야 할 것

**InspectionDialogHeader.tsx**:
- DialogHeader + template version badge 이동
- Props: equipmentName, currentTemplate, isInspectionTemplateEnabled, isTemplateMissing 등

**InspectionPrefillNotices.tsx**:
- 두 prefill 안내 banner 통합
- Props: previousInspectionApplied, prefillBannerSummary, prefillBannerDismissed, sourceInspectionDate, showNoSourceNotice, onDismiss

**InspectionItemsSection.tsx**:
- 항목 섹션 전체 이동 (헤더 + preset + toggle + items.map 카드)
- Props: items, onItemChange, onAddItem, onAddPresetItem, onRemoveItem, templatePrefill, usePreviousInspection, previousInspectionApplied, onTogglePrevious

**MeasurementEquipmentSection.tsx**:
- 측정장비 표 이동
- Props: measurementEquipment, onAdd, onRemove

**InspectionConfirmDialogs.tsx**:
- 두 AlertDialog (cancel-confirm, toggle-off-confirm) 통합
- Props: closeConfirm, toggleOffConfirm (각각 open/onOpenChange/onCancel/onConfirm + 메타데이터)

**InspectionFormDialog.tsx 수정**:
- 모든 추출 섹션 → `<XxxSection {...props} />`로 치환
- Provider wrapper export default, hooks/effects/mutations/handlers, top fields, remarks/result, footer, SoftForkDialog/TemplateGallery 보존
- 결과: ~620 lines

### 검증 명령
```bash
pnpm --filter frontend run tsc --noEmit
wc -l apps/frontend/components/inspections/InspectionFormDialog.tsx
```

---

## 통합 검증 (3 phase 완료 후)

```bash
# TypeScript
pnpm --filter frontend run tsc --noEmit

# Line counts
wc -l \
  apps/frontend/components/equipment/EquipmentForm.tsx \
  apps/frontend/components/inspections/InspectionFormDialog.tsx \
  apps/frontend/components/non-conformances/NCDetailClient.tsx

# Sub-component line caps
find apps/frontend/components/equipment/sections \
     apps/frontend/components/inspections/sections \
     apps/frontend/components/non-conformances/sections \
     -name "*.tsx" -exec wc -l {} \; | sort -rn

# Tests
pnpm --filter frontend test -- --testPathPattern="components/equipment|components/inspections|equipment-history-utils"

# PendingHistoryData export 확인
grep -rn "export.*PendingHistoryData" apps/frontend/components/equipment/ apps/frontend/hooks/

# setQueryData 금지
grep -rn "setQueryData" apps/frontend/hooks/use-equipment-history-handlers.ts apps/frontend/hooks/use-non-conformance-mutations.ts 2>/dev/null
```
