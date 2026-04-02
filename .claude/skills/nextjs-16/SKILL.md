---
name: nextjs-16
description: "Next.js 16 App Router reference guide (NOT a verification skill — use /verify-nextjs for validation). Use when creating or modifying pages, layouts, routes, Server Actions, or Server Components. Covers params Promise pattern, PageProps typing, useActionState (replaces useFormState), Server/Client component boundaries, and Cache Components. 페이지/레이아웃/라우트/Server Action 작성 시 참조."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Next.js 16 Quick Reference

**Version:** 16.1.1 (Jan 2025)

---

## CRITICAL RULES (Always Enforce)

### 1. params are Promise

```typescript
// ❌ WRONG
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>
}

// ✅ CORRECT
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  return <h1>{slug}</h1>
}
```

### 2. Use useActionState (NOT useFormState)

```typescript
// ❌ DEPRECATED
import { useFormState } from 'react-dom';
// ✅ CORRECT
import { useActionState } from 'react';
```

### 3. Form Actions Return Void (use revalidation, not return)

### 4. NO `any` Types

### 5. Use PageProps/LayoutProps Helpers

### 6. Use 'use cache' for Cached Dynamic Content

---

## Essential Patterns

| Pattern | Key Points |
|---------|-----------|
| Static Page | Default export function, `export const metadata` |
| Dynamic Page | `PageProps<'/blog/[slug]'>`, `await props.params`, `generateStaticParams` |
| Root Layout | `{ children: React.ReactNode }`, `<html>` + `<body>` |
| Server Action (Form) | `'use server'`, void return, `revalidatePath` |
| Server Action (State) | `useActionState(action, initialState)`, returns data |
| Client Component | `'use client'`, `useState`/`useEffect` |
| Cache Components | `'use cache'`, `cacheLife('hours')`, `cacheTag('posts')` |
| Proxy (Middleware) | `proxy.ts` (root), `export function proxy()`, `export const config` |

---

## When to Read Additional Files

| Need | Reference File |
|------|---------------|
| Project setup, folder conventions | [reference/01-project-structure.md](reference/01-project-structure.md) |
| Pages, layouts, dynamic routes | [reference/02-routing-pages.md](reference/02-routing-pages.md) |
| Links, prefetching, streaming | [reference/03-navigation.md](reference/03-navigation.md) |
| Server vs Client Components | [reference/04-server-client.md](reference/04-server-client.md) |
| TypeScript patterns | [reference/05-typescript.md](reference/05-typescript.md) |
| Server Actions, form handling | [reference/06-server-actions.md](reference/06-server-actions.md) |
| Metadata, SEO, OG images | [reference/07-metadata-seo.md](reference/07-metadata-seo.md) |
| Cache Components, PPR | [reference/08-cache-components.md](reference/08-cache-components.md) |
| Proxy (Middleware) | [reference/09-proxy.md](reference/09-proxy.md) |
| Data fetching (Server Components) | [reference/10-fetching-data.md](reference/10-fetching-data.md) |
| Data updating, revalidation | [reference/11-updating-data.md](reference/11-updating-data.md) |
| Caching & revalidation config | [reference/12-caching-revalidating.md](reference/12-caching-revalidating.md) |
| Error handling (error.tsx) | [reference/13-error-handling.md](reference/13-error-handling.md) |
| CSS & styling | [reference/14-css.md](reference/14-css.md) |
| Image optimization | [reference/15-image-optimization.md](reference/15-image-optimization.md) |
| Font optimization | [reference/16-font-optimization.md](reference/16-font-optimization.md) |
| API Routes (route.ts) | [reference/17-route-handlers.md](reference/17-route-handlers.md) |

---

## File Conventions

| File | Purpose |
|------|---------|
| `page.tsx` | Public route |
| `layout.tsx` | Shared wrapper |
| `loading.tsx` | Loading state |
| `error.tsx` | Error boundary (`'use client'` required) |
| `not-found.tsx` | 404 page |
| `route.ts` | API endpoint |
| `proxy.ts` | Middleware |

---

## Common Workflows

### Create New Page

1. Determine route type (static/dynamic)
2. Create `page.tsx`, add `PageProps<'/path/[param]'>` if dynamic
3. `await props.params` for dynamic segments
4. Add `generateStaticParams` if prerenderable
5. Export metadata, add `loading.tsx`

### Server Action

1. Create `actions.ts` with `'use server'`
2. Form action (void) or `useActionState` (returns data)
3. Add error handling + `revalidatePath/revalidateTag`

### Cache Components (PPR)

1. Enable `cacheComponents: true` in `next.config.ts`
2. Add `'use cache'` + `cacheLife` + `cacheTag` to cacheable components
3. Wrap runtime content in `<Suspense>`

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not awaiting params | `const { slug } = await props.params` |
| Form action returns data | Use void + `revalidatePath`, or `useActionState` |
| Client Component for data fetching | Use Server Component, pass data to Client |
| Using `<img>` | Use `next/image` with `<Image>` |
| Missing error boundaries | Add `error.tsx` with `'use client'` |
| No cache for dynamic content | Add `'use cache'` + `cacheLife` |

---

## Pre-Coding Checklist

- [ ] PageProps/LayoutProps helpers?
- [ ] All params handled with await?
- [ ] useActionState (not useFormState)?
- [ ] Form actions return void?
- [ ] No `any` types?
- [ ] Server Component unless needs interactivity?
- [ ] `'use client'` only when necessary?
- [ ] `loading.tsx` for dynamic routes?
- [ ] Metadata export for SEO?
- [ ] Cache Components if needed?
- [ ] Proxy setup for auth/routing?
- [ ] Error boundaries (`error.tsx`)?
- [ ] Image component for images?
