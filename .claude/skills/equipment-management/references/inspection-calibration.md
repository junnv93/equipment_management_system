# 점검 및 교정 프로세스 (UL-QP-18 Section 8, 10)

> ⚠️ **문서 성격**: 이 문서는 UL-QP-18 절차서 기반의 **요구사항 정의서**입니다.
> 중간점검(Intermediate Check), 자체점검(Self Check), 교정 프로세스의 설계 방향을 제시합니다.
> 실제 구현 상태는 관련 모듈(`apps/backend/src/modules/calibration/`)을 확인하세요.

## 목차

1. [점검 유형](#점검-유형)
2. [중간점검](#중간점검)
3. [자체점검](#자체점검)
4. [교정](#교정)
5. [장기 미사용 장비](#장기-미사용-장비)
6. [교정계획서](#교정계획서)
7. [구현 가이드](#구현-가이드)

---

## 점검 유형

| 유형         | 대상             | 목적             | 양식        |
| ------------ | ---------------- | ---------------- | ----------- |
| **중간점검** | 교정 대상 장비   | 교정 신뢰성 확인 | UL-QP-18-03 |
| **자체점검** | 비교정 대상 장비 | 기능/상태 확인   | UL-QP-18-05 |

---

## 중간점검 (Intermediate Check)

### 목적

교정검사의 신뢰성을 확인하기 위해 교정 주기 사이에 실시하는 점검

### 대상 선정

기술책임자가 중간점검 필요 장비를 별도 선정

### 점검 주기

각 부서(팀)별 운용장비의 특성에 따라 결정:

- 사용빈도
- 내용 연수
- 장비 상태

### 점검 기록 (UL-QP-18-03)

```typescript
interface IntermediateCheck {
  uuid: string;
  equipmentId: string;
  checkDate: Date;

  // 점검 기준
  checkCriteria: string;
  checkMethod: string;

  // 점검 결과
  result: 'pass' | 'fail' | 'conditional';
  measuredValues?: Record<string, any>;
  deviation?: string; // 편차

  // 합격 기준
  acceptanceCriteria: string;

  // 판정
  judgment: string;
  notes?: string;

  // 점검자/확인자
  checkedBy: string; // 시험실무자
  confirmedBy?: string; // 기술책임자

  // 상태
  status: 'pending' | 'confirmed';
}
```

### 상태 흐름

```
[시험실무자 점검 실시]
    ↓
pending (점검 완료, 확인 대기)
    ↓
[기술책임자 결과 확인]
    ↓
confirmed
```

---

## 자체점검 (Self Check)

### 목적

비교정 대상 장비의 기능 및 상태를 주기적으로 확인

### 대상

- 비교정 대상 장비
- 시험에 사용하는 설비
- 측정기기

### 점검 주기

각 부서(팀)별 운용 장비 특성에 따라 결정:

- 사용 빈도
- 내용 연수
- 장비 상태

### 점검 기록 (UL-QP-18-05)

```typescript
interface SelfCheck {
  uuid: string;
  equipmentId: string;
  checkDate: Date;

  // 점검 항목
  checkItems: SelfCheckItem[];

  // 전체 판정
  overallResult: 'pass' | 'fail';
  notes?: string;

  // 점검자
  checkedBy: string;

  // 상태
  status: 'completed';
}

interface SelfCheckItem {
  itemName: string;
  checkMethod: string;
  acceptanceCriteria: string;
  measuredValue?: string;
  result: 'pass' | 'fail' | 'na';
  notes?: string;
}
```

---

## 교정 (Calibration)

### 교정 방법 (calibrationMethod)

장비 속성으로, 해당 장비의 교정/점검 방법을 정의합니다.

| 값                     | 설명                      | 교정계획서                    |
| ---------------------- | ------------------------- | ----------------------------- |
| `external_calibration` | 외부 공인 교정기관에 의뢰 | **포함** (시험소장 승인 필요) |
| `self_inspection`      | 자체 점검 (내부 수행)     | 미포함                        |
| `not_applicable`       | 비교정 대상               | 미포함                        |

### 교정 주기 결정 요소

- 장비 매뉴얼 권장 주기
- 시험 품질에 미치는 영향
- 사용 빈도
- 장비 상태

### 교정 기록

```typescript
interface Calibration {
  uuid: string;
  equipmentId: string;

  // 기본 정보
  calibrationDate: Date;
  calibrationMethod: 'external_calibration' | 'self_inspection' | 'not_applicable';
  calibrationAgency?: string; // 교정기관

  // 결과
  result: 'pass' | 'fail' | 'conditional';
  certificateNumber?: string; // 교정성적서 번호
  certificateFile?: string; // 성적서 파일 경로

  // 보정계수
  hasCalibrationFactor: boolean;
  calibrationFactors?: CalibrationFactor[];

  // 차기 교정
  nextCalibrationDate: Date;

  // 승인 정보
  approvalStatus: ApprovalStatusEnum;
  registeredBy: string;
  registeredByRole: UserRoleEnum;
  registrarComment?: string; // 기술책임자 등록 시 필수
  approvedBy?: string;
  approverComment?: string; // 승인 시 필수
}
```

### 교정 후 조치

**이상 발견 시**:

1. 장비 사용 금지
2. 부적합 시험 발생 여부 확인
3. 필요시 재시험 실시
4. 사용 가능 범위 내 제한적 사용 또는 폐기/교체

**보정계수 발급 시**:

1. 보정값(보정계수)을 측정값에 반영
2. 관련 장비 소프트웨어 갱신 (가능한 경우)
3. 보정인자 및 파라미터 관리대장 최신화

---

## 장기 미사용 장비

### 정의

일정기간 동안 시험업무에 사용하지 않은 장비

### 재사용 전 필수 확인 사항

```typescript
interface LongTermUnusedCheck {
  equipmentId: string;
  lastUsedDate: Date;
  checkDate: Date;

  // 기능 점검
  functionalCheck: {
    performed: boolean;
    result: 'pass' | 'fail';
    notes?: string;
  };

  // 교정 상태 확인
  calibrationCheck: {
    isCalibrationValid: boolean;
    lastCalibrationDate?: Date;
    nextCalibrationDate?: Date;
    needsRecalibration: boolean;
  };

  // 최종 판정
  readyForUse: boolean;
  checkedBy: string;
}
```

### 처리 흐름

```
[장기 미사용 장비 사용 요청]
    ↓
기능 점검 실시
    ↓
교정 상태 확인
    ↓
┌─────────────────────────────┐
│ 교정 유효?                   │
├─────────────────────────────┤
│ ✅ 유효 → 사용 가능          │
│ ❌ 만료 → 재교정 후 사용     │
└─────────────────────────────┘
```

---

## 교정계획서

### 작성 권한

- **작성**: 기술책임자
- **항목 확인**: 기술책임자
- **최종 승인**: 시험소장(lab_manager)

### 대상 장비

`calibrationMethod = 'external_calibration'` 인 장비

### 교정계획서 스키마

```typescript
interface CalibrationPlan {
  uuid: string;
  year: number; // 대상 연도
  site: string;

  // 상태
  status: 'draft' | 'pending_approval' | 'approved';

  // 작성/승인
  createdBy: string; // 기술책임자
  approvedBy?: string; // 시험소장
  approvedAt?: Date;

  // 항목
  items: CalibrationPlanItem[];
}

interface CalibrationPlanItem {
  uuid: string;
  planId: string;
  equipmentId: string;

  // 계획
  plannedMonth: number; // 계획 월 (1-12)
  plannedCalibrationDate?: Date;
  calibrationAgency?: string;
  estimatedCost?: number;

  // 실적
  actualCalibrationDate?: Date;
  actualCost?: number;

  // 확인
  confirmedBy?: string; // 기술책임자 확인
  confirmedAt?: Date;
}
```

### 상태 흐름

```
[기술책임자 작성]
    ↓
draft (초안)
    ↓
[제출]
    ↓
pending_approval
    ↓
[시험소장 승인]
    ↓
approved
```

---

## 구현 가이드

### 점검 알림 시스템

```typescript
// 점검 예정일 계산
function getNextCheckDate(equipment: Equipment): Date | null {
  if (!equipment.checkCycle) return null;

  const lastCheck = equipment.lastIntermediateCheckDate || equipment.lastSelfCheckDate;
  if (!lastCheck) return new Date(); // 점검 기록 없으면 즉시

  return addMonths(lastCheck, equipment.checkCycle);
}

// 점검 예정 장비 조회
async function getUpcomingChecks(daysAhead: number = 30) {
  const targetDate = addDays(new Date(), daysAhead);

  return this.db.query.equipment.findMany({
    where: and(eq(equipment.status, 'available'), lte(equipment.nextCheckDate, targetDate)),
  });
}
```

### 교정 예정 알림

```typescript
// 교정 예정 장비 조회 (30일 이내)
async function getUpcomingCalibrations(daysAhead: number = 30) {
  const targetDate = addDays(new Date(), daysAhead);

  return this.db.query.equipment.findMany({
    where: and(
      eq(equipment.calibrationRequired, true),
      lte(equipment.nextCalibrationDate, targetDate)
    ),
    orderBy: asc(equipment.nextCalibrationDate),
  });
}
```

### 교정 완료 후 자동 처리

```typescript
async onCalibrationApproved(calibration: Calibration) {
  // 1. 장비 상태 업데이트
  await this.equipmentService.update(calibration.equipmentId, {
    lastCalibrationDate: calibration.calibrationDate,
    nextCalibrationDate: calibration.nextCalibrationDate,
    status: 'available',  // 교정중 → 사용가능
  });

  // 2. 이력 기록
  await this.historyService.createCalibrationHistory(calibration);

  // 3. 교정계획서 항목 실적 반영
  await this.calibrationPlanService.updateActualDate(
    calibration.equipmentId,
    calibration.calibrationDate
  );

  // 4. 보정계수 있으면 관리대장 업데이트
  if (calibration.hasCalibrationFactor) {
    await this.calibrationFactorService.createFromCalibration(calibration);
  }
}
```

### 교정 장비 보호 (UL-QP-18 Section 8.9)

교정 완료 장비의 외부 조정 방지:

```typescript
// 교정 봉인 상태 관리
interface CalibrationSeal {
  equipmentId: string;
  sealNumber: string;
  appliedAt: Date;
  appliedBy: string;
  isIntact: boolean;
  brokenAt?: Date;
  brokenReason?: string;
}

// 봉인 파손 시 처리
async reportSealBroken(equipmentId: string, reason: string, user: User) {
  // 1. 봉인 상태 업데이트
  await this.sealService.markBroken(equipmentId, reason, user.id);

  // 2. 기술책임자에게 알림
  await this.notificationService.notifyTechnicalManagers(
    equipment.teamId,
    `장비 ${equipment.name}의 교정 봉인이 파손되었습니다.`
  );

  // 3. 부적합 검토 필요 플래그
  await this.equipmentService.flagForReview(equipmentId, 'seal_broken');
}
```
