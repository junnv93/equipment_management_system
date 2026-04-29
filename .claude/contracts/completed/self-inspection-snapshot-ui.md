# Contract: Self-Inspection Snapshot UI Fields

**Slug**: `self-inspection-snapshot-ui`
**Mode**: 1 (Lightweight)
**Date**: 2026-04-18
**Scope**: 자체점검 폼 다이얼로그에 classification / calibrationValidityPeriod 필드 노출

## Deliverable

`SelfInspectionFormDialog`에 두 스냅샷 필드를 추가하여 사용자가 직접 확인·수정 후 저장하면,
백엔드 DB에 snapshot 컬럼이 실제 값으로 기록되도록 한다 (현재: null 저장).

## Files in Scope

| File | Change |
|------|--------|
| `apps/frontend/lib/api/self-inspection-api.ts` | SelfInspection / DTO 타입에 classification, calibrationValidityPeriod 추가 |
| `apps/frontend/components/inspections/SelfInspectionFormDialog.tsx` | equipment prop 추가, 두 필드 UI + 상태 + payload |
| `apps/frontend/components/equipment/SelfInspectionTab.tsx` | equipment prop 전달 |
| `apps/frontend/messages/ko/equipment.json` | 새 i18n 키 추가 |

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm tsc --noEmit` PASS (frontend) | `pnpm --filter frontend run tsc --noEmit` exit 0 |
| M2 | `pnpm build` frontend PASS | `pnpm --filter frontend run build` exit 0 |
| M3 | classification 필드: 교정기기/비교정기기 선택 UI 존재 | Grep `classification` in SelfInspectionFormDialog.tsx |
| M4 | calibrationValidityPeriod 필드: 텍스트 입력 UI 존재 | Grep `calibrationValidityPeriod` in SelfInspectionFormDialog.tsx |
| M5 | create 모드: classification이 equipment.calibrationRequired에서 pre-populate | Grep pre-populate logic in useEffect |
| M6 | edit 모드: initialData.classification, initialData.calibrationValidityPeriod로 fill | Grep initialData populate in useEffect |
| M7 | payload에 두 필드 포함 (빈 문자열이면 제외) | Grep payload construction in handleSubmit |
| M8 | SSOT: EquipmentClassification 타입을 @equipment-management/schemas에서 import | Grep import in SelfInspectionFormDialog.tsx |
| M9 | i18n: 두 필드의 라벨이 equipment.json에 정의, useTranslations 사용 | Grep i18n key in messages/ko/equipment.json |
| M10 | SelfInspection 인터페이스에 classification, calibrationValidityPeriod nullable 필드 추가 | Grep in self-inspection-api.ts |

## SHOULD Criteria (루프 차단 안 함)

| # | Criterion |
|---|-----------|
| S1 | calibrationValidityPeriod placeholder에 예시값('1년', 'N/A') 힌트 표시 |
| S2 | classification 필드를 점검일 row와 같은 grid에 배치 (점검 메타 섹션 통합) |

## Out of Scope

- UpdateSelfInspectionDto의 classification / calibrationValidityPeriod는 선택적(optional)이므로
  edit 모드에서 변경 없어도 전달하면 됨 (서버가 수용)
- E2E 테스트 (별도 tech-debt 항목)
- 양식 내보내기 변경 없음 (이미 snapshot 읽음)
