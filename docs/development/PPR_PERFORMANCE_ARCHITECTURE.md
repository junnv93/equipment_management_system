# PPR Performance Architecture

Next.js 16 PPR (Partial Prerendering) 환경에서 Performance API를 안전하게 사용하기 위한 아키텍처 설계.

## 문제 정의

### 증상

```
Runtime TypeError: Failed to execute 'measure' on 'Performance':
'SettingsPage [Prerender]' cannot have a negative time stamp.
```

### 근본 원인

| 계층          | 원인                                               |
| ------------- | -------------------------------------------------- |
| **Framework** | Next.js 16 Turbopack `flushComponentPerformance()` |
| **API**       | `performance.measure()` 음수 startTime 호출        |
| **Trigger**   | PPR + React Strict Mode + HMR 타이밍 충돌          |

### 영향 범위

- **환경**: 개발 모드 전용 (프로덕션 무영향)
- **컴포넌트**: PPR async 함수 (`SettingsPage`, `TeamListAsync` 등)
- **브라우저**: Chrome (TypeError), Firefox (DOMException)

---

## 아키텍처 개선

### 원칙

1. **SSOT (Single Source of Truth)**: 에러 패턴 중앙화
2. **타입 안전성**: 크로스 브라우저 타입 처리
3. **환경별 전략**: 개발/프로덕션 분리
4. **크로스 사이트 호환**: 모든 환경에서 안전 동작

### 계층 구조

```
┌─────────────────────────────────────────────┐
│  Application Layer (PPR Components)         │
│  - SettingsPage, TeamListAsync, etc.        │
└─────────────────┬───────────────────────────┘
                  │ (optional)
                  ▼
┌─────────────────────────────────────────────┐
│  Safe Performance Wrapper (safe-performance)│
│  - safeMeasure(), safeMark()                │
│  - Explicit null handling                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Global Patch (patch-performance-measure)   │
│  - Intercepts all performance.measure()     │
│  - Auto-filters PPR errors                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Error Detection (performance-errors)       │
│  - SSOT error patterns                      │
│  - Type-safe error checking                 │
└─────────────────────────────────────────────┘
```

---

## 파일 구조

### 1. Error Patterns SSOT

**파일**: `lib/utils/performance-errors.ts`

**역할**: 중앙화된 에러 감지 로직

```typescript
// SSOT: 모든 Performance 에러 감지에서 이 패턴 사용
export const PERFORMANCE_ERROR_PATTERNS = {
  NEGATIVE_TIMESTAMP: /negative time stamp/i,
  INVALID_MARK: /mark .+ does not exist|mark .+ not found/i,
} as const;

// 타입 안전: TypeError + DOMException
export function isPerformanceMeasureError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const isValidType = ['TypeError', 'DOMException'].some((type) => error.name === type);

  return isValidType && PERFORMANCE_ERROR_PATTERNS.NEGATIVE_TIMESTAMP.test(error.message);
}
```

**SSOT 준수:**

- ❌ 하드코딩: `error.message.includes('negative time stamp')`
- ✅ SSOT: `PERFORMANCE_ERROR_PATTERNS.NEGATIVE_TIMESTAMP`

### 2. Global Patch

**파일**: `lib/utils/patch-performance-measure.ts`

**역할**: 전역 Performance API 패치 (자동 에러 필터링)

**개선 사항:**

| Before                            | After                              |
| --------------------------------- | ---------------------------------- |
| `error instanceof DOMException`   | `isPerformanceMeasureError(error)` |
| `includes('negative time stamp')` | SSOT 정규식 패턴                   |
| TypeError 미처리                  | TypeError + DOMException 모두 처리 |
| 하드코딩 에러 메시지              | 중앙화된 패턴 매칭                 |

**적용 시점**: `lib/providers.tsx` 최상단 (앱 시작 시)

```typescript
// providers.tsx
import { patchPerformanceMeasure } from '@/lib/utils/patch-performance-measure';

patchPerformanceMeasure(); // 전역 적용
```

### 3. Safe Performance Wrapper (선택적)

**파일**: `lib/utils/safe-performance.ts`

**역할**: 명시적 PPR-safe API 제공

**사용 시점:**

- PPR 컴포넌트 내부에서 커스텀 성능 측정
- 타입 안전한 null 핸들링 필요
- 에러 제어를 명시적으로 하고 싶을 때

```typescript
// 예시: PPR async 함수 내부
async function TeamListAsync() {
  const mark1 = safeMark('data-fetch-start'); // null 가능
  const data = await fetchData();
  const mark2 = safeMark('data-fetch-end');

  const measure = safeMeasure('fetch-duration', 'data-fetch-start', 'data-fetch-end');
  if (measure) {
    console.log('Duration:', measure.duration);
  }
}
```

**전역 패치 vs Safe 래퍼:**

| 접근법    | 장점                              | 단점           | 사용 권장             |
| --------- | --------------------------------- | -------------- | --------------------- |
| 전역 패치 | Next.js 내부 호출 자동 커버, 투명 | 전역 상태 변경 | 필수 (기본)           |
| Safe 래퍼 | 명시적, 타입 안전, null 반환      | 수동 사용 필요 | 선택 (커스텀 측정 시) |

**권장**: 둘 다 사용 (전역 패치로 자동 커버 + 명시적 측정에 Safe 래퍼)

---

## 크로스 브라우저 호환성

### TypeError vs DOMException

| 브라우저    | measure() 에러 타입 |
| ----------- | ------------------- |
| Chrome/Edge | `TypeError`         |
| Firefox     | `DOMException`      |
| Safari      | `DOMException`      |

**아키텍처 대응:**

```typescript
// SSOT: 모든 브라우저 지원
export const PERFORMANCE_ERROR_TYPES = ['TypeError', 'DOMException'] as const;

export function isPerformanceMeasureError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // 타입 이름으로 체크 (instanceof 대신)
  const isValidType = PERFORMANCE_ERROR_TYPES.some((type) => error.name === type);

  if (!isValidType) return false;

  // 메시지 패턴 매칭
  return PERFORMANCE_ERROR_PATTERNS.NEGATIVE_TIMESTAMP.test(error.message);
}
```

---

## 환경별 전략

### 개발 환경

- ✅ 전역 패치 활성화
- ✅ 콘솔 디버그 로그 출력
- ✅ Safe 래퍼 사용 가능

### 프로덕션 환경

- ❌ 패치 비활성화 (성능)
- ❌ 로그 출력 없음
- ✅ PPR 자체가 정상 동작 (음수 타임스탬프 미발생)

**환경 체크 SSOT:**

```typescript
// performance-errors.ts
export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof performance !== 'undefined';
}

// patch-performance-measure.ts
export function patchPerformanceMeasure(): void {
  if (!isDevelopmentEnvironment() || !isBrowserEnvironment()) {
    return; // 프로덕션/SSR에서는 패치 생략
  }
  // ...
}
```

---

## 테스트 전략

### 단위 테스트 (Jest)

```typescript
// performance-errors.test.ts
describe('isPerformanceMeasureError', () => {
  it('should detect TypeError with negative timestamp', () => {
    const error = new TypeError('cannot have a negative time stamp');
    expect(isPerformanceMeasureError(error)).toBe(true);
  });

  it('should detect DOMException with negative timestamp', () => {
    const error = new DOMException('cannot have negative time stamp');
    error.name = 'DOMException';
    expect(isPerformanceMeasureError(error)).toBe(true);
  });

  it('should reject unrelated TypeError', () => {
    const error = new TypeError('some other error');
    expect(isPerformanceMeasureError(error)).toBe(false);
  });
});
```

### E2E 테스트 (Playwright)

```typescript
// performance-patch.spec.ts
test('should not crash with PPR components', async ({ page }) => {
  await page.goto('/teams');

  // PPR async 함수 렌더링
  await page.waitForSelector('text=팀 관리');

  // Performance errors should be silently handled
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));

  await page.reload();

  // No unhandled errors
  expect(errors).toHaveLength(0);
});
```

---

## 업스트림 추적

### Next.js Issue

**링크**: https://github.com/vercel/next.js/issues/86060

**상태**: Open (2024년 12월 보고)

**제거 조건:**

- Next.js 패치 릴리스 (16.x 또는 17.0)
- Turbopack `flushComponentPerformance()` 수정
- 모든 브라우저에서 에러 미발생 확인

**제거 절차:**

1. Next.js 업데이트
2. 개발 서버 실행 → PPR 페이지 접속
3. 콘솔에 Performance 에러 없음 확인
4. 다음 파일 제거:
   - `lib/utils/performance-errors.ts`
   - `lib/utils/patch-performance-measure.ts`
   - `lib/utils/safe-performance.ts` (선택적)
5. `lib/providers.tsx`에서 `patchPerformanceMeasure()` 호출 제거

---

## 모니터링

### 개발 환경

```typescript
// patch-performance-measure.ts
if (process.env.NODE_ENV === 'development') {
  console.debug(`[Performance Patch] PPR measure skipped: "${measureName}"`, error.message);
}
```

### 프로덕션 환경

Sentry/DataDog 등 에러 트래킹 서비스 연동 (선택):

```typescript
// performance-errors.ts
export function reportPerformanceError(error: Error, context: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production' && window.Sentry) {
    Sentry.captureException(error, { extra: context });
  }
}
```

---

## 참고 자료

- [Next.js 16 PPR 문서](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)
- [Performance API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Next.js Issue #86060](https://github.com/vercel/next.js/issues/86060)
- [프로젝트 CLAUDE.md](../../CLAUDE.md) - Next.js 16 패턴 가이드

---

## 변경 이력

| 날짜       | 변경 사항                  | 작성자 |
| ---------- | -------------------------- | ------ |
| 2026-02-16 | 초기 작성 (아키텍처 설계)  | System |
| 2026-02-16 | SSOT 에러 패턴 구현        | System |
| 2026-02-16 | Safe Performance 래퍼 추가 | System |
