# 레포트 내보내기 매핑 가이드

이 문서는 장비관리시스템의 레포트 내보내기 기능이 DB 스키마와 어떻게 매핑되어 파일로 출력되는지 설명합니다.

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [범용 통계 레포트 (Excel/CSV/PDF)](#2-범용-통계-레포트)
3. [UL-QP 양식 레포트](#3-ul-qp-양식-레포트)
4. [공통 메커니즘](#4-공통-메커니즘)

---

## 1. 아키텍처 개요

### 데이터 흐름

```
클라이언트 요청
  ↓
ReportsController (권한 검증 + 스코프 강제)
  ↓
┌─── 범용 레포트 ──────────────────┐  ┌─── UL-QP 양식 레포트 ────────────┐
│ ReportsService                    │  │ FormTemplateExportService          │
│  → DB 조회 + ReportData 구성     │  │  → DB 조회 + 템플릿 매핑          │
│  ↓                                │  │  ↓                                │
│ ReportExportService               │  │ ExcelJS (XLSX) / DocxTemplate     │
│  → Excel / CSV / PDF 생성        │  │  → 양식 파일 생성                 │
└───────────────────────────────────┘  └────────────────────────────────────┘
  ↓
Response: Binary file (Content-Disposition: attachment)
```

### 핵심 서비스

| 서비스                      | 파일                              | 역할                                   |
| --------------------------- | --------------------------------- | -------------------------------------- |
| `ReportsService`            | `reports.service.ts`              | DB 쿼리 + 통계 집계 + ReportData 구성  |
| `ReportExportService`       | `report-export.service.ts`        | ReportData → Excel/CSV/PDF Buffer 변환 |
| `FormTemplateExportService` | `form-template-export.service.ts` | UL-QP 양식별 DB→템플릿 매핑            |
| `FormTemplateService`       | `form-template.service.ts`        | 템플릿 파일 관리 (버전, 캐싱)          |

### RBAC 스코프 적용

모든 레포트는 `SiteScopeInterceptor`를 통해 사용자의 데이터 접근 범위가 강제됩니다:

| 스코프 | 동작                                                  |
| ------ | ----------------------------------------------------- |
| `all`  | 필터 없음 (관리자)                                    |
| `site` | `equipment.site = 사용자.site`                        |
| `team` | `equipment.teamId = 사용자.teamId` (없으면 site 폴백) |
| `none` | 데이터 접근 거부                                      |

---

## 2. 범용 통계 레포트

범용 레포트는 DB 데이터를 `ReportData` 구조로 변환한 후, `ReportExportService`가 Excel/CSV/PDF 중 선택한 포맷으로 출력합니다.

### 2.1 장비 현황 보고서

| 항목        | 값                                            |
| ----------- | --------------------------------------------- |
| 엔드포인트  | `GET /api/reports/export/equipment-inventory` |
| 포맷        | Excel, CSV, PDF                               |
| 데이터 소스 | `equipment` LEFT JOIN `teams`                 |
| 행 제한     | 10,000건                                      |

**컬럼 → DB 필드 매핑:**

| 컬럼 헤더     | DB 필드                           | 변환                                  |
| ------------- | --------------------------------- | ------------------------------------- |
| 관리번호      | `equipment.management_number`     | 그대로                                |
| 장비명        | `equipment.name`                  | 그대로                                |
| 제조사        | `equipment.manufacturer`          | null → '-'                            |
| 모델명        | `equipment.model_name`            | null → '-'                            |
| S/N           | `equipment.serial_number`         | null → '-'                            |
| 상태          | `equipment.status`                | `EQUIPMENT_STATUS_LABELS` 한국어 변환 |
| 팀            | `teams.name`                      | null → '-'                            |
| 위치          | `equipment.location`              | null → '-'                            |
| 마지막 교정일 | `equipment.last_calibration_date` | `toLocaleDateString('ko-KR')`         |
| 다음 교정일   | `equipment.next_calibration_date` | `toLocaleDateString('ko-KR')`         |
| 교정주기(월)  | `equipment.calibration_cycle`     | `{N}개월` 형식                        |
| 시험소        | `equipment.site_code`             | null → '-'                            |

**필터 파라미터:** `site`, `status`, `teamId`

### 2.2 교정 현황 보고서

| 항목        | 값                                           |
| ----------- | -------------------------------------------- |
| 엔드포인트  | `GET /api/reports/export/calibration-status` |
| 데이터 소스 | `calibrations` INNER JOIN `equipment`        |

**컬럼 → DB 필드 매핑:**

| 컬럼 헤더    | DB 필드                              | 변환                                      |
| ------------ | ------------------------------------ | ----------------------------------------- |
| 관리번호     | `equipment.management_number`        | 그대로                                    |
| 장비명       | `equipment.name`                     | 그대로                                    |
| 교정일       | `calibrations.calibration_date`      | 날짜 포맷                                 |
| 완료일       | `calibrations.completion_date`       | 날짜 포맷                                 |
| 교정기관     | `calibrations.agency_name`           | null → '-'                                |
| 교정증서번호 | `calibrations.certificate_number`    | null → '-'                                |
| 상태         | `calibrations.status`                | `CALIBRATION_STATUS_LABELS` 한국어 변환   |
| 승인상태     | `calibrations.approval_status`       | `CALIBRATION_APPROVAL_STATUS_LABELS` 변환 |
| 결과         | `calibrations.result`                | null → '-'                                |
| 비용(원)     | `calibrations.cost`                  | `{N.toLocaleString()}원`                  |
| 다음교정일   | `calibrations.next_calibration_date` | 날짜 포맷                                 |

**필터 파라미터:** `startDate`, `endDate`, `status`

### 2.3 장비 활용률 보고서

| 항목        | 값                                                           |
| ----------- | ------------------------------------------------------------ |
| 엔드포인트  | `GET /api/reports/export/utilization`                        |
| 데이터 소스 | `equipment` LEFT JOIN `teams`, `checkout_items`, `checkouts` |

**컬럼 → DB 필드 매핑:**

| 컬럼 헤더 | DB 필드                        | 변환                                   |
| --------- | ------------------------------ | -------------------------------------- |
| 관리번호  | `equipment.management_number`  | 그대로                                 |
| 장비명    | `equipment.name`               | 그대로                                 |
| 팀        | `teams.name`                   | null → '-'                             |
| 시험소    | `equipment.site_code`          | null → '-'                             |
| 반출횟수  | `COUNT(DISTINCT checkouts.id)` | 집계                                   |
| 활용률(%) | 반출횟수 / 기간일수 × 100      | `{N}%`                                 |
| 활용등급  | 활용률 기반                    | ≥80%: 고활용, ≥20%: 보통, <20%: 저활용 |

**필터 파라미터:** `startDate`, `endDate`, `period`, `site`

### 2.4 팀별 장비 현황 보고서

| 항목        | 값                                       |
| ----------- | ---------------------------------------- |
| 엔드포인트  | `GET /api/reports/export/team-equipment` |
| 데이터 소스 | `equipment` LEFT JOIN `teams`            |

**컬럼 → DB 필드 매핑:**

| 컬럼 헤더   | DB 필드                           | 변환                                  |
| ----------- | --------------------------------- | ------------------------------------- |
| 팀명        | `teams.name`                      | null → '미배정'                       |
| 시험소      | `teams.site`                      | null → '-'                            |
| 관리번호    | `equipment.management_number`     | 그대로                                |
| 장비명      | `equipment.name`                  | 그대로                                |
| 제조사      | `equipment.manufacturer`          | null → '-'                            |
| 모델명      | `equipment.model_name`            | null → '-'                            |
| 상태        | `equipment.status`                | `EQUIPMENT_STATUS_LABELS` 한국어 변환 |
| 위치        | `equipment.location`              | null → '-'                            |
| 다음 교정일 | `equipment.next_calibration_date` | 날짜 포맷                             |

**필터 파라미터:** `site`, `teamId`

### 2.5 수리 및 점검 이력 보고서

| 항목        | 값                                                        |
| ----------- | --------------------------------------------------------- |
| 엔드포인트  | `GET /api/reports/export/maintenance`                     |
| 데이터 소스 | `repair_history` INNER JOIN `equipment` LEFT JOIN `teams` |

**컬럼 → DB 필드 매핑:**

| 컬럼 헤더 | DB 필드                             | 변환                               |
| --------- | ----------------------------------- | ---------------------------------- |
| 관리번호  | `equipment.management_number`       | 그대로                             |
| 장비명    | `equipment.name`                    | 그대로                             |
| 팀        | `teams.name`                        | null → '-'                         |
| 수리일자  | `repair_history.repair_date`        | 날짜 포맷                          |
| 수리내용  | `repair_history.repair_description` | 그대로                             |
| 수리결과  | `repair_history.repair_result`      | `REPAIR_RESULT_LABELS` 한국어 변환 |
| 비고      | `repair_history.notes`              | null → '-'                         |

**필터 파라미터:** `startDate`, `endDate`, `equipmentId`

### 2.6 감사 로그 보고서

| 항목        | 값                                   |
| ----------- | ------------------------------------ |
| 엔드포인트  | `GET /api/reports/export/audit-logs` |
| 데이터 소스 | `audit_logs`                         |
| 스코프 정책 | `AUDIT_LOG_SCOPE` (별도)             |

**컬럼 → DB 필드 매핑:**

| 컬럼 헤더     | DB 필드                  | 변환                                   |
| ------------- | ------------------------ | -------------------------------------- |
| 시간          | `audit_logs.timestamp`   | `toLocaleString('ko-KR', Asia/Seoul)`  |
| 사용자명      | `audit_logs.user_name`   | 그대로                                 |
| 역할          | `audit_logs.user_role`   | `USER_ROLE_LABELS` 한국어 변환         |
| 액션          | `audit_logs.action`      | `AUDIT_ACTION_LABELS` 한국어 변환      |
| 대상유형      | `audit_logs.entity_type` | `AUDIT_ENTITY_TYPE_LABELS` 한국어 변환 |
| 대상명        | `audit_logs.entity_name` | 그대로                                 |
| 대상ID(앞8자) | `audit_logs.entity_id`   | `.slice(0, 8)`                         |
| IP주소        | `audit_logs.ip_address`  | 그대로                                 |
| 시험소        | `audit_logs.user_site`   | 그대로                                 |

**필터 파라미터:** `userId`, `entityType`, `action`, `startDate`, `endDate`

---

## 3. UL-QP 양식 레포트

UL-QP 양식 레포트는 사전 업로드된 XLSX/DOCX 템플릿을 로드한 후, DB 데이터를 특정 셀에 매핑하여 출력합니다.

**공통 엔드포인트:** `GET /api/reports/export/form/:formNumber`

### 3.1 UL-QP-18-01: 시험설비 관리대장 (XLSX)

| 항목        | 값                  |
| ----------- | ------------------- |
| 데이터 소스 | `equipment`         |
| 출력 형식   | XLSX (템플릿 기반)  |
| 행 제한     | 1,000건             |
| 시트명      | '시험설비 관리대장' |

**행 레이아웃:**

- Row 1: 헤더 (팀명 + 최종 업데이트 일자)
- Row 2: 컬럼 헤더 (템플릿 보존)
- Row 3+: 데이터

**셀 매핑 (Row 3+):**

| 열  | 컬럼 헤더  | DB 필드                              | 변환                                   |
| --- | ---------- | ------------------------------------ | -------------------------------------- |
| A   | 관리번호   | `equipment.management_number`        | 그대로                                 |
| B   | 자산번호   | `equipment.asset_number`             | null → 'N/A'                           |
| C   | 장비명     | `equipment.name`                     | 그대로                                 |
| D   | 관리방법   | `equipment.management_method`        | 한국어 변환 (외부교정/자체점검/비대상) |
| E   | 최종교정일 | `equipment.last_calibration_date`    | 날짜 포맷                              |
| F   | 교정기관   | `equipment.calibration_agency`       | null → 'N/A'                           |
| G   | 교정주기   | `equipment.calibration_cycle`        | null → 'N/A'                           |
| H   | 차기교정일 | `equipment.next_calibration_date`    | 날짜 포맷                              |
| I   | 제조사     | `equipment.manufacturer`             | null → '-'                             |
| J   | 구입년도   | `equipment.purchase_year`            | null → '-'                             |
| K   | 모델명     | `equipment.model_name`               | null → '-'                             |
| L   | S/N        | `equipment.serial_number`            | null → '-'                             |
| M   | 사양       | `equipment.description`              | null → '-'                             |
| N   | 위치       | `equipment.location`                 | null → '-'                             |
| O   | 중간점검   | `equipment.needs_intermediate_check` | true → 'O', false → 'X'                |
| P   | 가용여부   | `equipment.status`                   | 상태→가용여부 변환 (아래 표 참조)      |

**장비 상태 → 가용여부 변환 (QP-18-01):**

| equipment.status                                                              | 가용여부 |
| ----------------------------------------------------------------------------- | -------- |
| available, checked_out, calibration_scheduled, calibration_overdue, temporary | 사용     |
| non_conforming                                                                | 고장     |
| spare, inactive                                                               | 여분     |
| retired, pending_disposal, disposed                                           | 불용     |

**필터 파라미터:** `status`, `managementMethod`, `classification`, `manufacturer`, `location`, `isShared`, `showRetired`

### 3.2 UL-QP-18-02: 시험설비 이력카드 (DOCX, dedicated endpoint)

| 항목        | 값                                                                                                                                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 엔드포인트  | `GET /api/equipment/:uuid/history-card` (dedicated)                                                                                                                                                                                                |
| 데이터 소스 | `equipment` + `calibrations` + `equipment_test_software`/`test_software` + `repair_history` + `non_conformances` + `equipment_location_history` + `equipment_maintenance_history` + `equipment_incident_history` + `documents` + `users` + `teams` |
| 출력 형식   | DOCX (템플릿 기반)                                                                                                                                                                                                                                 |
| 파일명      | `{관리번호}_{장비명}_시험설비이력카드.docx`                                                                                                                                                                                                        |
| 글씨체      | 굴림체 (템플릿 기본 폰트 유지)                                                                                                                                                                                                                     |
| 날짜 형식   | `YYYY/MM/DD`                                                                                                                                                                                                                                       |
| 아키텍처    | 3-way 분리: `HistoryCardDataService` (집계) + `HistoryCardRendererService` (DOCX 주입) + `DocxXmlHelper` (범용 XML 유틸)                                                                                                                           |
| SSOT        | 레이블/섹션/치수: `apps/backend/src/modules/equipment/services/history-card.layout.ts` — 양식 개정 시 이 파일만 수정                                                                                                                               |

**기본정보 (HistoryCardRendererService.injectBasicInfo):**

| 양식 필드                     | DB 필드                                                                                     | 변환                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 관리번호                      | `equipment.management_number`                                                               | 그대로                                                                                  |
| 자산번호                      | `equipment.asset_number`                                                                    | null → `-`                                                                              |
| 장비명                        | `equipment.name`                                                                            | 그대로                                                                                  |
| 부속품 & 주요기능             | `equipment.accessories` + `equipment.description`                                           | 병합: `{accessories}\n주요기능: {description}` (`mergeAccessoriesAndFunctions`)         |
| 제조사명                      | `equipment.manufacturer`                                                                    | null → `-`                                                                              |
| 제조사 연락처                 | `equipment.manufacturer_contact`                                                            | null → `-`                                                                              |
| 공급사                        | `equipment.supplier`                                                                        | null → `-`                                                                              |
| 공급사 연락처                 | `equipment.supplier_contact`                                                                | null → `-`                                                                              |
| 시방일치 여부                 | `equipment.spec_match`                                                                      | `CHECKBOX_PATTERNS.SPEC_MATCH` 치환 (`□일치 □불일치` → `■/□`)                           |
| 일련번호                      | `equipment.serial_number`                                                                   | null → `-`                                                                              |
| 교정필요 여부                 | `equipment.calibration_required`                                                            | `CHECKBOX_PATTERNS.CALIBRATION_REQUIRED` 치환 (`□필요 □불필요` → `■/□`)                 |
| 운영 책임자 (정)              | `users.name` (managerId)                                                                    | null → `-`                                                                              |
| 교정주기                      | `equipment.calibration_cycle`                                                               | `{N}개월`                                                                               |
| 운영 책임자 (부)              | `users.name` (deputyManagerId)                                                              | null → `-`                                                                              |
| 관련 S/W 및 매뉴얼 (보관장소) | `equipment.manual_location` + `equipment_test_software.name` + `equipment.firmware_version` | 병합: `보관장소: {ml}\nS/W: {번호} {이름} v{버전}\nFW: {fw}` (`mergeManualAndSoftware`) |
| 최초 설치 위치                | `equipment.initial_location`                                                                | null → `-`                                                                              |
| 설치일시                      | `equipment.installation_date`                                                               | YYYY/MM/DD                                                                              |
| 확인란 날짜 (승인일)          | `equipment.approved_at ?? equipment.updated_at`                                             | YYYY/MM/DD — **approved_at 우선 (승인 시점 SSOT), null이면 updated_at fallback**        |
| 확인란 서명                   | `users.signature_image_path` (approver)                                                     | 전자서명 이미지 (2.5cm × 1.5cm) or 이름 텍스트 fallback                                 |

**이력 섹션 (fillSectionEmptyRows — `history-card.layout.ts` SECTIONS 상수 참조):**

| 섹션                          | 빈 행 | 열                                   | DB 소스                                                                     |
| ----------------------------- | ----: | ------------------------------------ | --------------------------------------------------------------------------- |
| §2 위치 변동 이력             |     5 | 변동일시, 설치위치, 비고             | `equipment_location_history`                                                |
| §3 교정 이력                  |     9 | 교정일시, 주요결과, 차기 교정 예정일 | `calibrations`                                                              |
| §4 유지보수 내역              |     8 | 일시, 주요내용                       | `equipment_maintenance_history`                                             |
| §5 통합 손상/오작동/변경/수리 |     8 | 일시, `[유형] 주요내용`              | `equipment_incident_history` + `repair_history` + `non_conformances` (병합) |

**§5 통합 이력 규칙 (`EquipmentTimelineService`):**

절차서 UL-QP-18 §7.7 항목 10 + §9.9 (개정14, 2024-11-26)의 "장비의 위치 변동, 교정, 유지보수, 파손, 오작동 또는 수리 내역"을 한 섹션으로 표시한다.

- **유형 prefix**: `TIMELINE_ENTRY_TYPE_LABELS` SSOT 사용 (손상/오작동/변경/수리/교정 기한 초과/부적합)
- **정렬**: `occurredAt DESC`, tie-breaker는 incident > repair > non_conformance priority
- **FK 역참조 기반 중복 제거**:
  - `incident.non_conformance_id === nc.id` → NC는 별도 행 생략 (incident가 이미 해당 사건 기록)
  - `nc.repair_history_id === repair.id` → NC는 별도 행 생략, repair content에 `(연계: 부적합 #{shortId})` crossRef 주석
- **repair_result suffix**: `[완료]` / `[부분 완료]` / `[실패]` 라벨 (REPAIR_RESULT_LABELS SSOT)
- **캐시 무효화**: `repair_history` / `non_conformances` / `equipment_incident_history` / `equipment_location_history` / `equipment_maintenance_history` 변경 시 모두 `invalidateAfterEquipmentUpdate(equipmentId)` 호출 (SSOT: `CacheInvalidationHelper`)

**교정 결과 변환:** `pass` → `적합 (교정기관명)`, `fail` → `부적합 (교정기관명)` — SSOT: `CALIBRATION_RESULT_LABELS` (packages/schemas/src/enums/labels.ts)

**장비사진:** `documents` 테이블에서 `document_type = 'equipment_photo'` 최신 1건 조회 → DOCX 인라인 이미지 삽입 (가로 12cm × 세로 9cm, `IMAGE_DIMENSIONS.EQUIPMENT_PHOTO`)

**제거된 쿼리:** 이전 구현은 `checkout_items` JOIN을 수행했으나 양식에 반출 섹션이 없어 2026-04-17 제거 (불필요 JOIN 최소화).

### 3.3 UL-QP-18-03: 중간점검표 (DOCX)

> 날짜 형식: QP-18-03/05는 `toLocaleDateString('ko-KR')`, QP-18-02는 `YYYY/MM/DD`, QP-18-06은 `YYYY . MM . DD .`

| 항목          | 값                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 데이터 소스   | `intermediate_inspections` + `intermediate_inspection_items` + `intermediate_inspection_equipment` + `equipment` + `users` + `teams` |
| 출력 형식     | DOCX (템플릿 기반)                                                                                                                   |
| 필수 파라미터 | `inspectionId`                                                                                                                       |

**DOCX 테이블 구조:**

**Table 0 — 장비 정보 + 점검 항목:**

| 위치 [table, row, cell] | 내용         | DB 필드                                                             |
| ----------------------- | ------------ | ------------------------------------------------------------------- |
| [0, 0, 1]               | 분류         | `intermediate_inspections.classification` → '교정기기'/'비교정기기' |
| [0, 0, 3]               | 팀명         | `teams.name`                                                        |
| [0, 1, 1]               | 관리번호     | `equipment.management_number`                                       |
| [0, 1, 3]               | 설치장소     | `equipment.location`                                                |
| [0, 2, 1]               | 장비명       | `equipment.name`                                                    |
| [0, 2, 3]               | 모델         | `equipment.model_name`                                              |
| [0, 3, 1]               | 점검주기     | `intermediate_inspections.inspection_cycle`                         |
| [0, 3, 3]               | 교정유효기간 | `intermediate_inspections.calibration_validity_period`              |
| [0, 6+]                 | 점검항목     | `intermediate_inspection_items` (동적 행)                           |

**점검항목 데이터 행 (Row 6+):**

| 셀  | 내용     | DB 필드                                                    |
| --- | -------- | ---------------------------------------------------------- |
| 0   | 번호     | `intermediate_inspection_items.item_number`                |
| 1   | 점검항목 | `intermediate_inspection_items.check_item`                 |
| 2   | 점검기준 | `intermediate_inspection_items.check_criteria`             |
| 3   | 점검결과 | `intermediate_inspection_items.check_result`               |
| 4   | 판정     | `intermediate_inspection_items.judgment` → '합격'/'불합격' |

**Table 1 — 측정 장비 목록 (Row 2+):**

| 셀  | 내용     | DB 필드                                              |
| --- | -------- | ---------------------------------------------------- |
| 0   | 번호     | 인덱스 (1-based)                                     |
| 1   | 관리번호 | `equipment.management_number` (측정장비)             |
| 2   | 장비명   | `equipment.name` (측정장비)                          |
| 3   | 교정일   | `intermediate_inspection_equipment.calibration_date` |

**Table 2 — 결과 및 결재:**

| 위치      | 내용      | DB 필드                                    |
| --------- | --------- | ------------------------------------------ |
| [2, 0, 1] | 점검일    | `intermediate_inspections.inspection_date` |
| [2, 1, 1] | 점검자    | `users.name` (inspector)                   |
| [2, 2, 1] | 특이사항  | `intermediate_inspections.remarks`         |
| [2, 0, 4] | 담당 서명 | `users.signature_image_path` (inspector)   |
| [2, 0, 5] | 검토 서명 | `users.signature_image_path` (inspector)   |
| [2, 0, 6] | 승인 서명 | `users.signature_image_path` (approver)    |

### 3.4 UL-QP-18-05: 자체점검표 (DOCX)

| 항목          | 값                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- |
| 데이터 소스   | `equipment_self_inspections` + `self_inspection_items` + `equipment` + `users` + `teams` |
| 출력 형식     | DOCX                                                                                     |
| 필수 파라미터 | `equipmentId`                                                                            |
| 선택 파라미터 | `inspectionId` (없으면 최신 1건)                                                         |

**Table 0 — 장비 정보 + 점검 항목:**

| 위치      | 내용         | DB 필드                                                    |
| --------- | ------------ | ---------------------------------------------------------- |
| [0, 0, 1] | 분류         | `equipment.calibration_required` → '교정기기'/'비교정기기' |
| [0, 0, 3] | 팀명         | `teams.name`                                               |
| [0, 1, 1] | 관리번호     | `equipment.management_number`                              |
| [0, 1, 3] | 설치장소     | `equipment.location`                                       |
| [0, 2, 1] | 장비명       | `equipment.name`                                           |
| [0, 2, 3] | 모델         | `equipment.model_name`                                     |
| [0, 3, 1] | 점검주기     | `equipment_self_inspections.inspection_cycle` → '{N}개월'  |
| [0, 3, 3] | 교정유효기간 | 비교정기기 → 'N/A', 교정기기 → '-'                         |

**점검항목 (2가지 모드):**

- **동적 항목** (`self_inspection_items` 존재 시): itemNumber, checkItem, checkResult
- **레거시 fallback** (항목 없을 시): 외관검사, 기능점검, 안전점검, 교정상태점검 (고정 4항목)

**결과 변환:** `pass` → '이상 없음', `fail` → '부적합'

**Table 1 — 기타 특기사항:**

- JSONB `special_notes` 배열 파싱 → [{번호, 내용, 날짜}]
- fallback: `remarks` → 단일행

**Table 2 — 결재:** QP-18-03과 동일 구조

### 3.5 UL-QP-18-06: 장비 반·출입 확인서 (DOCX)

| 항목          | 값                                                                          |
| ------------- | --------------------------------------------------------------------------- |
| 데이터 소스   | `checkouts` + `checkout_items` + `condition_checks` + `equipment` + `users` |
| 출력 형식     | DOCX                                                                        |
| 필수 파라미터 | `checkoutId`                                                                |
| 장비 행 제한  | 14개 (양식 고정)                                                            |

**단일 테이블 매핑:**

| 위치       | 내용             | DB 필드                                    |
| ---------- | ---------------- | ------------------------------------------ |
| [0, 2, 1]  | 반출지           | `checkouts.destination`                    |
| [0, 2, 3]  | 전화번호         | `checkouts.phone_number`                   |
| [0, 3, 1]  | 반출주소         | `checkouts.address`                        |
| [0, 4, 1]  | 반출사유         | `checkouts.reason`                         |
| [0, 5, 0]  | 반출 확인문      | 날짜(`YYYY . MM . DD .`) + 반출자명        |
| [0, 9~22]  | 장비 목록 (14행) | `checkout_items` + `equipment` (아래 상세) |
| [0, 23, 1] | 특기사항         | `checkouts.inspection_notes`               |
| [0, 24, 0] | 반입 확인문      | 날짜 + 반입자명                            |

**장비 목록 행 (Row 9~22, sequenceNumber 1~14):**

| 셀  | 내용     | DB 필드                                                                |
| --- | -------- | ---------------------------------------------------------------------- |
| 1   | 장비명   | `equipment.name`                                                       |
| 2   | 모델명   | `equipment.model_name`                                                 |
| 3   | 수량     | `checkout_items.quantity`                                              |
| 4   | 관리번호 | `equipment.management_number`                                          |
| 5   | 반출상태 | `checkout_items.condition_before` (없으면 `condition_checks` fallback) |
| 6   | 반입상태 | `checkout_items.condition_after` (없으면 `condition_checks` fallback)  |

**서명란:**

- Row 1, Cell 1~2: 반출 시 (작성자, 승인자)
- Row 25, Cell 1~2: 반입 시 (작성자, 승인자)

### 3.6 UL-QP-18-07: 시험용 소프트웨어 관리대장 (DOCX)

| 항목        | 값                                               |
| ----------- | ------------------------------------------------ |
| 데이터 소스 | `test_software` LEFT JOIN `users` (정/부 담당자) |
| 출력 형식   | DOCX                                             |
| 행 제한     | 1,000건                                          |

**10열 테이블 매핑 (Row 1+):**

| 열  | 컬럼 헤더      | DB 필드                             | 변환                                  |
| --- | -------------- | ----------------------------------- | ------------------------------------- |
| 1   | 관리번호       | `test_software.management_number`   | 그대로                                |
| 2   | SW명           | `test_software.name`                | 그대로                                |
| 3   | 버전           | `test_software.software_version`    | null → '-'                            |
| 4   | 시험분야       | `test_software.test_field`          | 그대로                                |
| 5   | 담당자(정,부)  | `users.name` (primary + secondary)  | 쉼표 구분                             |
| 6   | 설치일자       | `test_software.installed_at`        | 날짜 포맷                             |
| 7   | 제작사         | `test_software.manufacturer`        | null → '-'                            |
| 8   | 위치           | `test_software.location`            | null → '-'                            |
| 9   | 가용여부       | `test_software.availability`        | `SOFTWARE_AVAILABILITY_LABELS` 변환   |
| 10  | 유효성확인대상 | `test_software.requires_validation` | true → 'X'(대상), false → 'O'(미대상) |

**필터 파라미터:** `testField`, `availability`, `manufacturer`, `search`

### 3.7 UL-QP-18-08: Cable and Path Loss 관리대장 (XLSX)

| 항목        | 값                                                              |
| ----------- | --------------------------------------------------------------- |
| 데이터 소스 | `cables` + `cable_loss_measurements` + `cable_loss_data_points` |
| 출력 형식   | XLSX (멀티시트)                                                 |
| 행 제한     | 500건                                                           |

**시트 구조:**

- **시트 1 "RF Conducted"**: 케이블 목록
- **시트 2~N**: 개별 케이블 Path Loss 데이터 (최신 측정)

**시트 1 컬럼:**

| 열  | 헤더             | DB 필드                          | 변환                     |
| --- | ---------------- | -------------------------------- | ------------------------ |
| A   | No               | 인덱스                           | 1-based                  |
| B   | 관리번호         | `cables.management_number`       | 그대로                   |
| C   | Length (M)       | `cables.length`                  | null → '-'               |
| D   | TYPE             | `cables.connector_type`          | null → '-'               |
| E   | 사용 주파수 범위 | `cables.frequency_range_min/max` | '{min} MHz to {max} MHz' |
| F   | S/N              | `cables.serial_number`           | null → 'N/A'             |
| G   | 위치             | `cables.location`                | null → '-'               |

**시트 2+ (Path Loss):**

| 열  | 헤더       | DB 필드                                |
| --- | ---------- | -------------------------------------- |
| A   | Freq (MHz) | `cable_loss_data_points.frequency_mhz` |
| B   | Data (dB)  | `cable_loss_data_points.loss_db`       |

**필터 파라미터:** `connectorType`, `status`

### 3.8 UL-QP-18-09: 시험 소프트웨어 유효성확인 (DOCX)

| 항목          | 값                                                          |
| ------------- | ----------------------------------------------------------- |
| 데이터 소스   | `software_validations` INNER JOIN `test_software` + `users` |
| 출력 형식     | DOCX                                                        |
| 필수 파라미터 | `validationId`                                              |

**2가지 모드:**

**방법 1 — 공급자 시연 (`validationType = 'vendor'`):**

- T0: 기본정보 (공급자명, SW명+버전, 버전/날짜)
- T1: 검증내용 (날짜, 요약)
- T2: 수령정보 (수령자명, 날짜, 첨부)

**방법 2 — 자체 시험 (`validationType ≠ 'vendor'`):**

- T3: 기본정보 (SW명, 저자, 버전, 참조문서, 운영환경, SW구성, HW구성)
- T4: 획득기능 (명칭, 기준, 결과) — JSONB `acquisition_functions` 파싱
- T5: 프로세싱기능 — JSONB `processing_functions` 파싱
- T6: 제어기능 — JSONB `control_functions` 파싱
- T8: 승인란 (시험일, 시험자, 기술책임자 서명)

### 3.9 UL-QP-18-10: 공용 장비 사용/반납 확인서 (DOCX)

| 항목          | 값                                      |
| ------------- | --------------------------------------- |
| 데이터 소스   | `equipment_imports` + `users` + `teams` |
| 출력 형식     | DOCX                                    |
| 필수 파라미터 | `importId`                              |

**Part 1: 사용 확인서**

| 위치        | 내용               | DB 필드                                   |
| ----------- | ------------------ | ----------------------------------------- |
| [0, 1, 1~2] | 결재란 (작성/승인) | 서명 이미지                               |
| [0, 2, 1]   | 사용부서           | `teams.name`                              |
| [0, 2, 3]   | 사용자             | `users.name` (requester)                  |
| [0, 3, 1]   | 사용장소           | `equipment_imports.usage_location`        |
| [0, 3, 3]   | 사용기간           | `usage_period_start ~ usage_period_end`   |
| [0, 4, 1]   | 사용목적           | `equipment_imports.reason`                |
| [0, 5, 0]   | 사용 확인문        | 날짜 + 사용자명                           |
| [0, 9~13]   | 장비목록 5행       | 장비명/모델명/수량/관리번호/외관/교정여부 |

**Part 2: 반납 확인서**

| 위치         | 내용               | DB 필드                                       |
| ------------ | ------------------ | --------------------------------------------- |
| [0, 15, 1~2] | 결재란 (작성/승인) | 서명 이미지                                   |
| [0, 18~22]   | 장비목록 5행       | 장비명/모델명/수량/관리번호/외관/이상여부     |
| [0, 23, 1]   | 특기사항           | `equipment_imports.returned_abnormal_details` |
| [0, 24, 0]   | 반납 확인문        | 날짜 + 반납자명                               |

### 3.10 UL-QP-18-11: 보정인자 및 파라미터 관리대장 (미구현)

현재 `implemented: false` 상태. 템플릿은 7열 구조 (순번/장비관리번호/장비명/보정인자 및 파라미터/적용일/확인/변경일).

### 3.11 UL-QP-19-01: 연간 교정계획서 (XLSX, dedicated endpoint)

| 항목        | 값                                                           |
| ----------- | ------------------------------------------------------------ |
| 엔드포인트  | `GET /api/calibration-plans/:uuid/export` (dedicated)        |
| 데이터 소스 | `calibration_plans` + `calibration_plan_items` + `equipment` |
| 출력 형식   | XLSX (템플릿 기반)                                           |

**행 레이아웃:**

- Row 1~3: 병합 제목 (연도 + 사이트 + "연간 교정 계획서")
- Row 4~5: 병합 컬럼 헤더
- Row 6+: 데이터

**셀 매핑 (Row 6+, 10열):**

| 열  | 헤더          | DB 필드                                  | 변환                   |
| --- | ------------- | ---------------------------------------- | ---------------------- |
| 1   | 순번          | `calibration_plan_items.sequence_number` | 그대로                 |
| 2   | 관리번호      | `equipment.management_number`            | 그대로                 |
| 3   | 장비명        | `equipment.name`                         | 그대로                 |
| 4   | 현황-유효일자 | `snapshot_validity_date`                 | 날짜 포맷              |
| 5   | 현황-교정주기 | `snapshot_calibration_cycle`             | 그대로                 |
| 6   | 현황-교정기관 | `snapshot_calibration_agency`            | null → '-'             |
| 7   | 계획-교정일자 | `planned_calibration_date`               | 날짜 포맷              |
| 8   | 계획-교정기관 | `planned_calibration_agency`             | null → '-'             |
| 9   | 계획-확인     | `confirmed_by`                           | 존재 → 'O', null → '-' |
| 10  | 비고          | `actual_calibration_date ?? notes`       | 실제교정일 우선        |

---

## 4. 공통 메커니즘

### 4.1 파일 출력 포맷

**범용 레포트 (ReportExportService):**

| 포맷  | MIME 타입                                                           | 특징                                                                                      |
| ----- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | 제목(Row1), 생성일시(Row2), 헤더(Row3, 파란 배경), 데이터(Row4+), 자동필터, 상단 3행 고정 |
| CSV   | `text/csv; charset=utf-8`                                           | UTF-8 BOM 포함 (한국어 Excel 호환), RFC 4180 이스케이프                                   |
| PDF   | `application/pdf`                                                   | A4 가로, 테이블형 레이아웃, 페이지 번호, 자동 페이지 분리                                 |

**UL-QP 양식:**

| 포맷 | 사용 양식                                        |
| ---- | ------------------------------------------------ |
| XLSX | QP-18-01, QP-18-08                               |
| DOCX | QP-18-03, QP-18-05, QP-18-06, QP-18-07, QP-18-09 |

### 4.2 날짜 포맷

| 메서드                 | 출력 형식                    | 사용처                    |
| ---------------------- | ---------------------------- | ------------------------- |
| `formatDate()`         | `2026. 4. 9.` (ko-KR locale) | 대부분의 양식             |
| `formatQp1806Date()`   | `2026 . 04 . 09 .`           | QP-18-06 반출/반입일 전용 |
| `toLocaleDateString()` | `2026. 4. 9.`                | 범용 레포트               |

### 4.3 서명 이미지 처리

DOCX 양식에서 결재란 서명은 다음 프로세스로 삽입:

1. `users.signature_image_path`에서 경로 조회
2. 스토리지에서 이미지 다운로드 (`storage.download()`)
3. PNG/JPEG 판별 후 DOCX `word/media/`에 리소스 추가
4. 대상 셀에 인라인 이미지 삽입 (2.5cm × 1.5cm)
5. 실패 시 사용자 이름 텍스트로 fallback

### 4.4 템플릿 관리

- **저장소**: 스토리지 기반 (`form-templates/{formNumber}/`)
- **캐싱**: 인메모리 10분 TTL (반복 요청 시 재다운로드 방지)
- **버전 관리**: `form_templates` 테이블에서 `is_current` 플래그로 활성 버전 관리
- **교체 시**: 기존 템플릿 `superseded_at` 기록, 새 템플릿 `is_current = true`

### 4.5 응답 헤더

모든 레포트 다운로드의 HTTP 응답:

```
Content-Type: {mimeType}
Content-Disposition: attachment; filename*=UTF-8''{encodedFilename}
Content-Length: {buffer.length}
Cache-Control: no-cache, no-store, must-revalidate
```

파일명 형식: `{formNumber}_{formName}_{YYYY-MM-DD}.{ext}`
