---
name: verify-nextjs
description: Verifies Next.js 16 pattern compliance — await params/searchParams, PageProps typing, useActionState, Server/Client component boundaries, dynamic imports. Run after adding/modifying pages or layouts.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 라우트 경로]'
---

# Next.js 16 패턴 검증

## Purpose

프론트엔드 코드가 Next.js 16 App Router 패턴을 올바르게 준수하는지 검증합니다:

1. **await params/searchParams** — `params`와 `searchParams`는 Promise이므로 await 필수
2. **useActionState** — `useFormState` (deprecated) 대신 `useActionState` 사용
3. **서버 컴포넌트 패턴** — 데이터 fetching은 서버 컴포넌트에서, 인터랙션은 클라이언트 컴포넌트에서
4. **error.tsx / loading.tsx** — 라우트별 에러 바운더리와 로딩 UI 제공
5. **'use client' 지시어** — 클라이언트 컴포넌트에만 적절히 사용
6. **Dynamic imports** — `next/dynamic`을 사용한 코드 분할 패턴 (ssr: false, loading component)

## When to Run

- 새로운 페이지(page.tsx)를 추가한 후
- 기존 라우트의 params/searchParams 사용을 수정한 후
- 서버/클라이언트 컴포넌트 경계를 변경한 후
- 에러 바운더리나 로딩 UI를 추가한 후
- Dynamic import로 코드 분할을 적용한 후 (번들 최적화)

## Related Files

| File                                                       | Purpose                                                        |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/frontend/app/(dashboard)/equipment/page.tsx`         | 서버 컴포넌트 + 필터 리다이렉트 참조 구현                      |
| `apps/frontend/app/(dashboard)/equipment/[id]/page.tsx`    | 동적 라우트 params 참조 구현                                   |
| `apps/frontend/app/(dashboard)/equipment/error.tsx`        | Error Boundary 참조 구현                                       |
| `apps/frontend/app/(dashboard)/equipment/loading.tsx`      | Loading UI 참조 구현                                           |
| `apps/frontend/app/(dashboard)/checkouts/[id]/page.tsx`    | 동적 라우트 참조 구현                                          |
| `apps/frontend/app/(dashboard)/calibration-plans/page.tsx` | searchParams 사용 참조 구현                                    |
| `apps/frontend/components/equipment/EquipmentForm.tsx`     | Dynamic import 코드 분할 참조 구현 (7개 섹션)                  |
| `apps/frontend/proxy.ts`                                   | PPR 인증 프록시 (cacheComponents 레이아웃 non-blocking 핵심) — Next.js 16 proxy 컨벤션 |

## Workflow

### Step 1: params/searchParams await 확인

동적 라우트의 page.tsx에서 params를 올바르게 await하는지 확인합니다.

```bash
# 동적 라우트 page.tsx 목록
find apps/frontend/app -path "*/\[*\]/page.tsx" -type f
```

```bash
# params를 await 없이 직접 접근하는 패턴 탐지
grep -rn "params\." apps/frontend/app --include="page.tsx" | grep -v "await\|props\.params\|Promise\|// \|searchParams"
```

```bash
# 올바른 패턴: await props.params 확인
grep -rn "await props\.params\|await.*\.params" apps/frontend/app --include="page.tsx"
```

**PASS 기준:** 모든 동적 라우트 page.tsx에서 `await props.params` 사용.

**FAIL 기준:** `const { id } = params` (await 없이 직접 구조 분해) 발견 시 위반.

### Step 2: searchParams Promise 처리 확인

searchParams를 올바르게 await하는지 확인합니다.

```bash
# searchParams 사용 page.tsx에서 await 확인
grep -rn "searchParams" apps/frontend/app --include="page.tsx" | grep -v "await\|Promise\|// \|type\|interface"
```

**PASS 기준:** searchParams 사용 시 `await props.searchParams` 패턴.

**FAIL 기준:** await 없이 직접 접근 시 위반.

### Step 3: proxy.ts 컨벤션 확인

Next.js 16.1.6+는 `middleware.ts` 컨벤션을 deprecated하고 `proxy.ts`로 전환했습니다.

```bash
# middleware.ts가 존재하면 오류 — proxy.ts를 사용해야 함
ls apps/frontend/middleware.ts 2>/dev/null && echo "FAIL: middleware.ts는 deprecated" || echo "PASS"

# proxy.ts 존재 및 export proxy 함수 확인
grep -n "export.*function proxy\|export.*proxy" apps/frontend/proxy.ts
```

**PASS 기준:**
- `middleware.ts` 파일 없음
- `proxy.ts`에 `export async function proxy()` + `export const config` 직접 정의

**FAIL 기준:**
- `middleware.ts` 파일 존재 → proxy.ts와 충돌하여 서버 시작 불가
- `config`를 다른 파일에서 re-export → Next.js가 인식 못함

### Step 4: useFormState (deprecated) 사용 탐지

`useFormState`가 사용되지 않고 `useActionState`로 대체되었는지 확인합니다.

```bash
# useFormState 사용 탐지
grep -rn "useFormState" apps/frontend --include="*.tsx" --include="*.ts" | grep -v "// \|deprecated\|node_modules"
```

**PASS 기준:** 0개 결과 (`useActionState`로 모두 마이그레이션).

**FAIL 기준:** `import { useFormState }` 또는 `useFormState(` 발견 시 `useActionState`로 변경 필요.

### Step 4: 서버/클라이언트 컴포넌트 경계

page.tsx가 서버 컴포넌트(데이터 fetching)이고, 클라이언트 컴포넌트(*Client.tsx, *Content.tsx)에 인터랙션을 위임하는지 확인합니다.

```bash
# page.tsx에 'use client' 지시어가 있는 경우 (서버 컴포넌트여야 함)
grep -rn "'use client'" apps/frontend/app --include="page.tsx"
```

**PASS 기준:** page.tsx에 `'use client'`가 없어야 함 (서버 컴포넌트).

**FAIL 기준:** page.tsx가 클라이언트 컴포넌트면 데이터 fetching을 서버로 이동 필요.

**예외:** 단순 리다이렉트만 하는 page.tsx는 해당 없음.

### Step 5: error.tsx 제공 및 'use client' 확인

주요 라우트에 에러 바운더리가 있고, 올바르게 클라이언트 컴포넌트로 정의되었는지 확인합니다.

```bash
# error.tsx가 있는 라우트
find apps/frontend/app -name "error.tsx" -type f | sort
```

```bash
# error.tsx에 'use client' 확인 (필수)
for f in $(find apps/frontend/app -name "error.tsx" -type f); do
  if ! grep -q "'use client'" "$f"; then
    echo "MISSING 'use client': $f"
  fi
done
```

**PASS 기준:**

- 주요 목록 페이지(equipment, calibration, teams, checkouts 등)에 error.tsx 존재
- 모든 error.tsx에 `'use client'` 지시어 존재 (Next.js 규약)

**FAIL 기준:** error.tsx에 `'use client'` 누락 시 위반.

### Step 6: loading.tsx 제공 확인

주요 라우트에 로딩 UI가 있는지 확인합니다.

```bash
# loading.tsx가 있는 라우트
find apps/frontend/app -name "loading.tsx" -type f | sort
```

```bash
# loading.tsx 개수 확인
find apps/frontend/app -name "loading.tsx" -type f | wc -l
```

**PASS 기준:** 주요 목록 페이지(equipment, calibration, teams, checkouts 등)에 loading.tsx 존재.

**참고:**

- 모든 라우트에 필수는 아님 — 주요 목록/상세 페이지에 우선 적용
- loading.tsx는 서버 컴포넌트이므로 `'use client'` 불필요

### Step 7: Dynamic Import 패턴 확인

코드 분할을 위한 `next/dynamic` 사용이 올바른 패턴을 따르는지 확인합니다.

```bash
# next/dynamic 사용 파일 탐지
grep -rn "import dynamic from 'next/dynamic'" apps/frontend --include="*.tsx" --include="*.ts"
```

```bash
# dynamic() 호출에서 ssr: false 누락 탐지 (클라이언트 전용 컴포넌트)
grep -rn "const .* = dynamic(" apps/frontend --include="*.tsx" --include="*.ts" -A 3 | grep -v "ssr:\|loading:\|// "
```

```bash
# loading component 없는 dynamic import 탐지
grep -rn "const .* = dynamic(" apps/frontend --include="*.tsx" --include="*.ts" -A 2 | grep -B 2 "ssr: false" | grep -v "loading:"
```

**PASS 기준:**

- Dynamic import 사용 시 `ssr: false` 명시 (클라이언트 전용 섹션)
- `loading` 컴포넌트 제공 (Skeleton 등)
- 모듈 경로가 명확 (`.then((mod) => mod.ComponentName)`)

**FAIL 기준:**

- `ssr: false` 없이 클라이언트 전용 컴포넌트를 dynamic import (hydration 오류 가능)
- `loading` 누락으로 로딩 중 빈 화면 표시

**권장 패턴:**

```typescript
const HeavyComponent = dynamic(
  () => import('./HeavyComponent').then((mod) => mod.HeavyComponent),
  { loading: () => <Skeleton className="h-40 w-full" />, ssr: false }
);
```

## Output Format

```markdown
| #   | 검사                    | 상태      | 상세                               |
| --- | ----------------------- | --------- | ---------------------------------- |
| 1   | await params            | PASS/FAIL | 미적용 page.tsx 목록               |
| 2   | await searchParams      | PASS/FAIL | 미적용 page.tsx 목록               |
| 3   | proxy.ts 컨벤션         | PASS/FAIL | middleware.ts 존재 시 FAIL         |
| 4   | useFormState 미사용     | PASS/FAIL | 사용 위치 목록                     |
| 5   | 서버 컴포넌트 page.tsx  | PASS/FAIL | 'use client' page.tsx 목록         |
| 6   | error.tsx / loading.tsx | PASS/INFO | 누락 라우트 목록                   |
| 7   | Dynamic imports         | PASS/INFO | ssr: false 누락, loading 누락 위치 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **layout.tsx의 'use client'** — 일부 레이아웃은 클라이언트 상태(sidebar, theme) 관리 필요
2. **error.tsx의 'use client'** — Next.js 규약상 error.tsx는 반드시 클라이언트 컴포넌트
3. **(auth) 라우트의 page.tsx** — 로그인 페이지는 클라이언트 컴포넌트 가능
4. **settings 라우트** — 설정 페이지는 컨텍스트에 따라 클라이언트 컴포넌트 가능
5. **params를 사용하지 않는 page.tsx** — 정적 라우트(/equipment, /dashboard 등)는 params await 불필요
6. **api/ 라우트** — API Route Handler는 page.tsx 패턴과 다름
