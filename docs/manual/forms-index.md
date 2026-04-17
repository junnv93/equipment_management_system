# UL-QP 양식 인덱스

UL-QP-18(장비 관리) / UL-QP-19(교정) 절차서의 **모든 양식 레포트 내보내기 구현 현황**을 한눈에 정리한 참조 문서입니다.
양식 번호로 원본 사양 / 매핑표 / 구현 코드 / 엔드포인트를 1-click 탐색할 수 있도록 했습니다.

> **SSOT**: 양식 번호·이름·보존연한·구현 상태는 [`packages/shared-constants/src/form-catalog.ts`](../../packages/shared-constants/src/form-catalog.ts) 에서 단일 정의됩니다.

---

## 양식 인덱스 테이블

| 양식 번호       | 공식 명칭                     | 구현 | 포맷 | 엔드포인트 타입 | 원본 사양                                                      | 매핑표                                                                                      | 구현 파일                                                                                                          |
| --------------- | ----------------------------- | :--: | :--: | --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **UL-QP-18-01** | 시험설비 관리대장             |  ✅  | XLSX | 통합            | [양식](../procedure/양식/QP-18-01_시험설비관리대장.md)         | [§3.1](./report-export-mapping.md#31-ul-qp-18-01-시험설비-관리대장-xlsx)                    | `apps/backend/src/modules/reports/form-template-export.service.ts`                                                 |
| **UL-QP-18-02** | 시험설비 이력카드             |  ✅  | DOCX | **전용**        | [양식](../procedure/양식/QP-18-02_시험설비이력카드.md)         | [§3.2](./report-export-mapping.md#32-ul-qp-18-02-시험설비-이력카드-docx-dedicated-endpoint) | `apps/backend/src/modules/equipment/services/history-card*.ts` + `modules/reports/docx-xml-helper.ts` (3-way 분리) |
| **UL-QP-18-03** | 중간 점검표                   |  ✅  | DOCX | 통합            | [양식](../procedure/양식/QP-18-03_중간점검표.md)               | [§3.3](./report-export-mapping.md#33-ul-qp-18-03-중간점검표-docx)                           | `apps/backend/src/modules/reports/form-template-export.service.ts`                                                 |
| **UL-QP-18-05** | 자체 점검표                   |  ✅  | DOCX | 통합            | [양식](../procedure/양식/QP-18-05_자체점검표.md)               | [§3.4](./report-export-mapping.md#34-ul-qp-18-05-자체점검표-docx)                           | `apps/backend/src/modules/reports/form-template-export.service.ts`                                                 |
| **UL-QP-18-06** | 장비 반·출입 확인서           |  ✅  | DOCX | 통합            | [양식](../procedure/양식/QP-18-06_장비반출입확인서.md)         | [§3.5](./report-export-mapping.md#35-ul-qp-18-06-장비-반출입-확인서-docx)                   | `apps/backend/src/modules/reports/form-template-export.service.ts`                                                 |
| **UL-QP-18-07** | 시험용 소프트웨어 관리대장    |  ✅  | DOCX | 통합            | [양식](../procedure/양식/QP-18-07_시험용소프트웨어관리대장.md) | [§3.6](./report-export-mapping.md#36-ul-qp-18-07-시험용-소프트웨어-관리대장-docx)           | `apps/backend/src/modules/reports/form-template-export.service.ts`                                                 |
| **UL-QP-18-08** | Cable and Path Loss 관리 대장 |  ✅  | XLSX | 통합            | [양식](../procedure/양식/QP-18-08_CablePathLoss관리대장.md)    | [§3.7](./report-export-mapping.md#37-ul-qp-18-08-cable-and-path-loss-관리대장-xlsx)         | `apps/backend/src/modules/reports/form-template-export.service.ts`                                                 |
| **UL-QP-18-09** | 시험 소프트웨어 유효성확인    |  ✅  | DOCX | 통합            | [양식](../procedure/양식/QP-18-09_시험소프트웨어유효성확인.md) | [§3.8](./report-export-mapping.md#38-ul-qp-18-09-시험-소프트웨어-유효성확인-docx)           | `apps/backend/src/modules/reports/form-template-export.service.ts`                                                 |
| **UL-QP-18-10** | 공용 장비 사용/반납 확인서    |  ✅  | DOCX | 통합            | [양식](../procedure/양식/QP-18-10_공용장비사용반납확인서.md)   | [§3.9](./report-export-mapping.md#39-ul-qp-18-10-공용-장비-사용반납-확인서-docx)            | `apps/backend/src/modules/reports/form-template-export.service.ts`                                                 |
| **UL-QP-18-11** | 보정인자 및 파라미터 관리대장 |  ❌  |  —   | 미구현          | —                                                              | [§3.10](./report-export-mapping.md#310-ul-qp-18-11-보정인자-및-파라미터-관리대장-미구현)    | 템플릿만 존재, 서비스 미구현 (후속 작업)                                                                           |
| **UL-QP-19-01** | 연간 교정계획서               |  ✅  | XLSX | **전용**        | [양식](../procedure/양식/QP-19-01_연간교정계획서.md)           | [§3.11](./report-export-mapping.md#311-ul-qp-19-01-연간-교정계획서-xlsx-dedicated-endpoint) | `apps/backend/src/modules/calibration-plans/services/calibration-plan-export.service.ts`                           |

**범례**:

- ✅ 구현 완료 — `implemented: true`
- ❌ 미구현 — 템플릿만 존재
- **전용** 엔드포인트: 양식별 고유 경로 (예: `GET /api/equipment/:uuid/history-card`)
- **통합** 엔드포인트: `GET /api/reports/export/form/:formNumber` 공용 경로

---

## 엔드포인트 카탈로그

### 범용 통계 레포트

| 엔드포인트                                    | 설명              | 포맷          |
| --------------------------------------------- | ----------------- | ------------- |
| `GET /api/reports/export/equipment-inventory` | 장비 현황         | Excel/CSV/PDF |
| `GET /api/reports/export/calibration-status`  | 교정 현황         | Excel/CSV/PDF |
| `GET /api/reports/export/utilization`         | 장비 활용률       | Excel/CSV/PDF |
| `GET /api/reports/export/team-equipment`      | 팀별 장비 현황    | Excel/CSV/PDF |
| `GET /api/reports/export/maintenance`         | 수리 및 점검 이력 | Excel/CSV/PDF |
| `GET /api/reports/export/audit-logs`          | 감사 로그         | Excel/CSV/PDF |

### UL-QP 양식 레포트

| 엔드포인트                                 | 양식                            | 필수 파라미터  |
| ------------------------------------------ | ------------------------------- | -------------- |
| `GET /api/reports/export/form/UL-QP-18-01` | 시험설비 관리대장               | (필터: 선택)   |
| `GET /api/equipment/:uuid/history-card`    | **UL-QP-18-02 이력카드**        | `uuid` (path)  |
| `GET /api/reports/export/form/UL-QP-18-03` | 중간 점검표                     | `inspectionId` |
| `GET /api/reports/export/form/UL-QP-18-05` | 자체 점검표                     | `equipmentId`  |
| `GET /api/reports/export/form/UL-QP-18-06` | 장비 반·출입 확인서             | `checkoutId`   |
| `GET /api/reports/export/form/UL-QP-18-07` | 시험용 SW 관리대장              | (필터: 선택)   |
| `GET /api/reports/export/form/UL-QP-18-08` | Cable Path Loss 대장            | (필터: 선택)   |
| `GET /api/reports/export/form/UL-QP-18-09` | SW 유효성확인                   | `validationId` |
| `GET /api/reports/export/form/UL-QP-18-10` | 공용 장비 확인서                | `importId`     |
| `GET /api/calibration-plans/:uuid/export`  | **UL-QP-19-01 연간 교정계획서** | `uuid` (path)  |

---

## 아키텍처 — 3가지 내보내기 유형

### 1. 범용 레포트 (통계/집계)

**`ReportsService` + `ReportExportService`** 2단계:

```
DB 쿼리 → ReportData(중간 구조) → Excel/CSV/PDF Buffer
```

- 단일 구조(`ReportData`)로 모든 포맷 지원
- 파일: `apps/backend/src/modules/reports/reports.service.ts`, `report-export.service.ts`
- 상세 매핑: [report-export-mapping.md §2](./report-export-mapping.md#2-범용-통계-레포트)

### 2. 통합 양식 레포트 (`FormTemplateExportService`)

**템플릿 기반 XLSX/DOCX** — 업로드된 양식 원본에 셀 매핑:

```
템플릿 로딩(캐시) → DB 쿼리 → 셀/행 치환 → Buffer
```

- 파일: `apps/backend/src/modules/reports/form-template-export.service.ts`
- 호출: `POST /api/reports/export/form/:formNumber` (권한: `VIEW_REPORTS`)
- 상세: [report-export-mapping.md §3](./report-export-mapping.md#3-ul-qp-양식-레포트)

### 3. 전용 엔드포인트 양식 (Dedicated)

**양식별 전용 서비스**. 단순 셀 매핑을 넘어 도메인 로직(권한/CAS/통합 이력 등)이 필요한 경우 사용:

| 양식                        | 전용 서비스                                                                                                     | 특징                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| UL-QP-18-02 이력카드        | `HistoryCardService` (orchestrator) + `HistoryCardDataService` + `HistoryCardRendererService` + `DocxXmlHelper` | **3-way 분리 아키텍처 표준 구현**. layout SSOT, 통합 이력(incident+repair+NC), 장비 site/team 권한 |
| UL-QP-19-01 연간 교정계획서 | `CalibrationPlanExportService`                                                                                  | 3단계 승인 상태 기반 출력 + CAS 버전                                                               |

**3-way 분리 가이드**: [backend-patterns.md — DOCX 내보내기 3-way 분리 아키텍처](../references/backend-patterns.md)

---

## 새 양식 추가 체크리스트

새 UL-QP 양식(예: UL-QP-18-11 보정인자 관리대장)을 구현할 때:

1. **카탈로그 등록** — `packages/shared-constants/src/form-catalog.ts`에 `FormCatalogEntry` 추가 (`implemented: true`)
2. **원본 docx/xlsx 업로드** — `form-templates/{formNumber}/` 스토리지 (FormTemplateService가 관리)
3. **매핑 결정**:
   - 단순 셀 매핑만 → `FormTemplateExportService.exportX{formNumber}()` 추가
   - 도메인 로직 필요 → 전용 서비스 + `dedicatedEndpoint: true` + 3-way 분리 (UL-QP-18-02 패턴)
4. **SSOT 분리**:
   - 양식 셀 라벨/섹션/빈행수 → 서비스 옆 `{form}.layout.ts` 파일
   - 라벨 맵 → `packages/schemas/src/enums/labels.ts`
5. **매핑표 갱신** — `docs/manual/report-export-mapping.md`에 §3.x 섹션 추가
6. **인덱스 갱신** — 이 파일(`docs/manual/forms-index.md`)의 인덱스 테이블에 엔트리 추가
7. **e2e 테스트** — `apps/backend/test/{form}-export.e2e-spec.ts` + 완전 충전 seed 대상 장비 확보
8. **이력카드에 영향 있으면** — `history-card.layout.ts` / `HistoryCardDataService` / `EquipmentTimelineService` 확인

---

## 참조 문서 계층

```
docs/
├── manual/
│   ├── forms-index.md           ← 이 문서 (양식 통합 인덱스)
│   └── report-export-mapping.md ← 런타임 매핑표 (각 양식 필드 ↔ DB 컬럼)
├── references/
│   └── backend-patterns.md      ← DOCX 3-way 분리 아키텍처 + Zod/CAS/Cache 패턴
├── procedure/
│   ├── 절차서/장비관리절차서.md   ← UL-QP-18 절차서 원본 (읽기 전용)
│   └── 양식/QP-18-XX_*.md       ← 각 양식 사양 원본 (읽기 전용)
└── ...

packages/shared-constants/src/form-catalog.ts  ← 양식 번호/이름/보존연한 SSOT
apps/backend/src/modules/equipment/services/history-card.layout.ts ← 레이아웃 SSOT (UL-QP-18-02)
```

---

## Reference 테스트 데이터 — SUW-E0001

UL-QP-18-02 이력카드의 **모든 셀이 채워진** 완전 충전 reference 장비:

| 카테고리  | 필드                                                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 기본정보  | management_number, asset_number, name, accessories, description(주요기능), manufacturer(+contact), supplier(+contact), spec_match, serial_number, calibration_required, calibration_cycle, management_method |
| S/W·FW    | equipment_test_software(P0045 IECSoft), firmware_version(A.25.41), manual_location                                                                                                                           |
| 위치/일자 | initial_location, installation_date                                                                                                                                                                          |
| 담당자    | manager, deputy_manager, **approved_by + approved_at** (Phase 1)                                                                                                                                             |
| 이력      | location_history(3), calibration(1+), maintenance(2), **timeline(incident+repair+NC)** (3+FK crossRef)                                                                                                       |
| 문서      | equipment_photo (documents 테이블 직접)                                                                                                                                                                      |
| 서명      | approver `users.signature_image_path` (lab.manager@example.com)                                                                                                                                              |

**UUID**: `eeee1001-0001-4001-8001-000000000001` (`EQUIP_SPECTRUM_ANALYZER_SUW_E_ID`)

실제 DOCX 확인:

```bash
TOKEN=$(curl -s 'http://localhost:3001/api/auth/test-login?role=lab_manager' | jq -r .accessToken)
curl -o /tmp/SUW-E0001_이력카드.docx \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/equipment/eeee1001-0001-4001-8001-000000000001/history-card"
```
