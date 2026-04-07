# Contract: UL-QP-18-09 방법 2 프론트엔드 양식

## Slug: method2-validation-form
## Mode: 1
## Date: 2026-04-05

## MUST Criteria

| # | Criterion |
|---|-----------|
| M1 | `pnpm tsc --noEmit` error 0 |
| M2 | `pnpm --filter frontend run build` 성공 |
| M3 | SoftwareValidationContent.tsx에 validationType === 'self' 분기 존재 |
| M4 | 기본정보 4개 필드 입력 가능: referenceDocuments, operatingUnitDescription, softwareComponents, hardwareComponents |
| M5 | 검증항목 3개 동적 배열 폼: acquisitionFunctions, processingFunctions, controlFunctions |
| M6 | 각 배열 항목 추가/삭제 UI 동작 |
| M7 | performedBy 사용자 선택 필드 존재 |
| M8 | 생성 시 방법 2 필드가 CreateSoftwareValidationDto에 포함되어 백엔드 전송 |
| M9 | i18n: en/ko software.json에 방법 2 관련 키 추가 (최소 20키) |
| M10 | SSOT: 하드코딩된 API 경로/쿼리키 없음 |
| M11 | 기존 방법 1 (vendor) 폼에 영향 없음 (회귀 없음) |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | Dialog 너비가 방법 2 폼에 맞게 확장 (max-w-2xl 이상) |
| S2 | 제어 기능(controlFunctions)에 5개 필드 존재: controlEquipmentFunction, expectedFunction, verificationFunction, independentMethod, acceptanceCriteria |
| S3 | verify-implementation 변경 영역 PASS |
