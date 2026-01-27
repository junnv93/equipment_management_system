# 시험설비 이력카드 (UL-QP-18-02)

> ⚠️ **문서 성격**: 이 문서는 UL-QP-18 절차서 기반의 **요구사항 정의서**입니다.
> 데이터 스키마와 구현 가이드는 절차서 요구사항을 반영한 설계 방향을 제시합니다.
> 실제 구현 시 `packages/db/src/schema/` 및 관련 서비스 코드를 참조하세요.

## 목차

1. [개요](#개요)
2. [필수 항목](#필수-항목)
3. [이력 기록 항목](#이력-기록-항목)
4. [데이터 스키마](#데이터-스키마)
5. [구현 가이드](#구현-가이드)

---

## 개요

시험설비 이력카드는 장비의 전 생애주기 이력을 관리하는 핵심 문서이다.

**관리 주체**: 시험실무자
**갱신 시점**: 장비의 이동, 주요 부품 변동, 수리 보수 발생 시마다
**보존 연한**: **영구**

---

## 필수 항목 (UL-QP-18 Section 7.7)

| No  | 항목 (한글)                       | 항목 (영문)                      | 필수 |
| --- | --------------------------------- | -------------------------------- | :--: |
| 1   | 장비 명(모델명)                   | Equipment name (model name)      |  ✅  |
| 2   | 유형 구분 또는 기타 고유 식별표시 | Type identification              |  ✅  |
| 3   | 제조업체명, 공급업체명            | Manufacturer, supplier name      |  ✅  |
| 4   | 시방일치 여부                     | Specification agreement          |  ✅  |
| 5   | 부속품 및 주요 기능               | Accessories and main functions   |  ⬜  |
| 6   | 교정 필요 여부 및 교정 주기       | Calibration necessity and period |  ✅  |
| 7   | 관련 소프트웨어(펌웨어) 및 매뉴얼 | Related software and manuals     |  ⬜  |
| 8   | 운영책임자(정, 부)                | Operating Officer (Main, Deputy) |  ✅  |
| 9   | 설치 위치, 설치 일자              | Installation location, date      |  ✅  |
| 10  | 이력 기록                         | History records                  |  ✅  |

---

## 이력 기록 항목

이력 기록(항목 10)에 포함되어야 하는 내용:

### 위치 변동 (Location Change)

```typescript
{
  type: 'location_change';
  previousLocation: string;    // 이전 위치
  newLocation: string;         // 새 위치
  movedAt: Date;               // 이동일
  movedBy: string;             // 이동 처리자
  reason?: string;             // 이동 사유
}
```

### 교정 이력 (Calibration)

```typescript
{
  type: 'calibration';
  calibrationDate: Date;       // 교정일
  calibrationMethod: 'external_calibration' | 'self_inspection';
  calibrationAgency?: string;  // 교정기관 (외부 교정 시)
  result: 'pass' | 'fail';
  certificateNumber?: string;  // 교정성적서 번호
  nextCalibrationDate: Date;   // 차기 교정일
  calibrationBy: string;       // 교정 담당자
}
```

### 유지보수/수리 (Maintenance/Repair)

```typescript
{
  type: 'maintenance' | 'repair';
  performedAt: Date;           // 수행일
  description: string;         // 수리/유지보수 내용
  partsReplaced?: string[];    // 교체 부품
  performedBy: string;         // 수행자
  cost?: number;               // 비용
  vendor?: string;             // 수리업체
}
```

### 파손/오작동 (Breakage/Malfunction)

```typescript
{
  type: 'breakage' | 'malfunction';
  discoveredAt: Date;          // 발견일
  description: string;         // 증상/내용
  discoveredBy: string;        // 발견자
  affectedTests?: string[];    // 영향받은 시험 (있는 경우)
  nonConformanceId?: string;   // 부적합 보고서 ID
}
```

### 부품 변동 (Parts Change)

```typescript
{
  type: 'parts_change';
  changedAt: Date; // 변경일
  previousPart: string; // 이전 부품
  newPart: string; // 새 부품
  reason: string; // 변경 사유
  changedBy: string; // 변경 처리자
}
```

---

## 데이터 스키마

### 장비 기본 정보 (equipment 테이블)

```typescript
// 시험설비 이력카드 기본 정보 필드
{
  // 항목 1: 장비명(모델명)
  name: string;
  modelName: string;

  // 항목 2: 유형/고유 식별표시
  equipmentType: string;
  serialNumber: string;
  managementNumber: string;  // 관리번호

  // 항목 3: 제조업체/공급업체
  manufacturer: string;
  supplier?: string;

  // 항목 4: 시방일치 여부
  specificationMatch: boolean;
  specificationNotes?: string;

  // 항목 5: 부속품/주요 기능
  accessories?: string;
  mainFunctions?: string;

  // 항목 6: 교정 필요 여부/주기
  calibrationRequired: boolean;
  calibrationCycle?: number;  // 월 단위
  calibrationMethod: CalibrationMethodEnum;

  // 항목 7: 관련 소프트웨어/매뉴얼
  softwareVersion?: string;
  firmwareVersion?: string;
  manualLocation?: string;

  // 항목 8: 운영책임자
  primaryOperatorId: string;    // 정
  secondaryOperatorId?: string; // 부

  // 항목 9: 설치 위치/일자
  currentLocation: string;
  locationCode: string;
  installationDate?: Date;
}
```

### 이력 테이블 (equipment_history)

```typescript
// 항목 10: 이력 기록용 별도 테이블
{
  uuid: string;
  equipmentId: string;
  historyType: 'location_change' |
    'calibration' |
    'maintenance' |
    'repair' |
    'breakage' |
    'malfunction' |
    'parts_change';
  occurredAt: Date;
  description: string;
  details: Record<string, any>; // JSON 상세 정보
  recordedBy: string;
  recordedAt: Date;
}
```

---

## 구현 가이드

### 이력 자동 기록

다음 이벤트 발생 시 자동으로 이력 생성:

```typescript
// 위치 변경 시
async updateLocation(equipmentId: string, newLocation: string, user: User) {
  const equipment = await this.findOne(equipmentId);

  // 이력 기록
  await this.historyService.create({
    equipmentId,
    historyType: 'location_change',
    occurredAt: new Date(),
    description: `위치 변경: ${equipment.currentLocation} → ${newLocation}`,
    details: {
      previousLocation: equipment.currentLocation,
      newLocation,
    },
    recordedBy: user.id,
  });

  // 장비 정보 업데이트
  await this.update(equipmentId, { currentLocation: newLocation });
}
```

### 교정 완료 시 이력 기록

```typescript
async onCalibrationCompleted(calibration: Calibration) {
  await this.historyService.create({
    equipmentId: calibration.equipmentId,
    historyType: 'calibration',
    occurredAt: calibration.calibrationDate,
    description: `${calibration.calibrationMethod === 'external_calibration' ? '외부' : '자체'} 교정 완료`,
    details: {
      calibrationDate: calibration.calibrationDate,
      calibrationMethod: calibration.calibrationMethod,
      calibrationAgency: calibration.calibrationAgency,
      result: calibration.result,
      certificateNumber: calibration.certificateNumber,
      nextCalibrationDate: calibration.nextCalibrationDate,
    },
    recordedBy: calibration.approvedBy,
  });
}
```

### 부적합 발생 시 이력 기록

```typescript
async onNonConformanceCreated(nc: NonConformance) {
  await this.historyService.create({
    equipmentId: nc.equipmentId,
    historyType: nc.type === 'breakage' ? 'breakage' : 'malfunction',
    occurredAt: nc.discoveredAt,
    description: nc.description,
    details: {
      discoveredBy: nc.discoveredBy,
      symptoms: nc.symptoms,
      nonConformanceId: nc.uuid,
    },
    recordedBy: nc.createdBy,
  });
}
```

### 이력 조회 API

```typescript
// 장비별 이력 조회
GET /equipment/:uuid/history?type=calibration&from=2025-01-01&to=2025-12-31

// 응답
{
  data: [
    {
      uuid: "...",
      historyType: "calibration",
      occurredAt: "2025-06-15",
      description: "외부 교정 완료",
      details: {...},
      recordedBy: { name: "홍길동" },
      recordedAt: "2025-06-15T10:30:00Z"
    },
    // ...
  ],
  meta: { total: 15, page: 1, limit: 20 }
}
```

### 이력카드 PDF 출력

이력카드 출력 시 포함 항목:

1. 장비 기본 정보 (항목 1-9)
2. 이력 목록 (최신순, 유형별 필터 가능)
3. QR 코드 (장비 상세 페이지 링크)
4. 출력일 및 출력자 정보
