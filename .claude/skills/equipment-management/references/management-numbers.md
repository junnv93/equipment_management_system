# 관리번호 및 위치 코드 (UL-QP-18 Section 7.5, 부록 A)

## 목차

1. [관리번호 체계](#관리번호-체계)
2. [시험소 코드](#시험소-코드)
3. [분류 코드](#분류-코드)
4. [위치 코드](#위치-코드)
5. [구현 가이드](#구현-가이드)

---

## 관리번호 체계

### 형식

```
XXX – X YYYY
 │    │  └── 일련번호 (4자리)
 │    └───── 분류코드 (1자리)
 └────────── 시험소코드 (3자리)
```

### 예시
- `SUW-E0001`: 수원 시험소, FCC EMC/RF 분야, 일련번호 0001
- `UIW-R0042`: 의왕 시험소, General EMC 분야, 일련번호 0042
- `PYT-A0003`: 평택 시험소, Automotive EMC 분야, 일련번호 0003

---

## 시험소 코드

| 코드 | 시험소 | 영문 |
|------|--------|------|
| `SUW` | 수원 | Suwon |
| `UIW` | 의왕 | Uiwang |
| `PYT` | 평택 | Pyeongtaek |

### 코드 매핑

```typescript
enum SiteCodeEnum {
  SUW = 'SUW',  // 수원
  UIW = 'UIW',  // 의왕
  PYT = 'PYT',  // 평택
}

const SITE_CODE_TO_NAME: Record<SiteCodeEnum, string> = {
  [SiteCodeEnum.SUW]: 'suwon',
  [SiteCodeEnum.UIW]: 'uiwang',
  [SiteCodeEnum.PYT]: 'pyeongtaek',
};

const SITE_CODE_TO_KOREAN: Record<SiteCodeEnum, string> = {
  [SiteCodeEnum.SUW]: '수원',
  [SiteCodeEnum.UIW]: '의왕',
  [SiteCodeEnum.PYT]: '평택',
};
```

---

## 분류 코드

| 코드 | 분류 | 설명 |
|------|------|------|
| `E` | FCC EMC/RF | FCC 관련 EMC/RF 장비 |
| `R` | General EMC | 일반 EMC 장비 |
| `W` | General RF | 일반 RF 장비 |
| `S` | SAR | SAR(비흡수율) 측정 장비 |
| `A` | Automotive EMC | 자동차 EMC 장비 |
| `P` | Software Program | 소프트웨어 프로그램 |

### 코드 매핑

```typescript
enum ClassificationCodeEnum {
  E = 'E',  // FCC EMC/RF
  R = 'R',  // General EMC
  W = 'W',  // General RF
  S = 'S',  // SAR
  A = 'A',  // Automotive EMC
  P = 'P',  // Software Program
}

const CLASSIFICATION_CODE_LABELS: Record<ClassificationCodeEnum, string> = {
  [ClassificationCodeEnum.E]: 'FCC EMC/RF',
  [ClassificationCodeEnum.R]: 'General EMC',
  [ClassificationCodeEnum.W]: 'General RF',
  [ClassificationCodeEnum.S]: 'SAR',
  [ClassificationCodeEnum.A]: 'Automotive EMC',
  [ClassificationCodeEnum.P]: 'Software Program',
};
```

---

## 위치 코드

### 수원시험소 (SUW)

| 코드 | 위치 |
|------|------|
| 11 | Reception Area |
| 12 | Chamber 1 Room |
| 13 | Sample Room |
| 14 | Chamber 2 Room |
| 15 | RF1 Room |
| 16 | RF2 Room |
| 17 | RF3 Room |
| 18 | EMI Room |
| 21 | SAR 1 Room |
| 22 | SAR 2 Room |
| 23 | SAR 3 Room |
| 24 | SAR 4 Room |
| 25 | SAR Tissue Room |
| 41 | Chamber 4 (mmWave Chamber 1) |
| 42 | Chamber 5 (mmWave Chamber 2) |

### 의왕시험소 (UIW)

| 코드 | 위치 |
|------|------|
| 01 | Main server (의왕 공통) |
| 02 | Back Up Server (의왕 공통) |
| 31 | Office |
| 32 | Document Warehouse |
| 33 | HAC Room |
| 34 | SAR Room |
| 35 | SAR Tissue Room |
| 51 | 신관 EMC Chamber (Chamber 3) |
| 52 | 신관 RSE Chamber |
| 53 | 신관 RF Test Room |
| 54 | 신관 EMS Shield Room1 |
| 55 | 신관 EMS Shield Room2 |
| 56 | 10m Chamber |
| 61 | Automotive Chamber |
| 62 | Automotive Shield Room |
| 101 | 1층 EMS Shield Room 1 |
| 102 | 1층 EMS Shield Room 2 |
| 103 | 3m Chamber 1 |
| 104 | 3m Chamber 2 |
| 105 | RSE Chamber |
| 106 | 10m Chamber |
| 107 | RF Shield Room |
| 301 | Document Warehouse |

### 평택시험소 (PYT)

| 코드 | 위치 |
|------|------|
| 201 | Battery Chamber 1 |
| 202 | Battery Chamber 2 |
| 203 | High Voltage Chamber 1 |
| 204 | High Voltage Chamber 2 |
| 205 | Shield Room 1 |
| 206 | Shield Room 2 |
| 207 | Transient Immunity Room 1 |
| 208 | Transient Immunity Room 2 |
| 209 | Document Warehouse (PYT) |

---

## 구현 가이드

### 관리번호 생성

```typescript
async function generateManagementNumber(
  siteCode: SiteCodeEnum,
  classificationCode: ClassificationCodeEnum
): Promise<string> {
  // 해당 시험소/분류의 최대 일련번호 조회
  const lastEquipment = await db.query.equipment.findFirst({
    where: and(
      eq(equipment.siteCode, siteCode),
      eq(equipment.classificationCode, classificationCode)
    ),
    orderBy: desc(equipment.serialNumber),
  });

  const nextSerial = lastEquipment
    ? lastEquipment.serialNumber + 1
    : 1;

  const serialStr = nextSerial.toString().padStart(4, '0');

  return `${siteCode}-${classificationCode}${serialStr}`;
}
```

### 관리번호 파싱

```typescript
interface ParsedManagementNumber {
  siteCode: SiteCodeEnum;
  classificationCode: ClassificationCodeEnum;
  serialNumber: number;
}

function parseManagementNumber(managementNumber: string): ParsedManagementNumber | null {
  const regex = /^(SUW|UIW|PYT)-([ERWSAP])(\d{4})$/;
  const match = managementNumber.match(regex);

  if (!match) return null;

  return {
    siteCode: match[1] as SiteCodeEnum,
    classificationCode: match[2] as ClassificationCodeEnum,
    serialNumber: parseInt(match[3], 10),
  };
}
```

### 위치 코드 데이터

```typescript
const LOCATION_CODES: Record<SiteCodeEnum, Record<string, string>> = {
  [SiteCodeEnum.SUW]: {
    '11': 'Reception Area',
    '12': 'Chamber 1 Room',
    '13': 'Sample Room',
    '14': 'Chamber 2 Room',
    '15': 'RF1 Room',
    '16': 'RF2 Room',
    '17': 'RF3 Room',
    '18': 'EMI Room',
    '21': 'SAR 1 Room',
    '22': 'SAR 2 Room',
    '23': 'SAR 3 Room',
    '24': 'SAR 4 Room',
    '25': 'SAR Tissue Room',
    '41': 'Chamber 4 (mmWave Chamber 1)',
    '42': 'Chamber 5 (mmWave Chamber 2)',
  },
  [SiteCodeEnum.UIW]: {
    '01': 'Main server',
    '02': 'Back Up Server',
    '31': 'Office',
    '32': 'Document Warehouse',
    '33': 'HAC Room',
    '34': 'SAR Room',
    '35': 'SAR Tissue Room',
    '51': '신관 EMC Chamber (Chamber 3)',
    '52': '신관 RSE Chamber',
    '53': '신관 RF Test Room',
    '54': '신관 EMS Shield Room1',
    '55': '신관 EMS Shield Room2',
    '56': '10m Chamber',
    '61': 'Automotive Chamber',
    '62': 'Automotive Shield Room',
    '101': '1층 EMS Shield Room 1',
    '102': '1층 EMS Shield Room 2',
    '103': '3m Chamber 1',
    '104': '3m Chamber 2',
    '105': 'RSE Chamber',
    '106': '10m Chamber',
    '107': 'RF Shield Room',
    '301': 'Document Warehouse',
  },
  [SiteCodeEnum.PYT]: {
    '201': 'Battery Chamber 1',
    '202': 'Battery Chamber 2',
    '203': 'High Voltage Chamber 1',
    '204': 'High Voltage Chamber 2',
    '205': 'Shield Room 1',
    '206': 'Shield Room 2',
    '207': 'Transient Immunity Room 1',
    '208': 'Transient Immunity Room 2',
    '209': 'Document Warehouse',
  },
};

// 위치 코드 → 위치명 변환
function getLocationName(siteCode: SiteCodeEnum, locationCode: string): string {
  return LOCATION_CODES[siteCode]?.[locationCode] ?? locationCode;
}

// 시험소별 위치 목록 조회
function getLocationOptions(siteCode: SiteCodeEnum): { value: string; label: string }[] {
  const locations = LOCATION_CODES[siteCode] ?? {};
  return Object.entries(locations).map(([code, name]) => ({
    value: code,
    label: `${code} - ${name}`,
  }));
}
```

### 관리번호 검증

```typescript
function validateManagementNumber(managementNumber: string): boolean {
  const regex = /^(SUW|UIW|PYT)-[ERWSAP]\d{4}$/;
  return regex.test(managementNumber);
}

// DTO에서 사용
class CreateEquipmentDto {
  @IsString()
  @Matches(/^(SUW|UIW|PYT)-[ERWSAP]\d{4}$/, {
    message: '관리번호 형식이 올바르지 않습니다. (예: SUW-E0001)',
  })
  managementNumber: string;
}
```

### 중복 검증

```typescript
async function isManagementNumberUnique(managementNumber: string): Promise<boolean> {
  const existing = await db.query.equipment.findFirst({
    where: eq(equipment.managementNumber, managementNumber),
  });
  return !existing;
}
```

### 장비관리표 부착 예외 처리 (UL-QP-18 Section 7.4)

장비 크기 문제 등으로 장비관리표 부착이 어려운 경우:

```typescript
interface Equipment {
  // ...
  hasManagementLabel: boolean;      // 장비관리표 부착 여부
  labelException: boolean;          // 예외 적용 여부
  labelExceptionReason?: string;    // 예외 사유
}

// 예외 적용 시 시험설비 관리대장(UL-QP-18-01)에 기록 필수
```
