# AP-05 Mini Stepper Uniform Rows — Contract

> **Status:** READY
> **Mode:** 1 (Lightweight)
> **Slug:** ap05-mini-stepper-uniform
> **Date:** 2026-04-27

## Problem

`ApprovalRow.tsx:108` 조건부 `{meta.multiStep && ...}` — 단일 단계 항목(outgoing, incoming, equipment, calibration, inspection, nonconformity, software_validation)에 mini stepper가 없어 행 높이 불균일.

추가 아키텍처 문제: `totalSteps` 계산이 `meta.multiStepType === 'disposal' ? 2 : 3` 인라인 ternary로 하드코딩 — SSOT 위반.

## Scope (4 files)

| File | Change |
|---|---|
| `apps/frontend/lib/api/approvals-api.ts` | `TabMeta`: `multiStep` 제거, `totalApprovalSteps: number` 추가. 모든 TAB_META 항목에 값 추가 |
| `apps/frontend/components/approvals/ApprovalRow.tsx` | `{meta.multiStep && ...}` 제거 → 항상 렌더, `totalSteps={meta.totalApprovalSteps}` 사용 |
| `apps/frontend/components/approvals/ApprovalDetailModal.tsx` | `isMultiStep` = `meta.totalApprovalSteps > 1` (파생 제거) |
| `apps/frontend/components/approvals/ApprovalRowMiniStepper.tsx` | `totalSteps === 1`일 때 분수 레이블 숨김 |

## MUST Criteria

| # | Criterion | Verification |
|---|---|---|
| M1 | `TabMeta.multiStep` 필드 삭제됨 | `grep -n "multiStep" apps/frontend/lib/api/approvals-api.ts` → 0건 |
| M2 | `TabMeta.totalApprovalSteps: number` 필드 추가 | grep totalApprovalSteps → 15건(정의+각 카테고리) |
| M3 | 단일 단계 카테고리 `totalApprovalSteps: 1`, disposal `2`, calibration_plan `3` | TAB_META 직접 확인 |
| M4 | `ApprovalRow.tsx`에서 `meta.multiStep` 참조 0건 | grep multiStep ApprovalRow.tsx → 0 |
| M5 | 모든 ApprovalRow가 `ApprovalRowMiniStepper` 항상 렌더 | grep conditional 없음 확인 |
| M6 | `ApprovalDetailModal.tsx` `isMultiStep = meta.totalApprovalSteps > 1` | grep isMultiStep → totalApprovalSteps > 1 |
| M7 | `tsc --noEmit` PASS | 오류 0건 |
| M8 | `ApprovalRowMiniStepper` totalSteps=1 시 분수 레이블 숨김 | 코드 검증 |

## SHOULD Criteria

| # | Criterion |
|---|---|
| S1 | totalSteps=1 단일 dot가 `current` 상태(brand-info)로 표시 — 대기 중임을 시각적으로 표현 |
| S2 | `multiStepType` 필드는 유지 (ApprovalStepIndicator type prop으로 여전히 필요) |

## Step Counts

| Category | totalApprovalSteps | Note |
|---|---|---|
| outgoing | 1 | 단일 승인 |
| incoming | 1 | 단일 승인 |
| equipment | 1 | 단일 승인 |
| calibration | 1 | 단일 승인 |
| inspection | 1 | 단일 승인 |
| nonconformity | 1 | 단일 승인 |
| software_validation | 1 | 단일 승인 |
| disposal_review | 2 | disposal 1차 |
| disposal_final | 2 | disposal 2차 |
| plan_review | 3 | calibration_plan 1차 |
| plan_final | 3 | calibration_plan 2차 |
