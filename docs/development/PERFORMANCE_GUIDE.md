# 프론트엔드 성능 최적화 가이드

Vercel React Best Practices 기반의 성능 최적화 가이드입니다.

> 💡 **스킬 참조**: 이 문서의 내용은 `/vercel-react-best-practices` 스킬에 포함되어 있습니다.
>
> 📖 **관련 문서**:
>
> - [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md) - 프론트엔드 공통 가이드
> - [NEXTJS_16_GUIDE.md](./NEXTJS_16_GUIDE.md) - Next.js 16 개발 가이드

---

## 우선순위별 최적화 규칙

| 우선순위 | 카테고리               | 영향도   |
| -------- | ---------------------- | -------- |
| 1        | Waterfall 제거         | CRITICAL |
| 2        | 번들 사이즈 최적화     | CRITICAL |
| 3        | 서버 사이드 성능       | HIGH     |
| 4        | 클라이언트 데이터 페칭 | MEDIUM   |
| 5        | 리렌더링 최적화        | MEDIUM   |

---

## 1. Waterfall 제거 (Critical)

### 1.1 병렬 데이터 페칭

```typescript
// ❌ 잘못된 패턴: 순차 실행 (Waterfall)
const user = await getUser(userId);
const posts = await getPosts(userId);
const comments = await getComments(userId);

// ✅ 올바른 패턴: 병렬 실행
const [user, posts, comments] = await Promise.all([
  getUser(userId),
  getPosts(userId),
  getComments(userId),
]);
```

### 1.2 Suspense로 스트리밍

```tsx
// ✅ 각 섹션을 독립적으로 로드
export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<EquipmentListSkeleton />}>
        <EquipmentList />
      </Suspense>
      <Suspense fallback={<CalibrationAlertsSkeleton />}>
        <CalibrationAlerts />
      </Suspense>
    </>
  );
}
```

### 1.3 await 지연

```typescript
// ❌ 잘못된 패턴: 즉시 await
export async function getEquipmentWithStats(id: string) {
  const equipment = await getEquipment(id);
  const stats = await getStats(id); // equipment를 기다린 후 시작
  return { equipment, stats };
}

// ✅ 올바른 패턴: 먼저 시작, 나중에 await
export async function getEquipmentWithStats(id: string) {
  const equipmentPromise = getEquipment(id);
  const statsPromise = getStats(id); // 동시에 시작

  const [equipment, stats] = await Promise.all([equipmentPromise, statsPromise]);
  return { equipment, stats };
}
```

---

## 2. 번들 사이즈 최적화 (Critical)

### 2.1 Barrel Import 금지

```typescript
// ❌ 잘못된 패턴: Barrel import
import { Button, Card, Dialog } from '@/components/ui';

// ✅ 올바른 패턴: 직접 import
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
```

### 2.2 동적 Import

```tsx
// ❌ 잘못된 패턴: 무거운 컴포넌트 직접 import
import { HeavyChart } from '@/components/charts/HeavyChart';

// ✅ 올바른 패턴: 동적 import
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/charts/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // 클라이언트에서만 필요한 경우
});
```

### 2.3 서드파티 라이브러리 지연 로딩

```tsx
// ❌ 잘못된 패턴: 항상 로드
import { analytics } from 'heavy-analytics-lib';

// ✅ 올바른 패턴: 하이드레이션 후 로드
('use client');

import { useEffect } from 'react';

export function Analytics() {
  useEffect(() => {
    import('heavy-analytics-lib').then((mod) => {
      mod.analytics.init();
    });
  }, []);

  return null;
}
```

---

## 3. 서버 사이드 성능 (High)

### 3.1 React.cache로 요청 중복 제거

```typescript
import { cache } from 'react';

// ✅ 같은 요청 내에서 자동 중복 제거
export const getEquipment = cache(async (id: string) => {
  const response = await fetch(`/api/equipment/${id}`);
  return response.json();
});
```

### 3.2 직렬화 최소화

```tsx
// ❌ 잘못된 패턴: 전체 데이터 전달
const equipment = await getEquipmentWithHistory(id);
return <EquipmentClient equipment={equipment} />;

// ✅ 올바른 패턴: 필요한 데이터만 전달
const equipment = await getEquipmentWithHistory(id);
return (
  <EquipmentClient
    id={equipment.id}
    name={equipment.name}
    status={equipment.status}
    // history는 필요할 때 클라이언트에서 별도 페칭
  />
);
```

---

## 4. 리렌더링 최적화 (Medium)

### 4.1 콜백에서만 사용하는 상태 구독 금지

```tsx
// ❌ 잘못된 패턴: 렌더링에 사용하지 않는 상태 구독
function SearchForm() {
  const query = useSearchStore((s) => s.query); // 매번 리렌더링
  const setQuery = useSearchStore((s) => s.setQuery);

  const handleSubmit = () => {
    search(query);
  };

  return <input onChange={(e) => setQuery(e.target.value)} />;
}

// ✅ 올바른 패턴: getState() 사용
function SearchForm() {
  const setQuery = useSearchStore((s) => s.setQuery);

  const handleSubmit = () => {
    const query = useSearchStore.getState().query; // 렌더링 없이 최신 값
    search(query);
  };

  return <input onChange={(e) => setQuery(e.target.value)} />;
}
```

### 4.2 파생 상태 구독

```tsx
// ❌ 잘못된 패턴: 전체 상태 구독
const equipment = useEquipmentStore((s) => s.equipment);
const isAvailable = equipment.status === 'available';

// ✅ 올바른 패턴: 파생 상태만 구독
const isAvailable = useEquipmentStore((s) => s.equipment.status === 'available');
```

### 4.3 비용이 큰 계산 메모이제이션

```tsx
// ❌ 잘못된 패턴: 매 렌더링마다 계산
function EquipmentStats({ equipment }: Props) {
  const stats = calculateComplexStats(equipment); // 비용이 큼
  return <div>{stats}</div>;
}

// ✅ 올바른 패턴: useMemo 사용
function EquipmentStats({ equipment }: Props) {
  const stats = useMemo(() => calculateComplexStats(equipment), [equipment]);
  return <div>{stats}</div>;
}
```

---

## 5. 이미지 최적화

### 5.1 next/image 사용

```tsx
// ❌ 잘못된 패턴
<img src="/photo.jpg" alt="Photo" />;

// ✅ 올바른 패턴
import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  priority // above-the-fold 이미지인 경우
/>;
```

### 5.2 반응형 이미지

```tsx
<Image
  src="/equipment.jpg"
  alt="장비 이미지"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>
```

---

## 6. 빌드 타임 최적화 (Build-Time Optimization)

### 6.1 `optimizePackageImports` 관리

Barrel import(index.ts re-export)는 패키지 전체를 파싱하여 cold 컴파일 당 200-800ms 비용이 발생합니다.
`next.config.js`의 `optimizePackageImports`에 등록하면 빌드 타임에 직접 import로 자동 변환됩니다.

```javascript
// next.config.js
optimizePackageImports: [
  'lucide-react',        // 37MB, 3496 아이콘
  'date-fns',
  '@tanstack/react-query',
  'recharts',
  'react-hook-form',
  '@radix-ui/react-*',   // 전체 Radix UI 컴포넌트
  // ... 기타
],
```

> **새 대형 패키지 추가 시 반드시 `optimizePackageImports`에도 등록하세요.**
>
> 참고: [Vercel - How we optimized package imports](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)

### 6.2 Server/Client 분리 필수 패턴

`page.tsx`에 `'use client'`를 직접 사용하지 마세요. Server Component 경계가 Turbopack의 코드 분할 포인트가 됩니다.

```tsx
// ❌ 잘못된 패턴: page.tsx에 'use client'
'use client';
import { useState } from 'react';
import { HeavyLib } from 'heavy-lib'; // 전체 번들에 포함

export default function Page() {
  const [state, setState] = useState();
  return <div>...</div>;
}

// ✅ 올바른 패턴: Server page.tsx + Client XxxContent.tsx
// page.tsx (Server Component)
import { createServerApiClient } from '@/lib/api/server-api-client';
import PageContent from './PageContent';

export default async function Page() {
  const apiClient = await createServerApiClient();
  const initialData = await apiClient.get('/api/data');
  return <PageContent initialData={initialData} />;
}

// PageContent.tsx (Client Component)
('use client');
import { useState } from 'react';

export default function PageContent({ initialData }) {
  // 인터랙티브 로직
}
```

> **레퍼런스**: `checkouts/page.tsx`, `calibration/page.tsx`

### 6.3 Barrel Export 금지

`index.ts`에서 여러 모듈을 re-export하지 마세요. 직접 import만 사용합니다.

```typescript
// ❌ lib/api/index.ts에서 import
import { equipmentApi, calibrationApi } from '@/lib/api';

// ✅ 직접 import
import equipmentApi from '@/lib/api/equipment-api';
import calibrationApi from '@/lib/api/calibration-api';
```

### 6.4 미사용 의존성 정리

정기적으로 미사용 패키지를 점검하세요.

```bash
# 사용 여부 확인
grep -r "패키지명" apps/frontend/app apps/frontend/components apps/frontend/lib --include="*.ts" --include="*.tsx"

# 미사용 패키지 제거
pnpm --filter frontend remove 패키지명
```

---

## 7. 빠른 검증 명령어

```bash
# 번들 분석
pnpm --filter frontend build
npx @next/bundle-analyzer

# TypeScript 검사 (any 타입 체크)
pnpm --filter frontend tsc --noEmit

# Lighthouse 성능 테스트
npx lighthouse http://localhost:3000 --view
```

---

## 참고 문서

- [Vercel React Best Practices](https://vercel.com/docs)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [React Server Components](https://react.dev/reference/rsc/server-components)

---

**마지막 업데이트**: 2026-02-06
