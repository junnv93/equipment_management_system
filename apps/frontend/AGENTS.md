# AGENTS.md - Frontend (Next.js)

Frontend-specific rules for the Next.js application. Read root `./AGENTS.md` first.

---

## Module Context

**Role:** Web application for equipment management UI, handling user interactions, data display, and form submissions.

**Port:** 3000 (development)

**Dependencies:**

- Backend API at `http://localhost:3001/api` (configured via `NEXT_PUBLIC_API_URL`)
- NextAuth.js for authentication
- React Query for server state

**Note:** Current API routes use `/api/` prefix (e.g., `/api/equipment`), not `/api/v1/`. Future versioning may require migration.

---

## Tech Stack

| Component       | Version | Notes             |
| --------------- | ------- | ----------------- |
| Next.js         | 14.x    | App Router        |
| React           | 18.x    | UI library        |
| TailwindCSS     | 3.x     | Styling           |
| shadcn/ui       | latest  | Component library |
| React Query     | 5.x     | Server state      |
| React Hook Form | 7.x     | Form handling     |
| Zod             | 3.x     | Validation        |
| next-auth       | 4.x     | Authentication    |

---

## Operational Commands

```bash
# From apps/frontend directory
pnpm dev                 # Start dev server (port 3000)
pnpm build               # Production build
pnpm start               # Start production server
pnpm lint                # Run ESLint
pnpm lint:fix            # Fix lint errors
pnpm test                # Run Jest tests
pnpm test:watch          # Watch mode
```

---

## Directory Structure

```
app/
├── (auth)/              # Route group: Auth layout (does not affect URL)
│   ├── login/           # /login
│   └── layout.tsx
├── (dashboard)/         # Route group: Dashboard layout (does not affect URL)
│   ├── page.tsx         # / (dashboard home)
│   └── loans/           # /loans
├── [locale]/            # Dynamic segment: i18n locale (e.g., /ko, /en)
│   ├── calendar/        # /[locale]/calendar
│   └── reservations/    # /[locale]/reservations
├── equipment/           # Direct route: /equipment
│   ├── [id]/            # /equipment/[id]
│   └── page.tsx         # /equipment
├── rentals/             # /rentals
├── reservations/        # /reservations (duplicate with [locale]/reservations - verify usage)
├── calibration/         # /calibration
├── checkouts/           # /checkouts
├── admin/               # /admin
├── alerts/              # /alerts
├── maintenance/         # /maintenance
├── reports/             # /reports
├── settings/            # /settings
├── teams/               # /teams
├── api/                 # API routes (NextAuth, etc.)
│   ├── auth/[...nextauth]/
│   └── reservations/
├── layout.tsx           # Root layout
└── page.tsx             # Home page (/)

components/
├── ui/                  # shadcn/ui components
├── dashboard/           # Dashboard-specific
├── equipment/           # Equipment-specific
├── reservations/        # Reservation-specific
├── notifications/       # Notification components
└── shared/              # Shared components

hooks/
├── use-auth.ts          # Authentication hook
├── use-toast.ts         # Toast notifications
├── use-reports.ts       # Reports data
└── use-reservations.ts  # Reservations data

lib/
├── api/                 # API client functions
│   ├── api-client.ts    # Axios instance
│   ├── equipment-api.ts
│   ├── rental-api.ts
│   └── ...
├── auth.ts              # NextAuth config
├── providers.tsx        # React Query provider
├── types/               # TypeScript types
└── utils/               # Utility functions
```

---

## Implementation Patterns

### Page Component Pattern

```typescript
// app/equipment/page.tsx
import { Suspense } from 'react';
import { EquipmentList } from '@/components/equipment/EquipmentList';
import { PageHeader } from '@/components/shared/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';

export default function EquipmentPage() {
  return (
    <div className="container mx-auto py-6">
      <PageHeader title="Equipment" description="Manage equipment inventory" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <EquipmentList />
      </Suspense>
    </div>
  );
}
```

### Client Component Pattern

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipmentList } from '@/lib/api/equipment-api';
import { Equipment } from '@equipment-management/schemas';

export function EquipmentList() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['equipment', page],
    queryFn: () => getEquipmentList({ page }),
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="space-y-4">
      {data?.map((item) => (
        <EquipmentCard key={item.id} equipment={item} />
      ))}
    </div>
  );
}
```

### Form Pattern

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEquipmentSchema } from '@equipment-management/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';

export function EquipmentForm({ onSubmit }) {
  const form = useForm({
    resolver: zodResolver(CreateEquipmentSchema),
    defaultValues: { name: '', status: 'available' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <Input {...field} />
            </FormItem>
          )}
        />
        <Button type="submit">Create</Button>
      </form>
    </Form>
  );
}
```

### API Client Pattern

**Important:** Always use `apiClient` from `lib/api/api-client.ts`, never import `axios` directly.

```typescript
// lib/api/equipment-api.ts
import apiClient from './api-client'; // Axios instance with interceptors
import { Equipment, CreateEquipmentInput } from '@equipment-management/schemas';

// API functions use apiClient, not axios directly
export async function getEquipmentList(params?: { page?: number; status?: string }) {
  const response = await apiClient.get<{ data: Equipment[] }>('/api/equipment', { params });
  return response.data.data;
}

export async function createEquipment(data: CreateEquipmentInput) {
  const response = await apiClient.post<{ data: Equipment }>('/api/equipment', data);
  return response.data.data;
}
```

**Note:** Current implementation uses `/api/equipment` (not `/api/v1/equipment`). The `apiClient` instance handles base URL, authentication headers, and error interceptors automatically.

### Custom Hook Pattern

```typescript
// hooks/use-equipment.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipmentList, createEquipment } from '@/lib/api/equipment-api';
import { useToast } from './use-toast';

export function useEquipmentList(params?: { page?: number }) {
  return useQuery({
    queryKey: ['equipment', params],
    queryFn: () => getEquipmentList(params),
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({ title: 'Equipment created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create equipment', variant: 'destructive' });
    },
  });
}
```

---

## Component Rules

### UI Components (components/ui/)

- All from shadcn/ui; do NOT create custom base components.
- Import from `@/components/ui/[component]`.
- Customize via TailwindCSS classes, not inline styles.

### Adding New shadcn/ui Component

```bash
npx shadcn@latest add [component-name]
```

### Shared Components (components/shared/)

- `PageHeader` - Page title and description
- `MainNav` - Main navigation
- `SideNav` - Sidebar navigation
- `UserNav` - User dropdown menu

---

## Styling Rules

### TailwindCSS Classes

```typescript
// Correct
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-sm">

// Wrong - No inline styles
<div style={{ display: 'flex', padding: '24px' }}>
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Dark Mode

Use TailwindCSS dark mode classes:

```typescript
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

---

## Authentication

### NextAuth Configuration

Located at `lib/auth.ts` and `app/api/auth/[...nextauth]/route.ts`.

### Protected Routes

Middleware at `middleware.ts` handles route protection.

### Auth Hook Usage

```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { session, status, signIn, signOut } = useAuth();

  if (status === 'loading') return <Loading />;
  if (!session) return <Button onClick={() => signIn()}>Sign In</Button>;

  return <div>Welcome, {session.user.name}</div>;
}
```

---

## State Management

### Server State (React Query)

- All API data fetching via `useQuery`.
- Mutations via `useMutation` with cache invalidation.
- Query keys follow pattern: `['resource', ...params]`.

### Client State

- Form state: React Hook Form
- UI state: React `useState`
- Complex client state: Consider Zustand if needed

---

## Testing Strategy

### Component Test Pattern

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EquipmentCard } from './EquipmentCard';

describe('EquipmentCard', () => {
  const mockEquipment = {
    id: '1',
    name: 'Test Equipment',
    status: 'available',
  };

  it('renders equipment name', () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText('Test Equipment')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    render(<EquipmentCard equipment={mockEquipment} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith('1');
  });
});
```

### Test File Location

Place tests adjacent to components:

- `components/equipment/EquipmentCard.tsx`
- `components/equipment/EquipmentCard.test.tsx`

Or in `__tests__/` folder for page tests.

---

## Local Golden Rules

### Do's

- Use `'use client'` directive only when needed (hooks, events, state).
- Prefer Server Components for data fetching when possible.
- Use `Suspense` boundaries for async components.
- Memoize expensive computations with `useMemo`.
- Use `useCallback` for callbacks passed to child components.

### Don'ts

- Don't fetch data in Client Components without React Query.
- Don't use `useEffect` for data fetching; use React Query.
- Don't store server data in local state.
- Don't use `any` type; import types from schemas package.
- Don't create components over 200 lines; split them.

---

## File Naming

| Type      | Pattern              | Example                    |
| --------- | -------------------- | -------------------------- |
| Page      | `page.tsx`           | `app/equipment/page.tsx`   |
| Layout    | `layout.tsx`         | `app/equipment/layout.tsx` |
| Component | PascalCase           | `EquipmentCard.tsx`        |
| Hook      | kebab-case with use- | `use-equipment.ts`         |
| Utility   | kebab-case           | `date-utils.ts`            |
| API       | kebab-case with -api | `equipment-api.ts`         |
| Test      | [name].test.tsx      | `EquipmentCard.test.tsx`   |

---

End of frontend AGENTS.md.
