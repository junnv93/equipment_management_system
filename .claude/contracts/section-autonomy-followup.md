---
slug: section-autonomy-followup
mode: 2
created: 2026-05-12
parent_sprint: large-component-refactor (2026-05-10)
---

# Contract — Section Autonomy Followup (S-1 + S-2 + S-5)

## Scope (12 production files + 3 .claude)

| File | Action |
|------|--------|
| `apps/frontend/components/equipment/EquipmentForm.tsx` | S-2: `next/dynamic` 0건; wrapper 정적 import |
| `apps/frontend/components/equipment/sections/StatusLocationStep.tsx` | **신규** dynamic 호스트 |
| `apps/frontend/components/equipment/sections/CalibrationStep.tsx` | **신규** dynamic 호스트 |
| `apps/frontend/components/inspections/InspectionFormDialog.tsx` | S-5: 부모가 boolean 계산 + 전달 |
| `apps/frontend/components/inspections/sections/InspectionBasicInfoSection.tsx` | S-5: context 분리, props 수신 |
| `apps/frontend/components/inspections/sections/InspectionItemsSection.tsx` | S-1: 225 → ≤200, sub 추출 |
| `apps/frontend/components/inspections/sections/InspectionItemCard.tsx` | **신규** 단일 item card |
| `apps/frontend/components/non-conformances/sections/NCInfoCards.tsx` | S-1: 260 → ≤200, orchestrator만 |
| `apps/frontend/components/non-conformances/sections/NCBasicInfoCard.tsx` | **신규** 기본 정보 카드 |
| `apps/frontend/components/non-conformances/sections/NCRepairCard.tsx` | **신규** 수리 카드 + RepairDetail private |
| `apps/frontend/components/non-conformances/sections/NCCalibrationCard.tsx` | **신규** 교정 카드 |

## MUST Criteria (block loop)

### Build / Type / Test

- **M-1** 본 sprint 변경 파일 격리 tsc EXIT=0 (격리 정책: 다른 세션 미완성 작업 4건 — `RejectionPresetsAdminClient.tsx` x4 / `use-rejection-preset-mutations.ts` / `NCDetailClient.tsx` (use-non-conformance-mutations) — 본 sprint 무관, 평가 보고서에 명시)
- **M-2** `pnpm --filter frontend run build` — 본 sprint 파일에 의한 에러 0건 (M-1과 동일 격리 정책)

### S-2 — Dynamic import relocation

- **M-3** `grep -c "next/dynamic" apps/frontend/components/equipment/EquipmentForm.tsx` == 0
- **M-4** `grep -c "next/dynamic" .../StatusLocationStep.tsx` ≥ 1
- **M-5** `grep -c "next/dynamic" .../CalibrationStep.tsx` ≥ 1
- **M-6** EquipmentForm 의 `dynamic(.*CalibrationInfoSection|StatusLocationSection)` 매치 == 0
- **M-7** EquipmentForm 가 wrapper 정적 import (StatusLocationStep + CalibrationStep ≥ 1)

### S-5 — Context coupling removal

- **M-8** `useInspectionForm` 잔류 == 0 in InspectionBasicInfoSection.tsx
- **M-9** `isMasterPrefilledField` 잔류 == 0 in InspectionBasicInfoSection.tsx (JSDoc 포함)
- **M-10** form-context import 잔류 == 0
- **M-11** 2 boolean prop 선언 + usage (각 ≥ 2)
- **M-12** InspectionFormDialog 가 2 prop 전달 (각 ≥ 1)

### S-1 — Sub-component extraction

- **M-13** InspectionItemsSection.tsx ≤ 200
- **M-14** NCInfoCards.tsx ≤ 200
- **M-15** 6 신규 sub-component 모두 ≤ 200
- **M-16** 6 신규 모두 props interface 선언 + `any` 0건
- **M-17** `InfoCards` named export 시그니처 보존 (NCDetailClient 호출자 회귀 차단)

### Regression guards

- **M-18** 제거된 in-file 컴포넌트 (RepairCard/CalibrationCard/RepairDetail/InfoRow) 외부 import 0건 (production source — `.next/` 빌드 산출물 제외)
- **M-19** `next/dynamic` 가 신규 wrapper + 기존 HistoryAttachmentStep 외부에 추가 안 됨
- **M-20** verify-implementation 워크플로 PASS
- **M-21** review-architecture Mode 2 PASS

## SHOULD Criteria (non-blocking)

- **S-Sa** 기존 spec PASS 유지
- **S-Sb** 신규 sub-component `'use client'` directive 필요 시에만
- **S-Sc** Bundle size delta < +5%
- **S-Sd** 추가 context-coupled leaf section 발견 0건 (Phase 0 audit 결과)
- **S-Se** tech-debt-tracker S-1/S-2/S-5 `[x] ~~strike~~` + MeasurementEquipmentSection stale fact 정정
- **S-Sf** F-1/F-2/F-3 후속 tech-debt 등록
- **S-Sg** 다른 세션 브랜치 드리프트 학습 메모리 추가 (untracked .claude 손실 패턴)

## Out of Scope

- VisualTableEditor 분리, MeasurementEquipmentSection split, SelfInspectionFormDialog
- 신규 leaf section RTL spec, verify-section-autonomy skill 신설
- Bundle 전략, design-token 변경
