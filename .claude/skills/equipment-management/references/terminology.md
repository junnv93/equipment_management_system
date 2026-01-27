# 용어 정의 (UL-QP-18 Section 3)

## 목차

1. [기본 용어](#기본-용어)
2. [기록 용어](#기록-용어)
3. [코드 매핑](#코드-매핑)

---

## 기본 용어

### 장비 (Equipment)

시험소에서 시험에 사용하는 설비와 장비를 통칭한다.

### 점검 (Inspection)

장비, 측정시스템에 대해 점검을 통한 측정 오차를 줄이기 위한 일련의 업무를 말한다.

### 점검주기 (Inspection Cycle)

설비의 정확도를 유지하기 위한 점검 주기를 말한다.

### 소급성 (Traceability)

명시된 불확도를 갖고 끊어지지 않는 비교사슬을 통하여 통상, 국가 또는 국제 표준으로 규정한 표준과 연관될 수 있게 하는 측정 결과 또는 표준값의 특성을 말한다.

### 공용장비 (Common Use Equipment)

안전 인증 시험팀에서 관리하는 장비로 필요에 따라 EMC-W 분야 시험에 사용할 수 있는 장비를 통칭한다.

### 여분 장비 (Spare Equipment)

보유하고 있지만 상시 관리하지 않는 장비. 사용 전 기능 적절성과 교정상태 확인 필요.

### 시험보조용 장비 (Test Support Equipment)

시험보조용으로 사용되는 장비. 시험보조용 장비식별표 부착 필수.

---

## 기록 용어

### 기록 (Records)

달성된 결과를 명시하거나 수행한 활동의 증거를 제공하는 문서를 말한다.

### 품질기록 (Quality Records)

품질경영의 수행결과에 의해 발생된 객관적 증거를 가진 실행 결과물을 말한다.

### 기술기록 (Technical Record)

시험업무의 수행결과에 의해 발생된 객관적 증거를 가진 실행 결과물을 말한다.

---

## 코드 매핑

### 교정 방법 (CalibrationMethod)

```typescript
enum CalibrationMethodEnum {
  EXTERNAL_CALIBRATION = 'external_calibration', // 외부 교정 (공인 교정기관)
  SELF_INSPECTION = 'self_inspection', // 자체 점검 (내부 수행)
  NOT_APPLICABLE = 'not_applicable', // 비교정 대상
}
```

### 장비 상태 (EquipmentStatus)

```typescript
enum EquipmentStatusEnum {
  AVAILABLE = 'available', // 사용가능
  IN_USE = 'in_use', // 사용중
  CHECKED_OUT = 'checked_out', // 반출중 (교정중/수리중은 반출 목적으로 구분)
  CALIBRATION_SCHEDULED = 'calibration_scheduled', // 교정예정
  CALIBRATION_OVERDUE = 'calibration_overdue', // 교정기한초과
  NON_CONFORMING = 'non_conforming', // 부적합 (임시, 수리 후 복귀 가능)
  SPARE = 'spare', // 여분 (보유하지만 상시 관리 안함)
  RETIRED = 'retired', // 폐기 (영구)
}
```

### 장비 상태 한글 라벨

```typescript
const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: '사용 가능',
  in_use: '사용 중',
  checked_out: '반출 중', // UI에서 반출 목적에 따라 '교정중', '수리중', '대여중'으로 표시 가능
  calibration_scheduled: '교정 예정',
  calibration_overdue: '교정 기한 초과',
  non_conforming: '부적합',
  spare: '여분',
  retired: '폐기',
};
```

**상태 표시 규칙**:

- `checked_out` 상태는 반출 레코드(`checkouts` 테이블)의 `checkout_type` 필드로 세부 구분:
  - `calibration` → UI에서 "교정중"으로 표시
  - `repair` → UI에서 "수리중"으로 표시
  - `rental` → UI에서 "대여중"으로 표시
- `spare`: 여분 장비로 따로 관리하지 않는 상태

### 승인 상태 (ApprovalStatus)

```typescript
enum ApprovalStatusEnum {
  DRAFT = 'draft', // 초안
  PENDING_APPROVAL = 'pending_approval', // 승인대기
  APPROVED = 'approved', // 승인됨
  REJECTED = 'rejected', // 반려됨
  CANCELED = 'canceled', // 취소됨
}
```

### 반출 목적 (CheckoutPurpose) / 반출 유형 (CheckoutType)

> **참고**: 코드베이스에서는 `CheckoutPurpose`와 `CheckoutType` 두 가지 이름이 사용됩니다.
> 둘 다 동일한 값을 가지며, SSOT는 `packages/schemas/src/enums.ts`입니다.

```typescript
// SSOT: packages/schemas/src/enums.ts
export const CheckoutPurposeEnum = z.enum(['calibration', 'repair', 'rental']);
export const CheckoutTypeEnum = z.enum(['calibration', 'repair', 'rental']);

// 값 설명:
// - calibration: 교정 목적 반출 (외부 교정기관)
// - repair: 수리 목적 반출 (외부 수리업체)
// - rental: 대여 목적 반출 (시험소 간 대여)
```

**모든 반출 유형은 기술책임자 1단계 승인으로 통합됨**

### 점검 유형 (InspectionType)

```typescript
enum InspectionTypeEnum {
  INTERMEDIATE_CHECK = 'intermediate_check', // 중간점검 (UL-QP-18-03)
  SELF_CHECK = 'self_check', // 자체점검 (UL-QP-18-05)
}
```

### 부적합 상태 (NonConformanceStatus)

```typescript
enum NonConformanceStatusEnum {
  OPEN = 'open', // 발견/등록됨
  ANALYZING = 'analyzing', // 원인 분석 중
  CORRECTED = 'corrected', // 조치 완료
  CLOSED = 'closed', // 종료 (기술책임자 승인)
}
```

### 보정 방법 (CorrectionMethod)

```typescript
enum CorrectionMethodEnum {
  LINEAR_INTERPOLATION = 'linear_interpolation', // 선형 보간법
  HIGHER_VALUE = 'higher_value', // 큰 쪽 보정값
  CALIBRATION_AGENCY = 'calibration_agency', // 교정기관 제시
}
```
