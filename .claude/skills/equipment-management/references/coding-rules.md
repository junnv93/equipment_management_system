# 코드 품질 규칙 및 반복 실수 패턴

## 코드 품질 규칙

### 필수 (MUST)

1. **`any` 타입 사용 금지** — `unknown` 또는 구체적 타입 사용
2. **모든 타입은 SSOT에서 import** — `@equipment-management/schemas`, `@equipment-management/shared-constants`
3. **API 파일에서 barrel import 금지** — 직접 import 사용 (tree-shaking)
4. **Server Component에서 중복 fetch 금지** — `React.cache()` 사용

### 권장 (SHOULD)

1. 무거운 컴포넌트는 `next/dynamic` import 사용
2. useQuery 훅은 관련 컴포넌트 내부에서 호출 (탭별 데이터 분리)
3. 복잡한 계산은 `useMemo`로 메모이제이션

### ESLint로 강제되는 규칙

| 규칙 | 레벨 | 설명 |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | error | any 타입 금지 |
| `@typescript-eslint/no-unused-vars` | error | 미사용 변수 금지 |
| `react-hooks/exhaustive-deps` | error | useEffect 의존성 누락 금지 |
| `no-restricted-imports` | error | SSOT 위반 import 차단 |

---

## Vercel/React Best Practices 체크리스트

### CRITICAL: Request Waterfall 제거

```typescript
// ❌ 순차 실행 (Waterfall)
const user = await getUser();
const posts = await getPosts();

// ✅ 병렬 실행
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```

### CRITICAL: Bundle Size 최적화

- Barrel import 금지 (`from '@/lib/api'` → `from '@/lib/api/equipment-api'`)
- Dynamic import 사용 (`next/dynamic`, `ssr: false`)

### HIGH: Server-Side 성능

- `React.cache()` — generateMetadata와 Page에서 중복 fetch 방지
- Server Component 우선 — 데이터 fetch는 Server Component에서
- `initialData` 패턴 — Server에서 fetch → Client의 useQuery에 전달

---

## 반복되는 실수 패턴 (절대 금지)

### 1. NestJS Controller에서 `@Req() req: any` 사용

```typescript
// ❌ 금지
@Get(':uuid')
async findOne(@Param('uuid') uuid: string, @Req() req: any) {}

// ✅ 권장
import { AuthenticatedRequest } from '../../types/auth';
@Get(':uuid')
async findOne(@Param('uuid') uuid: string, @Req() req: AuthenticatedRequest) {}
```

### 2. Multer 파일에 `file: any` 사용

`Express.Multer.File` 타입 사용.

### 3. generateMetadata와 Page에서 중복 fetch

`React.cache()` 래핑으로 해결.

### 4. Drizzle ORM에서 `as any` 캐스팅

올바른 타입으로 값 전달.

### 5. 로컬에서 타입/Enum 재정의

`@equipment-management/schemas`에서 import.

### 6. Optimistic Locking 없이 상태 변경

`VersionedBaseService.updateWithVersion()` 사용.

### 7. 수동 캐시 조작 (스냅샷 롤백)

에러 시 `invalidateQueries`로 서버 재검증 (스냅샷 롤백 아님).

### 8. Server Component Props vs Client Cache 불일치

`useEquipmentWithInitialData` 훅으로 Server Component 초기 데이터와 React Query 캐시 연동.

**파일**: `apps/frontend/hooks/use-equipment.ts`

```typescript
// ✅ mutation이 있는 상세 페이지에서 사용
const { data: equipment } = useEquipmentWithInitialData(initialEquipment);
// initialData + staleTime: 0 → mutation 후 즉시 반영
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
