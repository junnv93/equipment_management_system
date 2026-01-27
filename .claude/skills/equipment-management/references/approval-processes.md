# 승인 프로세스 상세

> ⚠️ **문서 성격**: 이 문서는 UL-QP-18 절차서 기반의 **설계 가이드**입니다.
> 코드 예시는 개념적인 참고용이며, 실제 구현과 세부 사항이 다를 수 있습니다.
> 정확한 구현 내용은 해당 서비스 코드를 직접 확인하세요.

## 목차

1. [공통 규칙](#공통-규칙)
2. [장비 등록/수정/삭제](#장비-등록수정삭제)
3. [교정 기록](#교정-기록)
4. [시험소 내 대여](#시험소-내-대여)
5. [반출/반입](#반출반입)
6. [보정계수](#보정계수)
7. [부적합 장비](#부적합-장비)
8. [소프트웨어 변경](#소프트웨어-변경)
9. [교정계획서](#교정계획서)

---

## 공통 규칙

### 반려 사유 필수

```typescript
// 모든 반려에는 사유 필수 (최소 10자 권장)
@IsString()
@MinLength(10, { message: '반려 사유는 최소 10자 이상 입력해주세요' })
reason: string;
```

### 다중 승인자 선착순 처리

```typescript
// Optimistic Locking으로 중복 승인 방지
async approve(uuid: string, userId: string) {
  const result = await this.db.transaction(async (tx) => {
    const request = await tx.query.requests.findFirst({
      where: eq(requests.uuid, uuid),
    });

    if (request.status !== 'pending') {
      throw new ConflictException('이미 처리된 요청입니다');
    }

    return tx.update(requests)
      .set({
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        version: request.version + 1,
      })
      .where(and(
        eq(requests.uuid, uuid),
        eq(requests.version, request.version)
      ));
  });

  if (result.rowCount === 0) {
    throw new ConflictException('다른 승인자가 먼저 처리했습니다');
  }
}
```

### 요청 취소

```typescript
// pending 상태에서만 신청자 본인이 취소 가능
async cancel(uuid: string, userId: string) {
  const request = await this.findOne(uuid);

  if (request.requestedBy !== userId) {
    throw new ForbiddenException('본인의 요청만 취소할 수 있습니다');
  }

  if (request.status !== 'pending') {
    throw new BadRequestException('대기 중인 요청만 취소할 수 있습니다');
  }

  return this.update(uuid, { status: 'canceled' });
}
```

---

## 장비 등록/수정/삭제

### 상태 흐름

```
[시험실무자 요청]
    ↓
pending_approval
    ↓
┌───────────────────┐
│ 기술책임자 검토   │
├───────────────────┤
│ ✅ 승인 → approved │
│ ❌ 반려 → rejected │
└───────────────────┘
```

### 필수 첨부 파일

| 등록 유형 | 필수 첨부     |
| --------- | ------------- |
| 신규 장비 | 검수보고서    |
| 기존 장비 | 장비 이력카드 |

### 필수 필드 (장비 등록)

```typescript
{
  name: string;                    // 장비 명칭
  managementNumber: string;        // 관리번호
  site: 'suwon' | 'uiwang';        // 시험소
  teamId: string;                  // 관리 팀
  equipmentType: string;           // 장비타입
  serialNumber: string;            // 시리얼넘버
  modelName: string;               // 모델명
  currentLocation: string;         // 현재 위치
  calibrationMethod: string;       // 교정방법
  lastCalibrationDate?: Date;      // 교정일자
  calibrationResult?: string;      // 교정결과
  nextCalibrationDate?: Date;      // 차기 교정일
  intermediateCheckDate?: Date;    // 중간점검일정
  softwareVersion?: string;        // 소프트웨어/펌웨어 버전
  repairHistory?: string;          // 장비 수리 내역
}
```

### 예외: 시험소 관리자 자체 승인

```typescript
async create(dto: CreateEquipmentDto, user: User) {
  // lab_manager은 즉시 승인 상태로 생성
  const approvalStatus = user.role === UserRoleEnum.LAB_MANAGER
    ? 'approved'
    : 'pending_approval';

  const approvedBy = user.role === UserRoleEnum.LAB_MANAGER
    ? user.id
    : null;

  return this.db.insert(equipment).values({
    ...dto,
    approvalStatus,
    approvedBy,
    requestedBy: user.id,
  });
}
```

---

## 교정 기록

### 상태 흐름 (역할별)

**기술책임자/시험소 관리자 직접 등록**:

```
[기술책임자 등록 (registrarComment 필수)]
    ↓
approved (즉시)
```

**시험실무자 등록**:

```
[시험실무자 등록]
    ↓
pending_approval
    ↓
┌───────────────────────────────────┐
│ 기술책임자 검토                   │
├───────────────────────────────────┤
│ ✅ 승인 (approverComment 필수)    │
│ ❌ 반려 (reason 필수)             │
└───────────────────────────────────┘
```

### 구현 코드

```typescript
async create(dto: CreateCalibrationDto, user: User) {
  const isTechnicalOrHigher = [
    UserRoleEnum.TECHNICAL_MANAGER,
    UserRoleEnum.LAB_MANAGER,
  ].includes(user.role);

  if (isTechnicalOrHigher) {
    // 기술책임자/관리자: Comment 필수 검증
    if (!dto.registrarComment || dto.registrarComment.length < 5) {
      throw new BadRequestException('기술책임자 등록 시 코멘트는 필수입니다');
    }

    return this.db.insert(calibrations).values({
      ...dto,
      approvalStatus: 'approved',
      registeredBy: user.id,
      registeredByRole: user.role,
      approvedBy: user.id,
      approvedAt: new Date(),
    });
  }

  // 시험실무자: 승인 대기 상태
  return this.db.insert(calibrations).values({
    ...dto,
    approvalStatus: 'pending_approval',
    registeredBy: user.id,
    registeredByRole: user.role,
  });
}

async approve(uuid: string, dto: ApproveCalibrationDto, user: User) {
  // Comment 필수 검증
  if (!dto.approverComment || dto.approverComment.length < 5) {
    throw new BadRequestException('승인 시 코멘트는 필수입니다');
  }

  return this.db.update(calibrations)
    .set({
      approvalStatus: 'approved',
      approvedBy: user.id,
      approverComment: dto.approverComment,
      approvedAt: new Date(),
    })
    .where(eq(calibrations.uuid, uuid));
}
```

---

## 시험소 내 대여

### 상태 흐름

```
[모든 사용자 신청]
    ↓
pending
    ↓
┌─────────────────────────────────────┐
│ 장비 소유 팀의 시험실무자/기술책임자 │
├─────────────────────────────────────┤
│ ✅ 승인 → approved → active         │
│ ❌ 반려 → rejected                   │
└─────────────────────────────────────┘
    ↓
returned (반납 시)
```

### 동일 팀 자동 승인

```typescript
async create(dto: CreateRentalDto, user: User) {
  const equipment = await this.equipmentService.findOne(dto.equipmentId);

  // 동일 팀이면 자동 승인
  if (equipment.teamId === user.teamId) {
    return this.db.insert(rentals).values({
      ...dto,
      status: 'approved',
      autoApproved: true,
      requestedBy: user.id,
      approvedBy: user.id,
      approvedAt: new Date(),
    });
  }

  return this.db.insert(rentals).values({
    ...dto,
    status: 'pending',
    autoApproved: false,
    requestedBy: user.id,
  });
}
```

---

## 반출/반입

### 반출 유형

| 유형 코드              | 설명           | 승인 단계 |
| ---------------------- | -------------- | --------- |
| `internal_calibration` | 내부 교정 목적 | 1단계     |
| `internal_repair`      | 내부 수리 목적 | 1단계     |
| `inter_site_rental`    | 시험소간 대여  | 2단계     |

### 내부 목적 반출 (1단계)

```
[시험실무자 신청]
    ↓
pending
    ↓
[기술책임자 승인]
    ↓
approved
    ↓
checked_out (반출 처리)
    ↓
returned (반입 검사 완료)
    ↓
[기술책임자 반입 승인]
    ↓
return_approved
```

### 시험소간 대여 (1단계 승인으로 통합)

```
[빌리는 측 시험실무자 신청]
    ↓
pending
    ↓
[빌려주는 측 기술책임자 승인]
    ↓
approved
    ↓
checked_out
    ↓
returned (양측 확인 필요)
    ↓
return_approved
```

### 반입 검사 필수 항목

| 반출 유형              | calibrationChecked | repairChecked | workingStatusChecked |
| ---------------------- | :----------------: | :-----------: | :------------------: |
| `internal_calibration` |      ✅ 필수       |      ❌       |       ✅ 필수        |
| `internal_repair`      |         ❌         |    ✅ 필수    |       ✅ 필수        |
| `inter_site_rental`    |      ✅ 필수       |      ❌       |       ✅ 필수        |

### 시험소간 대여 반입 양측 확인

```typescript
// 빌린 측 반입 등록
async registerReturn(uuid: string, dto: ReturnDto, user: User) {
  const checkout = await this.findOne(uuid);

  await this.db.update(checkouts)
    .set({
      status: 'returned',
      returnedAt: new Date(),
      returnedBy: user.id,
      calibrationChecked: dto.calibrationChecked,
      workingStatusChecked: dto.workingStatusChecked,
      inspectionNotes: dto.inspectionNotes,
    })
    .where(eq(checkouts.uuid, uuid));
}

// 빌려준 측 확인
async confirmByLender(uuid: string, dto: LenderConfirmDto, user: User) {
  const checkout = await this.findOne(uuid);

  if (checkout.lenderTeamId !== user.teamId) {
    throw new ForbiddenException('빌려준 측만 확인할 수 있습니다');
  }

  await this.db.update(checkouts)
    .set({
      lenderConfirmedBy: user.id,
      lenderConfirmedAt: new Date(),
      lenderConfirmNotes: dto.notes,
    })
    .where(eq(checkouts.uuid, uuid));
}

// 최종 반입 승인 (기술책임자)
async approveReturn(uuid: string, user: User) {
  const checkout = await this.findOne(uuid);

  // 시험소간 대여는 양측 확인 필요
  if (checkout.checkoutType === 'inter_site_rental' && !checkout.lenderConfirmedBy) {
    throw new BadRequestException('빌려준 측 확인이 필요합니다');
  }

  await this.db.update(checkouts)
    .set({
      status: 'return_approved',
      returnApprovedBy: user.id,
      returnApprovedAt: new Date(),
    })
    .where(eq(checkouts.uuid, uuid));

  // 장비 상태 복원
  await this.equipmentService.updateStatus(checkout.equipmentId, 'available');
}
```

---

## 보정계수

### 상태 흐름

```
[시험실무자 변경 요청]
    ↓
pending
    ↓
[기술책임자 승인]
    ↓
approved (이전 보정계수 만료, 새 보정계수 적용)
```

### 보정계수 유형

```typescript
enum CalibrationFactorTypeEnum {
  ANTENNA_GAIN = 'antenna_gain', // 안테나 이득
  CABLE_LOSS = 'cable_loss', // 케이블 손실
  PATH_LOSS = 'path_loss', // 경로 손실
  AMPLIFIER_GAIN = 'amplifier_gain', // 증폭기 이득
  OTHER = 'other', // 기타
}
```

### 다중 파라미터 지원

```typescript
// parameters JSON 구조 예시
{
  "frequency": "3GHz",
  "temperature": "25C",
  "values": [1.2, 1.3, 1.4],
  "unit": "dB"
}
```

---

## 부적합 장비

### 상태 흐름

```
[시험실무자 발견 및 등록]
    ↓
open (장비 상태: non_conforming)
    ↓
analyzing (원인 분석 중)
    ↓
corrected (조치 완료)
    ↓
[기술책임자 종료 승인]
    ↓
closed (장비 상태: available 복원)
```

### 부적합 장비 제한

```typescript
// 대여/반출 서비스에서 부적합 장비 차단
async validateEquipmentStatus(equipmentId: string) {
  const equipment = await this.equipmentService.findOne(equipmentId);

  if (equipment.status === 'non_conforming') {
    throw new BadRequestException(
      '부적합 장비는 대여/반출이 불가합니다. 부적합 처리 완료 후 시도해주세요.'
    );
  }
}
```

---

## 소프트웨어 변경

### 상태 흐름

```
[시험실무자 변경 요청 (검증 기록 필수)]
    ↓
pending
    ↓
[기술책임자 승인]
    ↓
approved
```

### 필수 필드

```typescript
{
  equipmentId: string;
  softwareName: string;
  previousVersion: string;
  newVersion: string;
  verificationRecord: string; // 검증 기록 필수
}
```

---

## 교정계획서

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
[시험소장(lab_manager) 승인]
    ↓
approved
```

### 대상 장비

- `calibrationMethod = 'external_calibration'` 인 장비만 포함
- 해당 연도에 교정 예정인 장비 자동 로드

### 항목 확인

```typescript
// 기술책임자 항목별 확인
async confirmItem(planUuid: string, itemUuid: string, user: User) {
  if (![UserRoleEnum.TECHNICAL_MANAGER, UserRoleEnum.LAB_MANAGER].includes(user.role)) {
    throw new ForbiddenException('기술책임자 이상만 확인할 수 있습니다');
  }

  await this.db.update(calibrationPlanItems)
    .set({
      confirmedBy: user.id,
      confirmedAt: new Date(),
    })
    .where(eq(calibrationPlanItems.uuid, itemUuid));
}
```

### 실제 교정일 자동 기록

```typescript
// 교정 완료 시 교정계획서 항목에 자동 기록
async onCalibrationCompleted(equipmentId: string, calibrationDate: Date) {
  const currentYear = new Date().getFullYear();

  await this.db.update(calibrationPlanItems)
    .set({
      actualCalibrationDate: calibrationDate,
    })
    .where(and(
      eq(calibrationPlanItems.equipmentId, equipmentId),
      sql`EXTRACT(YEAR FROM ${calibrationPlanItems.plannedCalibrationDate}) = ${currentYear}`
    ));
}
```
