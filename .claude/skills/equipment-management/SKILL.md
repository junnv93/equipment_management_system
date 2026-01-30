---
name: equipment-management
description: |
  장비 관리 시스템(Equipment Management System) 개발 가이드. UL-QP-18 장비 관리 절차서 기반의 시험소 장비 관리 시스템 구현을 위한 전문 스킬입니다.

  사용 시점:
  (1) 장비 등록/수정/삭제 API 또는 UI 개발 시
  (2) 시험설비이력카드(UL-QP-18-02) 관련 기능 구현 시
  (3) 교정(Calibration) 기록 관리 및 승인 프로세스 구현 시
  (4) 점검(중간점검/자체점검) 기능 구현 시
  (5) 대여(Rental) 또는 반출(Checkout) 기능 구현 시
  (6) 보정계수(Calibration Factor) 관리 기능 구현 시
  (7) 부적합 장비(Non-Conformance) 관리 기능 구현 시
  (8) 소프트웨어 관리대장(UL-QP-18-07) 기능 구현 시
  (9) 교정계획서 작성 및 승인 기능 구현 시
  (10) 사용자 역할 및 권한 체계 관련 개발 시
  (11) 프론트엔드 UI 개발 시 (Next.js 16 App Router 패턴)
  (12) 관리번호 체계 및 위치 코드 관련 개발 시
  (13) 인증/인가 관련 개발 시 (NextAuth 토큰 관리)
---

# 장비 관리 시스템 개발 가이드

**기준 문서**: UL-QP-18 장비 관리 절차서 (개정번호 15, 2026.01.14)

---

## ⚠️ 필독: 프로젝트 컨텍스트

**이 스킬을 사용하기 전에 반드시 읽으세요!**

### 프로젝트 특성

- **개발 환경**: 1인 개발자 (개발 + 테스트 동일인)
- **DB 구조**: **단일 DB 통합** (개발 DB = 테스트 DB)
- **데이터 중요도**: 개발 데이터 중요하지 않음

### 🔴 절대 금지

```
❌ "테스트 DB와 개발 DB를 분리해야..."
❌ "두 DB를 동기화하려면..."
❌ postgres_equipment_test (제거됨)
❌ localhost:5434 (사용 안함)
❌ equipment_management_test (사용 안함)
```

### ✅ 올바른 접근

```
✅ 단일 DB 사용: postgres_equipment (포트 5432)
✅ DB 명령어: pnpm db:migrate
✅ 테스트: 개발 DB에서 실행
✅ 환경: 개발 + 테스트 통합
```

**자세한 내용**: `/.claude/PROJECT_RULES.md` 참조

---

## 기술 스택

- **Backend**: NestJS, Drizzle ORM, PostgreSQL
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS
- **인증**: NextAuth.js (Azure AD + Credentials), JWT
- **Monorepo**: pnpm workspace
- **개발 환경**: Docker (PostgreSQL, Redis만) + 로컬 실행 (앱)

> **인증 아키텍처**: NextAuth를 단일 인증 소스로 사용. localStorage 토큰 사용 금지.
> 상세: [references/auth-architecture.md](references/auth-architecture.md)

---

## 개발 환경 설정

### 빠른 시작 (Phase 1: 로컬 개발)

```bash
# 1. 자동 설정 (처음 한 번만)
./scripts/setup-dev.sh

# 2. 개발 서버 시작
pnpm dev
# 또는
make dev
```

**접속 주소:**

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 개발 환경 원칙

**Phase 1 (현재 - 1인 개발):**

- ✅ **Docker**: PostgreSQL, Redis만
- ✅ **로컬 실행**: 백엔드, 프론트엔드
- ✅ 빠른 개발, hot-reload 지원

```bash
# Docker 인프라만 시작
docker compose up -d

# 앱은 로컬에서
pnpm dev
```

**Phase 2 (팀 확장 준비):**

- 하이브리드 접근 또는 계속 로컬
- 온보딩 자동화 강화

**Phase 3 (3인+ 팀):**

- 완전 컨테이너화 (선택)
- CI/CD 파이프라인

**상세 로드맵**: `/docs/development/TEAM_EXPANSION_ROADMAP.md`

### 주요 명령어

```bash
# Docker (DB/Redis만)
docker compose up -d     # 시작
docker compose down      # 중지

# 개발
pnpm dev                # 백엔드 + 프론트엔드
pnpm --filter backend run dev      # 백엔드만
pnpm --filter frontend run dev     # 프론트엔드만

# DB
pnpm --filter backend run db:migrate   # 스키마 변경 적용
pnpm --filter backend run db:studio    # Drizzle Studio

# 빌드 & 테스트
pnpm build              # 전체 빌드
pnpm test               # 테스트
```

### 트러블슈팅

**dist 폴더 권한 문제:**

```bash
sudo rm -rf apps/backend/dist
pnpm --filter backend run start:dev
```

**포트 충돌:**

```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**상세 가이드**: `/docs/development/DEV_SETUP.md`

---

## 핵심 용어 (UL-QP-18 기준)

| 용어                     | 정의                                                         |
| ------------------------ | ------------------------------------------------------------ |
| **장비(Equipment)**      | 시험소에서 시험에 사용하는 설비와 장비 통칭                  |
| **점검(Inspection)**     | 장비/측정시스템에 대한 측정 오차를 줄이기 위한 업무          |
| **교정(Calibration)**    | 외부/내부 교정기관을 통한 장비 정밀도 검증                   |
| **중간점검**             | 교정 신뢰성 확인을 위한 교정 주기 사이 점검                  |
| **자체점검**             | 비교정 대상 장비에 대한 주기적 점검                          |
| **소급성(Traceability)** | 국가/국제 표준과 연결되는 측정 결과 특성                     |
| **공용장비**             | 안전인증 시험팀에서 관리, EMC-W 분야 시험에 사용 가능한 장비 |
| **미관리 장비**          | 상시 관리하지 않는 장비(여분 장비 등)                        |

**상세 용어**: [references/terminology.md](references/terminology.md)

---

## 역할 체계 (UL-QP-18 Section 4)

| 역할 코드           | 절차서 역할 | 영문              | 주요 권한                                                    |
| ------------------- | ----------- | ----------------- | ------------------------------------------------------------ |
| `test_engineer`     | 시험실무자  | Test Engineer     | 장비 운영/관리, 점검 실시, 이력카드 작성, 반출입 확인서 작성 |
| `technical_manager` | 기술책임자  | Technical Manager | 교정계획 수립, 점검 결과 확인, 반출입 승인, 보정인자 관리    |
| `lab_manager`       | 시험소장    | Lab Manager       | 교정계획 승인, 장비 폐기 승인, 시험소 전체 관리 (모든 권한)  |

**상세 역할/권한**: [references/roles.md](references/roles.md)

---

## 관리번호 체계 (UL-QP-18 Section 7.5)

```
XXX – X YYYY
 │    │  └── 일련번호 (4자리, 0001~9999)
 │    └───── 분류코드 (E/R/S/A/P) - 팀에서 결정
 └────────── 시험소코드 (SUW/UIW/PYT)
```

**시험소코드**: SUW(수원), UIW(의왕), PYT(평택)

**분류코드 (팀 이름 = 분류 이름)**:
| 코드 | 분류 (= 팀 이름) | 사이트 |
|------|------------------|--------|
| E | FCC EMC/RF | 수원 |
| R | General EMC | 수원 |
| W | General RF | 의왕 |
| S | SAR | 수원 |
| A | Automotive EMC | 수원, 평택 |
| P | Software Program | - |

> ✅ **팀 이름 = 분류 이름**: 팀 선택 시 분류 이름(FCC EMC/RF 등)으로 표시됩니다.

**상세 관리번호 및 위치코드**: [references/management-numbers.md](references/management-numbers.md)

---

## 팀-분류코드 매핑 및 Azure AD 그룹

**팀 이름 = 분류 이름 (통일):**

- 장비 등록/필터에서 팀 선택 시 분류 이름으로 표시
- 사이트 선택 시 해당 사이트의 팀만 드롭다운에 표시

### 사이트별 팀 구성

| 사이트     | 팀(분류)       | 분류코드 |
| ---------- | -------------- | -------- |
| 수원 (SUW) | FCC EMC/RF     | E        |
| 수원 (SUW) | General EMC    | R        |
| 수원 (SUW) | SAR            | S        |
| 수원 (SUW) | Automotive EMC | A        |
| 의왕 (UIW) | General RF     | W        |
| 평택 (PYT) | Automotive EMC | A        |

### Azure AD 그룹 매핑 (수원)

| Azure AD 그룹        | 테넌트 ID                              | 팀 이름 (분류)     |
| -------------------- | -------------------------------------- | ------------------ |
| `LST.SUW.RF`         | `7dc3b94c-82b8-488e-9ea5-4fe71bb086e1` | FCC EMC/RF (E)     |
| `LST.SUW.EMC`        | `bb6c860d-9d7c-4e2d-b289-2b2e416ec289` | General EMC (R)    |
| `LST.SUW.SAR`        | `7fd28076-fd5e-4d36-b051-bbf8a97b82db` | SAR (S)            |
| `LST.SUW.Automotive` | `f0a32655-00f9-4ecd-b43c-af4faed499b6` | Automotive EMC (A) |

### Azure AD 그룹 매핑 (의왕/평택)

| Azure AD 그룹        | 테넌트 ID                              | 팀 이름 (분류)     |
| -------------------- | -------------------------------------- | ------------------ |
| `LST.UIW.RF`         | `없음`                                 | General RF (W)     |
| `LST.PYT.Automotive` | `70115954-0ccd-45f0-87bd-03b2a3587569` | Automotive EMC (A) |

---

## 시험설비 이력카드 (UL-QP-18 Section 7.6-7.7)

시험실무자가 작성/갱신해야 하는 필수 항목:

| 항목                        | 설명                             |
| --------------------------- | -------------------------------- |
| 장비명(모델명)              | Equipment name (model name)      |
| 유형/고유 식별표시          | Type identification              |
| 제조업체/공급업체명         | Manufacturer, supplier           |
| 시방일치 여부               | Specification agreement          |
| 부속품/주요 기능            | Accessories and main functions   |
| 교정 필요 여부/주기         | Calibration necessity and period |
| 관련 소프트웨어/매뉴얼      | Related software and manuals     |
| 운영책임자(정, 부)          | Operating Officer                |
| 설치 위치/일자              | Installation location, date      |
| 이력(위치변동/교정/수리 등) | History records                  |

**상세 이력카드**: [references/equipment-history-card.md](references/equipment-history-card.md)

---

## 코드 품질 규칙

> **목표**: 컴파일 타임에 실수를 방지하고, 코드 품질을 자동으로 강제

### 필수 (MUST)

1. **`any` 타입 사용 금지** - `unknown` 또는 구체적 타입 사용

   ```typescript
   // ❌ 금지
   const data: any = await fetch(...);

   // ✅ 권장
   const data: Equipment = await fetch(...).then(r => r.json());
   ```

2. **모든 타입은 SSOT에서 import**

   ```typescript
   // ❌ 금지: 로컬 타입 정의
   type UserRole = 'ADMIN' | 'USER'; // 잘못된 값!

   // ✅ 권장: schemas 패키지에서 import
   import { UserRole } from '@equipment-management/schemas';
   import { Permission } from '@equipment-management/shared-constants';
   ```

3. **API 파일에서 barrel import 금지** - 직접 import 사용

   ```typescript
   // ❌ 피해야 함 (bundle size 증가)
   import { equipmentApi, dashboardApi } from '@/lib/api';

   // ✅ 권장 (tree-shaking 가능)
   import equipmentApi from '@/lib/api/equipment-api';
   ```

4. **Server Component에서 같은 데이터 중복 fetch 금지** - React.cache() 사용
   ```typescript
   // ❌ Page()와 generateMetadata()에서 각각 호출
   // ✅ 권장: cache() 래핑
   import { cache } from 'react';
   const getEquipmentCached = cache(async (id: string) => {
     return equipmentApiServer.getEquipment(id);
   });
   ```

### 권장 (SHOULD)

1. **무거운 컴포넌트는 dynamic import 사용**

   ```typescript
   const HeavyChart = dynamic(() => import('./HeavyChart'), {
     loading: () => <ChartSkeleton />,
   });
   ```

2. **useQuery 훅은 관련 컴포넌트 내부에서 호출** (탭별 데이터 분리)

3. **복잡한 계산은 useMemo로 메모이제이션**

### ESLint로 강제되는 규칙

| 규칙                                 | 레벨  | 설명                       |
| ------------------------------------ | ----- | -------------------------- |
| `@typescript-eslint/no-explicit-any` | error | any 타입 금지              |
| `@typescript-eslint/no-unused-vars`  | error | 미사용 변수 금지           |
| `react-hooks/exhaustive-deps`        | error | useEffect 의존성 누락 금지 |
| `no-restricted-imports`              | error | SSOT 위반 import 차단      |

### lint-staged 설정

- **max-warnings=0**: 모든 warning이 커밋을 차단
- pre-commit hook에서 자동 실행

---

## ✅ Vercel/React Best Practices 체크리스트

> **참조**: Vercel Engineering 팀의 React 성능 최적화 가이드라인
> **스킬**: `/vercel-react-best-practices` 스킬에서 상세 규칙 확인 가능

### 🔴 CRITICAL: Request Waterfall 제거

```typescript
// ❌ 순차 실행 (Waterfall)
const user = await getUser();
const posts = await getPosts();
const comments = await getComments();

// ✅ 병렬 실행
const [user, posts, comments] = await Promise.all([getUser(), getPosts(), getComments()]);
```

### 🔴 CRITICAL: Bundle Size 최적화

| 규칙                    | 설명                                                     |
| ----------------------- | -------------------------------------------------------- |
| **Barrel import 금지**  | `from '@/lib/api'` 대신 `from '@/lib/api/equipment-api'` |
| **Dynamic import 사용** | 무거운 컴포넌트는 `next/dynamic`으로 지연 로딩           |
| **ssr: false**          | 클라이언트 전용 탭/모달 컴포넌트에 적용                  |

```typescript
// ✅ 탭 컴포넌트는 ssr: false (사용자 상호작용 후에만 로드)
const CalibrationHistoryTab = dynamic(
  () => import('./CalibrationHistoryTab'),
  { loading: () => <TabSkeleton />, ssr: false }
);
```

### 🟠 HIGH: Server-Side 성능

| 규칙                      | 설명                                                    |
| ------------------------- | ------------------------------------------------------- |
| **React.cache()**         | generateMetadata와 Page에서 동일 데이터 중복 fetch 방지 |
| **Server Component 우선** | 데이터 fetch는 Server Component에서                     |
| **initialData 패턴**      | Server에서 fetch → Client의 useQuery에 전달             |

```typescript
// ✅ Server Component에서 초기 데이터 fetch
export default async function EquipmentPage(props: PageProps) {
  const initialData = await equipmentApiServer.getEquipmentList();
  return <EquipmentListContent initialData={initialData} />;
}
```

### 🟡 MEDIUM: Re-render 최적화

| 규칙                 | 설명                                                |
| -------------------- | --------------------------------------------------- |
| **useState 통합**    | 관련 상태는 하나의 객체로 관리 (또는 useQuery 사용) |
| **useMemo 사용**     | 복잡한 계산은 메모이제이션                          |
| **useCallback 사용** | 자식에 전달하는 콜백 함수 안정화                    |

```typescript
// ❌ 여러 useState로 다중 리렌더링
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// ✅ React Query로 상태 통합 (단일 리렌더링)
const { data, isLoading, error } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});
```

### 🟢 LOW: 접근성 (Accessibility)

| 규칙            | 설명                                             |
| --------------- | ------------------------------------------------ |
| **아이콘 버튼** | `aria-label` 필수, 아이콘에 `aria-hidden="true"` |
| **폼 입력**     | `htmlFor` + `id` 매칭                            |
| **포커스**      | `:focus-visible` 스타일 적용                     |
| **SR-only**     | 스크린 리더 전용 안내 텍스트                     |

```typescript
// ✅ 접근성 있는 아이콘 버튼
<Button variant="ghost" size="icon" aria-label="장비 상세로 돌아가기">
  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
</Button>

// ✅ 스크린 리더 전용 안내
<span className="sr-only">Enter를 눌러 검색하세요</span>
```

### 커밋 전 체크리스트

```
□ any 타입 사용하지 않음
□ Barrel import 사용하지 않음 (직접 import)
□ Server Component에서 데이터 fetch
□ 독립적 Promise는 Promise.all()로 병렬화
□ 무거운 컴포넌트는 dynamic import 사용
□ 탭/모달 컴포넌트에 ssr: false 적용
□ 아이콘 버튼에 aria-label 추가
□ ESLint/TypeScript 오류 0개
```

---

## ❌ 반복되는 실수 패턴 (절대 금지)

> **목표**: Claude Code가 같은 실수를 반복하지 않도록 명시적으로 금지 패턴 정의

### 1. NestJS Controller에서 `@Req() req: any` 사용

```typescript
// ❌ 금지 - any 타입 사용
@Get(':uuid')
async findOne(@Param('uuid') uuid: string, @Req() req: any) {
  const userId = req.user?.userId; // 타입 안전하지 않음
}

// ✅ 권장 - AuthenticatedRequest 타입 사용
import { AuthenticatedRequest } from '../../types/common.types';

@Get(':uuid')
async findOne(@Param('uuid') uuid: string, @Req() req: AuthenticatedRequest) {
  const userId = req.user.userId; // 타입 안전
}
```

### 2. Multer 파일에 `file: any` 사용

```typescript
// ❌ 금지 - any 타입 사용
async uploadFile(file: any) {
  const buffer = file.buffer;  // 타입 안전하지 않음
}

// ✅ 권장 - Express.Multer.File 타입 사용
async uploadFile(file: Express.Multer.File) {
  const buffer = file.buffer;  // 타입 안전
}
```

### 3. generateMetadata와 Page에서 중복 fetch

```typescript
// ❌ 금지 - 동일 API 2번 호출 (네트워크 낭비)
export async function generateMetadata(props: PageProps) {
  const equipment = await getEquipment(id);  // 1번째 호출
  return { title: equipment.name };
}

export default async function Page(props: PageProps) {
  const equipment = await getEquipment(id);  // 2번째 호출 (중복!)
  return <Client equipment={equipment} />;
}

// ✅ 권장 - React.cache()로 메모이제이션
import { cache } from 'react';

const getEquipmentCached = cache(async (id: string) => {
  return getEquipment(id);
});

export async function generateMetadata(props: PageProps) {
  const equipment = await getEquipmentCached(id);  // 캐시
  return { title: equipment.name };
}

export default async function Page(props: PageProps) {
  const equipment = await getEquipmentCached(id);  // 재사용 (호출 안함)
  return <Client equipment={equipment} />;
}
```

### 4. Drizzle ORM에서 `as any` 캐스팅

```typescript
// ❌ 금지 - as any로 타입 체크 우회
const [record] = await db
  .insert(table)
  .values({
    name: 'test',
    status: 'active',
  } as any)
  .returning();

// ✅ 권장 - 올바른 타입으로 값 전달
const [record] = await db
  .insert(table)
  .values({
    name: 'test',
    status: 'active', // enum 타입이면 스키마에서 추론됨
  })
  .returning();
```

### 5. 로컬에서 타입/Enum 재정의

```typescript
// ❌ 금지 - 로컬에서 enum 재정의 (SSOT 위반)
type UserRole = 'ADMIN' | 'USER' | 'MANAGER'; // 잘못된 값!

// ✅ 권장 - 중앙 패키지에서 import
import { UserRole } from '@equipment-management/schemas';
```

### 6. optional 파라미터에 `| undefined` 누락

```typescript
// ❌ 금지 - req가 optional인데 타입에 반영 안됨
async update(@Req() req?: any) {
  const userId = req.user?.userId;  // req가 undefined일 수 있음
}

// ✅ 권장 - optional 파라미터 명시
async update(@Req() req?: AuthenticatedRequest) {
  const userId = req?.user?.userId;  // null 안전 체인
}
```

---

## 핵심 규칙

### 1. 승인 프로세스 공통 규칙

```typescript
// 반려 시 사유 필수 (최소 10자)
if (action === 'reject' && (!reason || reason.length < 10)) {
  throw new BadRequestException('반려 사유는 10자 이상 필수입니다');
}

// 다중 승인자 선착순 처리 (Optimistic Locking)
const updated = await db
  .update(requests)
  .set({ status: 'approved', approvedBy: userId, version: currentVersion + 1 })
  .where(and(eq(requests.uuid, uuid), eq(requests.version, currentVersion)));

if (updated.rowCount === 0) {
  throw new ConflictException('이미 처리된 요청입니다');
}
```

### 2. 팀별/사이트별 권한 제한

- EMC팀은 RF팀 장비 반출 신청/승인 불가
- 장비 등록 시 관리 팀(teamId) 및 시험소(site) 필수
- 조회는 전체 가능, 수정/승인은 권한 범위 내에서만

### 3. 교정 기록 등록/승인 분리 원칙 (엄격한 정책)

**등록 권한:**

- ✓ 시험실무자(test_engineer): 교정 기록 등록 가능 → 기술책임자 승인 필요
- ❌ 기술책임자(technical_manager): 등록 불가, 승인만 가능
- ❌ 시험소장(lab_manager): 등록 불가 (교정만 예외적으로 제한)

**승인 권한:**

- ✓ 기술책임자(technical_manager): 교정 기록 승인
- ✓ 시험소장(lab_manager): 교정 기록 승인

**정책 배경:**

- **등록/승인 완전 분리**: 견제 구조를 통한 품질 보증 (UL-QP-18)
- **시험소장 제한**: 교정 관리는 다른 기능과 달리 시험소장도 등록 불가
- **이중 검증**: 실무자가 등록, 책임자가 검증하는 2단계 프로세스 강제

> **원칙**: 교정 기록은 등록자와 승인자를 완전히 분리하여 견제 구조 유지 (UL-QP-18)

---

## 주요 기능별 프로세스

### 장비 등록/수정 (2단계 승인)

```
시험실무자 요청 → pending_approval → 기술책임자 승인 → approved
                                   ↘ 반려 → rejected
```

**예외**: 시험소 관리자(lab_manager)는 자체 승인 가능

### 교정 기록 등록 (엄격한 정책)

```
시험실무자 등록: pending_approval → 기술책임자/시험소장 승인 (approverComment 필수)
```

> ⚠️ **주의**: 교정 기록은 시험실무자만 등록 가능. 시험소장도 등록 불가 (등록/승인 완전 분리)

### 점검 프로세스 (UL-QP-18 Section 8)

- **중간점검**: 교정검사 신뢰성 확인용, 중간점검표(UL-QP-18-03) 기록
- **자체점검**: 비교정 대상 장비, 자체점검표(UL-QP-18-05) 기록

**상세 점검/교정**: [references/inspection-calibration.md](references/inspection-calibration.md)

### 반출/반입 프로세스 (모든 목적 1단계 승인 통합)

**모든 목적 (교정/수리/시험소간 대여)**:

```
pending → [기술책임자 승인] → approved → checked_out → returned → return_approved
```

**시험소간 대여 추가 사항**: 반입 시 양측 확인 필요

**상세 승인 프로세스**: [references/approval-processes.md](references/approval-processes.md)

---

## 부적합 장비 관리 (UL-QP-18 Section 9)

### 상태 흐름

```
[이상 발견] → open (장비: non_conforming, 사용중지 식별표)
    ↓
analyzing (원인 분석)
    ↓
corrected (조치 완료)
    ↓
[기술책임자 승인] → closed (장비: available)
```

### 필수 조치 사항

1. **사용중지 식별표** 부착 또는 격리 보관
2. 기술책임자에게 **즉시 보고**
3. 부적합 발생일 추적하여 **영향도 평가**
4. 필요시 **재시험 실시**
5. 시험설비 이력카드에 **기록**

---

## 소프트웨어 관리 (UL-QP-18 Section 14)

### 유효성 확인 (UL-QP-18-09)

- 데이터 수집/처리/제어용 소프트웨어 도입 전 유효성 확인 필수
- 공급자 검증 기록으로 대체 가능
- 자체 개발 소프트웨어: 기술책임자가 유효성 확인 실시

### 소프트웨어 관리대장 (UL-QP-18-07)

```typescript
{
  softwareName: string;
  version: string;
  purpose: string;            // 용도 (데이터 수집/처리/제어/기록)
  equipmentId?: string;       // 관련 장비
  validatedBy: string;        // 유효성 확인자
  validatedAt: Date;
  validationRecord: string;   // 검증 기록
}
```

---

## 보정계수 관리 (UL-QP-18 Section 10.4-10.6)

### 적용 규칙 (보정인자 및 파라미터 관리대장 UL-QP-18-11)

- 교정기관 제시 방법 우선
- 별도 방법 미제시 시: **선형 보간법** 또는 **큰 쪽 보정값** 활용
- 기술책임자가 최신화 관리

### 보정 방법 코드

```typescript
enum CorrectionMethodEnum {
  LINEAR_INTERPOLATION = 'linear_interpolation', // 선형 보간법
  HIGHER_VALUE = 'higher_value', // 큰 쪽 보정값
  CALIBRATION_AGENCY = 'calibration_agency', // 교정기관 제시
}
```

---

## 기록 보존 연한 (UL-QP-18 Section 15)

| 양식                | 양식번호    | 보존연한 |
| ------------------- | ----------- | -------- |
| 시험설비 관리대장   | UL-QP-18-01 | **영구** |
| 시험설비 이력카드   | UL-QP-18-02 | **영구** |
| 중간 점검표         | UL-QP-18-03 | 5년      |
| 자체 점검표         | UL-QP-18-05 | 5년      |
| 장비 반·출입 확인서 | UL-QP-18-06 | 5년      |
| 소프트웨어 관리대장 | UL-QP-18-07 | 5년      |
| 보정인자 관리대장   | UL-QP-18-11 | 5년      |

---

## 데이터베이스 스키마

### 장비 (equipment)

```typescript
{
  id: string;                         // uuid 타입 기본 키 (Drizzle ORM 표준)
  name: string;
  managementNumber: string;           // 관리번호 (XXX-XYYYY)
  site: 'suwon' | 'uiwang' | 'pyeongtaek';
  siteCode: 'SUW' | 'UIW' | 'PYT';
  classificationCode: 'E' | 'R' | 'W' | 'S' | 'A' | 'P';
  teamId: string;
  status: EquipmentStatusEnum;
  approvalStatus: ApprovalStatusEnum;

  // 교정 관련
  calibrationMethod: 'external_calibration' | 'self_inspection' | 'not_applicable';
  calibrationRequired: boolean;       // 교정 필요 여부
  lastCalibrationDate?: Date;
  nextCalibrationDate?: Date;
  calibrationCycle?: number;          // 교정 주기 (월)

  // 점검 관련
  lastIntermediateCheckDate?: Date;   // 마지막 중간점검일
  lastSelfCheckDate?: Date;           // 마지막 자체점검일
  checkCycle?: number;                // 점검 주기 (월)

  // 공용장비 관련
  isShared: boolean;
  sharedSource?: 'safety_lab' | 'external';

  // 미관리 장비 플래그
  isUnmanaged: boolean;               // 미관리 장비 여부
  unmanagedReason?: string;           // 미관리 사유

  // 운영책임자
  primaryOperatorId: string;          // 운영책임자(정)
  secondaryOperatorId?: string;       // 운영책임자(부)

  // 첨부파일
  attachmentPath?: string;            // 검수보고서/이력카드 파일
  manualLocation?: string;            // 매뉴얼 보관 위치
}
```

### 장비 상태 Enum (SSOT)

> **⚠️ 중요**: 장비 상태 enum과 라벨은 `packages/schemas/src/enums.ts`에서 **단일 소스로 관리**됩니다.
> 프론트엔드 스타일은 `apps/frontend/lib/constants/equipment-status-styles.ts`에서 정의합니다.

```typescript
// packages/schemas/src/enums.ts (SSOT - Single Source of Truth)
type EquipmentStatus =
  | 'available' // 사용 가능
  | 'in_use' // 사용 중
  | 'checked_out' // 반출 중
  | 'calibration_scheduled' // 교정 예정
  | 'calibration_overdue' // 교정 기한 초과
  | 'non_conforming' // 부적합
  | 'spare' // 여분
  | 'retired'; // 폐기

// 한글 라벨 (packages/schemas)
const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: '사용 가능',
  in_use: '사용 중',
  checked_out: '반출 중',
  calibration_scheduled: '교정 예정',
  calibration_overdue: '교정 기한 초과',
  non_conforming: '부적합',
  spare: '여분',
  retired: '폐기',
};
```

**상태 표시 규칙:**

- `calibration_scheduled`, `calibration_overdue`: 기본 상태 배지는 **"사용 가능"**으로 표시, 교정 상태는 **별도 D-day 배지**로 표시
- `checked_out`: 반출 레코드(checkouts 테이블)의 purpose 필드로 구분
- `spare`: 여분 장비로 따로 관리하지 않는 상태

---

## 장비 필터 관리 (SSOT)

### ⚠️ 중요: 과거 발생한 버그

**2026-01-30 발생한 버그**: 서버 컴포넌트(page.tsx)에서 URL searchParams를 파싱할 때 새 필터 파라미터를 누락하여 필터가 작동하지 않는 문제 발생.

**원인**: 클라이언트 훅과 서버 컴포넌트가 각각 다른 파싱 로직을 사용

**해결책**: `equipment-filter-utils.ts` 공유 유틸리티 생성

장비 목록 필터는 **공유 유틸리티**를 사용하여 클라이언트와 서버 간 일관성을 유지합니다.

### 🔴 절대 금지

```
❌ page.tsx에서 직접 searchParams 파싱하지 말 것
❌ useEquipmentFilters.ts에서 직접 필터 변환 로직 작성하지 말 것
❌ 새 필터 추가 시 equipment-filter-utils.ts 수정 없이 다른 파일만 수정하지 말 것
```

### ✅ 올바른 방법

```
✅ 항상 equipment-filter-utils.ts의 공유 함수 사용
✅ parseEquipmentFiltersFromSearchParams() - URL → UI 필터
✅ convertFiltersToApiParams() - UI 필터 → API 파라미터
✅ 새 필터 추가 시 equipment-filter-utils.ts 먼저 수정
```

### 🔴 필터 추가 시 체크리스트

**새로운 필터를 추가할 때 아래 파일들을 순서대로 수정하세요:**

| 순서 | 파일                                                       | 설명                                                                     |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1    | `lib/utils/equipment-filter-utils.ts`                      | **SSOT** - `UIEquipmentFilters`, `ApiEquipmentFilters` 타입 및 변환 함수 |
| 2    | `hooks/useEquipmentFilters.ts`                             | `EquipmentFilters` 타입 (필요시)                                         |
| 3    | `components/equipment/EquipmentFilters.tsx`                | UI 컴포넌트 (Select, 옵션 등)                                            |
| 4    | `packages/schemas/src/equipment.ts`                        | 백엔드 Zod 스키마 (필요시)                                               |
| 5    | `backend/src/modules/equipment/dto/equipment-query.dto.ts` | 백엔드 DTO                                                               |
| 6    | `backend/src/modules/equipment/equipment.service.ts`       | 백엔드 쿼리 로직                                                         |

### 핵심 파일: `equipment-filter-utils.ts`

```typescript
// ✅ SSOT: 클라이언트 훅과 서버 컴포넌트가 동일한 변환 로직 사용
import {
  parseEquipmentFiltersFromSearchParams,
  convertFiltersToApiParams,
} from '@/lib/utils/equipment-filter-utils';

// Server Component (page.tsx)
const uiFilters = parseEquipmentFiltersFromSearchParams(searchParams);
const apiQuery = convertFiltersToApiParams(uiFilters);

// Client Hook (useEquipmentFilters.ts)
const queryFilters = useMemo(() => {
  return convertFiltersToApiParams(filters);
}, [filters]);
```

### 필터 변환 흐름

```
URL 파라미터 (사용자 친화적)     API 파라미터 (백엔드)
─────────────────────────────   ─────────────────────
isShared=shared            →    isShared=true
isShared=normal            →    isShared=false
calibrationDueFilter=due_soon →  calibrationDue=30
calibrationDueFilter=overdue  →  calibrationOverdue=true
calibrationDueFilter=normal   →  calibrationDueAfter=30
```

---

## 프론트엔드 개발 패턴

> **상세 패턴**: [references/frontend-patterns.md](references/frontend-patterns.md)

### 핵심 원칙

#### 1. Server Component 우선

| 상황               | Server  | Client  |
| ------------------ | ------- | ------- |
| 데이터 fetching    | ✅ 권장 | 가능    |
| 정적 UI 렌더링     | ✅ 권장 | 가능    |
| 이벤트 핸들러      | ❌ 불가 | ✅ 필수 |
| useState/useEffect | ❌ 불가 | ✅ 필수 |

#### 2. Server/Client 분리 패턴

```typescript
// ✅ 권장: Server에서 데이터 fetch → Client로 전달
// app/equipment/page.tsx (Server Component)
export default async function EquipmentPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const initialData = await equipmentApiServer.getEquipmentList(searchParams);

  return <EquipmentListClient initialData={initialData} />;
}

// components/equipment/EquipmentListClient.tsx ('use client')
export function EquipmentListClient({ initialData }) {
  const { data } = useQuery({
    queryKey: ['equipmentList'],
    initialData,  // ← Server 데이터로 hydration
  });
}
```

### 필수 규칙

1. **params/searchParams는 Promise** - 반드시 await 사용
2. **useActionState** 사용 (useFormState 아님)
3. **Form action은 void 반환** - revalidatePath 사용
4. **any 타입 금지**

```typescript
// ✅ Next.js 16 올바른 패턴
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function Page(props: PageProps) {
  const { id } = await props.params;
  const equipment = await equipmentApiServer.getEquipment(id);
  return <EquipmentDetailClient equipment={equipment} />;
}
```

### 장비 상태 스타일 SSOT

프론트엔드에서 장비 상태 표시 시 **반드시** 중앙화된 스타일을 사용합니다.

#### 스타일 조회 (권장)

```typescript
import { getEquipmentStatusStyle } from '@/lib/constants/equipment-status-styles';

// 컴포넌트에서 사용
const style = getEquipmentStatusStyle(equipment.status);
<Badge className={style.className}>{style.label}</Badge>
```

#### 교정 상태 표시 여부 확인

```typescript
import { shouldDisplayCalibrationStatus } from '@/lib/constants/equipment-status-styles';

// 폐기/부적합/여분 장비는 D-day 배지 표시 안함
if (shouldDisplayCalibrationStatus(equipment.status)) {
  // D-day 배지 렌더링
}
```

#### SSOT 파일 구조

| 파일                                                     | 용도                                    |
| -------------------------------------------------------- | --------------------------------------- |
| `packages/schemas/src/enums.ts`                          | Enum 값 + 한글 라벨 정의 (SSOT)         |
| `apps/frontend/lib/constants/equipment-status-styles.ts` | UI 스타일 정의 (className, borderColor) |

> **❌ 금지**: 컴포넌트 내에서 상태별 라벨/스타일을 인라인으로 정의하지 마세요.
> **✅ 권장**: 항상 `getEquipmentStatusStyle()` 헬퍼 함수를 사용하세요.

### 라우트 파일 패턴

| 파일            | 용도                                     | 예시 위치                          |
| --------------- | ---------------------------------------- | ---------------------------------- |
| `loading.tsx`   | 라우트 전환 시 로딩 UI                   | `app/equipment/loading.tsx`        |
| `error.tsx`     | 라우트별 에러 처리 (`'use client'` 필수) | `app/equipment/error.tsx`          |
| `not-found.tsx` | 404 처리 (`notFound()` 호출 시)          | `app/equipment/[id]/not-found.tsx` |
| `layout.tsx`    | 공통 레이아웃 + 메타데이터 템플릿        | `app/equipment/layout.tsx`         |

### generateMetadata 패턴

```typescript
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const equipment = await equipmentApiServer.getEquipment(id);
    return { title: `${equipment.name} - 장비 상세` };
  } catch {
    return { title: '장비 상세' }; // 폴백
  }
}
```

---

## Server Component Props vs Client Cache 패턴 (SSOT)

### ⚠️ 중요: 과거 발생한 버그

**2026-01-30 발생한 버그**: 사고이력 탭에서 "부적합으로 등록" 후 상태 뱃지가 즉시 반영되지 않음 (새로고침 후에야 반영)

**원인**: Server Component에서 props로 받은 데이터는 정적이어서, mutation 후에도 `router.refresh()`가 완료될 때까지 이전 값 유지

**해결책**: `useEquipmentWithInitialData` 훅으로 Server Component 초기 데이터와 React Query 캐시 연동

### 문제 패턴

```
Server Component → props → Client Component
                           └─ mutation 후 props는 변하지 않음!

React Query Cache → refetchQueries() → 캐시 갱신됨
                                        └─ 하지만 props를 구독하지 않는 컴포넌트는 반영 안됨
```

### 🔴 절대 금지

```
❌ Server Component props를 그대로 렌더링에 사용 (mutation이 있는 페이지에서)
❌ mutation 후 router.refresh()만 의존 (비동기 완료 전까지 stale UI)
❌ 각 컴포넌트에서 useQuery 직접 작성 (SSOT 위반)
```

### ✅ 올바른 방법

```typescript
// ✅ SSOT: hooks/use-equipment.ts의 공유 훅 사용
import { useEquipmentWithInitialData } from '@/hooks/use-equipment';

export function EquipmentHeader({ equipment: initialEquipment }: Props) {
  // Server Component 초기 데이터를 initialData로, 이후 캐시 구독
  const { data: equipment } = useEquipmentWithInitialData(initialEquipment);

  // equipment.status는 mutation 후 즉시 반영됨
  const statusConfig = getStatusConfig(equipment.status);
}
```

### SSOT 훅 사용 가이드

**파일 위치**: `apps/frontend/hooks/use-equipment.ts`

```typescript
/**
 * useEquipmentWithInitialData
 *
 * Server Component 초기 데이터와 Client-Side React Query 캐시를 연동합니다.
 * - initialData: SSR 데이터 → 초기 렌더링에 사용, SEO 최적화
 * - staleTime: 0 → 캐시 갱신 시 즉시 UI 반영
 * - queryKey: ['equipment', id] → mutation의 refetchQueries와 일치 필수
 */
export function useEquipmentWithInitialData(initialData: Equipment) {
  const equipmentId = String(initialData.id);
  return useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    initialData,
    staleTime: 0,
  });
}
```

### 적용 대상 컴포넌트

| 컴포넌트                | 적용 여부 | 이유                                       |
| ----------------------- | --------- | ------------------------------------------ |
| `EquipmentHeader`       | ✅ 적용   | 상태 뱃지가 mutation 후 즉시 반영되어야 함 |
| `EquipmentDetailClient` | ⚠️ 검토   | 하위 탭에서 mutation이 있으면 적용 필요    |
| `EquipmentTable` (목록) | ❌ 불필요 | 목록은 별도 쿼리 키 사용                   |

### Mutation 측에서의 쿼리 키 일치

```typescript
// IncidentHistoryTab.tsx - mutation onSuccess
onSuccess: async () => {
  await queryClient.refetchQueries({
    queryKey: ['equipment', equipmentId], // ← 이 키가 일치해야 함
    type: 'active',
  });
};
```

> **중요**: `queryKey`가 `useEquipmentWithInitialData`의 키와 **정확히 일치**해야 캐시가 갱신됩니다.

---

## E2E 테스트

> **중요**: Playwright E2E 테스트에서 NextAuth 인증을 올바르게 처리하는 방법

### 핵심 원칙

**절대 금지**:

- ❌ 백엔드 JWT를 직접 쿠키에 저장
- ❌ NextAuth를 우회하는 어떤 방법
- ❌ `localStorage`에 토큰 저장

**권장 사항**:

- ✅ NextAuth Provider를 통한 인증 (test-login)
- ✅ NextAuth callback API 직접 호출
- ✅ "단일 인증 소스(SSOT)" 원칙 준수

### 올바른 인증 플로우

```typescript
// ✅ 올바른 E2E 테스트 로그인 방식
async function loginAs(page: Page, role: string) {
  // 1. CSRF 토큰 획득
  const csrfResponse = await page.request.get('http://localhost:3000/api/auth/csrf');
  const { csrfToken } = await csrfResponse.json();

  // 2. NextAuth callback API로 POST 요청
  const loginResponse = await page.request.post(
    'http://localhost:3000/api/auth/callback/test-login?callbackUrl=/',
    {
      form: {
        role: role,
        csrfToken: csrfToken,
        json: 'true',
      },
    }
  );

  // 3. 메인 페이지로 이동하여 세션 확인
  await page.goto('/');
}
```

**상세 가이드**: [references/e2e-test-auth.md](references/e2e-test-auth.md)

---

## API 엔드포인트 패턴

### CRUD 기본

```
GET    /[resource]           목록 조회 (필터 지원)
GET    /[resource]/:uuid     상세 조회
POST   /[resource]           생성 (pending_approval 상태)
PATCH  /[resource]/:uuid     수정 (draft 상태만)
DELETE /[resource]/:uuid     삭제 (draft 상태만)
```

### 승인 관련

```
PATCH  /[resource]/:uuid/approve   승인
PATCH  /[resource]/:uuid/reject    반려 (reason 필수)
DELETE /[resource]/:uuid/cancel    취소 (pending 상태만)
```

---

## 검증 명령어

```bash
pnpm tsc --noEmit   # 타입 체크
pnpm test           # 테스트
pnpm db:generate    # 마이그레이션 생성
pnpm db:migrate     # 마이그레이션 실행
pnpm dev            # 개발 서버
```

---

## 참조 문서

### 스킬 내 참조

- **용어 정의**: [references/terminology.md](references/terminology.md)
- **역할 체계 상세**: [references/roles.md](references/roles.md)
- **관리번호/위치코드**: [references/management-numbers.md](references/management-numbers.md)
- **시험설비 이력카드**: [references/equipment-history-card.md](references/equipment-history-card.md)
- **점검/교정 프로세스**: [references/inspection-calibration.md](references/inspection-calibration.md)
- **승인 프로세스 상세**: [references/approval-processes.md](references/approval-processes.md)
- **프론트엔드 UI 패턴**: [references/frontend-patterns.md](references/frontend-patterns.md)
- **인증 아키텍처**: [references/auth-architecture.md](references/auth-architecture.md) - NextAuth 토큰 관리, localStorage 금지 정책
- **E2E 테스트 인증**: [references/e2e-test-auth.md](references/e2e-test-auth.md) - Playwright E2E 테스트에서 NextAuth 인증 처리, 잘못된 접근 vs 올바른 접근

### 연관 스킬

- **Next.js 16 개발 가이드**: `/nextjs-16` - 프론트엔드 UI 개발 시 함께 사용

### 프로젝트 문서

- **장비 관리 절차서**: `/docs/development/장비관리절차서.md` (UL-QP-18)
- **API 표준**: `/docs/development/API_STANDARDS.md`
- **인증 아키텍처 상세**: `/docs/development/AUTH_ARCHITECTURE.md`
- **E2E 테스트 인증 가이드**: `/docs/development/E2E_TEST_AUTH_GUIDE.md` - Playwright E2E 테스트 인증 완벽 가이드
- **개발 환경 설정**: `/docs/development/DEV_SETUP.md` - 개발 환경 구축 가이드, 트러블슈팅
- **팀 확장 로드맵**: `/docs/development/TEAM_EXPANSION_ROADMAP.md` - Phase 1→2→3 단계별 전환 가이드
