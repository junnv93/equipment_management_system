# 데이터 마이그레이션 가이드

UL-QP-18 장비 관리 시스템의 초기 데이터 이관 절차 가이드입니다.
Excel(.xlsx) 파일로 장비·이력 데이터를 일괄 등록합니다.

---

## 지원 도메인

| 시트 타입     | 시트명 인식 패턴           | 필수 컬럼                  |
| ------------- | -------------------------- | -------------------------- |
| `equipment`   | `장비`, `Equipment` 포함   | 장비명, 사이트, 설치위치   |
| `calibration` | `교정`, `Calibration` 포함 | 관리번호, 교정일           |
| `repair`      | `수리`, `Repair` 포함      | 관리번호, 수리일, 수리내용 |
| `incident`    | `사고`, `Incident` 포함    | 관리번호, 발생일, 사고유형 |

Excel 템플릿 다운로드: `GET /data-migration/equipment/template`

---

## 워크플로우

```
xlsx 업로드 → Preview(dry-run) → 결과 확인 → Execute(commit)
               └─ sessionId 발급 ─┘           └─ 단일 트랜잭션 Batch INSERT
```

### 1. Preview

```http
POST /data-migration/equipment/preview
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: {xlsx 파일}
autoGenerateManagementNumber: true|false   # 관리번호 자동 생성 여부
defaultSite: suwon|uiwang|pyeongtaek       # 사이트 미지정 행 기본값
skipDuplicates: true|false                 # DB 중복 장비 스킵 여부
```

응답:

```json
{
  "sessionId": "uuid",
  "fileName": "test.xlsx",
  "totalRows": 100,
  "validRows": 95,
  "errorRows": 5,
  "sheets": [
    {
      "sheetType": "equipment",
      "sheetName": "장비",
      "totalRows": 100,
      "validRows": 95,
      "errorRows": 3,
      "duplicateRows": 2,
      "rows": [ ... ]
    }
  ]
}
```

`sessionId`는 **1시간 TTL** 캐시로 저장됩니다. TTL 내에 Execute를 호출해야 합니다.

### 2. Execute

```http
POST /data-migration/equipment/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": "uuid",
  "autoGenerateManagementNumber": true,
  "skipDuplicates": true
}
```

- `valid`·`warning` 상태 행만 INSERT됩니다.
- 모든 시트 INSERT는 **단일 트랜잭션**으로 실행됩니다 (중간 실패 시 전체 롤백).
- 성공 후 sessionId 캐시가 삭제됩니다.

### 3. 에러 리포트 다운로드

Preview 또는 Execute 후 에러/중복 행을 Excel로 다운로드합니다.

```http
GET /data-migration/equipment/{sessionId}/error-report
Authorization: Bearer {token}
```

---

## 템플릿 작성 규칙

### 사이트 값

`packages/schemas`의 `SiteEnum` 기준 (변경 시 템플릿 자동 반영):

- `suwon` (수원)
- `uiwang` (의왕)
- `pyeongtaek` (평택)

한글 별칭도 인식됩니다: `수원`, `의왕`, `평택`, `수원랩`, `의왕랩`, `평택랩`

### 날짜 형식

ExcelJS 자동 변환 우선. 텍스트 셀은 아래 형식을 지원합니다:

- `2024-03-15`, `2024.03.15`, `2024/03/15`, `20240315`

### 관리번호 자동 생성

`autoGenerateManagementNumber: true` → 사이트 코드 기반 자동 채번 (`SUW-E0001` 형식)

### 이력 시트 요건

- 교정·수리·사고 이력의 `관리번호` 컬럼은 **장비 시트의 관리번호**를 참조합니다.
- 장비 시트에 없는 관리번호는 기존 DB에서 조회합니다.
- DB에도 없으면 해당 이력 행은 `EQUIPMENT_NOT_FOUND` 에러로 처리됩니다.

---

## 중복 처리 정책

### 장비 중복

- DB에 동일 관리번호가 이미 존재하면 `skipDuplicates: true` 시 스킵 (status=`duplicate`).
- `skipDuplicates: false` 시 에러로 처리합니다.

### 이력 중복 (DB 중복 차단)

재업로드 시 동일 키의 이력 행은 자동 차단됩니다 (status=`duplicate`):

| 시트        | 중복 키 기준                              |
| ----------- | ----------------------------------------- |
| calibration | `(equipmentId, calibrationDate)`          |
| repair      | `(equipmentId, repairDate)`               |
| incident    | `(equipmentId, occurredAt, incidentType)` |

중복 행은 에러 리포트에 포함되며 INSERT되지 않습니다.
에러 코드: `HISTORY_DB_DUPLICATE` ([`MigrationErrorCode`](../../packages/shared-constants/src/error-codes.ts) 참조)

---

## 에러 코드 참조

모든 에러 코드는 `packages/shared-constants/src/error-codes.ts`의 `MigrationErrorCode` 상수에 정의됩니다.

| 코드                                 | 설명                                    |
| ------------------------------------ | --------------------------------------- |
| `MIGRATION_FILE_REQUIRED`            | 파일이 업로드되지 않음                  |
| `MIGRATION_EMPTY_FILE`               | 빈 파일                                 |
| `MIGRATION_NO_DATA_ROWS`             | 데이터 행 없음                          |
| `MIGRATION_NO_HEADERS`               | 헤더 행 없음                            |
| `MIGRATION_SESSION_NOT_FOUND`        | sessionId 만료 또는 미존재              |
| `MIGRATION_SESSION_OWNERSHIP_DENIED` | 타인의 sessionId 접근 시도              |
| `MIGRATION_SITE_ACCESS_DENIED`       | 비-시스템관리자의 타 사이트 데이터 접근 |
| `IN_FILE_DUPLICATE`                  | 파일 내 관리번호 중복                   |
| `DB_DUPLICATE`                       | DB에 이미 존재하는 장비 관리번호        |
| `EQUIPMENT_NOT_FOUND`                | 이력 행 참조 장비 미발견                |
| `HISTORY_DB_DUPLICATE`               | DB에 이미 존재하는 이력 레코드          |

---

## 권한 모델

- **필요 권한**: `MANAGE_SYSTEM_SETTINGS` (`SYSTEM_ADMIN` 역할)
- **세션 소유권**: Preview를 실행한 사용자만 Execute 가능 (타인의 sessionId → 403)
- **사이트 ACL**: 비-`SYSTEM_ADMIN` 사용자는 자신의 사이트 데이터만 마이그레이션 가능

---

## 프론트엔드 훅

`apps/frontend/hooks/use-data-migration.ts`에 정의된 React Query 훅을 사용합니다.

```ts
import {
  usePreviewMigration,
  useExecuteMigration,
  useDownloadErrorReport,
  useDownloadMigrationTemplate,
} from '@/hooks/use-data-migration';

// Preview
const previewMutation = usePreviewMigration();
previewMutation.mutate({ file, options }, { onSuccess: (result) => setPreviewResult(result) });

// Execute — 성공 시 equipment·dashboard 캐시 자동 무효화
const executeMutation = useExecuteMigration();
executeMutation.mutate({ sessionId, ...options }, { onSuccess: (result) => onComplete(result) });
```

---

## 운영 절차

### 초기 도입 시

1. 템플릿 다운로드 후 데이터 입력
2. Preview → 에러 0건 확인
3. Execute → equipment/calibration 목록 갱신 확인

### 증분 이관 시 (일부 장비 추가)

- `skipDuplicates: true` 설정 유지 (기존 장비 자동 스킵)
- 이력 시트의 `관리번호`는 DB에 이미 등록된 관리번호를 사용
- 이력 중복 검사가 자동으로 실행되어 재업로드 안전

### 세션 만료 시

Preview 후 1시간 이내에 Execute를 실행해야 합니다.
만료 시 파일을 재업로드하여 Preview부터 재시작합니다.
