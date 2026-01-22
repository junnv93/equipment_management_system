# API 표준 가이드라인

## 개요

이 문서는 장비 관리 시스템의 API 표준을 정의합니다. 모든 코드는 이 표준을 준수해야 하며, 변경 시 이 문서를 먼저 업데이트해야 합니다.

## 핵심 원칙

### 1. Single Source of Truth (단일 소스 원칙)

- **모든 열거형(enum)과 상수는 `packages/schemas/src/enums.ts`에서 정의**
- 다른 패키지나 모듈에서는 이 파일을 import하여 사용
- 직접 정의하거나 중복 정의 금지

### 2. 네이밍 규칙

- **상태값**: 소문자 + 언더스코어 (snake_case)
  - 예: `available`, `in_use`, `under_maintenance`
- **타입/인터페이스**: PascalCase
  - 예: `EquipmentStatus`, `EquipmentStatusEnum`
- **상수**: UPPER_SNAKE_CASE
  - 예: `MAX_PAGE_SIZE`

### 3. 식별자 표준

- **API 엔드포인트**: 모든 리소스 식별자는 `uuid` 사용
  - 경로: `/equipment/:uuid` (❌ `/equipment/:id` 아님)
  - 내부 `id`는 데이터베이스 내부에서만 사용
- **파라미터 검증**: `ParseUUIDPipe` 사용 필수

## 장비 상태값 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `EquipmentStatusEnum`

### 표준 상태값

| 값                      | 설명           | 사용 시나리오                |
| ----------------------- | -------------- | ---------------------------- |
| `available`             | 사용 가능      | 장비가 대여/반출 가능한 상태 |
| `in_use`                | 사용 중        | 현재 누군가 사용 중인 상태   |
| `checked_out`           | 반출 중        | 외부로 반출된 상태           |
| `calibration_scheduled` | 교정 예정      | 교정 일정이 잡힌 상태        |
| `calibration_overdue`   | 교정 기한 초과 | 교정 기한이 지난 상태        |
| `under_maintenance`     | 유지보수 중    | 수리/점검 중인 상태          |
| `non_conforming`        | 부적합         | 부적합으로 판정된 상태       |
| `retired`               | 사용 중지      | 더 이상 사용하지 않는 상태   |

### 사용 규칙

1. **API 요청/응답**: 항상 소문자 + 언더스코어 형식 사용
2. **데이터베이스**: PostgreSQL enum 타입으로 저장
3. **프론트엔드**: 표시 시 한글로 변환하여 사용

### 예시

```typescript
// ✅ 올바른 사용
import { EquipmentStatusEnum } from '@equipment-management/schemas';

const status: EquipmentStatus = 'in_use'; // 타입 안전
const isValid = EquipmentStatusEnum.safeParse('in_use'); // 검증

// ❌ 잘못된 사용
const status = 'IN_USE'; // 대문자 사용 금지
const status = 'loaned'; // 표준에 없는 값 사용 금지
```

## 교정 방법 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `CalibrationMethodEnum`

### 표준 값

| 값                     | 설명      |
| ---------------------- | --------- |
| `external_calibration` | 외부 교정 |
| `self_inspection`      | 자체 점검 |
| `not_applicable`       | 비대상    |

## 사용자 역할 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `UserRoleEnum`

### 표준 값

| 값                  | 설명            |
| ------------------- | --------------- |
| `test_operator`     | 시험실무자      |
| `technical_manager` | 기술책임자      |
| `site_admin`        | 시험소 관리자   |
| `system_admin`      | 시스템 관리자   |

### 역할 설명

- **test_operator (시험실무자)**: 장비 등록/수정 요청, 대여/반출 신청, 교정 등록 (승인 필요)
- **technical_manager (기술책임자)**: 요청 승인/반려, 교정 직접 등록 (Comment 필수), 팀 내 관리
- **site_admin (시험소 관리자)**: 시험소장 역할, 교정계획서 승인, 해당 시험소 전체 관리, 자체 승인 불가
- **system_admin (시스템 관리자)**: 전체 시스템 관리, 모든 시험소 접근, 자체 승인 가능

### 역할 계층

역할은 계층 구조를 가지며, 상위 역할은 하위 역할의 모든 권한을 포함합니다:

```
system_admin (4) > site_admin (3) > technical_manager (2) > test_operator (1)
```

### 자체 승인 규칙

- **system_admin만** 자체 승인 가능 (본인 요청 직접 승인)
- site_admin, technical_manager, test_operator는 자체 승인 불가

### 하위 호환성

기존 역할은 다음과 같이 매핑됩니다:

- `admin` → `system_admin`
- `manager` → `technical_manager`
- `user` → `test_operator`
- `approver` → `technical_manager`

## 팀 ID 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `TeamEnum`

### 표준 값

| 값     | 설명         |
| ------ | ------------ |
| `rf`   | RF팀         |
| `sar`  | SAR팀        |
| `emc`  | EMC팀        |
| `auto` | Automotive팀 |

## 대여 상태값 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `LoanStatusEnum`

### 표준 상태값

| 값         | 설명                       | 사용 시나리오                                  |
| ---------- | -------------------------- | ---------------------------------------------- |
| `pending`  | 대여 신청 (승인 대기)      | 사용자가 대여를 신청한 상태                    |
| `approved` | 승인됨 (아직 대여 시작 전) | 담당자/매니저가 승인했지만 아직 대여 시작 전   |
| `active`   | 대여 중 (실제 사용 중)     | 실제로 장비를 사용 중인 상태                   |
| `returned` | 반납 완료                  | 장비를 반납한 상태                             |
| `overdue`  | 반납 기한 초과             | 반납 예정일이 지났지만 아직 반납하지 않은 상태 |
| `rejected` | 거절됨                     | 담당자/매니저가 대여를 거절한 상태             |
| `canceled` | 취소됨                     | 신청자가 승인 전에 취소한 상태                 |

### 사용 규칙

1. **API 요청/응답**: 항상 소문자 형식 사용
2. **데이터베이스**: PostgreSQL varchar 타입으로 저장
3. **프론트엔드**: 표시 시 한글로 변환하여 사용

### 예시

```typescript
// ✅ 올바른 사용
import { LoanStatusEnum, LoanStatus } from '@equipment-management/schemas';

const status: LoanStatus = 'pending'; // 타입 안전
const isValid = LoanStatusEnum.safeParse('pending'); // 검증

// ❌ 잘못된 사용
const status = 'PENDING'; // 대문자 사용 금지
const status = 'borrowed'; // 표준에 없는 값 사용 금지 (active 사용)
```

## 반출 상태값 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `CheckoutStatusEnum`

### 표준 상태값

| 값                | 설명                  | 사용 시나리오                                  |
| ----------------- | --------------------- | ---------------------------------------------- |
| `pending`         | 반출 신청 (승인 대기) | 사용자가 반출을 신청한 상태                    |
| `approved`  | 1차 승인됨            | 외부 대여 목적 반출의 1차 승인 완료            |
| `approved`  | 최종 승인됨           | 반출 가능한 상태                               |
| `rejected`        | 거절됨                | 반출이 거절된 상태                             |
| `checked_out`     | 반출 중               | 실제로 반출된 상태                             |
| `returned`        | 반입 완료             | 장비를 반입한 상태 (검사 완료)                 |
| `return_approved` | 반입 최종 승인        | 반입 최종 승인됨 (기술책임자 승인)             |
| `overdue`         | 반입 기한 초과        | 반입 예정일이 지났지만 아직 반입하지 않은 상태 |
| `canceled`        | 취소됨                | 신청자가 승인 전에 취소한 상태                 |

### 사용 규칙

1. **API 요청/응답**: 항상 소문자 + 언더스코어 형식 사용
2. **데이터베이스**: PostgreSQL varchar 타입으로 저장
3. **프론트엔드**: 표시 시 한글로 변환하여 사용

## 시험소/위치 표준

### 시험소 열거형

`packages/schemas/src/enums.ts`의 `SiteEnum`

| 값       | 설명 |
| -------- | ---- |
| `suwon`  | 수원 |
| `uiwang` | 의왕 |

### 위치 열거형

`packages/schemas/src/enums.ts`의 `LocationEnum`

| 값       | 설명   |
| -------- | ------ |
| `수원랩` | 수원랩 |
| `의왕랩` | 의왕랩 |

## 반출 목적/유형 표준

### 반출 목적 열거형

`packages/schemas/src/enums.ts`의 `CheckoutPurposeEnum`

| 값                | 설명      |
| ----------------- | --------- |
| `calibration`     | 교정      |
| `repair`          | 수리      |
| `external_rental` | 외부 대여 |

### 반출 유형 열거형

`packages/schemas/src/enums.ts`의 `CheckoutTypeEnum`

반출 유형에 따라 승인 단계가 자동으로 결정됩니다:

| 값                     | 설명                | 승인 단계                                        |
| ---------------------- | ------------------- | ------------------------------------------------ |
| `internal_calibration` | 내부 교정 목적 반출 | 기술책임자 1단계 승인                            |
| `internal_repair`      | 내부 수리 목적 반출 | 기술책임자 1단계 승인                            |
| `external_rental`      | 외부 대여 목적 반출 | 2단계 승인 (빌려주는 측 시험실무자 → 기술책임자) |

## 교정 관련 표준

### 교정 승인 상태 열거형

`packages/schemas/src/enums.ts`의 `CalibrationApprovalStatusEnum`

| 값                 | 설명      | 사용 시나리오               |
| ------------------ | --------- | --------------------------- |
| `pending_approval` | 승인 대기 | 시험실무자가 교정 결과 등록 |
| `approved`         | 승인됨    | 기술책임자가 승인           |
| `rejected`         | 반려됨    | 기술책임자가 반려           |

### 교정 등록자 역할 열거형

`packages/schemas/src/enums.ts`의 `CalibrationRegisteredByRoleEnum`

| 값                  | 설명       |
| ------------------- | ---------- |
| `test_operator`     | 시험실무자 |
| `technical_manager` | 기술책임자 |

## 보정계수 표준

### 보정계수 타입 열거형

`packages/schemas/src/enums.ts`의 `CalibrationFactorTypeEnum`

| 값               | 설명        |
| ---------------- | ----------- |
| `antenna_gain`   | 안테나 이득 |
| `cable_loss`     | 케이블 손실 |
| `path_loss`      | 경로 손실   |
| `amplifier_gain` | 증폭기 이득 |
| `other`          | 기타        |

### 보정계수 승인 상태 열거형

`packages/schemas/src/enums.ts`의 `CalibrationFactorApprovalStatusEnum`

| 값         | 설명      | 사용 시나리오          |
| ---------- | --------- | ---------------------- |
| `pending`  | 승인 대기 | 시험실무자가 변경 요청 |
| `approved` | 승인됨    | 기술책임자가 승인      |
| `rejected` | 반려됨    | 기술책임자가 반려      |

## 부적합 관리 표준

### 부적합 상태 열거형

`packages/schemas/src/enums.ts`의 `NonConformanceStatusEnum`

| 값          | 설명                 | 사용 시나리오                  |
| ----------- | -------------------- | ------------------------------ |
| `open`      | 부적합 등록 (발견됨) | 부적합이 발견되어 등록된 상태  |
| `analyzing` | 원인 분석 중         | 부적합의 원인을 분석하는 중    |
| `corrected` | 조치 완료            | 조치가 완료되어 종료 승인 대기 |
| `closed`    | 종료됨               | 기술책임자가 종료 승인         |

## 공용장비 표준

### 공용장비 출처 열거형

`packages/schemas/src/enums.ts`의 `SharedSourceEnum`

| 값           | 설명                        |
| ------------ | --------------------------- |
| `safety_lab` | Safety Lab 등 사내 공용장비 |
| `external`   | 외부 기관 보유 장비         |

## 소프트웨어 관리 표준

### 소프트웨어 타입 열거형

`packages/schemas/src/enums.ts`의 `SoftwareTypeEnum`

| 값            | 설명            | 예시                |
| ------------- | --------------- | ------------------- |
| `measurement` | 측정 소프트웨어 | EMC32, DASY6 SAR 등 |
| `analysis`    | 분석 소프트웨어 |                     |
| `control`     | 제어 소프트웨어 |                     |
| `other`       | 기타            |                     |

### 소프트웨어 승인 상태 열거형

`packages/schemas/src/enums.ts`의 `SoftwareApprovalStatusEnum`

| 값         | 설명      | 사용 시나리오        |
| ---------- | --------- | -------------------- |
| `pending`  | 승인 대기 | 소프트웨어 변경 요청 |
| `approved` | 승인됨    | 기술책임자가 승인    |
| `rejected` | 반려됨    | 기술책임자가 반려    |

## 교정계획서 표준

### 교정계획서 상태 열거형

`packages/schemas/src/enums.ts`의 `CalibrationPlanStatusEnum`

| 값                 | 설명      | 사용 시나리오               |
| ------------------ | --------- | --------------------------- |
| `draft`            | 작성 중   | 기술책임자가 계획서 작성 중 |
| `pending_approval` | 승인 대기 | 시험소장에게 승인 요청됨    |
| `approved`         | 승인됨    | 시험소장이 승인 완료        |
| `rejected`         | 반려됨    | 시험소장이 반려 (사유 필수) |

## 감사 로그 표준

### 감사 로그 액션 열거형

`packages/schemas/src/enums.ts`의 `AuditActionEnum`

| 값         | 설명      | 사용 시나리오      |
| ---------- | --------- | ------------------ |
| `create`   | 생성      | 새 리소스 생성 시  |
| `update`   | 수정      | 리소스 수정 시     |
| `delete`   | 삭제      | 리소스 삭제 시     |
| `approve`  | 승인      | 승인 처리 시       |
| `reject`   | 반려      | 반려 처리 시       |
| `checkout` | 반출      | 장비 반출 시       |
| `return`   | 반입/반납 | 장비 반입/반납 시  |
| `cancel`   | 취소      | 요청 취소 시       |
| `login`    | 로그인    | 사용자 로그인 시   |
| `logout`   | 로그아웃  | 사용자 로그아웃 시 |

### 감사 로그 엔티티 타입 열거형

`packages/schemas/src/enums.ts`의 `AuditEntityTypeEnum`

| 값                   | 설명       |
| -------------------- | ---------- |
| `equipment`          | 장비       |
| `calibration`        | 교정       |
| `checkout`           | 반출       |
| `rental`             | 대여       |
| `user`               | 사용자     |
| `team`               | 팀         |
| `calibration_factor` | 보정계수   |
| `non_conformance`    | 부적합     |
| `software`           | 소프트웨어 |
| `calibration_plan`   | 교정계획서 |
| `repair_history`     | 수리이력   |

### 감사 로그 테이블 구조

감사 로그 테이블 (`audit_logs`)은 다음 필드를 포함합니다:

| 필드명       | 타입         | 설명                                   |
| ------------ | ------------ | -------------------------------------- |
| `id`         | UUID         | 고유 식별자                            |
| `timestamp`  | TIMESTAMP    | 로그 발생 시간                         |
| `userId`     | UUID         | 작업 수행 사용자 ID                    |
| `userName`   | VARCHAR(100) | 작업 수행 사용자 이름                  |
| `userRole`   | VARCHAR(50)  | 작업 수행 사용자 역할                  |
| `action`     | VARCHAR(50)  | 수행된 액션 (AuditActionEnum 참조)     |
| `entityType` | VARCHAR(50)  | 대상 엔티티 타입 (AuditEntityTypeEnum) |
| `entityId`   | UUID         | 대상 엔티티 ID                         |
| `entityName` | VARCHAR(200) | 대상 엔티티 이름 (예: 장비명)          |
| `details`    | JSONB        | 상세 정보 (변경 전/후 값, 요청 ID 등)  |
| `ipAddress`  | VARCHAR(50)  | 요청 IP 주소                           |

### 감사 로그 비즈니스 규칙

- **INSERT 전용**: 로그는 수정/삭제 불가
- **5년 보관**: 규정에 따른 보관 기간
- **비동기 기록**: 성능 영향 최소화를 위해 비동기로 기록
- **조회 권한**:
  - `site_admin`: 해당 시험소의 감사 로그만 조회 가능
  - `system_admin`: 모든 시험소의 감사 로그 조회 가능

### 교정계획서 테이블 구조

교정계획서는 다음 테이블 형식으로 구성됩니다:

| 순번 | 관리번호 | 장비명 |   현황   |          |          |   계획   |          |      | 비고 |
| :--: | :------: | :----: | :------: | :------: | :------: | :------: | :------: | :--: | :--: |
|      |          |        | 유효일자 | 교정주기 | 교정기관 | 교정일자 | 교정기관 | 확인 |      |

**필드 매핑:**

- **현황 (스냅샷)**
  - 유효일자 = 최종교정일 (lastCalibrationDate)
  - 교정주기 = calibrationCycle (개월)
  - 교정기관 = calibrationAgency
- **계획**
  - 교정일자 = 차기교정일 (nextCalibrationDate)
  - 교정기관 = 계획된 교정기관
  - 확인 = 기술책임자 확인란
- **비고** = 실제 교정일 (자동 기록)

### 비즈니스 규칙

- 연초에 작성
- **외부교정 대상 장비만 포함** (calibrationMethod = 'external_calibration')
- 장비 교정 완료 시 비고(실제 교정일) 자동 기록

## 장비 필드 표준

### 정의 위치

`packages/db/src/schema/equipment.ts`

### 장비 테이블 필드

#### 식별자

| DB 필드명 | 타입        | 한글명 | 설명                       |
| --------- | ----------- | ------ | -------------------------- |
| `id`      | serial      | ID     | DB 내부 ID (API 노출 금지) |
| `uuid`    | varchar(36) | UUID   | 외부 식별자 (API용)        |

#### 기본 정보

| DB 필드명          | 타입         | 한글명     | 필수 | 설명   |
| ------------------ | ------------ | ---------- | :--: | ------ |
| `name`             | varchar(100) | 장비명     |  ✓   |        |
| `managementNumber` | varchar(50)  | 관리번호   |  ✓   | unique |
| `assetNumber`      | varchar(50)  | 자산번호   |      |        |
| `modelName`        | varchar(100) | 모델명     |      |        |
| `manufacturer`     | varchar(100) | 제조사     |      |        |
| `serialNumber`     | varchar(100) | 시리얼번호 |      |        |
| `description`      | text         | 설명       |      |        |
| `location`         | varchar(100) | 위치       |      |        |
| `equipmentType`    | varchar(50)  | 장비타입   |      |        |

#### 교정 정보

| DB 필드명                   | 타입         | 한글명       | 설명                       |
| --------------------------- | ------------ | ------------ | -------------------------- |
| `calibrationCycle`          | integer      | 교정주기     | 개월 단위                  |
| `lastCalibrationDate`       | timestamp    | 최종교정일   |                            |
| `nextCalibrationDate`       | timestamp    | 차기교정일   |                            |
| `calibrationAgency`         | varchar(100) | 교정기관     |                            |
| `calibrationMethod`         | varchar(50)  | 교정방법     | CalibrationMethodEnum 참조 |
| `calibrationResult`         | text         | 교정결과     |                            |
| `correctionFactor`          | varchar(50)  | 보정계수     |                            |
| `needsIntermediateCheck`    | boolean      | 중간점검필요 |                            |
| `intermediateCheckSchedule` | timestamp    | 중간점검일정 |                            |

#### 관리 정보

| DB 필드명          | 타입         | 한글명     | 필수 | 설명                |
| ------------------ | ------------ | ---------- | :--: | ------------------- |
| `site`             | varchar(20)  | 시험소     |  ✓   | 'suwon' \| 'uiwang' |
| `teamId`           | uuid         | 팀ID       |      | FK → teams          |
| `managerId`        | varchar(36)  | 담당자ID   |      |                     |
| `technicalManager` | varchar(100) | 기술책임자 |      |                     |
| `purchaseDate`     | timestamp    | 구매일     |      |                     |
| `price`            | integer      | 가격       |      |                     |
| `supplier`         | varchar(100) | 공급업체   |      |                     |
| `contactInfo`      | varchar(100) | 연락처     |      |                     |
| `repairHistory`    | text         | 수리내역   |      |                     |

#### 소프트웨어 정보

| DB 필드명         | 타입         | 한글명         | 설명                  |
| ----------------- | ------------ | -------------- | --------------------- |
| `softwareName`    | varchar(200) | 소프트웨어명   | EMC32, DASY6 SAR 등   |
| `softwareType`    | varchar(50)  | 소프트웨어타입 | SoftwareTypeEnum 참조 |
| `softwareVersion` | varchar(50)  | 소프트웨어버전 |                       |
| `firmwareVersion` | varchar(50)  | 펌웨어버전     |                       |
| `manualLocation`  | text         | 매뉴얼위치     |                       |
| `accessories`     | text         | 부속품         |                       |
| `mainFeatures`    | text         | 주요기능       |                       |

#### 공용장비 정보

| DB 필드명      | 타입        | 한글명       | 설명                  |
| -------------- | ----------- | ------------ | --------------------- |
| `isShared`     | boolean     | 공용장비여부 | default: false        |
| `sharedSource` | varchar(50) | 공용장비출처 | SharedSourceEnum 참조 |

#### 상태 정보

| DB 필드명        | 타입        | 한글명     | 설명                                           |
| ---------------- | ----------- | ---------- | ---------------------------------------------- |
| `status`         | varchar(50) | 장비상태   | EquipmentStatusEnum 참조                       |
| `isActive`       | boolean     | 활성화여부 | default: true                                  |
| `approvalStatus` | varchar(50) | 승인상태   | 'pending_approval' \| 'approved' \| 'rejected' |
| `requestedBy`    | varchar(36) | 요청자ID   |                                                |
| `approvedBy`     | varchar(36) | 승인자ID   |                                                |

#### 시스템 필드

| DB 필드명   | 타입      | 한글명   | 설명 |
| ----------- | --------- | -------- | ---- |
| `createdAt` | timestamp | 생성일시 |      |
| `updatedAt` | timestamp | 수정일시 |      |

## 리소스별 API 엔드포인트

### 장비 (Equipment) API

| Method   | Endpoint                                   | 설명                | 권한                    |
| -------- | ------------------------------------------ | ------------------- | ----------------------- |
| `POST`   | `/equipment`                               | 장비 등록 요청      | CREATE_EQUIPMENT        |
| `POST`   | `/equipment/shared`                        | 공용장비 등록       | CREATE_EQUIPMENT        |
| `GET`    | `/equipment`                               | 장비 목록 조회      | VIEW_EQUIPMENT          |
| `GET`    | `/equipment/:uuid`                         | 장비 상세 조회      | VIEW_EQUIPMENT          |
| `PATCH`  | `/equipment/:uuid`                         | 장비 수정 요청      | UPDATE_EQUIPMENT        |
| `DELETE` | `/equipment/:uuid`                         | 장비 삭제 요청      | DELETE_EQUIPMENT        |
| `PATCH`  | `/equipment/:uuid/status`                  | 장비 상태 변경      | UPDATE_EQUIPMENT        |
| `GET`    | `/equipment/team/:teamId`                  | 팀별 장비 조회      | VIEW_EQUIPMENT          |
| `GET`    | `/equipment/calibration/due`               | 교정 예정 장비 조회 | VIEW_EQUIPMENT          |
| `GET`    | `/equipment/requests/pending`              | 승인 대기 요청 목록 | VIEW_EQUIPMENT_REQUESTS |
| `GET`    | `/equipment/requests/:requestUuid`         | 요청 상세 조회      | VIEW_EQUIPMENT_REQUESTS |
| `POST`   | `/equipment/requests/:requestUuid/approve` | 요청 승인           | APPROVE_EQUIPMENT       |
| `POST`   | `/equipment/requests/:requestUuid/reject`  | 요청 반려           | REJECT_EQUIPMENT        |
| `POST`   | `/equipment/attachments`                   | 파일 업로드         | CREATE_EQUIPMENT        |

### 대여 (Rentals) API

| Method  | Endpoint                 | 설명                    | 권한           |
| ------- | ------------------------ | ----------------------- | -------------- |
| `POST`  | `/rentals`               | 대여 신청               | CREATE_RENTAL  |
| `GET`   | `/rentals`               | 대여 목록 조회          | VIEW_RENTALS   |
| `GET`   | `/rentals/:uuid`         | 대여 상세 조회          | VIEW_RENTALS   |
| `PATCH` | `/rentals/:uuid/approve` | 대여 승인               | APPROVE_RENTAL |
| `PATCH` | `/rentals/:uuid/reject`  | 대여 반려 (reason 필수) | REJECT_RENTAL  |
| `PATCH` | `/rentals/:uuid/return`  | 대여 반납               | RETURN_RENTAL  |
| `PATCH` | `/rentals/:uuid/cancel`  | 대여 취소               | CANCEL_RENTAL  |

### 반출 (Checkouts) API

| Method  | Endpoint                          | 설명                 | 권한                   |
| ------- | --------------------------------- | -------------------- | ---------------------- |
| `POST`  | `/checkouts`                      | 반출 신청            | CREATE_CHECKOUT        |
| `GET`   | `/checkouts`                      | 반출 목록 조회       | VIEW_CHECKOUTS         |
| `GET`   | `/checkouts/:uuid`                | 반출 상세 조회       | VIEW_CHECKOUTS         |
| `PATCH` | `/checkouts/:uuid/first-approve`  | 1차 승인 (외부 대여) | FIRST_APPROVE_CHECKOUT |
| `PATCH` | `/checkouts/:uuid/final-approve`  | 최종 승인            | FINAL_APPROVE_CHECKOUT |
| `PATCH` | `/checkouts/:uuid/reject`         | 반출 반려            | REJECT_CHECKOUT        |
| `PATCH` | `/checkouts/:uuid/checkout`       | 반출 처리            | PROCESS_CHECKOUT       |
| `PATCH` | `/checkouts/:uuid/return`         | 반입 처리            | RETURN_CHECKOUT        |
| `PATCH` | `/checkouts/:uuid/return-approve` | 반입 최종 승인       | APPROVE_RETURN         |

### 교정 (Calibration) API

| Method  | Endpoint                     | 설명           | 권한                |
| ------- | ---------------------------- | -------------- | ------------------- |
| `POST`  | `/calibration`               | 교정 결과 등록 | CREATE_CALIBRATION  |
| `GET`   | `/calibration`               | 교정 이력 조회 | VIEW_CALIBRATION    |
| `GET`   | `/calibration/:uuid`         | 교정 상세 조회 | VIEW_CALIBRATION    |
| `PATCH` | `/calibration/:uuid/approve` | 교정 결과 승인 | APPROVE_CALIBRATION |
| `PATCH` | `/calibration/:uuid/reject`  | 교정 결과 반려 | REJECT_CALIBRATION  |

### 보정계수 (Calibration Factors) API

| Method  | Endpoint                             | 설명                    | 권한                       |
| ------- | ------------------------------------ | ----------------------- | -------------------------- |
| `POST`  | `/calibration-factors`               | 보정계수 등록/변경 요청 | CREATE_CALIBRATION_FACTOR  |
| `GET`   | `/calibration-factors`               | 보정계수 목록 조회      | VIEW_CALIBRATION_FACTORS   |
| `GET`   | `/calibration-factors/:uuid`         | 보정계수 상세 조회      | VIEW_CALIBRATION_FACTORS   |
| `PATCH` | `/calibration-factors/:uuid/approve` | 보정계수 승인           | APPROVE_CALIBRATION_FACTOR |
| `PATCH` | `/calibration-factors/:uuid/reject`  | 보정계수 반려           | REJECT_CALIBRATION_FACTOR  |

### 부적합 (Non-Conformances) API

| Method  | Endpoint                          | 설명             | 권한                   |
| ------- | --------------------------------- | ---------------- | ---------------------- |
| `POST`  | `/non-conformances`               | 부적합 등록      | CREATE_NON_CONFORMANCE |
| `GET`   | `/non-conformances`               | 부적합 목록 조회 | VIEW_NON_CONFORMANCES  |
| `GET`   | `/non-conformances/:uuid`         | 부적합 상세 조회 | VIEW_NON_CONFORMANCES  |
| `PATCH` | `/non-conformances/:uuid/analyze` | 원인 분석 등록   | UPDATE_NON_CONFORMANCE |
| `PATCH` | `/non-conformances/:uuid/correct` | 조치 완료        | UPDATE_NON_CONFORMANCE |
| `PATCH` | `/non-conformances/:uuid/close`   | 부적합 종료      | CLOSE_NON_CONFORMANCE  |

### 소프트웨어 (Software) API

| Method  | Endpoint                  | 설명                 | 권한             |
| ------- | ------------------------- | -------------------- | ---------------- |
| `POST`  | `/software`               | 소프트웨어 변경 요청 | CREATE_SOFTWARE  |
| `GET`   | `/software`               | 소프트웨어 목록 조회 | VIEW_SOFTWARE    |
| `GET`   | `/software/:uuid`         | 소프트웨어 상세 조회 | VIEW_SOFTWARE    |
| `GET`   | `/software/:uuid/history` | 소프트웨어 변경 이력 | VIEW_SOFTWARE    |
| `PATCH` | `/software/:uuid/approve` | 소프트웨어 변경 승인 | APPROVE_SOFTWARE |
| `PATCH` | `/software/:uuid/reject`  | 소프트웨어 변경 반려 | REJECT_SOFTWARE  |

### 사용자 (Users) API

| Method  | Endpoint            | 설명             | 권한             |
| ------- | ------------------- | ---------------- | ---------------- |
| `GET`   | `/users`            | 사용자 목록 조회 | VIEW_USERS       |
| `GET`   | `/users/:uuid`      | 사용자 상세 조회 | VIEW_USERS       |
| `PATCH` | `/users/:uuid`      | 사용자 정보 수정 | UPDATE_USER      |
| `PATCH` | `/users/:uuid/role` | 사용자 역할 변경 | UPDATE_USER_ROLE |

### 팀 (Teams) API

| Method | Endpoint       | 설명         | 권한       |
| ------ | -------------- | ------------ | ---------- |
| `GET`  | `/teams`       | 팀 목록 조회 | VIEW_TEAMS |
| `GET`  | `/teams/:uuid` | 팀 상세 조회 | VIEW_TEAMS |

### 교정계획서 (Calibration Plans) API

| Method   | Endpoint                                           | 설명                                         | 권한                          |
| -------- | -------------------------------------------------- | -------------------------------------------- | ----------------------------- |
| `POST`   | `/calibration-plans`                               | 계획서 생성 (외부교정 장비 자동 로드)        | CREATE_CALIBRATION_PLAN       |
| `GET`    | `/calibration-plans`                               | 계획서 목록 조회 (year, siteId, status 필터) | VIEW_CALIBRATION_PLANS        |
| `GET`    | `/calibration-plans/:uuid`                         | 계획서 상세 조회 (항목 포함)                 | VIEW_CALIBRATION_PLANS        |
| `PATCH`  | `/calibration-plans/:uuid`                         | 계획서 수정 (draft 상태만)                   | UPDATE_CALIBRATION_PLAN       |
| `DELETE` | `/calibration-plans/:uuid`                         | 계획서 삭제 (draft 상태만)                   | DELETE_CALIBRATION_PLAN       |
| `POST`   | `/calibration-plans/:uuid/submit`                  | 승인 요청 (draft → pending_approval)         | SUBMIT_CALIBRATION_PLAN       |
| `PATCH`  | `/calibration-plans/:uuid/approve`                 | 승인 (site_admin만)                          | APPROVE_CALIBRATION_PLAN      |
| `PATCH`  | `/calibration-plans/:uuid/reject`                  | 반려 (site_admin만, reason 필수)             | REJECT_CALIBRATION_PLAN       |
| `PATCH`  | `/calibration-plans/:uuid/items/:itemUuid/confirm` | 항목 확인 (기술책임자)                       | CONFIRM_CALIBRATION_PLAN_ITEM |
| `GET`    | `/calibration-plans/equipment/external`            | 외부교정 대상 장비 조회                      | VIEW_EQUIPMENT                |
| `GET`    | `/calibration-plans/:uuid/pdf`                     | PDF 다운로드                                 | VIEW_CALIBRATION_PLANS        |

### 감사 로그 (Audit Logs) API

| Method | Endpoint                                   | 설명                                                              | 권한            |
| ------ | ------------------------------------------ | ----------------------------------------------------------------- | --------------- |
| `GET`  | `/audit-logs`                              | 감사 로그 목록 조회 (필터: userId, entityType, action, dateRange) | VIEW_AUDIT_LOGS |
| `GET`  | `/audit-logs/entity/:entityType/:entityId` | 특정 엔티티의 감사 로그 조회                                      | VIEW_AUDIT_LOGS |
| `GET`  | `/audit-logs/user/:userId`                 | 특정 사용자의 감사 로그 조회                                      | VIEW_AUDIT_LOGS |

## API 엔드포인트 표준

### 리소스 식별자

- **모든 CRUD 엔드포인트는 `uuid` 사용**
- 경로 파라미터: `:uuid` (소문자)
- 검증: `ParseUUIDPipe` 필수

### 예시

```typescript
// ✅ 올바른 엔드포인트
@Get(':uuid')
findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
  return this.equipmentService.findOne(uuid);
}

// ❌ 잘못된 엔드포인트
@Get(':id')  // id 대신 uuid 사용
findOne(@Param('id') id: string) {  // ParseUUIDPipe 없음
  return this.equipmentService.findOne(id);
}
```

## API 응답 구조 표준

### 핵심 원칙

- **Single Source of Truth**: 모든 API 응답 타입은 `packages/schemas/src/api-response.ts`에서 정의
- **일관성**: 백엔드와 프론트엔드 간 응답 구조 일치 보장
- **중복 제거**: 공통 유틸리티 함수 사용으로 변환 로직 중복 방지

### 백엔드 응답 구조

#### 페이지네이션된 목록 응답

백엔드 서비스는 다음 구조로 응답을 반환합니다:

```typescript
interface PaginatedListResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
```

**예시**:

```json
{
  "items": [
    { "id": "uuid-1", "name": "장비 1" },
    { "id": "uuid-2", "name": "장비 2" }
  ],
  "meta": {
    "totalItems": 100,
    "itemCount": 2,
    "itemsPerPage": 20,
    "totalPages": 5,
    "currentPage": 1
  }
}
```

#### 단일 리소스 응답

백엔드 컨트롤러는 서비스에서 반환한 값을 그대로 반환합니다:

```typescript
type SingleResourceResponse<T> = T;
```

**예시**:

```json
{
  "id": "uuid-1",
  "name": "장비 1",
  "status": "available",
  "createdAt": "2025-01-16T00:00:00Z"
}
```

### 프론트엔드 응답 구조

프론트엔드는 백엔드 응답을 다음 구조로 변환하여 사용합니다:

#### 페이지네이션된 목록 응답

```typescript
interface FrontendPaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      pageSize: number;
      currentPage: number;
      totalPages: number;
    };
  };
}
```

**예시**:

```json
{
  "data": [
    { "id": "uuid-1", "name": "장비 1" },
    { "id": "uuid-2", "name": "장비 2" }
  ],
  "meta": {
    "pagination": {
      "total": 100,
      "pageSize": 20,
      "currentPage": 1,
      "totalPages": 5
    }
  }
}
```

### 응답 변환 유틸리티

**위치**: `apps/frontend/lib/api/utils/response-transformers.ts`

모든 API 클라이언트는 공통 유틸리티 함수를 사용하여 응답을 변환합니다:

```typescript
// 페이지네이션 응답 변환
import { transformPaginatedResponse } from './utils/response-transformers';

const response = await axios.get('/api/equipment');
const transformed = transformPaginatedResponse<Equipment>(response);
// transformed.data, transformed.meta.pagination 사용
```

```typescript
// 단일 리소스 응답 변환
import { transformSingleResponse } from './utils/response-transformers';

const response = await axios.get('/api/equipment/uuid-1');
const equipment = transformSingleResponse<Equipment>(response);
// equipment 직접 사용
```

### 공통 타입 사용

**위치**: `apps/frontend/lib/api/types.ts`

모든 API 클라이언트는 공통 타입을 사용합니다:

```typescript
// ✅ 올바른 사용
import type { PaginatedResponse } from './types';

async getRentals(): Promise<PaginatedResponse<Rental>> {
  // ...
}
```

```typescript
// ❌ 잘못된 사용 - 각 파일마다 개별 정의 금지
export interface PaginatedResponse<T> {
  // 중복 정의 금지
}
```

### 에러 응답 구조

백엔드는 다음 구조로 에러를 반환합니다:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
  };
}
```

프론트엔드는 공통 에러 변환 유틸리티를 사용합니다:

```typescript
import { transformErrorResponse } from './utils/response-transformers';

try {
  await apiClient.get('/api/equipment');
} catch (error) {
  const transformed = transformErrorResponse(error);
  // transformed.message, transformed.code 사용
}
```

### 사용 규칙

1. **백엔드**: 서비스에서 `PaginatedListResponse<T>` 구조로 반환
2. **프론트엔드**: 공통 유틸리티 함수로 `FrontendPaginatedResponse<T>`로 변환
3. **타입 정의**: `packages/schemas/src/api-response.ts`에서만 정의
4. **변환 로직**: `apps/frontend/lib/api/utils/response-transformers.ts`에서만 정의
5. **중복 금지**: 각 API 클라이언트에서 개별적으로 변환 로직 작성 금지

### 예시

```typescript
// ✅ 올바른 API 클라이언트 구현
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';

const rentalApi = {
  async getRentals(): Promise<PaginatedResponse<Rental>> {
    const response = await axios.get('/api/rentals');
    return transformPaginatedResponse<Rental>(response);
  },

  async getRental(id: string): Promise<Rental> {
    const response = await axios.get(`/api/rentals/${id}`);
    return transformSingleResponse<Rental>(response);
  },
};
```

```typescript
// ❌ 잘못된 구현 - 중복된 변환 로직
const rentalApi = {
  async getRentals() {
    const response = await axios.get('/api/rentals');
    // 중복된 변환 로직 - 금지
    return {
      data: response.data.items || [],
      meta: { pagination: {...} },
    };
  },
};
```

### 참고 파일

- **타입 정의**: `packages/schemas/src/api-response.ts`
- **변환 유틸리티**: `apps/frontend/lib/api/utils/response-transformers.ts`
- **공통 타입**: `apps/frontend/lib/api/types.ts`

## 데이터베이스 스키마 동기화

### 원칙

- Drizzle 스키마의 enum 값은 `packages/schemas/src/enums.ts`와 **반드시 일치**해야 함
- 스키마 변경 시 마이그레이션 필수

### 동기화 체크리스트

- [ ] Drizzle enum 값이 schemas 패키지와 일치하는가?
- [ ] 마이그레이션 파일이 생성되었는가?
- [ ] 테스트가 통과하는가?

## 테스트 표준

### 상태값 사용

- 테스트에서도 표준 상태값만 사용
- 하드코딩된 상태값 금지

```typescript
// ✅ 올바른 테스트
import { EquipmentStatusEnum } from '@equipment-management/schemas';

const equipment = {
  status: 'in_use' as EquipmentStatus, // 표준 값 사용
};

// ❌ 잘못된 테스트
const equipment = {
  status: 'loaned', // 표준에 없는 값
  status: 'IN_USE', // 대문자 사용
};
```

## 변경 관리

### 새로운 상태값 추가 시

1. `packages/schemas/src/enums.ts`에 추가
2. 데이터베이스 스키마 업데이트 (마이그레이션)
3. 이 문서 업데이트
4. 모든 테스트 업데이트
5. 프론트엔드 표시 로직 업데이트

### 기존 상태값 변경 시

1. **절대 기존 값 변경 금지** (하위 호환성)
2. 새 값 추가 후 점진적 마이그레이션
3. 사용 중단(deprecated) 표시 후 충분한 기간 후 제거

## 대여 반려 사유 필수 규칙

### 요구사항

- 모든 대여 반려 시 반드시 사유를 기재해야 함
- API에서 `rejectionReason` 필드가 비어있으면 400 Bad Request 반환

### 예시

```typescript
// ✅ 올바른 반려
PATCH /rentals/:uuid/reject
{
  "approverId": "uuid",
  "reason": "장비가 교정 예정으로 대여 불가"
}

// ❌ 잘못된 반려 (사유 없음)
PATCH /rentals/:uuid/reject
{
  "approverId": "uuid"
  // reason 필드 누락 → 400 Bad Request
}
```

## 프론트엔드 API 클라이언트 설정 표준

### 환경 변수 설정

프론트엔드 API 클라이언트 설정 시 다음 규칙을 준수해야 합니다.

**환경 변수 (.env.local)**:
```bash
# ✅ 올바른 설정 (호스트만, /api 미포함)
NEXT_PUBLIC_API_URL=http://localhost:3001

# ❌ 잘못된 설정 (/api 포함 금지)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### API 경로 규칙

모든 API 호출 경로는 반드시 `/api/`로 시작해야 합니다.

```typescript
// ✅ 올바른 예시
apiClient.get('/api/equipment');
apiClient.post('/api/calibration', data);
apiClient.patch('/api/rentals/:uuid/approve', data);

// ❌ 잘못된 예시
apiClient.get('/equipment');        // '/api' 접두사 누락 → 404 에러
apiClient.get('api/equipment');     // 슬래시 누락 → 404 에러
apiClient.get('/api/api/equipment'); // '/api' 중복 → 404 에러
```

### 오류 방지

API 클라이언트에는 개발 모드에서 경로 검증 로직이 포함되어 있습니다:

1. **경로가 `/api/`로 시작하지 않으면 경고**
2. **`/api/api` 중복이 감지되면 에러**

이 검증 기능은 개발 중 실수를 방지하고 빠른 디버깅을 돕습니다.

### 흔한 실수와 해결 방법

| 에러 메시지 | 원인 | 해결 방법 |
|------------|------|----------|
| `Cannot POST /api/api/equipment` | 환경변수에 `/api` 포함 | `.env.local`에서 `/api` 제거 |
| `Cannot GET /equipment` | API 경로에 `/api` 누락 | 경로 앞에 `/api/` 추가 |
| 404 Not Found | 경로 불일치 | 환경변수와 API 경로 모두 확인 |

### 파일 위치

- **API 클라이언트**: `apps/frontend/lib/api/api-client.ts`
- **환경 변수**: `apps/frontend/.env.local`
- **API 모듈들**: `apps/frontend/lib/api/*.ts`

---

## 참고 파일

- **표준 정의**:
  - `packages/schemas/src/enums.ts` - 열거형 및 상태값
  - `packages/schemas/src/api-response.ts` - API 응답 타입
- **데이터베이스 스키마**:
  - `packages/db/src/schema/equipment.ts`
  - `packages/db/src/schema/loans.ts`
  - `packages/db/src/schema/checkouts.ts`
  - `packages/db/src/schema/calibrations.ts`
  - `packages/db/src/schema/calibration-factors.ts`
  - `packages/db/src/schema/non-conformances.ts`
  - `packages/db/src/schema/software-history.ts`
  - `packages/db/src/schema/audit-logs.ts`
- **프론트엔드 유틸리티**:
  - `apps/frontend/lib/api/utils/response-transformers.ts` - 응답 변환 유틸리티
  - `apps/frontend/lib/api/types.ts` - 공통 타입 별칭
- **API 문서**: Swagger UI (`/api/docs`)

---

**마지막 업데이트**: 2026-01-21
**버전**: 1.7.0

### 변경 이력

- **v1.7.0** (2026-01-21): 프론트엔드 API 클라이언트 설정 표준 추가
  - 환경 변수 NEXT_PUBLIC_API_URL 설정 규칙 문서화 (호스트만, /api 미포함)
  - API 경로 규칙 문서화 (모든 경로는 '/api/'로 시작)
  - 개발 모드 경로 검증 기능 설명 추가
  - 흔한 실수와 해결 방법 표 추가
- **v1.6.0** (2026-01-20): 감사 로그 시스템 표준 추가
  - AuditActionEnum 추가 (create, update, delete, approve, reject, checkout, return, cancel, login, logout)
  - AuditEntityTypeEnum 추가 (equipment, calibration, checkout, rental, user, team, calibration_factor, non_conformance, software, calibration_plan, repair_history)
  - 감사 로그 테이블 구조 및 비즈니스 규칙 문서화
  - 감사 로그 API 엔드포인트 목록 추가 (3개)
  - 참고 파일 섹션에 audit-logs.ts 추가
- **v1.5.0** (2026-01-20): 교정계획서 표준 추가
  - CalibrationPlanStatusEnum 추가 (draft, pending_approval, approved, rejected)
  - 교정계획서 테이블 구조 및 필드 매핑 문서화
  - 교정계획서 비즈니스 규칙 정의 (외부교정 대상만, 실제 교정일 자동 기록)
  - 교정계획서 API 엔드포인트 목록 추가 (11개)
- **v1.4.0** (2026-01-20): 장비 필드 표준 및 API 엔드포인트 목록 추가
  - 장비 테이블 필드 표준 섹션 추가 (식별자, 기본정보, 교정정보, 관리정보, 소프트웨어정보, 공용장비정보, 상태정보, 시스템필드)
  - "최근교정일" → "최종교정일" 용어 변경
  - 리소스별 API 엔드포인트 목록 추가 (장비, 대여, 반출, 교정, 보정계수, 부적합, 소프트웨어, 사용자, 팀)
- **v1.3.0** (2026-01-20): 누락된 열거형 표준 추가
  - 장비 상태에 `non_conforming` (부적합) 상태 추가
  - 반출 상태에 `return_approved` (반입 최종 승인) 상태 추가
  - 시험소/위치 표준 추가 (SiteEnum, LocationEnum)
  - 반출 목적/유형 표준 추가 (CheckoutPurposeEnum, CheckoutTypeEnum)
  - 교정 관련 표준 추가 (CalibrationApprovalStatusEnum, CalibrationRegisteredByRoleEnum)
  - 보정계수 표준 추가 (CalibrationFactorTypeEnum, CalibrationFactorApprovalStatusEnum)
  - 부적합 관리 표준 추가 (NonConformanceStatusEnum)
  - 공용장비 표준 추가 (SharedSourceEnum)
  - 소프트웨어 관리 표준 추가 (SoftwareTypeEnum, SoftwareApprovalStatusEnum)
  - 참고 파일 섹션에 새 스키마 파일 추가
- **v1.2.0** (2026-01-16): API 응답 구조 표준 추가
  - 백엔드/프론트엔드 응답 구조 정의
  - 공통 응답 변환 유틸리티 표준화
  - 타입 안전성 및 중복 제거 원칙 추가
- **v1.1.0** (2025-01-28): 초기 버전
