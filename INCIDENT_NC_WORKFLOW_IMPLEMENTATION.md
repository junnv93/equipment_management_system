# 사고이력 기반 부적합 생성 워크플로우 구현 완료

## 📋 구현 개요

사용자가 사고이력 등록 시 부적합 생성 여부와 장비 상태 변경 여부를 선택할 수 있는 유연한 워크플로우를 구현했습니다.

### 핵심 기능

1. **사고이력 등록 시 부적합 생성 선택**
   - damage/malfunction 유형에서만 부적합 생성 옵션 표시
   - change/repair 유형은 일반 사고이력만 생성

2. **장비 상태 변경 사용자 확인**
   - 부적합 생성 선택 시 확인 Dialog 표시
   - "예" 선택 → 장비 상태를 `non_conforming`으로 변경
   - "아니오" 선택 → 장비 상태 유지 (외관 손상이지만 기능 정상인 경우)

3. **트랜잭션 원자성 보장**
   - 사고이력 + 부적합 + 장비 상태 변경을 하나의 트랜잭션으로 처리
   - 부분 실패 방지, 데이터 일관성 보장

---

## 🚀 구현 내역

### Phase 1: 백엔드 (4개 파일 수정)

#### 1. DTO 스키마 확장
**파일**: `apps/backend/src/modules/equipment/dto/equipment-history.dto.ts`

```typescript
// 신규 필드 추가
export const createIncidentHistorySchema = z.object({
  occurredAt: dateStringSchema,
  incidentType: z.nativeEnum(IncidentTypeEnum),
  content: z.string().min(1).max(500),
  // 부적합 생성 관련 필드
  createNonConformance: z.boolean().optional(),
  changeEquipmentStatus: z.boolean().optional(),
  actionPlan: z.string().max(500).optional(),
});
```

#### 2. 서비스 로직 확장
**파일**: `apps/backend/src/modules/equipment/services/equipment-history.service.ts`

```typescript
async createIncidentHistory(...) {
  return await this.db.transaction(async (tx) => {
    // 1. 사고이력 생성
    const [record] = await tx.insert(equipmentIncidentHistory)...

    let nonConformanceId: string | undefined;

    // 2. 부적합 생성 (선택)
    if (dto.createNonConformance === true) {
      // damage/malfunction만 허용
      if (!['damage', 'malfunction'].includes(dto.incidentType)) {
        throw new BadRequestException(...);
      }

      const [nc] = await tx.insert(nonConformances)...
      nonConformanceId = nc.id;

      // 3. 장비 상태 변경 (선택)
      if (dto.changeEquipmentStatus === true) {
        await tx.update(equipment).set({ status: 'non_conforming' })...
      }
    }

    return { ...record, nonConformanceId };
  });
}
```

#### 3. 모듈 순환 참조 해결
**파일**: `apps/backend/src/modules/equipment/equipment.module.ts`
- `forwardRef(() => NonConformancesModule)` 이미 설정됨 ✅

**파일**: `apps/backend/src/modules/non-conformances/non-conformances.module.ts`
- `forwardRef(() => EquipmentModule)` 이미 설정됨 ✅

---

### Phase 2: 프론트엔드 (2개 파일 수정)

#### 1. API 타입 확장
**파일**: `apps/frontend/lib/api/equipment-api.ts`

```typescript
export interface CreateIncidentHistoryInput {
  occurredAt: string;
  incidentType: IncidentType;
  content: string;
  // 신규 필드
  createNonConformance?: boolean;
  changeEquipmentStatus?: boolean;
  actionPlan?: string;
}

export interface IncidentHistoryItem {
  // ... 기존 필드
  nonConformanceId?: string; // 연결된 부적합 ID
}
```

#### 2. IncidentHistoryTab UI 확장
**파일**: `apps/frontend/components/equipment/IncidentHistoryTab.tsx`

**주요 변경사항:**
- 스키마에 `createNonConformance`, `changeEquipmentStatus`, `actionPlan` 필드 추가
- `useEffect`로 `incidentType` 감시 → damage/malfunction이 아니면 체크박스 자동 해제
- 조건부 체크박스 렌더링 (damage/malfunction 선택 시만 표시)
- 조건부 조치 계획 입력 필드 (체크박스 체크 시만 표시)
- 장비 상태 변경 확인 Dialog 추가
- 폼 제출 로직: 부적합 체크 시 확인 Dialog 먼저 표시

**UI 플로우:**
```
사용자: 사고 등록 버튼 클릭
     ↓
사고 유형 선택 (damage/malfunction)
     ↓
☑ 부적합으로 등록 (체크박스 표시)
     ↓
조치 계획 입력 (선택)
     ↓
저장 버튼 클릭
     ↓
확인 Dialog 표시:
  - "예, 사용할 수 없습니다" → changeEquipmentStatus=true
  - "아니오, 계속 사용" → changeEquipmentStatus=false
     ↓
API 호출 → 트랜잭션 실행
```

---

### Phase 3: E2E 테스트 (2개 파일 생성)

#### 1. 프론트엔드 E2E 테스트
**파일**: `apps/frontend/tests/e2e/incident-to-non-conformance.spec.ts`

**테스트 시나리오:**
- ✅ 사고이력만 생성 (change 유형, 체크박스 없음)
- ✅ damage/malfunction 선택 시 체크박스 표시 확인
- ✅ 부적합 생성 + 장비 상태 유지 ("아니오" 선택)
- ✅ 부적합 생성 + 장비 상태 변경 ("예" 선택)

#### 2. 백엔드 E2E 테스트
**파일**: `apps/backend/test/incident-non-conformance-integration.e2e-spec.ts`

**테스트 시나리오:**
- ✅ createNonConformance=false → 사고이력만 생성
- ✅ createNonConformance=true, changeEquipmentStatus=false → 부적합 생성, 상태 유지
- ✅ createNonConformance=true, changeEquipmentStatus=true → 부적합 생성, 상태 변경
- ✅ change 유형에서 부적합 생성 시도 → 400 에러
- ✅ createNonConformance 생략 → 기본값 false로 동작

---

## ✅ 검증 결과

### 1. TypeScript 컴파일
```bash
pnpm tsc --noEmit
```
**결과**: ✅ 0 errors

### 2. 수정된 파일 목록

**백엔드 (4개):**
1. `apps/backend/src/modules/equipment/dto/equipment-history.dto.ts`
2. `apps/backend/src/modules/equipment/services/equipment-history.service.ts`
3. `apps/backend/src/modules/equipment/equipment.module.ts` (이미 설정됨)
4. `apps/backend/src/modules/non-conformances/non-conformances.module.ts` (이미 설정됨)

**프론트엔드 (2개):**
1. `apps/frontend/lib/api/equipment-api.ts`
2. `apps/frontend/components/equipment/IncidentHistoryTab.tsx`

**테스트 (2개 신규):**
1. `apps/frontend/tests/e2e/incident-to-non-conformance.spec.ts`
2. `apps/backend/test/incident-non-conformance-integration.e2e-spec.ts`

---

## 🎯 테스트 실행 방법

### 백엔드 E2E 테스트
```bash
# Docker 인프라 시작 (PostgreSQL)
docker compose up -d

# 특정 테스트 파일 실행
pnpm --filter backend run test:e2e -- incident-non-conformance-integration.e2e-spec.ts
```

### 프론트엔드 E2E 테스트
```bash
# 백엔드 및 프론트엔드 서버 시작
pnpm dev

# Playwright 테스트 실행 (다른 터미널)
pnpm --filter frontend run test:e2e -- incident-to-non-conformance.spec.ts
```

---

## 💡 구현 인사이트

### 1. 트랜잭션 원자성 (Transaction Atomicity)
```typescript
return await this.db.transaction(async (tx) => {
  // 1. 사고이력 생성
  // 2. 부적합 생성 (선택)
  // 3. 장비 상태 변경 (선택)
  // → 하나라도 실패하면 전체 롤백
});
```
**효과**: 부분 실패 방지, 데이터 일관성 보장

### 2. 조건부 워크플로우 (Conditional Workflows)
- 자동 상태 전환(Phase 1)보다 사용자 확인 기반(Phase 2)이 현실적
- 디스플레이 크랙(외관 손상) vs 전원부 고장(기능 이상) 구분 가능

### 3. 조건부 UI 렌더링 (Conditional Rendering)
```typescript
useEffect(() => {
  if (incidentType && !['damage', 'malfunction'].includes(incidentType)) {
    form.setValue('createNonConformance', false);
  }
}, [incidentType, form]);
```
**효과**: 불필요한 옵션 숨김, 사용자 혼란 방지

### 4. 순환 참조 해결 (Circular Dependencies)
```typescript
// EquipmentHistoryService
constructor(
  @Inject(forwardRef(() => NonConformancesService))
  private readonly nonConformancesService: NonConformancesService
) {}
```
**원칙**: 양쪽 모듈에 `forwardRef()` 추가

---

## 📝 사용 시나리오

### 시나리오 1: 외관 손상 (운용 가능)
1. 사고 등록: damage, "디스플레이 크랙"
2. ☑ 부적합으로 등록
3. 확인 Dialog → "아니오, 계속 사용"
4. **결과**: 사고이력 + 부적합 생성, 장비 상태 `available` 유지

### 시나리오 2: 심각한 오작동 (사용 불가)
1. 사고 등록: malfunction, "전원부 고장"
2. ☑ 부적합으로 등록
3. 확인 Dialog → "예, 사용할 수 없습니다"
4. **결과**: 사고이력 + 부적합 생성, 장비 상태 `non_conforming`

### 시나리오 3: 일반 변경 (부적합 아님)
1. 사고 등록: change, "케이블 교체"
2. (체크박스 표시 안됨)
3. 저장
4. **결과**: 사고이력만 생성

---

## 🔄 기존 Phase 1 코드 유지 사항

**유지하는 기능:**
- `NonConformancesService.linkRepair()` - 수리 기록 연결
- `NonConformancesService.markCorrected()` - 조치 완료 상태 변경
- `NonConformancesService.findByRepairId()` - 수리 ID로 부적합 조회
- DB 스키마 (ncType, resolutionType, repairHistoryId, calibrationId)

**변경하는 기능:**
- `NonConformancesService.create()` - 자동 상태 변경 제거 (사용자 확인 기반)
- `requiresRepair()` 헬퍼 - 유지 (부적합 종료 시 검증용)

**Phase 2 구현 예정:**
- 수리 완료 시 부적합 자동 corrected 변경 → 사용자 확인 기반
- 부적합 종료 시 장비 상태 복원 → 사용자 확인 기반

---

## ✨ 구현 완료

- ✅ 백엔드 DTO 및 서비스 확장
- ✅ 프론트엔드 UI 확장 (체크박스 + 확인 Dialog)
- ✅ 백엔드 E2E 테스트 작성
- ✅ 프론트엔드 E2E 테스트 작성
- ✅ TypeScript 컴파일 검증 (0 errors)
- ✅ 수동 테스트 시나리오 작성

**구현 일시**: 2026-01-26
**구현자**: Claude Code
**문서 버전**: 1.0
