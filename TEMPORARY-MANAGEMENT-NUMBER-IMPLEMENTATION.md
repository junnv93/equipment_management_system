# 임시 관리번호 체계 구현 완료

**날짜**: 2026-01-30
**구현자**: Claude Sonnet 4.5
**목적**: 공용/렌탈 장비에 대한 임시 관리번호 체계 및 소유처 원본 번호 추적 시스템 구축

---

## 🎯 구현 개요

### 문제 정의

공용/렌탈 장비에 우리 팀 관리번호를 부여할 때 발생하는 문제:

1. ❌ 정규 관리번호 사용 시 일련번호 소진 (9999개 제한)
2. ❌ 임시 사용 후 영구 번호 낭비
3. ❌ 임시 vs 정규 장비 구분 어려움
4. ❌ 소유처 원본 번호 추적 불가

### 해결 방안

✅ **임시 관리번호 체계 (TEMP-XXX-XYYYY) 도입**

- 정규 번호와 명확히 구분
- 별도 일련번호 카운터 관리
- 소유처 원본 번호 병기

---

## 📐 구현 내용

### 1. Schema 확장 ✅

#### packages/schemas/src/enums.ts

```typescript
// 임시 관리번호 프리픽스
export const TEMPORARY_EQUIPMENT_PREFIX = 'TEMP-' as const;

// 임시 관리번호 정규식 패턴
export const TEMPORARY_MANAGEMENT_NUMBER_PATTERN = /^TEMP-(SUW|UIW|PYT)-[ERWSAP]\d{4}$/;

// 임시 관리번호 생성 함수
export function generateTemporaryManagementNumber(
  site: Site,
  classification: Classification,
  serialNumber: string
): string;

// 임시 관리번호 파싱 함수
export function parseTemporaryManagementNumber(managementNumber: string): ParsedComponents | null;

// 임시 관리번호 확인 함수
export function isTemporaryManagementNumber(managementNumber: string): boolean;
```

#### packages/schemas/src/equipment.ts

```typescript
export const baseEquipmentSchema = z.object({
  // ... 기존 필드
  externalIdentifier: z.string().optional().nullable(), // 소유처 원본 식별번호
});
```

#### packages/db/src/schema/equipment.ts

```typescript
export const equipment = pgTable('equipment', {
  // ... 기존 필드
  externalIdentifier: varchar('external_identifier', { length: 100 }),
});
```

### 2. Frontend UI 확장 ✅

#### EquipmentForm.tsx (임시등록 폼)

```typescript
// 소유처 원본 식별번호 입력 필드 추가
<div className="space-y-2">
  <Label htmlFor="externalIdentifier">
    소유처 원본 식별번호 (선택)
  </Label>
  <Input
    id="externalIdentifier"
    name="externalIdentifier"
    placeholder={
      equipmentType === 'common'
        ? '예: SAF-EQ-1234 (Safety팀 장비번호)'
        : '예: RNT-2024-001 (렌탈업체 번호)'
    }
  />
</div>
```

#### EquipmentCardGrid.tsx (목록 표시)

```typescript
{/* 소유처 원본 번호 표시 */}
{equipment.isShared && equipment.externalIdentifier && (
  <div className="flex items-center gap-2 text-muted-foreground">
    <Package className="h-3.5 w-3.5" />
    <dd className="truncate">{equipment.externalIdentifier}</dd>
  </div>
)}
```

#### BasicInfoTab.tsx (상세 표시)

```typescript
{/* 소유처 원본 번호 */}
{equipment.isShared && equipment.externalIdentifier && (
  <InfoField
    label="소유처 원본 번호"
    value={equipment.externalIdentifier}
    icon={Package}
  />
)}
```

### 3. 데이터베이스 마이그레이션 ✅

```sql
-- 파일: drizzle/manual/20260130_add_external_identifier.sql

-- external_identifier 컬럼 추가
ALTER TABLE equipment
ADD COLUMN external_identifier VARCHAR(100);

-- 코멘트 추가
COMMENT ON COLUMN equipment.external_identifier IS
  '소유처 원본 식별번호 (공용장비: SAF-EQ-1234, 렌탈장비: RNT-2024-001)';

-- 인덱스 생성 (검색 최적화)
CREATE INDEX idx_equipment_external_identifier
ON equipment(external_identifier)
WHERE external_identifier IS NOT NULL;
```

---

## 🏗️ 데이터 구조

### 임시 관리번호 체계

| 관리번호 유형     | 형식           | 예시           | 용도              |
| ----------------- | -------------- | -------------- | ----------------- |
| **정규 관리번호** | XXX-XYYYY      | SUW-E0001      | 우리 팀 소유 장비 |
| **임시 관리번호** | TEMP-XXX-XYYYY | TEMP-SUW-E0001 | 공용/렌탈 장비    |

### Equipment 테이블 필드

```typescript
interface Equipment {
  // 우리 시스템 관리번호 (필수)
  managementNumber: string; // "TEMP-SUW-E0001" 또는 "SUW-E0001"

  // 소유처 원본 번호 (선택, 참고용)
  externalIdentifier?: string; // "SAF-EQ-1234" (Safety팀 번호)

  // 임시등록 정보
  status: EquipmentStatus; // 'temporary' | 'inactive' | ...
  isShared: boolean; // true (공용/렌탈 장비)
  sharedSource: SharedSource; // 'safety_lab' | 'external'
  owner: string; // "Safety팀" 또는 "렌탈업체명"

  // 사용 기간
  usagePeriodStart: Date;
  usagePeriodEnd: Date;
}
```

---

## 📊 사용 예시

### 1. 공용장비 (Safety팀)

```typescript
{
  managementNumber: 'TEMP-SUW-E0001',      // 우리 시스템 임시 번호
  externalIdentifier: 'SAF-EQ-1234',       // Safety팀 원본 번호
  isShared: true,
  sharedSource: 'safety_lab',
  owner: 'Safety팀',
  status: 'temporary',
  usagePeriodStart: '2026-02-01',
  usagePeriodEnd: '2026-04-30'
}
```

**UI 표시**:

```
관리번호: TEMP-SUW-E0001 (임시)
소유처 원본 번호: SAF-EQ-1234
소유: Safety팀
사용 기간: D-2 (2026-02-01 ~ 2026-04-30)
```

### 2. 렌탈장비 (외부)

```typescript
{
  managementNumber: 'TEMP-SUW-E0002',      // 우리 시스템 임시 번호
  externalIdentifier: 'RNT-2024-001',      // 렌탈업체 원본 번호
  isShared: true,
  sharedSource: 'external',
  owner: 'ABC 렌탈',
  status: 'temporary',
  usagePeriodStart: '2026-02-01',
  usagePeriodEnd: '2026-05-31'
}
```

**UI 표시**:

```
관리번호: TEMP-SUW-E0002 (임시)
소유처 원본 번호: RNT-2024-001
소유: ABC 렌탈
사용 기간: D-2 (2026-02-01 ~ 2026-05-31)
```

---

## 🔄 워크플로우

### 공용장비 등록/사용/반납 플로우

```
[등록]
/equipment/create-shared 접속
→ 장비 유형: "공용장비" 선택
→ 소유처: "Safety팀" 선택
→ 소유처 원본 번호: "SAF-EQ-1234" 입력 (선택)
→ 우리 관리번호: "TEMP-SUW-E0001" 자동 생성
→ 교정성적서 업로드 + 유효성 검증
→ 사용 기간 설정
→ status='temporary' 저장

[사용]
사용 신청 → 기술책임자 승인 → status='in_use'

[반납]
반납 요청 → 반납 승인 → status='inactive'
→ 3개월 후 자동 삭제 (선택)
```

### 렌탈장비 등록/입고/반출 플로우

```
[등록]
/equipment/create-shared 접속
→ 장비 유형: "렌탈장비" 선택
→ 소유처: "ABC 렌탈" 입력
→ 소유처 원본 번호: "RNT-2024-001" 입력 (선택)
→ 우리 관리번호: "TEMP-SUW-E0002" 자동 생성
→ 교정성적서 업로드 + 유효성 검증
→ 사용 기간 설정
→ status='temporary' 저장

[입고 검수]
입고 검수 폼 작성 (EquipmentConditionForm)
→ 기술책임자 확인
→ 반입 처리
→ status='available'

[반출]
4단계 상태 확인
→ status='inactive'
→ 3개월 후 자동 삭제 (선택)
```

---

## 🧪 테스트 가이드

### 1. 임시 관리번호 생성 테스트

```typescript
import { generateTemporaryManagementNumber } from '@equipment-management/schemas';

const tempNumber = generateTemporaryManagementNumber('suwon', 'fcc_emc_rf', '0001');
expect(tempNumber).toBe('TEMP-SUW-E0001');
```

### 2. 임시 관리번호 파싱 테스트

```typescript
import { parseTemporaryManagementNumber } from '@equipment-management/schemas';

const parsed = parseTemporaryManagementNumber('TEMP-SUW-E0001');
expect(parsed).toEqual({
  siteCode: 'SUW',
  site: 'suwon',
  classificationCode: 'E',
  classification: 'fcc_emc_rf',
  serialNumber: '0001',
});
```

### 3. UI 테스트 (E2E)

```typescript
test('should register temporary equipment with external identifier', async ({ page }) => {
  await page.goto('/equipment/create-shared');

  // 장비 유형 선택
  await page.click('input[value="common"]');

  // 소유처 선택
  await page.selectOption('select#owner', 'Safety팀');

  // 소유처 원본 번호 입력
  await page.fill('input#externalIdentifier', 'SAF-EQ-1234');

  // 폼 제출
  await page.click('button:has-text("등록")');

  // 상세 페이지에서 확인
  await expect(page.locator('text=SAF-EQ-1234')).toBeVisible();
});
```

---

## 📝 마이그레이션 실행 가이드

### 1. 마이그레이션 실행

```bash
# PostgreSQL 데이터베이스에 연결
cd apps/backend

# 마이그레이션 파일 실행
psql -U postgres -d equipment_management < drizzle/manual/20260130_add_external_identifier.sql

# 또는 pgAdmin / DBeaver 등 GUI 도구 사용
```

### 2. 확인

```sql
-- 컬럼 추가 확인
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'equipment' AND column_name = 'external_identifier';

-- 인덱스 생성 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'equipment' AND indexname = 'idx_equipment_external_identifier';
```

### 3. Rollback (필요시)

```sql
-- 인덱스 삭제
DROP INDEX IF EXISTS idx_equipment_external_identifier;

-- 컬럼 삭제
ALTER TABLE equipment DROP COLUMN IF EXISTS external_identifier;
```

---

## ✅ 변경된 파일 목록

### Schema & Database (3개)

1. ✅ `packages/schemas/src/enums.ts`

   - TEMPORARY_EQUIPMENT_PREFIX 상수 추가
   - TEMPORARY_MANAGEMENT_NUMBER_PATTERN 정규식 추가
   - generateTemporaryManagementNumber() 함수 추가
   - parseTemporaryManagementNumber() 함수 추가
   - isTemporaryManagementNumber() 함수 추가

2. ✅ `packages/schemas/src/equipment.ts`

   - externalIdentifier 필드 추가 (baseEquipmentSchema)

3. ✅ `packages/db/src/schema/equipment.ts`
   - externalIdentifier 컬럼 추가

### Frontend UI (3개)

4. ✅ `apps/frontend/components/equipment/EquipmentForm.tsx`

   - externalIdentifier 입력 필드 추가 (임시등록 모드)
   - FormValues 타입에 externalIdentifier 추가
   - processSubmit에 externalIdentifier 포함

5. ✅ `apps/frontend/components/equipment/BasicInfoSection.tsx`

   - FormValues 인터페이스에 externalIdentifier 추가

6. ✅ `apps/frontend/components/equipment/EquipmentCardGrid.tsx`

   - externalIdentifier 표시 (공용/렌탈 장비만)

7. ✅ `apps/frontend/components/equipment/BasicInfoTab.tsx`
   - externalIdentifier 필드 표시 (상세 페이지)

### Migration (1개)

8. ✅ `apps/backend/drizzle/manual/20260130_add_external_identifier.sql`
   - external_identifier 컬럼 추가 SQL
   - 인덱스 생성 SQL

---

## 🎓 핵심 인사이트

### 1. SSOT 패턴의 힘

관리번호 관련 모든 유틸리티 함수를 `enums.ts`에 집중:

- ✅ 정규/임시 관리번호 구분 로직 단일화
- ✅ 타입 안전성 보장
- ✅ 변경 시 한 곳만 수정

### 2. Optional vs Nullable

```typescript
// ✅ 올바른 사용
externalIdentifier: z.string().optional().nullable();

// ❌ 잘못된 사용
externalIdentifier: z.string().optional(); // null 허용 안됨
```

- `optional()`: 필드 자체가 없을 수 있음 (undefined)
- `nullable()`: 필드가 명시적으로 null일 수 있음
- 둘 다 사용: 새 장비(undefined) + 일반 장비(null) 모두 지원

### 3. 조건부 렌더링 패턴

```typescript
{equipment.isShared && equipment.externalIdentifier && (
  <Component /> // 공용/렌탈 장비이고 소유처 번호가 있을 때만 표시
)}
```

불필요한 UI 노출을 방지하여 UX 향상

---

## 🚀 배포 체크리스트

### ✅ 완료된 항목

- [x] enums.ts에 임시 관리번호 상수 및 함수 추가
- [x] equipment.ts 스키마에 externalIdentifier 추가
- [x] Drizzle 스키마에 external_identifier 컬럼 추가
- [x] EquipmentForm에 입력 필드 추가
- [x] 장비 목록/상세 페이지에 표시 추가
- [x] 마이그레이션 SQL 작성
- [x] TypeScript 타입 검증 통과
- [x] schemas 패키지 빌드 성공

### ⏳ 배포 전 확인 사항

- [ ] 마이그레이션 실행 (PostgreSQL)
- [ ] 임시등록 폼에서 externalIdentifier 입력 테스트
- [ ] 장비 목록에서 소유처 번호 표시 확인
- [ ] 장비 상세 페이지에서 소유처 번호 표시 확인
- [ ] 기존 장비 (isShared=false) 정상 동작 확인
- [ ] E2E 테스트 추가 (선택)

---

## 📚 참고 문서

- **구현 계획**: 사용자 질문 및 추천 답변
- **CLAUDE.md**: 프로젝트 가이드라인
- **SSOT 패키지**: `@equipment-management/schemas` (enums.ts, equipment.ts)
- **UI-14 계획**: `docs/development/Ui 14 common rental equipment prompt.md`
- **기존 구현**: `UI-14-IMPLEMENTATION-SUMMARY.md`

---

**구현 완료일**: 2026-01-30
**예상 소요 시간**: ~1시간
**실제 소요 시간**: ~1시간
**SSOT 준수**: ✅ 모든 타입 및 유틸리티를 packages/schemas에서 관리
