---
slug: typeof-guard-ppr-software
date: 2026-05-13
mode: 1
status: active
---

# Contract: typeof-guard-ppr-software

## 목표

1. `software/layout.tsx` async → PPR-compatible (sync outer + Suspense + async inner) 전환
2. 6개 server component `session.user.role as UserRole` 직접 캐스팅 → typeof guard 패턴으로 수정

## 대상 파일 (6개)

| 파일 | 이슈 |
|------|------|
| `apps/frontend/app/(dashboard)/software/layout.tsx` | PPR 파괴(async export) + typeof guard 누락 |
| `apps/frontend/app/(dashboard)/calibration/register/page.tsx` | typeof guard 누락 |
| `apps/frontend/app/(dashboard)/admin/data-migration/page.tsx` | typeof guard 누락 |
| `apps/frontend/app/(dashboard)/admin/monitoring/page.tsx` | typeof guard 누락 |
| `apps/frontend/app/(dashboard)/admin/rejection-presets/page.tsx` | typeof guard 누락 |
| `apps/frontend/app/(dashboard)/admin/approvals/page.tsx` | typeof guard 누락 (ApprovalsContentAsync 내부) |

## MUST 기준 (PASS/FAIL)

| # | 기준 | 검증 방법 |
|---|------|----------|
| M-1 | `session.user.role as UserRole` 직접 캐스팅 0건 | `grep -rn "session\.user\.role as " apps/frontend/app --include="*.tsx" \| grep -v "// "` = 0줄 |
| M-2 | `software/layout.tsx` sync outer export | `grep "export default function SoftwareLayout" apps/frontend/app/(dashboard)/software/layout.tsx` = 1줄 |
| M-3 | `software/layout.tsx` 내 Suspense + async inner 함수 존재 | `grep -n "Suspense\|async function Software" apps/frontend/app/(dashboard)/software/layout.tsx` ≥ 2줄 |
| M-4 | frontend tsc PASS | `pnpm --filter frontend run tsc --noEmit` EXIT=0 |
| M-5 | frontend build PASS | `pnpm --filter frontend run build` EXIT=0 |
| M-6 | typeof role !== 'string' guard 6개 파일 모두 존재 | `grep -rn "typeof role !== 'string'" apps/frontend/app --include="*.tsx"` = 6줄 이상 (software layout 포함) |

## SHOULD 기준 (권고, 미충족 시 tech-debt 등록)

| # | 기준 |
|---|------|
| S-1 | admin/layout.tsx 패턴(guard 컴포넌트 이름 `*Guard`, `*PermissionGuard`)과 일관된 명명 |
| S-2 | `apps/frontend/app/(dashboard)/admin/approvals/page.tsx`에서 guard 통과 후 `role as UserRole` 타입 좁힘 보존 (ApprovalsClient prop 전달 정합) |

## 레퍼런스 패턴

```typescript
// ✅ PPR-compatible layout (software/layout.tsx 변환 목표)
export default function SoftwareLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SoftwarePermissionGuard>{children}</SoftwarePermissionGuard>
    </Suspense>
  );
}

async function SoftwarePermissionGuard({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect('/login');
  const role = session.user.role;
  if (typeof role !== 'string' || !hasPermission(role as UserRole, Permission.VIEW_TEST_SOFTWARE)) {
    redirect('/dashboard');
  }
  return <>{children}</>;
}

// ✅ typeof guard 패턴 (page.tsx 적용 목표)
const role = session.user.role;
if (typeof role !== 'string' || !hasPermission(role as UserRole, Permission.VIEW_X)) {
  redirect('/dashboard');
}
```
