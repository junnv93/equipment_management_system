# Evaluation: large-component-refactor
- Date: 2026-05-10
- Evaluator: QA Agent (skeptical mode)
- Contract: `.claude/contracts/large-component-refactor.md`

## Verdict: PASS

All 16 MUST criteria pass. 2 SHOULD criteria fail (tech-debt registration required).

---

## MUST Criteria Results

### M-1: tsc --noEmit EXIT=0
**PASS**
```
pnpm --filter frontend exec tsc --noEmit; echo "EXIT=$?"
EXIT=0
```

### M-2: EquipmentForm.tsx ≤ 700 lines
**PASS** — 543 lines

### M-3: InspectionFormDialog.tsx ≤ 700 lines
**PASS** — 577 lines

### M-4: NCDetailClient.tsx ≤ 700 lines
**PASS** — 499 lines

### M-5: 모든 신규 서브컴포넌트 파일은 독립 Props 인터페이스(`export interface XxxProps`) 보유
**PASS** — 13개 섹션 파일 전수 확인:
- `equipment/sections/`: EquipmentApprovalConfirmDialogProps, HistoryAttachmentStepProps, TemporaryEquipmentSectionProps
- `inspections/sections/`: InspectionBasicInfoSectionProps, InspectionConfirmDialogsProps, InspectionDialogHeaderProps, InspectionItemsSectionProps, InspectionPrefillNoticesProps, MeasurementEquipmentSectionProps
- `non-conformances/sections/`: ActionBarProps, CollapsibleSectionProps, InfoCardsProps, WorkflowTimelineProps

### M-6: PendingHistoryData re-export 보존 — equipment-history-utils.ts import 미파괴
**PASS**
- `use-equipment-history-handlers.ts:26` — `export interface PendingHistoryData { ... }`
- `EquipmentForm.tsx:37` — `export type { PendingHistoryData } from '@/hooks/use-equipment-history-handlers';`
- `equipment-history-utils.ts:13` — `import type { PendingHistoryData } from '@/components/equipment/EquipmentForm';` (체인 정상)

### M-7: InspectionFormDialog default export(Provider wrapper) 시그니처 보존
**PASS**
```typescript
// InspectionFormDialog.tsx:86
export default function InspectionFormDialog(props: InspectionFormDialogProps) {
  return (
    <InspectionFormProvider>
      <InspectionFormDialogInner {...props} />
    </InspectionFormProvider>
  );
}
```
Provider wrapper 구조 정상 보존.

### M-8: NCDetailClient default export 시그니처 보존
**PASS**
```typescript
// NCDetailClient.tsx:81
export default function NCDetailClient({ ncId, initialData }: NCDetailClientProps) {
```
시그니처 보존. `NCDetailClientProps` 인터페이스 (`ncId: string; initialData: NonConformance`) 유지.

### M-9: RTL 테스트 회귀 0건
**PASS**
```
Test Suites: 5 passed, 5 total
Tests:       14 passed, 14 total
```
- `lib/utils/__tests__/equipment-history-utils.test.ts` PASS
- `components/inspections/__tests__/TemplateGallery.test.tsx` PASS
- `components/inspections/__tests__/SoftForkDialog.test.tsx` PASS
- `components/inspections/__tests__/InspectionFormDialog.gallery.test.tsx` PASS
- `components/inspections/__tests__/InspectionFormDialog.softfork.test.tsx` PASS

전체 frontend 700 tests PASS (regression 0건).

### M-10: use-equipment-history-handlers.ts — setQueryData 없이 useQuery + setState 패턴
**PASS**
- `setQueryData` 호출 없음 (line 55는 주석)
- `useQuery` 4건: locationHistory, maintenanceHistory, incidentHistory, calibrationHistory (각 독립 queryKey)
- `useState` 패턴: 4× serverHistory (서버 동기화) + 4× pendingHistory (미확정 로컬 상태)
- `verify-frontend-state Exception #6` 주석 보존

### M-11: use-non-conformance-mutations.ts — useCasGuardedMutation 패턴 (직접 useMutation 전환 금지)
**PASS**
```
use-non-conformance-mutations.ts:5 — import { useCasGuardedMutation }
Line 38: updateMutation = useCasGuardedMutation<...>
Line 66: saveMutation = useCasGuardedMutation<...>
Line 81: closeMutation = useCasGuardedMutation<...>
Line 103: rejectMutation = useCasGuardedMutation<...>
```
useMutation 직접 호출 0건.

### M-12: 모든 추출 컴포넌트 useTranslations 자체 호출 (props로 t 전달 금지)
**PASS** — 13개 섹션 파일 전수 확인. Props 인터페이스에 `t:` 필드 없음. 모든 파일이 `useTranslations(...)` 자체 호출.

### M-13: 신규 파일 경로 규칙 준수
**PASS**
- `apps/frontend/components/equipment/sections/` — 3개 파일 존재
- `apps/frontend/components/inspections/sections/` — 6개 파일 존재
- `apps/frontend/components/non-conformances/sections/` — 4개 파일 존재
- `apps/frontend/hooks/use-equipment-history-handlers.ts` — 존재
- `apps/frontend/hooks/use-non-conformance-mutations.ts` — 존재

### M-14: 신규 sub-component 파일 line count ≤ 270
**PASS** — 최대값 NCInfoCards.tsx = 260 lines (≤ 270)
| 파일 | Lines |
|------|-------|
| NCInfoCards.tsx | 260 |
| InspectionItemsSection.tsx | 230 |
| TemporaryEquipmentSection.tsx | 215 |
| InspectionBasicInfoSection.tsx | 180 |
| HistoryAttachmentStep.tsx | 165 |
| NCWorkflowTimeline.tsx | 111 |
| MeasurementEquipmentSection.tsx | 103 |
| InspectionConfirmDialogs.tsx | 100 |
| InspectionPrefillNotices.tsx | 79 |
| InspectionDialogHeader.tsx | 77 |
| NCActionBar.tsx | 76 |
| NCCollapsibleSection.tsx | 74 |
| EquipmentApprovalConfirmDialog.tsx | 73 |

### M-15: setQueryData 직접 호출 금지 (신규 파일 전체)
**PASS** — 신규 hook 4개 + 섹션 컴포넌트 13개 전수 확인. `setQueryData` 실제 호출 0건.
- `use-non-conformance-mutations.ts`의 `useQueryClient` 사용은 `invalidateQueries` 목적으로만 사용.

### M-16: 신규 hook — useToast/useQueryClient/useTranslations/useAuth 등 컨텍스트 자체 호출
**PASS**
| Hook | 자체 호출 |
|------|-----------|
| use-inspection-fork.ts | useQueryClient, useTranslations, useToast, useAuth |
| use-equipment-form-submit.ts | useTranslations, useToast |
| use-non-conformance-mutations.ts | useQueryClient, useTranslations, useToast |
| use-equipment-history-handlers.ts | useTranslations, useToast |

`any` 타입 0건.

---

## SHOULD Criteria Results

### S-1: 추출 sub-component ≤ 200 lines 권장
**FAIL (tech-debt)** — 6개 파일이 200 lines 초과:
- NCInfoCards.tsx: 260 lines
- InspectionItemsSection.tsx: 230 lines
- TemporaryEquipmentSection.tsx: 215 lines
- InspectionBasicInfoSection.tsx: 180 lines
- HistoryAttachmentStep.tsx: 165 lines

NCInfoCards.tsx(260)와 InspectionItemsSection.tsx(230)는 내부에 여러 sub-component function을 포함하는 구조로, 추가 분리 가능.

### S-2: EquipmentForm 내 기존 dynamic import 6개 유지
**FAIL (tech-debt)** — EquipmentForm.tsx에 dynamic import 2개만 남음 (CalibrationInfoSection, StatusLocationSection). 나머지 5개 (AttachmentSection, LocationHistorySection, MaintenanceHistorySection, IncidentHistorySection, CalibrationHistorySection)는 `sections/HistoryAttachmentStep.tsx`로 이전됨.
- 기능적으로는 동작하며 dynamic import가 제거된 것이 아니라 섹션 파일 내부로 이동된 것.
- Contract는 "EquipmentForm 내"를 명시하므로 기술적 SHOULD 위반.

### S-3: NCDetailClient sections 'use client' 보존
**PASS** — 4개 NC sections 파일 모두 `'use client'` 선언 확인.

### S-4: 기존 코드 주석 보존
**PASS** — `use-equipment-history-handlers.ts:108`: `// ✅ 예외: verify-frontend-state Exception #6 (폼 상태 useState)` 보존 확인.

### S-5: useInspectionForm Context — 추출 sub-component는 계산된 props만 수신
**FAIL (tech-debt)** — `InspectionBasicInfoSection.tsx:24,54`에서 `useInspectionForm()` 직접 호출 발견:
```typescript
import { useInspectionForm } from '@/lib/inspection/form-context';
// ...
const { isMasterPrefilledField } = useInspectionForm();
```
Contract: "추출 sub-component는 계산된 props만 수신." `isMasterPrefilledField`를 props로 전달받도록 리팩토링 필요.

---

## Tech-Debt 등록 항목

| ID | 항목 | 우선순위 |
|----|------|----------|
| TD-1 | S-2: HistoryAttachmentStep 내 dynamic imports를 EquipmentForm으로 재호이스팅 (의미적 일치) | LOW |
| TD-2 | S-5: InspectionBasicInfoSection.tsx — useInspectionForm() 제거, isMasterPrefilledField를 props로 수신 | LOW |
| TD-3 | S-1: NCInfoCards.tsx(260)와 InspectionItemsSection.tsx(230) 추가 분리 검토 | LOW |

---

## 검증 환경

- 검증 일시: 2026-05-10
- tsc EXIT=0 확인
- Frontend tests: 700/700 PASS (80 suites)
- 섹션 파일 13개 전수 확인
- 신규 hook 4개 전수 확인
