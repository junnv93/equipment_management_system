# Exec Plan: Section Autonomy Followup (S-1 + S-2 + S-5)

- Date: 2026-05-12
- Slug: section-autonomy-followup
- Mode: 2 (Full Harness)
- Parent sprint: large-component-refactor (2026-05-10)
- Planner: opus

## 설계 철학 — Section Autonomy Pattern

`large-component-refactor` (2026-05-10) sprint 후속. **leaf section autonomy** 4축:

1. **No orchestrator-only dynamic imports** — `next/dynamic` 호출은 leaf wrapper에 위치
2. **Props in, JSX out** — leaf section은 context에서 derived value 직접 호출 금지
3. **Single responsibility, ~200 lines** — section은 leaf, 의미 단위 분해
4. **Testable in isolation** — Provider stack 없이 props만으로 mount 가능

## Phase 0: Discovery

| File | Lines | Action |
|---|---|---|
| `apps/frontend/components/equipment/EquipmentForm.tsx` | 543 | dynamic 0건으로 (orchestrator) |
| `apps/frontend/components/inspections/sections/InspectionItemsSection.tsx` | 225 | sub-component 추출 |
| `apps/frontend/components/non-conformances/sections/NCInfoCards.tsx` | 260 | 3 카드 분리 |
| `apps/frontend/components/inspections/sections/InspectionBasicInfoSection.tsx` | 176 | S-5 context 분리 |
| `apps/frontend/components/inspections/sections/MeasurementEquipmentSection.tsx` | 107 | **stale claim** — no action |
| `VisualTableEditor.tsx` | — | graceful no-op SSOT (out of scope, F-3) |

## Phase 1: S-2 Dynamic import relocation

- 신규: `StatusLocationStep.tsx`, `CalibrationStep.tsx` — `HistoryAttachmentStep` 패턴 모방
- 수정: `EquipmentForm.tsx` — `next/dynamic` 0건 + wrapper 정적 import

## Phase 2: S-5 Context coupling removal

- 수정: `InspectionBasicInfoSection.tsx` — `useInspectionForm()` 제거, 2 boolean props 수신
- 수정: `InspectionFormDialog.tsx` — 부모가 `isMasterPrefilledField` 계산 + props 전달

## Phase 3: S-1 Sub-component extraction

- 신규: `InspectionItemCard.tsx` (~132) — items.map body
- 신규: `NCBasicInfoCard.tsx` (~47), `NCRepairCard.tsx` (~107), `NCCalibrationCard.tsx` (~84) — NCInfoCards 분리
- 수정: orchestrator (`NCInfoCards.tsx` 50, `InspectionItemsSection.tsx` 127) — InfoCards/Section export 시그니처 보존

## Phase 4: Pattern propagation audit

- `VisualTableEditor` 의도된 graceful no-op SSOT → scope 외, F-3 후속

## Phase 5: Verification & documentation

- tsc / build / grep gate / tracker 갱신
- 후속 tech-debt F-1 (leaf section RTL spec), F-2 (verify-section-autonomy skill), F-3 (VisualTableEditor ADR)

## Out of Scope

- VisualTableEditor 분리, MeasurementEquipmentSection split, SelfInspectionFormDialog, RTL spec, verify-* skill 신설

## Cleanup (Step 7)

- tech-debt-tracker S-1/S-2/S-5 closure + MeasurementEquipmentSection stale fact 정정
- contract / exec-plan → completed/, REGISTRY 정리
- MEMORY.md section autonomy 메모리 추가
- **다른 세션 브랜치 드리프트 학습** — 메모리 갱신 (untracked .claude 손실 패턴)
