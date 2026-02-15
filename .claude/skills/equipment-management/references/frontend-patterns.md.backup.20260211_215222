# 프론트엔드 개발 패턴 (Next.js 16)

## 목차

1. [핵심 원칙](#핵심-원칙)
2. [필수 규칙](#필수-규칙)
3. [Server/Client Component 분리](#serverclient-component-분리)
4. [라우트 파일 패턴](#라우트-파일-패턴)
5. [페이지 패턴](#페이지-패턴)
6. [메타데이터 패턴](#메타데이터-패턴)
7. [Suspense와 Streaming](#suspense와-streaming)
8. [컴포넌트 패턴](#컴포넌트-패턴)
9. [API 호출 패턴](#api-호출-패턴)
10. [폼 처리 패턴](#폼-처리-패턴)
11. [캐싱과 재검증](#캐싱과-재검증)
12. [승인 관리 페이지](#승인-관리-페이지)

---

## 핵심 원칙

### Server Component 우선 원칙

Next.js 16에서는 **Server Component가 기본**입니다. 다음 경우에만 Client Component를 사용하세요:

| 상황                          | Server         | Client          |
| ----------------------------- | -------------- | --------------- |
| 데이터 fetching               | ✅ 권장        | 가능 (useQuery) |
| 정적 UI 렌더링                | ✅ 권장        | 가능            |
| 이벤트 핸들러 (onClick)       | ❌ 불가        | ✅ 필수         |
| useState, useEffect           | ❌ 불가        | ✅ 필수         |
| 브라우저 API (localStorage)   | ❌ 불가        | ✅ 필수         |
| 서드파티 라이브러리 (차트 등) | ❌ 대부분 불가 | ✅ 필수         |

### 컴포넌트 경계 설계

```
┌─────────────────────────────────────────────────────────────┐
│  page.tsx (Server Component)                                │
│  ├── 데이터 fetching                                        │
│  ├── 메타데이터 생성                                         │
│  └── 정적 레이아웃                                           │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ClientComponent.tsx ('use client')                  │   │
│  │  ├── 상호작용 (onClick, onChange)                    │   │
│  │  ├── 상태 관리 (useState, useQuery)                  │   │
│  │  └── 클라이언트 사이드 필터/정렬                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 필수 규칙

### 1. params와 searchParams는 Promise

```typescript
// ❌ 잘못된 패턴 (Next.js 15 이전)
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}

// ✅ 올바른 패턴 (Next.js 16)
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page(props: PageProps) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  return <div>{id}</div>;
}
```

### 2. useActionState 사용

```typescript
// ❌ 잘못된 패턴 (useFormState 사용)
import { useFormState } from 'react-dom';

// ✅ 올바른 패턴
import { useActionState } from 'react';
```

### 3. Form action은 void 반환

```typescript
// ❌ 잘못된 패턴 - 폼 액션에서 데이터 반환
export async function submitForm(formData: FormData) {
  'use server';
  return { success: true }; // 타입 에러!
}

// ✅ 올바른 패턴 - revalidation 사용
export async function submitForm(formData: FormData) {
  'use server';
  await saveData(formData);
  revalidatePath('/equipment');
  // void 반환
}
```

### 4. any 타입 금지

```typescript
// ❌ 잘못된 패턴
const data: any = await fetch(...);

// ✅ 올바른 패턴
interface Equipment {
  uuid: string;
  name: string;
  // ...
}
const data: Equipment[] = await fetch(...).then(r => r.json());
```

---

## Server/Client Component 분리

### 목록 페이지 분리 패턴

```typescript
// ✅ 권장 패턴: Server Component에서 초기 데이터 fetch

// app/equipment/page.tsx (Server Component)
import { Suspense } from 'react';
import { EquipmentListClient } from '@/components/equipment/EquipmentListClient';
import { EquipmentListSkeleton } from '@/components/equipment/EquipmentListSkeleton';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';

type PageProps = {
  searchParams: Promise<{
    site?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function EquipmentPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // Server에서 초기 데이터 fetch
  const initialData = await equipmentApiServer.getEquipmentList({
    site: searchParams.site,
    status: searchParams.status,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">장비 목록</h1>

      <Suspense fallback={<EquipmentListSkeleton />}>
        <EquipmentListClient
          initialData={initialData}
          initialFilters={{
            site: searchParams.site,
            status: searchParams.status,
          }}
        />
      </Suspense>
    </div>
  );
}

// components/equipment/EquipmentListClient.tsx ('use client')
'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import equipmentApi from '@/lib/api/equipment-api';

interface EquipmentListClientProps {
  initialData: EquipmentListResponse;
  initialFilters?: { site?: string; status?: string };
}

export function EquipmentListClient({
  initialData,
  initialFilters
}: EquipmentListClientProps) {
  const [filters, setFilters] = useState(initialFilters ?? {});

  // initialData로 시작, 이후 클라이언트에서 refetch
  const { data, isLoading } = useQuery({
    queryKey: ['equipmentList', filters],
    queryFn: () => equipmentApi.getEquipmentList(filters),
    initialData,  // ← Server에서 받은 데이터로 hydration
    staleTime: 30 * 1000,
  });

  return (
    <>
      <EquipmentFilters filters={filters} onChange={setFilters} />
      <EquipmentTable items={data.data} isLoading={isLoading} />
    </>
  );
}
```

### 상세 페이지 분리 패턴

```typescript
// app/equipment/[id]/page.tsx (Server Component)
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { EquipmentDetailClient } from '@/components/equipment/EquipmentDetailClient';
import { EquipmentDetailSkeleton } from '@/components/equipment/EquipmentDetailSkeleton';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import { isNotFoundError } from '@/lib/api/error';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EquipmentDetailPage(props: PageProps) {
  const { id } = await props.params;

  let equipment;
  try {
    equipment = await equipmentApiServer.getEquipment(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;  // error.tsx에서 처리
  }

  return (
    <Suspense fallback={<EquipmentDetailSkeleton />}>
      <EquipmentDetailClient equipment={equipment} />
    </Suspense>
  );
}
```

### 수정 페이지 분리 패턴

```typescript
// ✅ 권장: Server Component에서 데이터 fetch 후 Client로 전달

// app/equipment/[id]/edit/page.tsx (Server Component)
import { notFound } from 'next/navigation';
import { EditEquipmentClient } from '@/components/equipment/EditEquipmentClient';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import { isNotFoundError } from '@/lib/api/error';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEquipmentPage(props: PageProps) {
  const { id } = await props.params;

  let equipment;
  try {
    equipment = await equipmentApiServer.getEquipment(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return <EditEquipmentClient equipment={equipment} />;
}

export async function generateMetadata(props: PageProps) {
  const { id } = await props.params;

  try {
    const equipment = await equipmentApiServer.getEquipment(id);
    return {
      title: `${equipment.name} 수정 - 장비 관리`,
    };
  } catch {
    return { title: '장비 수정' };
  }
}

// components/equipment/EditEquipmentClient.tsx ('use client')
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EquipmentForm } from './EquipmentForm';
import { useUpdateEquipment } from '@/hooks/use-equipment';

interface EditEquipmentClientProps {
  equipment: Equipment;
}

export function EditEquipmentClient({ equipment }: EditEquipmentClientProps) {
  const router = useRouter();
  const updateEquipment = useUpdateEquipment();

  const handleSubmit = async (data: UpdateEquipmentInput) => {
    await updateEquipment.mutateAsync({ id: equipment.uuid, data });
    router.push(`/equipment/${equipment.uuid}`);
  };

  return (
    <EquipmentForm
      initialData={equipment}
      onSubmit={handleSubmit}
      isLoading={updateEquipment.isPending}
    />
  );
}
```

---

## 라우트 파일 패턴

### loading.tsx - 라우트 전환 로딩 UI

```typescript
// app/equipment/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Next.js가 자동으로 Suspense 경계를 생성
 * 라우트 전환 시 이 컴포넌트가 표시됨
 */
export default function EquipmentLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* 필터 스켈레톤 */}
      <Skeleton className="h-[120px] w-full rounded-lg" />

      {/* 테이블 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[300px]" />
      </div>
    </div>
  );
}
```

### error.tsx - 라우트별 에러 처리

```typescript
// app/equipment/error.tsx
'use client';  // 필수! Error boundary는 Client Component

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EquipmentError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅 (Sentry 등으로 전송)
    console.error('Equipment page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <h2 className="mt-6 text-2xl font-bold">장비 목록을 불러올 수 없습니다</h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          {error.message || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
        </p>

        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            오류 코드: {error.digest}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              홈으로
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### not-found.tsx - 라우트별 404 처리

```typescript
// app/equipment/[id]/not-found.tsx
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * notFound() 호출 시 렌더링되는 컴포넌트
 * Server Component로 작성 가능
 */
export default function EquipmentNotFound() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        <h2 className="mt-6 text-2xl font-bold">장비를 찾을 수 없습니다</h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          요청하신 장비가 존재하지 않거나 삭제되었습니다.
        </p>

        <div className="mt-6">
          <Button asChild className="gap-2">
            <Link href="/equipment">
              <ArrowLeft className="h-4 w-4" />
              장비 목록으로
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### layout.tsx - 라우트 그룹 레이아웃

```typescript
// app/equipment/layout.tsx
import { ReactNode } from 'react';

interface EquipmentLayoutProps {
  children: ReactNode;
}

/**
 * /equipment 하위 모든 페이지에 적용되는 레이아웃
 */
export default function EquipmentLayout({ children }: EquipmentLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

// 정적 메타데이터 (하위 페이지에서 오버라이드 가능)
export const metadata = {
  title: {
    template: '%s - 장비 관리',
    default: '장비 관리',
  },
};
```

---

## 페이지 패턴

### 목록 페이지 (Server + Client 하이브리드)

```typescript
// app/equipment/page.tsx
import { Suspense } from 'react';
import { EquipmentListClient } from '@/components/equipment/EquipmentListClient';
import { EquipmentListSkeleton } from '@/components/equipment/EquipmentListSkeleton';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';

type PageProps = {
  searchParams: Promise<{
    site?: string;
    status?: string;
    page?: string;
    search?: string;
  }>;
};

export default async function EquipmentPage(props: PageProps) {
  const searchParams = await props.searchParams;

  // Server에서 초기 데이터 fetch (SEO + 초기 로드 성능)
  const initialData = await equipmentApiServer.getEquipmentList({
    site: searchParams.site,
    status: searchParams.status,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    search: searchParams.search,
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">장비 관리</h1>
          <p className="text-muted-foreground mt-1">
            시험소 장비를 검색하고 관리합니다
          </p>
        </div>
      </div>

      <Suspense fallback={<EquipmentListSkeleton />}>
        <EquipmentListClient
          initialData={initialData}
          initialFilters={{
            site: searchParams.site,
            status: searchParams.status,
            search: searchParams.search,
          }}
        />
      </Suspense>
    </div>
  );
}

// 정적 메타데이터
export const metadata = {
  title: '장비 목록',
  description: '시험소 장비 목록을 조회하고 관리합니다.',
};
```

### 상세 페이지 (Server Component 주도)

```typescript
// app/equipment/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { EquipmentDetailClient } from '@/components/equipment/EquipmentDetailClient';
import { EquipmentDetailSkeleton } from '@/components/equipment/EquipmentDetailSkeleton';
import * as equipmentApiServer from '@/lib/api/equipment-api-server';
import { isNotFoundError } from '@/lib/api/error';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EquipmentDetailPage(props: PageProps) {
  const { id } = await props.params;

  let equipment;
  try {
    equipment = await equipmentApiServer.getEquipment(id);
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }

  return (
    <Suspense fallback={<EquipmentDetailSkeleton />}>
      <EquipmentDetailClient equipment={equipment} />
    </Suspense>
  );
}
```

### 등록 페이지 (Client Component)

```typescript
// app/equipment/create/page.tsx
import { CreateEquipmentClient } from '@/components/equipment/CreateEquipmentClient';

/**
 * 등록 페이지는 폼 인터랙션이 주이므로 Client Component 사용
 * 메타데이터만 Server에서 정적으로 제공
 */
export default function CreateEquipmentPage() {
  return <CreateEquipmentClient />;
}

export const metadata = {
  title: '장비 등록',
  description: '새로운 장비를 시스템에 등록합니다.',
};
```

---

## 메타데이터 패턴

### 정적 메타데이터

```typescript
// app/equipment/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '장비 목록',
  description: '시험소 장비 목록을 조회하고 관리합니다.',
  openGraph: {
    title: '장비 관리 시스템',
    description: '시험소 장비를 효율적으로 관리하세요.',
  },
};
```

### 동적 메타데이터

```typescript
// app/equipment/[id]/page.tsx
import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;

  try {
    const equipment = await equipmentApiServer.getEquipment(id);

    return {
      title: `${equipment.name} - 장비 상세`,
      description: `${equipment.name} (${equipment.managementNumber})의 상세 정보, 교정 이력, 반출 이력을 확인하세요.`,
      openGraph: {
        title: equipment.name,
        description: `관리번호: ${equipment.managementNumber}`,
      },
    };
  } catch {
    // 에러 시 기본 메타데이터 반환
    return {
      title: '장비 상세',
      description: '장비 상세 정보',
    };
  }
}
```

### 템플릿 메타데이터

```typescript
// app/equipment/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | 장비 관리', // 하위 페이지 title에 suffix 추가
    default: '장비 관리',
  },
};

// 결과:
// /equipment → "장비 관리"
// /equipment/[id] → "장비명 - 장비 상세 | 장비 관리"
```

---

## Suspense와 Streaming

### 중첩 Suspense로 점진적 렌더링

```typescript
// app/equipment/[id]/page.tsx
import { Suspense } from 'react';

export default async function EquipmentDetailPage(props: PageProps) {
  const { id } = await props.params;
  const equipment = await equipmentApiServer.getEquipment(id);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 기본 정보: 즉시 표시 */}
      <EquipmentHeader equipment={equipment} />

      {/* 교정 이력: 별도 Suspense 경계 */}
      <Suspense fallback={<CalibrationHistorySkeleton />}>
        <CalibrationHistoryWrapper equipmentId={id} />
      </Suspense>

      {/* 반출 이력: 별도 Suspense 경계 */}
      <Suspense fallback={<CheckoutHistorySkeleton />}>
        <CheckoutHistoryWrapper equipmentId={id} />
      </Suspense>
    </div>
  );
}

// 각 섹션은 독립적으로 데이터 fetch 및 렌더링
async function CalibrationHistoryWrapper({ equipmentId }: { equipmentId: string }) {
  const history = await equipmentApiServer.getCalibrationHistory(equipmentId);
  return <CalibrationHistoryTable data={history} />;
}
```

### loading.tsx vs 수동 Suspense

```typescript
// loading.tsx 사용 시
// - 라우트 전환 시 전체 페이지에 로딩 UI 표시
// - 자동으로 Suspense 경계 생성

// 수동 Suspense 사용 시
// - 페이지 내 특정 섹션만 로딩 UI 표시
// - 더 세밀한 로딩 경험 제공

// ✅ 권장: 둘 다 사용
// - loading.tsx: 라우트 전환용
// - 수동 Suspense: 페이지 내 비동기 섹션용
```

---

## 컴포넌트 패턴

### 상태 배지 컴포넌트 (SSOT 패턴)

> **⚠️ 중요**: 장비 상태 스타일은 인라인으로 정의하지 않고, 중앙화된 헬퍼 함수를 사용합니다.
>
> **파일 위치**: `apps/frontend/lib/constants/equipment-status-styles.ts`
>
> 이 파일이 장비 상태 스타일의 **Single Source of Truth (SSOT)**입니다.
> 새로운 상태 추가나 스타일 변경 시 이 파일만 수정하면 됩니다.

#### 장비 상태 배지 (권장 패턴)

```typescript
// ✅ 권장: 중앙화된 스타일 사용
// 파일: apps/frontend/lib/constants/equipment-status-styles.ts
import { getEquipmentStatusStyle } from '@/lib/constants/equipment-status-styles';

interface EquipmentStatusBadgeProps {
  status: string;
}

export function EquipmentStatusBadge({ status }: EquipmentStatusBadgeProps) {
  const style = getEquipmentStatusStyle(status);

  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

// 실제 구현: apps/frontend/components/equipment/EquipmentTable.tsx
// StatusBadge는 EquipmentTable 내에 memo로 정의되어 있습니다.
const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const style = getEquipmentStatusStyle(status);
  return (
    <Badge variant="outline" className={`${style.className} border-0`}>
      {style.label}
    </Badge>
  );
});
```

#### 교정 상태 D-day 배지

```typescript
import { shouldDisplayCalibrationStatus } from '@/lib/constants/equipment-status-styles';

interface CalibrationBadgeProps {
  status: string;
  nextCalibrationDate?: string | null;
}

export function CalibrationBadge({ status, nextCalibrationDate }: CalibrationBadgeProps) {
  // 교정 상태 표시가 의미 없는 장비 상태 확인
  // - retired: 더 이상 사용하지 않음
  // - non_conforming: 수리/보수 후 필수적으로 재교정 필요
  // - spare: 실제 사용 전에 교정 상태 재확인 필요
  if (!shouldDisplayCalibrationStatus(status)) {
    return null;
  }

  if (!nextCalibrationDate) {
    return null;
  }

  const dDay = calculateDDay(nextCalibrationDate);
  const badgeClass = dDay > 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass}`}>
      {dDay > 0 ? `D+${dDay}` : dDay === 0 ? 'D-Day' : `D${dDay}`}
    </span>
  );
}
```

#### 승인/반출 상태 배지 (기존 패턴)

승인 상태와 반출 상태는 기존 인라인 설정 방식을 사용합니다:

```typescript
// components/shared/StatusBadge.tsx
const STATUS_CONFIG = {
  approval: {
    pending_approval: { label: '승인대기', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: '승인됨', color: 'bg-green-100 text-green-800' },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-800' },
  },
  checkout: {
    pending: { label: '대기', color: 'bg-gray-100 text-gray-800' },
    approved: { label: '승인됨', color: 'bg-green-100 text-green-800' },
    checked_out: { label: '반출중', color: 'bg-purple-100 text-purple-800' },
    returned: { label: '반입완료', color: 'bg-yellow-100 text-yellow-800' },
    return_approved: { label: '반입승인', color: 'bg-green-100 text-green-800' },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-800' },
    canceled: { label: '취소됨', color: 'bg-gray-100 text-gray-800' },
    overdue: { label: '기한초과', color: 'bg-red-100 text-red-800' },
  },
};
```

### 역할 기반 UI 표시

> ⚠️ **참고**: 별도의 `RoleGuard` 컴포넌트는 현재 구현되어 있지 않습니다.
> 역할 기반 UI 표시는 세션 정보를 직접 사용하여 조건부 렌더링합니다.

```typescript
// 패턴 1: useSession 훅 사용 (Client Component)
'use client';

import { useSession } from 'next-auth/react';

export function ApprovalButtons() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const canApprove = userRole === 'technical_manager' || userRole === 'lab_manager';

  if (!canApprove) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <button onClick={handleApprove}>승인</button>
      <button onClick={handleReject}>반려</button>
    </div>
  );
}

// 패턴 2: Server Component에서 세션 확인
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles?.includes('lab_manager')) {
    return <div>접근 권한이 없습니다.</div>;
  }

  return <AdminContent />;
}
```

> 💡 **향후 개선**: 재사용성을 위해 `RoleGuard` 컴포넌트 구현을 고려할 수 있습니다.

---

## API 호출 패턴

### Server-side API (Server Component용)

```typescript
// lib/api/equipment-api-server.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Server Component 전용 API 함수
 * getServerSession()으로 인증 토큰 자동 주입
 */
export async function getEquipmentList(params?: {
  site?: string;
  status?: string;
  page?: number;
}): Promise<EquipmentListResponse> {
  const session = await getServerSession(authOptions);

  const searchParams = new URLSearchParams();
  if (params?.site) searchParams.set('site', params.site);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', params.page.toString());

  const response = await fetch(`${BACKEND_URL}/api/equipment?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${session?.accessToken}`,
    },
    next: { revalidate: 60 }, // 60초 캐시
  });

  if (!response.ok) {
    throw new Error('장비 목록을 불러올 수 없습니다');
  }

  return response.json();
}

export async function getEquipment(uuid: string): Promise<Equipment> {
  const session = await getServerSession(authOptions);

  const response = await fetch(`${BACKEND_URL}/api/equipment/${uuid}`, {
    headers: {
      Authorization: `Bearer ${session?.accessToken}`,
    },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      const error = new Error('장비를 찾을 수 없습니다');
      (error as any).status = 404;
      throw error;
    }
    throw new Error('장비 정보를 불러올 수 없습니다');
  }

  return response.json();
}
```

### Client-side API (Client Component용)

```typescript
// lib/api/equipment-api.ts
import { apiClient } from './api-client';

/**
 * Client Component용 API 함수
 * apiClient가 세션 토큰 자동 주입
 */
export async function getEquipmentList(params?: {
  site?: string;
  status?: string;
  page?: number;
}): Promise<EquipmentListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.site) searchParams.set('site', params.site);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', params.page.toString());

  const response = await apiClient.get(`/equipment?${searchParams}`);
  return response.data;
}
```

---

## 폼 처리 패턴

### useActionState 활용

```typescript
// app/calibration/register/page.tsx
'use client';

import { useActionState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createCalibration } from '@/lib/actions/calibration-actions';

export default function RegisterCalibrationPage() {
  const { user } = useAuth();
  const [state, formAction, isPending] = useActionState(createCalibration, null);

  const isTechnicalOrHigher = ['technical_manager', 'lab_manager'].includes(user?.role || '');

  return (
    <form action={formAction}>
      <div className="space-y-4">
        <input type="text" name="calibrationDate" required />
        <input type="text" name="result" required />
      </div>

      {/* 기술책임자용: 코멘트 필수 */}
      {isTechnicalOrHigher && (
        <textarea
          name="registrarComment"
          required
          minLength={5}
          placeholder="검토 완료 내용을 입력하세요"
        />
      )}

      {state?.error && (
        <div className="p-4 bg-red-50 text-red-700 rounded">
          {state.error}
        </div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? '등록 중...' : '등록'}
      </button>
    </form>
  );
}
```

### Server Action 정의

```typescript
// lib/actions/equipment-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface FormState {
  error?: string;
  success?: boolean;
}

export async function createEquipment(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return { error: '인증이 필요합니다' };
  }

  try {
    const name = formData.get('name') as string;
    const managementNumber = formData.get('managementNumber') as string;

    if (!name || !managementNumber) {
      return { error: '필수 항목을 모두 입력해주세요' };
    }

    const response = await fetch(`${BACKEND_URL}/api/equipment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, managementNumber }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { error: data.message || '등록에 실패했습니다' };
    }

    revalidatePath('/equipment');
  } catch (error) {
    return { error: '등록 중 오류가 발생했습니다' };
  }

  redirect('/equipment');
}
```

---

## 캐싱과 재검증

### fetch 캐싱 옵션

```typescript
// Server Component에서 fetch 캐싱
const data = await fetch(url, {
  // 캐시 전략
  cache: 'force-cache', // 기본값, 무한 캐시
  cache: 'no-store', // 캐시 안함, 매번 새로 요청

  // 시간 기반 재검증
  next: { revalidate: 60 }, // 60초마다 재검증
  next: { revalidate: 3600 }, // 1시간마다 재검증
  next: { revalidate: false }, // 무한 캐시 (force-cache와 동일)

  // 태그 기반 재검증
  next: { tags: ['equipment', 'equipment-list'] },
});
```

### On-demand 재검증

```typescript
// lib/actions/equipment-actions.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateEquipment(id: string, data: unknown) {
  await apiClient.patch(`/equipment/${id}`, data);

  // 경로 기반 재검증
  revalidatePath('/equipment');
  revalidatePath(`/equipment/${id}`);

  // 태그 기반 재검증
  revalidateTag('equipment');
  revalidateTag(`equipment-${id}`);
}
```

---

## 승인 관리 페이지

### 범용 승인 관리 페이지 패턴

```typescript
// components/admin/ApprovalsPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface PendingItem {
  uuid: string;
  name: string;
  requestedBy: { name: string };
  requestedAt: string;
}

interface ApprovalsPageProps {
  title: string;
  fetchPending: () => Promise<PendingItem[]>;
  onApprove: (uuid: string, comment: string) => Promise<void>;
  onReject: (uuid: string, reason: string) => Promise<void>;
  commentRequired?: boolean;
}

export function ApprovalsPage({
  title,
  fetchPending,
  onApprove,
  onReject,
  commentRequired = false,
}: ApprovalsPageProps) {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await fetchPending();
    setItems(data);
    setLoading(false);
  };

  const handleReject = async () => {
    if (!selectedItem || rejectReason.length < 10) {
      alert('반려 사유는 10자 이상 입력해주세요');
      return;
    }

    await onReject(selectedItem, rejectReason);
    await loadItems();
    setRejectReason('');
    setShowRejectModal(false);
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      {items.length === 0 ? (
        <p className="text-gray-500">승인 대기 중인 항목이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.uuid} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    요청자: {item.requestedBy.name}
                  </p>
                </div>
                <StatusBadge status="pending_approval" type="approval" />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onApprove(item.uuid, '')}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  승인
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(item.uuid);
                    setShowRejectModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  반려
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 반려 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">반려 사유 입력</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력하세요 (10자 이상)"
              className="w-full border rounded p-2"
              rows={4}
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border rounded"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```
