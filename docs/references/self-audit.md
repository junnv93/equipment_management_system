# Self-Audit — 7대 아키텍처 원칙 자동 검증

`scripts/self-audit.mjs`가 pre-commit + CI 양방향으로 실행하는 검증 규칙과 예외 승인 절차를 설명합니다.

## 실행 방법

```bash
# pre-commit (staged 파일만, 7개 규칙 전체 적용)
node scripts/self-audit.mjs --staged

# CI full scan (전체 codebase, ①④⑤⑥ 4개 규칙 적용)
node scripts/self-audit.mjs --all
```

| 모드       | 트리거                      | 적용 규칙                         |
| ---------- | --------------------------- | --------------------------------- |
| `--staged` | `.husky/pre-commit`         | ①②③④⑤⑥⑦ 전체                      |
| `--all`    | `main.yml` quality-gate job | ①④⑤⑥ (나머지는 기존 tracked 제외) |

---

## 규칙 상세

### ① 하드코딩 URL

**의도**: QUERY_INTENTS / FRONTEND_ROUTES SSOT를 경유하지 않는 URL 리터럴 차단.

**감지 패턴**:

- `?action=` 포함 문자열 리터럴
- `/e/[A-Z...]` QR 단축 URL 직접 사용
- `/handover?...` 핸드오버 URL 직접 사용
- `/checkouts/...?scope=` 반출 URL 직접 사용

**올바른 대안**:

```typescript
// ❌ 하드코딩
href="/equipment/123/non-conformance?action=create"

// ✅ SSOT 경유
import { FRONTEND_ROUTES, QUERY_INTENTS } from '@equipment-management/shared-constants';
href={FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES_CREATE(equipment.id)}
```

**제외**: `packages/shared-constants/`, `packages/schemas/`, 테스트 파일, JSDoc 주석

---

### ② eslint-disable 주석 신규 추가

**의도**: 타입 오류를 `eslint-disable`로 숨기는 것은 타입 시스템을 무력화함.

**적용**: `--staged` 모드 전용 (기존 위반은 tracker에서 관리)

**올바른 대안**: 타입 오류를 직접 수정하거나 `@ts-expect-error` + 이유 주석.

**예외 승인**: 외부 라이브러리 타입 불일치 등 불가피한 경우 PR 설명에 이유 기록 후 maintainer 승인.

---

### ③ any 타입 신규 추가

**의도**: TypeScript strict 모드 준수 — `any`는 타입 안전성을 파괴함.

**적용**: `--staged` 모드 전용

**제외 파일**: `useOptimisticMutation`, `.dto.ts`, `create-zod-dto`, `common.types.ts`, 테스트/설정 파일

**올바른 대안**:

```typescript
// ❌
const data: any = response.json();

// ✅
const data: unknown = response.json();
const equipment = data as Equipment; // zod parse 후 타입 단언
```

---

### ④ SSOT 우회 — 로컬 재정의

**의도**: `QR_CONFIG`/`LABEL_CONFIG` 등 shared-constants SSOT를 로컬에서 재정의하면 설정이 분리되어 일관성 파괴.

**감지 패턴** (`--staged` + `--all`):

- `QR_CONFIG = {` — 로컬 객체 리터럴로 재정의
- `LABEL_CONFIG = {` — 로컬 객체 리터럴로 재정의
- `FRONTEND_ROUTES = {` — 로컬 재정의

**감지 패턴** (`--staged` only, 기존 위반 2건은 tracker 추적 중):

- `queryKey: ['...']` — 문자열 리터럴로 시작하는 queryKey 배열 직접 구성

**올바른 대안**:

```typescript
import { QR_CONFIG, FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// queryKey: queryKeys 빌더 경유
import { queryKeys } from '@/lib/api/query-config';
useQuery({ queryKey: queryKeys.equipment.detail(id), ... });
```

**제외**: `packages/shared-constants/` (정의 파일 자체)

**기존 tracked 위반** (`--staged` only 이유):

- `EquipmentQRCode.tsx:56` — Phase 5.4에서 수정 예정
- `AuthProviders.tsx:24` — Phase 5.4에서 수정 예정

---

### ⑤ role 리터럴 직접 비교

**의도**: 역할 검사는 `Permission` enum + `useAuth().can()` 경유가 원칙. 문자열 리터럴 비교는 오타/확장 시 버그 위험.

**감지 패턴**: `role === 'admin'` / `role !== 'lab_manager'` 등

**올바른 대안**:

```typescript
// ❌
if (session.user.role === 'admin') { ... }

// ✅ Permission 기반
const { can } = useAuth();
if (can(Permission.MANAGE_SYSTEM_SETTINGS)) { ... }

// ✅ UserRole enum 기반 (type guard)
import { UserRole } from '@equipment-management/schemas';
if (role === UserRole.SYSTEM_ADMIN) { ... }
```

**제외**: `packages/shared-constants/src/roles.ts` (type guard 구현 파일)

---

### ⑥ onSuccess 내 setQueryData

**의도**: `useOptimisticMutation`의 `onSuccess`에서 `setQueryData`를 사용하면 `TData`와 `TCachedData` 타입 불일치로 `.map` crash 위험 (memory 항목 등록됨).

**감지**: `onSuccess` 콜백 블록 내 `setQueryData` 호출 (12줄 윈도우)

**올바른 대안**:

```typescript
// ❌
onSuccess: (data) => {
  queryClient.setQueryData(queryKeys.equipment.detail(id), data);
};

// ✅ 캐시 무효화 방식
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: queryKeys.equipment.detail(id) });
};
```

---

### ⑦ icon 버튼 aria-label 누락

**의도**: `size="icon"` 버튼은 텍스트 없이 아이콘만 표시 → 스크린리더가 동작을 인식 불가.

**적용**: `--staged` 모드 전용 (.tsx 파일), 기존 위반은 tracker에서 점진 개선

**감지**: `size="icon"` 이 있는 Button/button 요소에 `aria-label` 없음

**올바른 대안**:

```tsx
// ❌
<Button size="icon"><Trash2 className="h-4 w-4" /></Button>

// ✅
<Button size="icon" aria-label="삭제"><Trash2 className="h-4 w-4" /></Button>
```

---

## 예외 승인 절차

불가피하게 규칙을 위반해야 하는 경우:

1. **이유 명시**: 코드 주변에 `// self-audit-exception: <이유>` 주석 추가
2. **Whitelist 등록**: `scripts/self-audit.mjs`의 해당 check 함수에 파일/패턴 예외 추가 후 PR 설명에 이유 기록
3. **Maintainer 승인**: PR 리뷰 시 예외 타당성 검토

---

## 규칙 추가 방법

1. `scripts/self-audit.mjs`에 `checkXxx(file, lines)` 함수 추가
2. 메인 루프 `for (const file of files)` 블록에 호출 추가
3. 이 문서에 규칙 상세 섹션 추가
4. `--all` 모드에서 현재 codebase exit 0 확인 후 커밋
