# Exec Plan: QP-18-03/QP-18-05 점검표 갭 분석 및 구현

**Slug**: `inspection-form-gap-analysis`
**Date**: 2026-04-06
**Mode**: 2 (Full)
**Scope**: DB 스키마 검증, Export 구현, 결재란 서명 매핑, E2E 테스트

---

## Context

UL-QP-18-03(중간점검표)과 UL-QP-18-05(자체점검표) 양식 문서를 기준으로 시스템 구현 상태를 감사하고, 누락된 부분을 구현한다.

### 사용자 요구사항 (결재란)
- **담당/검토** = 점검자 전자 서명 (inspectorId → users.signatureImagePath)
- **승인** = 기술책임자 전자 서명 (approvedBy/confirmedBy → users.signatureImagePath)

---

## Phase 1: 갭 분석 결과 (현재 상태)

### QP-18-03 중간점검표 — 컬럼 매핑

| 양식 항목 | DB 매핑 | 상태 |
|---|---|---|
| **헤더: 분류** | equipment → calibrationRequired | ✅ |
| **헤더: 관리팀** | equipment.teamId → teams.name | ✅ |
| **헤더: 관리번호** | equipment.managementNumber | ✅ |
| **헤더: 장비위치** | equipment.site / location | ✅ |
| **헤더: 장비명** | equipment.name | ✅ |
| **헤더: 모델명** | equipment.modelName | ✅ |
| **헤더: 점검주기** | intermediateInspections.inspectionCycle | ✅ |
| **헤더: 교정유효기간** | intermediateInspections.calibrationValidityPeriod | ✅ |
| **점검항목: 번호** | intermediateInspectionItems.itemNumber | ✅ |
| **점검항목: 점검 항목** | intermediateInspectionItems.checkItem | ✅ |
| **점검항목: 점검 기준** | intermediateInspectionItems.checkCriteria | ✅ |
| **점검항목: 점검 결과** | intermediateInspectionItems.checkResult | ✅ |
| **점검항목: 판정** | intermediateInspectionItems.judgment | ✅ |
| **측정장비: 번호** | (순번 생성) | ✅ |
| **측정장비: 관리번호** | intermediateInspectionEquipment → equipment.managementNumber | ✅ |
| **측정장비: 장비명** | intermediateInspectionEquipment → equipment.name | ✅ |
| **측정장비: 교정일자** | intermediateInspectionEquipment.calibrationDate | ✅ |
| **결재: 점검일** | intermediateInspections.inspectionDate | ✅ |
| **결재: 점검자** | intermediateInspections.inspectorId → users.name | ✅ |
| **결재: 특이사항** | intermediateInspections.remarks | ✅ |
| **결재: 담당/검토 서명** | inspectorId → users.signatureImagePath | ⚠️ 서명 미연동 |
| **결재: 승인 서명** | approvedBy → users.signatureImagePath | ⚠️ 서명 미연동 |

**결론**: 스키마 컬럼은 **100% 매핑** 완료. Export만 미구현.

### QP-18-05 자체점검표 — 컬럼 매핑

| 양식 항목 | DB 매핑 | 상태 |
|---|---|---|
| **헤더: 분류** | equipment → calibrationRequired (비교정기기) | ✅ |
| **헤더: 관리팀** | equipment.teamId → teams.name | ✅ |
| **헤더: 관리번호** | equipment.managementNumber | ✅ |
| **헤더: 장비위치** | equipment.site / location | ✅ |
| **헤더: 장비명** | equipment.name | ✅ |
| **헤더: 모델명** | equipment.modelName | ✅ |
| **헤더: 점검주기** | equipmentSelfInspections.inspectionCycle | ✅ |
| **헤더: 교정유효기간** | N/A (비교정기기) | ✅ |
| **점검항목: 번호** | (고정 4항목 순번) | ⚠️ 설계 결정 |
| **점검항목: 점검 항목** | appearance/functionality/safety/calibrationStatus | ⚠️ 고정 4항목 |
| **점검항목: 점검 결과** | 각 항목의 pass/fail/na 값 | ✅ |
| **기타 특기사항: 번호** | (없음) | ❌ 구조 없음 |
| **기타 특기사항: 내용** | remarks (text 단일 필드) | ⚠️ 단일 필드 |
| **기타 특기사항: 날짜** | (없음) | ❌ 구조 없음 |
| **결재: 점검일** | inspectionDate | ✅ |
| **결재: 점검자** | inspectorId → users.name | ✅ (export 미포함) |
| **결재: 특기사항** | remarks | ✅ |
| **결재: 담당/검토 서명** | inspectorId → users.signatureImagePath | ❌ export 미포함 |
| **결재: 승인 서명** | confirmedBy → users.signatureImagePath | ❌ export 미포함 |

### 공통 갭 요약

| # | 갭 | 심각도 | Phase |
|---|---|---|---|
| G-1 | QP-18-03 XLSX export 미구현 | HIGH | 2 |
| G-2 | QP-18-05 export에 결재란(점검자, 서명) 미포함 | HIGH | 2 |
| G-3 | QP-18-03 export에 결재란 서명 렌더링 필요 | HIGH | 2 |
| G-4 | QP-18-05 "기타 특기사항" 섹션이 단일 text → 구조화 필요 여부 | MEDIUM | 사용자 판단 |
| G-5 | QP-18-05 점검 항목이 고정 4개 (양식은 유연) | LOW | 설계 결정 |
| G-6 | Export E2E 테스트 없음 (양식 다운로드 검증) | MEDIUM | 3 |
| G-7 | 결재란 서명 렌더링 E2E 미검증 | MEDIUM | 3 |

---

## Phase 2: 구현 (G-1 ~ G-3)

### 2-1. QP-18-03 중간점검표 Export 구현

**파일**: `apps/backend/src/modules/reports/form-template-export.service.ts`

- `exportIntermediateInspection()` 메서드 추가
- 장비 헤더 섹션 (equipment join)
- 점검 항목 테이블 (intermediateInspectionItems)
- 측정 장비 List (intermediateInspectionEquipment → equipment join)
- 점검 결과 + 결재란 (inspectorId, approvedBy → users join + signatureImagePath)
- exporters 맵에 `'UL-QP-18-03'` 등록

**파일**: `packages/shared-constants/src/form-catalog.ts`
- `UL-QP-18-03.implemented: true`로 변경

### 2-2. QP-18-05 자체점검표 Export 보강

**파일**: `apps/backend/src/modules/reports/form-template-export.service.ts`

- `exportSelfInspection()` 보강:
  - 장비 헤더 섹션 추가 (equipment join: 분류, 관리팀, 관리번호, 장비위치, 장비명, 모델명)
  - 점검자 이름 컬럼 추가 (inspectorId → users.name join)
  - 결재란 섹션: 담당/검토(점검자 서명), 승인(confirmedBy 서명)

### 2-3. 결재란 서명 공통 유틸

- 서명은 users.signatureImagePath 텍스트 경로로 저장됨
- Excel export에서는 서명 이미지를 셀에 삽입하거나, 서명자 이름+날짜를 텍스트로 렌더링
- 이미지 삽입은 ExcelJS addImage API 활용

### 검증

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test
# Manual: GET /reports/export/form/UL-QP-18-03?inspectionId={uuid}
# Manual: GET /reports/export/form/UL-QP-18-05?equipmentId={uuid}
```

---

## Phase 3: E2E 테스트 보강

### 3-1. Export E2E 테스트

**파일**: `apps/frontend/tests/e2e/workflows/` (기존 WF-19, WF-20에 추가 또는 별도 spec)

- QP-18-03 export 다운로드 → 200 응답 + content-type 검증
- QP-18-05 export 다운로드 → 200 응답 + content-type 검증
- 결재란 데이터 포함 여부 (API 레벨 검증)

### 검증

```bash
pnpm --filter frontend run test:e2e -- --grep "export"
```

---

## 사용자 판단 필요 사항

1. **G-4**: QP-18-05 "기타 특기사항" 섹션을 별도 테이블로 구조화할 것인가, 아니면 현재 `remarks` text 필드로 충분한가?
2. **G-5**: QP-18-05 점검 항목을 유연하게 변경할 필요가 있는가, 아니면 고정 4항목(외관/기능/안전/교정상태)으로 유지하는가?
3. **서명 렌더링**: Excel에 실제 서명 이미지를 삽입할 것인가, 아니면 서명자 이름+직위+날짜 텍스트로 충분한가?
