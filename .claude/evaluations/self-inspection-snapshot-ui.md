# Evaluation: self-inspection-snapshot-ui
Date: 2026-04-18
Iteration: 1

## MUST Criteria
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | tsc PASS (frontend) | PASS | `pnpm --filter frontend exec tsc --noEmit` → exit 0 |
| M2 | build PASS (frontend) | PASS | `pnpm --filter frontend run build` → exit 0, "Compiled successfully in 13.2s" |
| M3 | classification 필드: 교정기기/비교정기기 선택 UI 존재 | PASS | SelfInspectionFormDialog.tsx L305-319: `<Select>` + `<SelectItem value="calibrated">교정기기` / `<SelectItem value="non_calibrated">비교정기기` |
| M4 | calibrationValidityPeriod 필드: 텍스트 입력 UI 존재 | PASS | SelfInspectionFormDialog.tsx L324-330: `<Input value={calibrationValidityPeriod} onChange={...}>` |
| M5 | create 모드: classification이 equipment.calibrationRequired에서 pre-populate | PASS | L94-97: `deriveClassification()` 함수가 `calibrationRequired === 'required'` → `'calibrated'` 매핑. L107: resetForm() 내 `setClassification(deriveClassification(equipment))` 호출. create 경로(else at L137)에서 resetForm() 실행 |
| M6 | edit 모드: initialData.classification, initialData.calibrationValidityPeriod로 fill | PASS | L135: `setClassification(initialData.classification ?? deriveClassification(equipment))`, L136: `setCalibrationValidityPeriod(initialData.calibrationValidityPeriod ?? '')` |
| M7 | payload에 두 필드 포함 (빈 문자열이면 제외) | PASS | L234: `...(classification ? { classification: ... } : {})`, L235: `...(calibrationValidityPeriod ? { calibrationValidityPeriod } : {})` — falsy이면 spread 생략 |
| M8 | SSOT: EquipmentClassification 타입을 @equipment-management/schemas에서 import | PASS | L40-44: `import type { EquipmentClassification, ... } from '@equipment-management/schemas'` — 로컬 재정의 없음 |
| M9 | i18n: 두 필드의 라벨이 equipment.json에 정의, useTranslations 사용 | PASS | equipment.json L397-400: `snapshotClassificationLabel`, `snapshotClassificationCalibrated`, `snapshotClassificationNonCalibrated`, `snapshotCalibrationValidityPeriodLabel` 정의. Dialog L74: `useTranslations('equipment')`, L304/L323에서 `t(...)` 사용. 하드코딩 없음 |
| M10 | SelfInspection 인터페이스에 classification, calibrationValidityPeriod nullable 필드 추가 | PASS | self-inspection-api.ts L31-33: `classification: EquipmentClassification \| null;` 및 `calibrationValidityPeriod: string \| null;` |

## SHOULD Criteria
| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | calibrationValidityPeriod placeholder에 예시값('1년', 'N/A') 힌트 표시 | PASS | equipment.json L335: `"calibrationValidityPeriodPlaceholder": "예: 1년, N/A"`. Dialog L327: `placeholder={t('selfInspection.form.calibrationValidityPeriodPlaceholder')}` 사용 |
| S2 | classification 필드를 점검일 row와 같은 grid에 배치 (점검 메타 섹션 통합) | FAIL | L260-295: 점검일/종합결과/점검주기는 `grid grid-cols-3`. L298-332: classification+calibrationValidityPeriod는 별도 `<div class="space-y-2">` + `grid grid-cols-2` 섹션으로 분리됨. 동일 grid 미배치 |

## Overall Verdict
**PASS**

## Issues
없음. MUST 기준 M1-M10 전부 충족.

## Post-merge Suggestions (SHOULD failures only)
- **S2**: classification 및 calibrationValidityPeriod를 점검일 row와 동일한 grid(`grid-cols-3` 확장 또는 새 row 추가)에 배치하면 계약서의 "점검 메타 섹션 통합" 의도에 부합함. 현재 별도 섹션("양식 헤더 정보 UL-QP-18-05")은 시각적으로 명확하나 레이아웃 통합 기준과 다름. 기능 결함은 아님.
- **관찰 (기술 부채)**: `useEffect` deps 배열에 `equipment`가 없음 (L140: `[open, initialData]`만). 현재는 다이얼로그가 열릴 때 트리거되므로 실질적 버그 없음. 단, 동일 세션 내 장비 데이터가 변경되는 흐름이 추가될 경우 stale derive 가능성 있음. tech-debt 등록 권장.
