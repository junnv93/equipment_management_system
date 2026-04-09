# Behavioral Guidelines (코딩 전 행동 원칙)

**이 원칙은 모든 기술 규칙보다 우선합니다. 위반 시 불필요한 재작업과 사이드 이펙트 발생.**

## Guideline 1: 코딩 전에 생각하기

**가정을 숨기지 않는다. 혼란을 감추지 않는다. 트레이드오프를 표면에 드러낸다.**

구현 전 확인 사항:

- 상태 변경이 수반되는가? → CAS(`version` 필드) 필요 여부 먼저 판단
- 여러 해석이 가능하면 **조용히 하나를 선택하지 말고** 선택지를 제시
- 더 단순한 접근법이 있으면 말한다. 필요 시 반론을 제기한다
- 불명확하면 멈추고, **무엇이 불명확한지** 명시한 뒤 질문한다

```
// 판단 체크리스트
1. 이 변경에 CAS가 필요한가? → VersionedBaseService + versionedSchema
2. 캐시 무효화 전략은? → CacheInvalidationHelper 교차 무효화
3. 어떤 역할이 이 기능에 접근하는가? → @RequirePermissions
4. 프론트엔드 상태는 어디서 관리하는가? → TanStack Query (useState 금지)
```

## Guideline 2: 최소 코드 원칙

**요청된 문제를 해결하는 최소한의 코드만 작성한다. 추측성 코드 금지.**

- 요청되지 않은 기능, 추상화, "유연성", "설정 가능성"을 추가하지 않는다
- 불가능한 시나리오에 대한 에러 핸들링을 넣지 않는다
- 한 번만 사용되는 코드에 헬퍼/유틸리티를 만들지 않는다
- 200줄로 짠 것이 50줄로 가능하면 다시 작성한다

```typescript
// ❌ 과잉 — 한 번만 쓰는 타입 변환에 유틸리티 생성
function formatCheckoutForDisplay(checkout: Checkout): DisplayCheckout { ... }
const formatted = formatCheckoutForDisplay(checkout);

// ✅ 최소 — 인라인으로 충분
const displayData = { ...checkout, statusLabel: STATUS_LABELS[checkout.status] };
```

**프로젝트 특화 함정:**

- `useOptimisticMutation`의 `onSuccess`에서 `setQueryData` 호출 금지 (TData ≠ TCachedData 75%)
- Drizzle ORM에서 correlated subquery 대신 JOIN + GROUP BY 사용 (subquery는 0 반환)
- 필터 상태를 `useState`로 이중 관리하지 않는다 (URL 파라미터가 SSOT)

## Guideline 3: 수술적 변경 (Surgical Changes)

**변경한 부분만 건드린다. 자기가 만든 잔여물만 정리한다.**

기존 코드 편집 시:

- 인접 코드의 "개선", 주석 추가, 포맷팅 변경 금지
- 고장나지 않은 것을 리팩토링하지 않는다
- 기존 스타일에 맞춘다 (더 좋은 방법을 알아도)
- 관련 없는 데드 코드를 발견하면 **언급만** 하고 삭제하지 않는다

자신의 변경으로 인한 잔여물:

- 자신의 변경이 만든 미사용 import/변수/함수는 제거한다
- 기존에 있던 데드 코드는 요청 없이 제거하지 않는다

**검증:** 변경된 모든 라인이 사용자 요청에 직접 매핑되어야 한다.

## Guideline 4: 목표 기반 실행

**성공 기준을 정의하고, 검증될 때까지 반복한다.**

작업을 검증 가능한 목표로 변환:

```
"유효성 검사 추가" → "잘못된 입력 테스트 작성 → 통과시키기"
"버그 수정"       → "재현 테스트 작성 → 통과시키기"
"리팩토링"        → "기존 테스트 통과 확인 → 변경 → 재확인"
```

다단계 작업 시 검증 계획 명시:

```
1. [단계] → 검증: pnpm tsc --noEmit (타입 에러 0)
2. [단계] → 검증: pnpm --filter backend run test (관련 스위트)
3. [단계] → 검증: 브라우저에서 해당 페이지 동작 확인
```

**명확한 성공 기준 = 독립적 반복 가능. 모호한 기준("되게 만들기") = 매번 확인 필요.**
