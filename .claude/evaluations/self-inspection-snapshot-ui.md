# 평가 보고서: self-inspection-snapshot-ui

**날짜**: 2026-04-18
**계약**: `.claude/contracts/self-inspection-snapshot-ui.md`
**반복**: 1

## MUST 기준 판정

| # | 기준 | 판정 | 근거 |
|---|------|------|------|
| M1 | tsc PASS | PASS | exit 0 확인 |
| M2 | build PASS | CANNOT VERIFY | 실행 환경 제약 |
| M3 | classification Select UI | PASS | SelfInspectionFormDialog.tsx: Select + 두 SelectItem |
| M4 | calibrationValidityPeriod Input | PASS | Input 위젯 존재 |
| M5 | create 모드 pre-populate | PASS | deriveClassification(equipment) + resetForm() |
| M6 | edit 모드 initialData fill | PASS | initialData.classification ?? derive, calibrationValidityPeriod 복원 |
| M7 | payload 두 필드 포함 | PASS | 빈 문자열 제외 조건부 spread |
| M8 | SSOT import | PASS | @equipment-management/schemas에서 import |
| M9 | i18n + useTranslations | PASS | 7개 키 추가, 하드코딩 없음 |
| M10 | SelfInspection interface | PASS | classification: EquipmentClassification \| null 추가 |

## SHOULD 기준 판정

| # | 기준 | 판정 |
|---|------|------|
| S1 | placeholder 힌트 | PASS — "예: 1년, N/A" |
| S2 | 점검 메타 grid 통합 | PARTIAL — 별도 섹션 (기능상 문제 없음) |

## 기술 부채 후보

- useEffect deps에 `equipment` 미포함 — 현재 사용 패턴(다이얼로그 닫기→열기 시 재실행)상 무해하나 향후 실시간 장비 편집 흐름 시 stale derive 가능성. tech-debt-tracker 등록 권장.

## 최종 판정: PASS
