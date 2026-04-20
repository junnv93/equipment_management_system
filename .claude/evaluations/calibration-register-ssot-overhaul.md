# Evaluation Report: 교정 등록 SSOT 재정비 (Phase 0)

## 반복 #1 (2026-04-20T00:00:00+09:00)

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| tsc 에러 0 | PASS | `pnpm tsc --noEmit` EXIT:0 — 에러 없음 |
| lint 에러 0 | PASS | `pnpm --filter frontend run lint` EXIT:0 — 에러 없음 |
| 기존 컴포넌트 컴파일 오류 없음 (CalibrationRegisterDialog, CalibrationRegisterContent, CalibrationHistoryTab) | PASS | tsc EXIT:0 확인. Phase 0 변경은 순수 신규 파일 추가 — 기존 컴포넌트에 import 없음 (additive-only, non-breaking) |
| `createCalibrationFormSchema` factory 함수 export 존재 | PASS | `apps/frontend/lib/schemas/calibration-form-schema.ts` line 12에 `export const createCalibrationFormSchema = (t: ...) => z.object({...})` 존재 |
| `CalibrationErrorCode` **enum** 정의 + 에러 코드 7개 이상 | **FAIL** | 에러 코드 8개로 수 요건(7+)은 충족. 그러나 구현체가 TypeScript `enum` 키워드가 아닌 `as const` 객체(`export const CalibrationErrorCode = { ... } as const`)로 정의됨. 계약 원문 "enum 정의"와 불일치. 참고: 같은 디렉토리의 `equipment-errors.ts`는 `export enum EquipmentErrorCode`(TypeScript enum) 패턴 사용 — 일관성 깨짐 |
| `queryKeys.documents.byCalibration` 이 `documents` 섹션에 존재 | PASS | `query-config.ts` line 523-524에 `documents.byCalibration: (calibrationId: string) => ['documents', 'calibration', calibrationId] as const` 존재 |
| `CalibrationCacheInvalidation.invalidateAfterCreate`가 `queryKeys.calibrations.all`, `queryKeys.approvals.countsAll`, `queryKeys.notifications.all` 포함 | PASS | `cache-invalidation.ts` line 522-535: `calibrations.all`(line 525), `approvals.countsAll`(line 529), `notifications.all`(line 530) 모두 포함 |
| SSOT 준수: `z.instanceof(File)` 는 frontend 전용 파일에서만 사용 | PASS | `packages/` 디렉토리 전체 grep 결과 `z.instanceof(File)` 없음. `calibration-form-schema.ts` line 28에만 존재 |

## SHOULD 기준 대조 (루프 차단 없음)

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| `createCalibrationFormSchema`에 날짜 유효성 `.superRefine` 검증 포함 | PASS | line 33-51: `nextCalibrationDate > calibrationDate` + `intermediateCheckDate` 범위 검증 2개 `.superRefine` 구현 |
| `CalibrationErrorCode`에 i18n 메시지 매핑 헬퍼 함수 포함 | PASS | `getCalibrationErrorI18nKey(code: string): string` 함수 line 38-42에 구현. `CALIBRATION_ERROR_I18N_KEY` Record 매핑도 포함 |
| verify-ssot PASS | 미실행 (별도 스킬 호출 필요) — 수동 검사 결과: 신규 파일 2개 모두 `@equipment-management/schemas`에서 `CalibrationResultEnum`, `uuidString` import; `as const` 객체/에러코드는 프론트엔드 전용 — SSOT 위반 없음 |

## 전체 판정: **FAIL** (필수 기준 1개 미달)

MUST 기준 8개 중 1개 FAIL:
- `CalibrationErrorCode` — TypeScript `enum` 키워드 대신 `as const` 객체 패턴 사용

---

## 수정 지시

### 이슈 1: CalibrationErrorCode — `enum` 키워드 불일치

- **파일**: `apps/frontend/lib/errors/calibration-errors.ts` line 6
- **문제**: 계약은 "enum 정의"를 요구하며, 같은 디렉토리의 `equipment-errors.ts`는 `export enum EquipmentErrorCode` (TypeScript enum 키워드) 패턴을 사용한다. 현재 구현체는 `export const CalibrationErrorCode = { ... } as const` — TypeScript `enum`이 아닌 const 객체. 코드베이스 내 패턴 일관성이 깨지고 계약 문구와 불일치.

- **수정**: `as const` 객체를 TypeScript `enum`으로 변경:

  ```typescript
  // BEFORE
  export const CalibrationErrorCode = {
    FILE_REQUIRED: 'CALIBRATION_FILE_REQUIRED',
    ...
  } as const;
  export type CalibrationErrorCodeType =
    (typeof CalibrationErrorCode)[keyof typeof CalibrationErrorCode];

  // AFTER
  export enum CalibrationErrorCode {
    FILE_REQUIRED = 'CALIBRATION_FILE_REQUIRED',
    CERTIFICATE_REQUIRED = 'CALIBRATION_CERTIFICATE_REQUIRED',
    DOCUMENT_TYPE_COUNT_MISMATCH = 'DOCUMENT_TYPE_COUNT_MISMATCH',
    DOCUMENT_TYPE_INVALID = 'DOCUMENT_TYPE_INVALID',
    FILE_LIMIT_EXCEEDED = 'CALIBRATION_FILE_LIMIT_EXCEEDED',
    DUPLICATE_SAME_DAY = 'CALIBRATION_DUPLICATE_SAME_DAY',
    TX_FAILED = 'CALIBRATION_TX_FAILED',
    NOT_FOUND = 'CALIBRATION_NOT_FOUND',
  }
  // CalibrationErrorCodeType은 아래로 변경
  export type CalibrationErrorCodeType = CalibrationErrorCode;
  ```

  `CALIBRATION_ERROR_I18N_KEY` Record의 key 타입도 `CalibrationErrorCodeType`으로 유지되므로 별도 변경 불필요. `getCalibrationErrorI18nKey` 함수의 `code as CalibrationErrorCodeType` 캐스팅도 그대로 유효.

- **검증**: `pnpm --filter frontend tsc --noEmit` EXIT:0, `pnpm --filter frontend run lint` EXIT:0

---

## 부가 관찰 (계약 외, 정보 제공용)

1. **기존 컴포넌트 미통합 (예상된 상태)**: `CalibrationRegisterDialog`는 여전히 자체 로컬 `createCalibrationSchema` 함수를 정의(line 50-63)하고, `CalibrationRegisterContent`는 수동 state 관리 패턴 사용. Phase 0은 "신규 파일 추가"가 목적이므로 기대된 상태. Phase 1에서 기존 컴포넌트가 신규 스키마를 사용하도록 통합 필요.

2. **`certificateFile` 필드 — 기존 Dialog와 스키마 불일치**: 신규 `createCalibrationFormSchema`에는 `certificateFile: z.instanceof(File)` 필드가 **required**로 포함되어 있으나, 기존 `CalibrationRegisterDialog`는 `certificateFile`을 별도 `useState`로 관리하고 폼 스키마 밖에서 처리. 통합 시 `certificateFile`을 optional로 변경하거나 기존 Dialog를 완전히 재작성해야 함 — Phase 1에서 주의 필요.

---

## 반복 #2 (2026-04-20T09:00:00+09:00)

### 이전 반복 대비 변화

| 이슈 | Iteration #1 | Iteration #2 |
|------|-------------|-------------|
| `CalibrationErrorCode` 구현 방식 | FAIL — `export const ... = { } as const` (const 객체) | PASS — `export enum CalibrationErrorCode` (TypeScript enum 키워드) |

Iteration #1의 유일한 FAIL 이슈가 정확하게 수정됨. `as const` 객체 패턴이 완전히 제거되고 TypeScript `enum` 키워드로 교체됨.

### 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| tsc 에러 0 | **PASS** | `pnpm tsc --noEmit` EXIT:0 — 에러 없음 |
| lint 에러 0 | **PASS** | `pnpm --filter frontend run lint` EXIT:0 — 에러 없음 |
| 기존 컴포넌트 컴파일 오류 없음 (CalibrationRegisterDialog, CalibrationRegisterContent, CalibrationHistoryTab) | **PASS** | tsc EXIT:0 확인. Phase 0 변경은 기존 컴포넌트에 import 없음 (additive-only, non-breaking) |
| `createCalibrationFormSchema` factory 함수 export 존재 | **PASS** | `calibration-form-schema.ts` line 12: `export const createCalibrationFormSchema = (t: (key: string) => string) => z.object({...})` |
| `CalibrationErrorCode` **enum** 정의 + 에러 코드 7개 이상 | **PASS** | `calibration-errors.ts` line 7: `export enum CalibrationErrorCode` (TypeScript enum 키워드). 에러 코드 8개 (FILE_REQUIRED, CERTIFICATE_REQUIRED, DOCUMENT_TYPE_COUNT_MISMATCH, DOCUMENT_TYPE_INVALID, FILE_LIMIT_EXCEEDED, DUPLICATE_SAME_DAY, TX_FAILED, NOT_FOUND) — 7개 이상 요건 충족 |
| `queryKeys.documents.byCalibration` 이 `documents` 섹션에 존재 | **PASS** | `query-config.ts` line 523-524: `documents.byCalibration: (calibrationId: string) => ['documents', 'calibration', calibrationId] as const` |
| `CalibrationCacheInvalidation.invalidateAfterCreate`가 3개 키 포함 | **PASS** | `cache-invalidation.ts` line 524: `calibrations.all`, line 530: `approvals.countsAll`, line 531: `notifications.all` 모두 포함 |
| SSOT 준수: `z.instanceof(File)` 는 frontend 전용 파일에서만 사용 | **PASS** | `packages/` 디렉토리 grep 결과 `z.instanceof(File)` 없음. `calibration-form-schema.ts` line 28에만 존재 |

### SHOULD 기준 대조

| 기준 | 판정 | 비고 |
|------|------|------|
| `.superRefine` 날짜 검증 포함 | **PASS** | line 33-51: `nextCalibrationDate > calibrationDate` + `intermediateCheckDate` 범위 검증 2개 구현 |
| i18n 매핑 헬퍼 함수 포함 | **PASS** | `getCalibrationErrorI18nKey(code: string): string` line 36-38 구현. `CALIBRATION_ERROR_I18N_KEY` Record 포함 |

### 전체 판정: **PASS**

MUST 기준 8개 전체 PASS. SHOULD 기준 2개 전체 PASS. 종료 조건 달성.
