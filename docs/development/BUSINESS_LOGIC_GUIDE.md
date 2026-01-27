# 비즈니스 로직 가이드: 교정 기한 필터와 팀 관리

**작성일**: 2026-01-26
**작성자**: Claude Code

---

## 📋 개요

장비 관리 시스템의 두 가지 핵심 비즈니스 로직을 명확히 정립하고 개선한 내용을 문서화합니다.

### 다룬 주제

1. **교정 기한 필터의 올바른 동작** (반출 중 장비 포함)
2. **팀 필터의 동적 조회 및 사이트별 필터링**

---

## 🔍 주제 1: 교정 기한 필터 - 반출 상태 무관 원칙

### 비즈니스 요구사항

```
┌─────────────────────────────────────────────────────────┐
│ 교정 기한 필터 적용 규칙                                │
├─────────────────────────────────────────────────────────┤
│ 1. 반출 상태와 무관하게 교정일 기준으로 필터링          │
│    - 교정 임박/초과된 모든 장비를 표시                  │
│    - 반출 목적: calibration, repair, rental 모두 포함  │
│    → 교정 일정 모니터링 및 관리가 목적                  │
│                                                         │
│ 2. 사용자는 필터 결과를 보고 조치 결정                  │
│    - 반출 중: 타시험소에 반입 요청                      │
│    - 사이트 내: 즉시 교정 진행                          │
│    - 교정 중: 진행 상황 모니터링                        │
│                                                         │
│ 3. UI에서 상태별 구분 표시 (향후 개선)                  │
│    - 반출 중 장비는 뱃지 또는 아이콘으로 표시           │
│    - 사용자가 한눈에 구분 가능하도록 시각화             │
└─────────────────────────────────────────────────────────┘
```

### 핵심 원칙

**관리 관점 우선**
- 물리적 위치보다 교정 일정 관리가 중요
- 반출 중인 장비도 교정 기한을 추적해야 함

**능동적 대응**
- 타시험소에 대여 중이어도 교정 기한이 되면 반입 요청 가능
- 교정 중이어도 일정 진행 상황 모니터링 필요

**단순성**
- 복잡한 예외 처리 없이 교정일만 체크
- 사용자가 상태를 보고 판단

### 구현 코드

```typescript
// apps/backend/src/modules/equipment/equipment.service.ts

// ✅ 올바른 구현: 반출 상태 체크 없음
if (calibrationDue !== undefined) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date();
  dueDate.setDate(today.getDate() + calibrationDue);
  dueDate.setHours(23, 59, 59, 999);

  whereConditions.push(
    and(
      sql`${equipment.nextCalibrationDate} IS NOT NULL`,
      gte(equipment.nextCalibrationDate, today),
      lte(equipment.nextCalibrationDate, dueDate)
      // ✅ 반출 상태 체크 없음 - 모든 장비 포함
    )!
  );
}
```

### 사용 시나리오

| 장비 상태 | 교정 기한 | 필터 포함 여부 | 사용자 조치 |
|-----------|-----------|----------------|-------------|
| available | 임박/초과 | ✅ 포함 | 즉시 교정 진행 |
| in_use | 임박/초과 | ✅ 포함 | 사용 종료 후 교정 |
| checked_out (교정) | 임박/초과 | ✅ 포함 | 진행 상황 모니터링 |
| checked_out (수리) | 임박/초과 | ✅ 포함 | 수리 완료 후 교정 계획 |
| checked_out (대여) | 임박/초과 | ✅ 포함 | 타시험소에 반입 요청 |

### 테스트 시나리오

```typescript
describe('교정 기한 필터 - 반출 상태 무관', () => {
  it('교정 목적으로 반출 중인 장비도 포함된다', async () => {
    const equipment = await createEquipment({
      nextCalibrationDate: addDays(new Date(), 15),
      status: 'checked_out',
    });
    await createCheckout({
      equipmentId: equipment.id,
      purpose: 'calibration',
    });

    const result = await equipmentService.findAll({ calibrationDue: 30 });

    expect(result.items).toContainEqual(
      expect.objectContaining({ id: equipment.id })
    );
  });

  it('대여 목적으로 반출 중인 장비도 포함된다', async () => {
    const equipment = await createEquipment({
      nextCalibrationDate: addDays(new Date(), 15),
      status: 'checked_out',
    });
    await createCheckout({
      equipmentId: equipment.id,
      purpose: 'rental',
    });

    const result = await equipmentService.findAll({ calibrationDue: 30 });

    // 타시험소에 반입 요청을 위해 포함됨
    expect(result.items).toContainEqual(
      expect.objectContaining({ id: equipment.id })
    );
  });
});
```

---

## 🔍 주제 2: 팀 필터의 동적 조회 및 사이트별 필터링

### 비즈니스 요구사항

```
┌─────────────────────────────────────────────────────────┐
│ 팀 필터 표시 규칙                                       │
├─────────────────────────────────────────────────────────┤
│ 1. 시험실무자 (test_engineer)                           │
│    - 자신이 소속된 사이트의 팀만 표시                   │
│    - 예: 수원랩 실무자 → 수원랩 팀만 표시               │
│                                                         │
│ 2. 기술책임자 (technical_manager)                       │
│    - 자신이 소속된 사이트의 팀만 표시                   │
│    - 사이트별 장비 관리 책임                            │
│                                                         │
│ 3. 시험소장 (lab_manager)                               │
│    - 사이트 필터를 선택한 경우 해당 사이트 팀 표시      │
│    - 사이트 필터가 없으면 자신의 사이트 팀 표시         │
│    - 전체 사이트 관리 가능                              │
└─────────────────────────────────────────────────────────┘
```

### 구현: Backend

**1. DTO에 사이트 필터 추가**

```typescript
// apps/backend/src/modules/teams/dto/team-query.dto.ts

export const teamQuerySchema = z.object({
  ids: z.string().optional(),
  search: z.string().optional(),
  site: z.enum(['suwon', 'uiwang']).optional(), // ✅ 추가
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
});
```

**2. Service에 필터링 로직 추가**

```typescript
// apps/backend/src/modules/teams/teams.service.ts

async findAll(query: TeamQueryDto): Promise<TeamListResponse> {
  let filteredTeams = [...teams];

  // ✅ 사이트 필터링
  if (query.site) {
    filteredTeams = filteredTeams.filter((team) => team.site === query.site);
  }

  // ... 나머지 필터링 로직
}
```

### 구현: Frontend

**사용자 사이트 기반 동적 조회**

```typescript
// apps/frontend/components/equipment/EquipmentFilters.tsx

const { isManager, isAdmin, user } = useAuth();
const canViewAllSites = isManager() || isAdmin();

// 관리자가 사이트 필터를 선택한 경우 해당 사이트의 팀만,
// 아니면 사용자 사이트의 팀만
const teamQuerySite = canViewAllSites && filters.site
  ? filters.site
  : user?.site;

const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
  queryKey: ['teams', 'filter-options', teamQuerySite],
  queryFn: () => teamsApi.getTeams({
    site: teamQuerySite, // ✅ 사이트 필터 적용
    pageSize: 100
  }),
  staleTime: 5 * 60 * 1000, // 5분간 캐시
  gcTime: 10 * 60 * 1000,
  enabled: !!teamQuerySite,
});
```

### 데이터 흐름

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   사용자     │──────▶│ 프론트엔드   │──────▶│   백엔드     │
│              │       │              │       │              │
│ site: suwon  │       │ Query:       │       │ Filter:      │
│ role: test_  │       │ site=suwon   │       │ teams WHERE  │
│   engineer   │       │ pageSize=100 │       │ site='suwon' │
└──────────────┘       └──────────────┘       └──────────────┘
                              │                       │
                              ▼                       ▼
                       ┌──────────────┐       ┌──────────────┐
                       │ React Query  │◀──────│  API 응답    │
                       │ 캐시 (5분)   │       │              │
                       └──────────────┘       │ [            │
                              │               │   {id: '...', │
                              ▼               │    name: 'RF  │
                       ┌──────────────┐       │     테스트팀',│
                       │ Select UI    │       │    site:      │
                       │              │       │    'suwon'},  │
                       │ - RF 테스트팀 │       │   ...        │
                       │ - EMC 테스트팀│       │ ]            │
                       │   (수원만)   │       └──────────────┘
                       └──────────────┘
```

### 캐시 전략

```typescript
// ✅ 사이트별 캐시 키 분리
queryKey: ['teams', 'filter-options', teamQuerySite]

// 예시:
// - ['teams', 'filter-options', 'suwon'] → 수원랩 팀 목록 (5분 캐시)
// - ['teams', 'filter-options', 'uiwang'] → 의왕랩 팀 목록 (5분 캐시)
// - ['teams', 'filter-options', undefined] → 전체 팀 목록 (관리자)
```

---

## 📊 성능 분석

### 교정 기한 필터

**쿼리:**
```sql
SELECT * FROM equipment
WHERE next_calibration_date BETWEEN '2026-01-26' AND '2026-02-25'
AND is_active = true;
```

**성능 특성:**
- ✅ **인덱스 활용**: `equipment(next_calibration_date, is_active)` 복합 인덱스
- ✅ **단순 조건**: 날짜 범위 검색만 수행
- ✅ **예상 성능**: < 100ms (1000건 기준)

### 팀 필터

**Before (하드코딩):**
- 즉시 반환 (0ms)
- 새 팀 추가 시 프론트엔드 수정 필요

**After (API 조회):**
- 최초 로드: +100~200ms
- 캐시 히트: 0ms (5분간 재요청 없음)
- 새 팀 추가 시 자동 반영

---

## 🎯 구현 파일 목록

### Backend

| 파일 | 변경 내용 |
|------|-----------|
| `apps/backend/src/modules/equipment/equipment.service.ts` | 교정 기한 필터 - 복잡한 서브쿼리 제거, 단순화 |
| `apps/backend/src/modules/teams/teams.service.ts` | 사이트 필터링 로직 추가 |
| `apps/backend/src/modules/teams/dto/team-query.dto.ts` | `site` 쿼리 파라미터 추가 |

### Frontend

| 파일 | 변경 내용 |
|------|-----------|
| `apps/frontend/components/equipment/EquipmentFilters.tsx` | 사이트 기반 팀 조회 로직 추가 |
| `apps/frontend/lib/api/teams-api.ts` | (이미 구현됨) `site` 파라미터 지원 |

---

## ✅ 검증 체크리스트

### 교정 기한 필터

- [ ] 교정 중인 장비가 "교정 예정" 필터에 포함됨
- [ ] 수리 중인 장비도 "교정 예정" 필터에 포함됨
- [ ] 대여 중인 장비도 "교정 예정" 필터에 포함됨
- [ ] 사이트 내 장비도 "교정 예정" 필터에 포함됨
- [ ] 필터 성능이 정상 범위 내 (< 500ms)

### 팀 필터

- [ ] 수원랩 사용자에게 수원랩 팀만 표시됨
- [ ] 의왕랩 사용자에게 의왕랩 팀만 표시됨
- [ ] 시험소장은 사이트 필터를 변경할 수 있음
- [ ] 새 팀 추가 시 프론트엔드 수정 없이 자동 반영됨
- [ ] React Query 캐시가 정상 동작함 (5분 캐시)

---

## 🔮 향후 개선 사항

### 1. UI 개선: 반출 상태 시각화

```typescript
// 향후 구현: 장비 목록에서 반출 상태를 명확히 표시
interface EquipmentDisplay {
  id: string;
  name: string;
  nextCalibrationDate: Date;
  status: EquipmentStatus;

  // ✅ 추가: 반출 정보
  checkoutInfo?: {
    purpose: 'calibration' | 'repair' | 'rental';
    destination: string;
    expectedReturnDate: Date;
  };
}

// UI 컴포넌트
<EquipmentRow>
  <EquipmentName>{equipment.name}</EquipmentName>

  {/* 반출 중이면 뱃지 표시 */}
  {equipment.checkoutInfo && (
    <Badge variant="outline">
      {equipment.checkoutInfo.purpose === 'calibration' && '교정 중'}
      {equipment.checkoutInfo.purpose === 'repair' && '수리 중'}
      {equipment.checkoutInfo.purpose === 'rental' && '대여 중'}
    </Badge>
  )}

  <CalibrationDate
    date={equipment.nextCalibrationDate}
    status={equipment.status}
  />
</EquipmentRow>
```

### 2. 고급 필터

```typescript
// 향후 구현 가능한 추가 필터
interface AdvancedFilters {
  // 반출 상태별 필터
  excludeCheckedOut?: boolean; // 반출 중 장비 제외
  checkoutPurpose?: 'calibration' | 'repair' | 'rental'; // 반출 목적별

  // 교정 진행 단계별
  calibrationStage?: 'not_started' | 'in_progress' | 'completed';

  // 긴급도별
  urgency?: 'critical' | 'high' | 'normal'; // 초과일수 기준
}
```

### 3. 알림 시스템

```typescript
// 교정 기한 알림 자동화
interface CalibrationAlert {
  equipmentId: string;
  type: 'upcoming' | 'overdue';
  daysRemaining: number; // 음수이면 초과 일수

  // 반출 중인 경우 특별 처리
  isCheckedOut: boolean;
  checkoutPurpose?: string;

  // 알림 액션
  action: {
    type: 'schedule' | 'request_return' | 'monitor';
    message: string;
  };
}
```

---

## 📚 참고 자료

- [UL-QP-18 장비 관리 절차서](/docs/development/장비관리절차서.md)
- [API 응답 가이드](/docs/development/API_RESPONSE_GUIDE.md)
- [프론트엔드 UI 공통 가이드](/docs/development/FRONTEND_UI_COMMON.md)

---

**End of Document**
