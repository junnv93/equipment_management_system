# 시험용 소프트웨어 유효성 확인 운영 가이드

> ISO/IEC 17025:2017 §6.2.2 (인원 역량) 및 §6.4.13 (데이터 및 정보 관리) 준수.
> 절차서 수치는 **TBD (절차서 원문 확인 필요)** 처리 — 절차서 §14 원문 확인 전 SLA/보존연한 기재 금지.

## 상태 전이 다이어그램

```
                 ┌──────────────────────────────────────────┐
                 │                                          │
                 ▼                                          │  revise
          ┌─────────────┐                           ┌──────────────┐
          │    draft    │ ──── submit ────────────▶ │  submitted   │
          └─────────────┘                           └──────────────┘
                                                           │
                                              ┌────────────┴─────────────┐
                                              │                          │
                                      approve (기술 승인)         reject (거부)
                                              │                          │
                                              ▼                          ▼
                                     ┌──────────────┐          ┌──────────────┐
                                     │   approved   │          │   rejected   │
                                     └──────────────┘          └──────────────┘
                                              │
                                   qualityApprove (품질 승인)
                                              │
                                              ▼
                                   ┌──────────────────────┐
                                   │   quality_approved   │
                                   └──────────────────────┘
```

**전이 권한:**

| 전이                        | 필요 권한                     | 서버 가드                   |
| --------------------------- | ----------------------------- | --------------------------- |
| draft → submitted           | `SUBMIT_SOFTWARE_VALIDATION`  | 본인 소유 검증              |
| submitted → approved        | `APPROVE_SOFTWARE_VALIDATION` | `assertIndependentApprover` |
| submitted → rejected        | `APPROVE_SOFTWARE_VALIDATION` | —                           |
| approved → quality_approved | `APPROVE_SOFTWARE_VALIDATION` | 기술 승인자 ≠ 품질 승인자   |
| rejected → draft            | `CREATE_SOFTWARE_VALIDATION`  | 본인/관리자                 |

---

## assertIndependentApprover 가드

ISO 17025 §6.2.2: **제출자와 승인자는 동일인이 될 수 없다**.

```typescript
// backend: software-validations.service.ts
assertIndependentApprover(validation, approverId);
// validation.submittedBy === approverId → 403 ForbiddenException
```

UI 대칭 (서버 가드의 프론트엔드 반영):

```tsx
// ValidationActionsBar.tsx
disabled={approveMutation.isPending || v.submittedBy === userId}
title={v.submittedBy === userId ? t('validation.actions.selfApprovalForbidden') : undefined}
```

**dual-approval (품질 승인)** 에도 동일 원칙 적용:

- `v.technicalApproverId === userId` → 품질 승인 버튼 비활성화.

---

## validationType 분기

### vendor (벤더 제공 검증)

| 필드             | 필수 | 설명             |
| ---------------- | ---- | ---------------- |
| `vendorName`     | —    | 검증 수행 벤더명 |
| `vendorSummary`  | —    | 벤더 검증 요약   |
| `receivedBy`     | —    | 수령자 (userId)  |
| `receivedDate`   | —    | 수령일           |
| `attachmentNote` | —    | 첨부 문서 메모   |

### self (자체 수행 검증)

| 필드                       | 필수 | 설명                            |
| -------------------------- | ---- | ------------------------------- |
| `referenceDocuments`       | —    | 참조 문서 목록                  |
| `operatingUnitDescription` | —    | 운영 단위 설명                  |
| `softwareComponents`       | —    | SW 구성 요소                    |
| `hardwareComponents`       | —    | HW 구성 요소                    |
| `performedBy`              | —    | 수행자 (userId)                 |
| `acquisitionFunctions`     | —    | 데이터 획득 기능 목록 (3-field) |
| `processingFunctions`      | —    | 처리 기능 목록 (3-field)        |
| `controlFunctions`         | —    | 제어 기능 목록 (5-field)        |

**function item 구조 (3-field):**

```typescript
{
  functionName: string;
  independentMethod: string;
  acceptanceCriteria: string;
}
```

**control function item 구조 (5-field):**

```typescript
{
  controlEquipmentFunction: string;
  expectedFunction: string;
  verificationFunction: string;
  independentMethod: string;
  acceptanceCriteria: string;
}
```

---

## SLA / 보존연한

> **TBD** — 절차서 §14 원문 확인 필요. 시스템에 임의 수치 기재 금지.

---

## 관련 파일 경로

| 역할            | 경로                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------- |
| 백엔드 서비스   | `apps/backend/src/modules/software-validations/services/software-validations.service.ts`          |
| 백엔드 컨트롤러 | `apps/backend/src/modules/software-validations/software-validations.controller.ts`                |
| 프론트엔드 목록 | `apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx`            |
| 프론트엔드 상세 | `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/`                          |
| 다이얼로그      | `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationCreateDialog.tsx`   |
| 액션 바         | `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationActionsBar.tsx`     |
| 함수 테이블     | `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationFunctionsTable.tsx` |
| 제어 테이블     | `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationControlTable.tsx`   |
| API 클라이언트  | `apps/frontend/lib/api/software-api.ts`                                                           |
