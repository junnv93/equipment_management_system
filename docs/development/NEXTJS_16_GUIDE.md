# Next.js 16 개발 가이드

Next.js 16 App Router 개발 패턴 및 필수 준수 사항입니다.

> 💡 **스킬 참조**: 이 문서의 내용은 `/nextjs-16` 스킬에 포함되어 있습니다.
>
> 📖 **관련 문서**:
> - [FRONTEND_UI_COMMON.md](./FRONTEND_UI_COMMON.md) - 프론트엔드 공통 가이드
> - [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md) - 성능 최적화 가이드

---

## 필수 규칙 (반드시 준수)

### 1. params/searchParams는 Promise

```typescript
// ❌ 잘못된 패턴 (Next.js 15 이하)
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>;
}

// ✅ 올바른 패턴 (Next.js 16)
type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page(props: PageProps) {
  const { slug } = await props.params;
  return <h1>{slug}</h1>;
}
```

### 2. useActionState 사용 (useFormState 폐지)

```typescript
// ❌ 폐지된 API
import { useFormState } from 'react-dom';

// ✅ 새로운 API
import { useActionState } from 'react';
```

### 3. Form Action은 void 반환

```typescript
// ❌ 잘못된 패턴: Form action에서 데이터 반환
export async function submitForm(formData: FormData) {
  'use server';
  return { success: true }; // 타입 에러!
}

// ✅ 올바른 패턴: revalidate 사용
export async function submitForm(formData: FormData) {
  'use server';
  await saveData(formData);
  revalidatePath('/posts');
  // 반환값 없음
}
```

### 4. any 타입 절대 금지

```typescript
// ❌ 잘못된 패턴
const data: any = await fetch(...);

// ✅ 올바른 패턴
interface Equipment {
  id: string;
  name: string;
}
const data: Equipment[] = await fetch(...).then(r => r.json());
```

### 5. React.FC 사용 지양

```typescript
// ❌ 지양
export const Component: React.FC<Props> = ({ children }) => { ... }

// ✅ 권장
export function Component({ children }: Props) { ... }
```

---

## 페이지 패턴

### 정적 페이지

```typescript
// app/about/page.tsx
export default function AboutPage() {
  return <h1>About</h1>;
}

export const metadata = {
  title: 'About',
  description: 'About page',
};
```

### 동적 페이지

```typescript
// app/equipment/[id]/page.tsx
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EquipmentPage(props: PageProps) {
  const { id } = await props.params;

  const equipment = await getEquipment(id);
  if (!equipment) {
    notFound();
  }

  return <EquipmentDetail equipment={equipment} />;
}

// 정적 생성할 페이지 지정 (선택)
export async function generateStaticParams() {
  const equipmentList = await getEquipmentList();
  return equipmentList.map((e) => ({ id: e.id }));
}

// 동적 메타데이터
export async function generateMetadata(props: PageProps) {
  const { id } = await props.params;
  const equipment = await getEquipment(id);

  return {
    title: equipment?.name ?? '장비 상세',
    description: `${equipment?.name} 상세 정보`,
  };
}
```

---

## Server Action 패턴

### Form Action (void 반환)

```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createEquipment(formData: FormData) {
  const name = formData.get('name') as string;
  await db.equipment.create({ data: { name } });
  revalidatePath('/equipment');
}

// app/equipment/new/page.tsx
import { createEquipment } from '@/app/actions';

export default function NewEquipmentPage() {
  return (
    <form action={createEquipment}>
      <input name="name" required />
      <button type="submit">생성</button>
    </form>
  );
}
```

### useActionState (상태 반환)

```typescript
// app/actions.ts
'use server';

type ActionState = {
  success?: boolean;
  error?: string;
};

export async function updateProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = formData.get('name') as string;

  if (!name) {
    return { error: '이름을 입력해주세요.' };
  }

  await db.users.update({ name });
  return { success: true };
}

// app/profile/page.tsx
'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/app/actions';

export default function ProfilePage() {
  const [state, action, isPending] = useActionState(updateProfile, {});

  return (
    <form action={action}>
      <input name="name" required />
      <button disabled={isPending}>저장</button>
      {state.error && <p className="text-red-500">{state.error}</p>}
      {state.success && <p className="text-green-500">저장되었습니다.</p>}
    </form>
  );
}
```

---

## 레이아웃 패턴

### 루트 레이아웃

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '장비 관리 시스템',
  description: '장비 관리 시스템입니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

### 인증 레이아웃

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
```

---

## 에러 처리 패턴

### error.tsx (에러 바운더리)

```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>문제가 발생했습니다</h2>
      <p>{error.message}</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

### not-found.tsx

```typescript
// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>페이지를 찾을 수 없습니다</h2>
      <Link href="/">홈으로 이동</Link>
    </div>
  );
}
```

### loading.tsx

```typescript
// app/equipment/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  );
}
```

---

## Server vs Client 컴포넌트

### 결정 기준

| 기능                        | Server | Client |
| --------------------------- | :----: | :----: |
| 데이터 페칭                 |   ✅   |   ❌   |
| 정적 콘텐츠                 |   ✅   |   ❌   |
| 이벤트 핸들러               |   ❌   |   ✅   |
| useState, useEffect         |   ❌   |   ✅   |
| 브라우저 API                |   ❌   |   ✅   |
| Context Provider            |   ❌   |   ✅   |

### 패턴: Server에서 페칭, Client에서 인터랙션

```typescript
// Server Component (데이터 페칭)
// app/equipment/page.tsx
export default async function EquipmentPage() {
  const equipment = await getEquipmentList();

  return <EquipmentTable equipment={equipment} />;
}

// Client Component (인터랙션)
// components/equipment/EquipmentTable.tsx
'use client';

import { useState } from 'react';

interface Props {
  equipment: Equipment[];
}

export function EquipmentTable({ equipment }: Props) {
  const [filter, setFilter] = useState('');

  const filtered = equipment.filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="검색..."
      />
      <table>
        {filtered.map((e) => (
          <tr key={e.id}>
            <td>{e.name}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

---

## 검증 명령어

```bash
# params await 누락 검사
grep -rn "params\." apps/frontend/app/ | grep -v "await" | grep -v "props.params"

# TypeScript 검사
pnpm --filter frontend tsc --noEmit

# any 타입 검사 (ESLint)
pnpm --filter frontend lint
```

---

## 체크리스트

새 페이지/컴포넌트 작성 전:

- [ ] params/searchParams에 await 사용
- [ ] useFormState 대신 useActionState 사용
- [ ] Form action은 void 반환
- [ ] any 타입 사용 안 함
- [ ] Server Component 기본, Client는 필요시만
- [ ] loading.tsx 추가 (동적 라우트)
- [ ] error.tsx 추가
- [ ] metadata export 추가 (SEO)

---

**마지막 업데이트**: 2026-01-23
