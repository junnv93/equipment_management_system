# Evaluation Report: 누락된 loading.tsx 추가

## 반복 #1

---

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| M1: tsc --noEmit | PASS | 사전 검증 완료 — 타입 에러 0 |
| M2: build 성공 | PASS | 사전 검증 완료 — 빌드 성공 |
| M3: Suspense fallback과 동일한 스켈레톤 사용 | **FAIL** | 2건 불일치 (상세 아래 참조) |
| M4: redirect 라우트에 loading.tsx 미생성 | PASS | checkouts/manage/, checkouts/import/ 모두 loading.tsx 없음 확인 |
| M5: design token 사용 — 하드코딩 금지 | PASS | teams/create/loading.tsx: `getPageContainerClasses('form')` 사용. 나머지 RouteLoading 위임. 하드코딩 없음 |
| M6: Server Component (use client 없음) | PASS | 6개 loading.tsx 전부 `'use client'` 없음 확인 |

**필수 S1 (권장): 네이밍 컨벤션**
6개 신규 loading.tsx 모두 `XxxLoading` 패턴 준수: `PendingChecksLoading`, `CheckoutDetailLoading`, `CalibrationFactorsLoading`, `CreateEquipmentLoading`, `CalibrationRegisterLoading`, `CreateTeamLoading` — PASS

**S2 (권장): 인라인 스켈레톤 export + 재사용**
`CalibrationFactorsLoadingSkeleton`, `CreateEquipmentFormSkeleton`, `CreateTeamPageSkeleton` 모두 page.tsx에서 named export, loading.tsx에서 import 재사용 — PASS

---

## 전체 판정: **FAIL**

---

## 수정 지시

### 이슈 1 (M3): calibration/register — loading.tsx와 Suspense fallback 불일치

**파일:** `apps/frontend/app/(dashboard)/calibration/register/loading.tsx`

`loading.tsx`는 `RouteLoading variant="detail"`을 반환한다.

`page.tsx`의 Suspense fallback은 다음과 같다:
```tsx
<div className={getPageContainerClasses('centered')}>
  <p className="text-muted-foreground">교정 등록 페이지를 불러오는 중...</p>
</div>
```

계약 Context에 "텍스트 fallback → RouteLoading variant="detail"로 개선"이 명시되어 있으나, `page.tsx`의 Suspense fallback이 함께 업데이트되지 않았다. 두 파일이 서로 다른 컴포넌트를 사용하므로 M3 위반.

**수정:** `calibration/register/page.tsx`의 Suspense fallback을 `<RouteLoading variant="detail" />`로 교체한다.

```tsx
// 수정 전
<Suspense
  fallback={
    <div className={getPageContainerClasses('centered')}>
      <p className="text-muted-foreground">교정 등록 페이지를 불러오는 중...</p>
    </div>
  }
>

// 수정 후
<Suspense fallback={<RouteLoading variant="detail" />}>
```

---

### 이슈 2 (M3): teams/create — loading.tsx 컨테이너 이중 구조 불일치

**파일:** `apps/frontend/app/(dashboard)/teams/create/loading.tsx`

`page.tsx` 구조:
```tsx
export default function CreateTeamPage() {
  return (
    <div className={getPageContainerClasses('form')}>          // ← static shell (항상 렌더링)
      <Suspense fallback={<CreateTeamPageSkeleton />}>          // ← fallback: 컨테이너 없이 스켈레톤만
        <CreateTeamContentAsync />
      </Suspense>
    </div>
  );
}
```

Suspense fallback에 전달되는 컴포넌트는 `<CreateTeamPageSkeleton />`만이다. 컨테이너(`getPageContainerClasses('form')`)는 Suspense 외부 static shell이 담당한다.

`loading.tsx`는:
```tsx
export default function CreateTeamLoading() {
  return (
    <div className={getPageContainerClasses('form')}>  // ← 컨테이너를 자체 추가
      <CreateTeamPageSkeleton />
    </div>
  );
}
```

route transition 시 loading.tsx는 컨테이너+스켈레톤을 렌더링한다. SSR streaming 중 Suspense fallback은 page.tsx의 outer div(컨테이너) 안에서 스켈레톤만 렌더링한다. 두 코드 경로가 구조적으로 다르므로 M3의 "동일한 스켈레톤 사용" 기준 위반.

**수정:** `page.tsx`를 리팩토링하여 컨테이너를 Suspense fallback 안으로 이동시키고, loading.tsx와 구조를 일치시킨다.

```tsx
// page.tsx 수정 후
export default function CreateTeamPage() {
  return (
    <Suspense
      fallback={
        <div className={getPageContainerClasses('form')}>
          <CreateTeamPageSkeleton />
        </div>
      }
    >
      <CreateTeamContentAsync />
    </Suspense>
  );
}

// CreateTeamContentAsync도 컨테이너를 자체 포함해야 함
async function CreateTeamContentAsync() {
  const t = await getTranslations('teams');
  return (
    <div className={getPageContainerClasses('form')}>
      <PageHeader ... />
      <TeamForm mode="create" />
    </div>
  );
}
```

이렇게 하면 loading.tsx의 `getPageContainerClasses('form')` 래퍼와 Suspense fallback이 동일한 구조를 갖는다.

---

---

## 반복 #2

---

## 이전 반복 대비 변화

| 이슈 | 반복 #1 | 반복 #2 | 수정 방향 |
|------|---------|---------|-----------|
| M3: calibration/register — Suspense fallback 불일치 | FAIL | **PASS** | page.tsx의 Suspense fallback을 `<RouteLoading variant="detail" />`로 교체 — loading.tsx와 일치 |
| M3: teams/create — 컨테이너 구조 불일치 | FAIL | **PASS** | page.tsx에서 static shell 컨테이너 제거. `CreateTeamContentAsync`가 컨테이너 포함. `CreateTeamPageSkeleton`이 컨테이너 포함. loading.tsx import 구조와 일치 |

---

## 계약 기준 대조 (반복 #2)

| 기준 | 판정 | 상세 |
|------|------|------|
| M1: tsc --noEmit | PASS | 사전 검증 완료 — 타입 에러 0 |
| M2: build 성공 | PASS | 사전 검증 완료 — 빌드 성공 |
| M3: Suspense fallback과 동일한 스켈레톤 사용 | **PASS** | 6개 라우트 전체 일치 확인 (상세 아래) |
| M4: redirect 라우트에 loading.tsx 미생성 | PASS | checkouts/manage/, checkouts/import/ 모두 loading.tsx 없음 확인 |
| M5: design token 사용 — 하드코딩 금지 | PASS | 하드코딩 없음 — 모든 스켈레톤이 `getPageContainerClasses` 또는 RouteLoading 위임 |
| M6: Server Component (use client 없음) | PASS | 6개 loading.tsx 전부 `'use client'` 없음 확인 |

**S1 (권장): 네이밍 컨벤션** — PASS (변경 없음)

**S2 (권장): 인라인 스켈레톤 export + 재사용** — PASS (변경 없음)

---

## M3 상세 검증 (반복 #2)

### 1. checkouts/pending-checks
- `loading.tsx`: `<RouteLoading variant="table" showHeader />`
- `page.tsx` Suspense fallback: `<RouteLoading variant="table" showHeader />`
- 판정: **일치**

### 2. checkouts/[id]
- `loading.tsx`: `<RouteLoading variant="detail" />`
- `page.tsx` Suspense fallback: `<RouteLoading variant="detail" />`
- 판정: **일치**

### 3. reports/calibration-factors
- `loading.tsx`: `import { CalibrationFactorsLoadingSkeleton } from './page'` → `<CalibrationFactorsLoadingSkeleton />`
- `page.tsx` Suspense fallback: `<CalibrationFactorsLoadingSkeleton />`
- 동일 named export 재사용
- 판정: **일치**

### 4. equipment/create
- `loading.tsx`: `import { CreateEquipmentFormSkeleton } from './page'` → `<CreateEquipmentFormSkeleton />`
- `page.tsx` Suspense fallback: `<CreateEquipmentFormSkeleton />`
- 동일 named export 재사용
- 판정: **일치**

### 5. calibration/register (이전 반복 FAIL → 수정됨)
- `loading.tsx`: `<RouteLoading variant="detail" />`
- `page.tsx` Suspense fallback: `<RouteLoading variant="detail" />`
- 판정: **일치** (수정 반영 확인)

### 6. teams/create (이전 반복 FAIL → 수정됨)
- `loading.tsx`: `import { CreateTeamPageSkeleton } from './page'` → `<CreateTeamPageSkeleton />`
- `page.tsx` Suspense fallback: `<CreateTeamPageSkeleton />`
- `CreateTeamPageSkeleton` 내부에 `getPageContainerClasses('form')` 컨테이너 포함
- `CreateTeamContentAsync`도 `getPageContainerClasses('form')` 컨테이너 자체 포함
- 구조 일치 확인: static shell 컨테이너 없음, Suspense 전후 동일 구조
- 판정: **일치** (수정 반영 확인)

---

## 전체 판정: **PASS**

필수 기준 M1~M6 전체 통과. 이전 반복에서 FAIL이었던 2개 이슈 모두 수정 확인됨.
