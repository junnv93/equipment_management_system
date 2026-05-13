# ADR-0013: Graceful No-Op Context Consumer 패턴

- **상태**: Accepted
- **일시**: 2026-05-13
- **결정자**: myeongjun kwon
- **맥락 범위**: frontend (React Context 설계)

## Context

Next.js App Router 프로젝트에서 컴포넌트 트리가 깊어질수록 Context는 두 가지 상반된 압력을 받는다.

| 압력         | 설명                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| **재사용성** | 동일 컴포넌트를 visual-fixtures, Storybook, 단위 테스트에서 Provider 없이 독립 실행 |
| **안전성**   | Provider 누락이 버그일 때 런타임에서 즉시 실패                                      |

기존 React 패턴은 두 가지가 혼용된다:

```typescript
// 패턴 A — fail-fast (Provider 필수)
const ctx = createContext<T | null>(null);
export function useCtx() {
  const v = useContext(ctx);
  if (!v) throw new Error('Provider 필요');
  return v;
}

// 패턴 B — graceful no-op (Provider 선택)
const ctx = createContext<T | null>(null);
const NO_OP_VALUE: T = { fn: () => {} };
export function useCtx() {
  return useContext(ctx) ?? NO_OP_VALUE;
}
```

선택 기준이 없으면 개발자마다 임의로 선택하고, Context 안전성 등급이 코드베이스 전반에서 불일치한다.
본 ADR은 각 패턴의 적용 조건을 형식화하여 일관된 판단 근거를 제공한다.

### 코드베이스 현황 (2026-05-13)

| Context                      | 패턴                          | 이유                                      |
| ---------------------------- | ----------------------------- | ----------------------------------------- |
| `InspectionFormContext`      | Graceful no-op                | VisualTableEditor 단독 사용 + 테스트 격리 |
| `AuthenticatedClientContext` | Fail-fast (throw)             | 인증 없이 API 호출은 항상 버그            |
| `KeyboardShortcutsContext`   | Fail-fast (undefined → throw) | Provider 없이 단축키 동작 불가            |
| `BreadcrumbContext`          | Fail-fast (undefined → throw) | 레이아웃 인프라 — 누락은 라우팅 버그      |
| `NavigationPendingContext`   | Fail-fast (null → throw)      | 네비게이션 상태 누락은 UX 버그            |

## Decision

React Context를 설계할 때 **컨텍스트의 의미**에 따라 두 패턴을 명시적으로 선택한다.

### 패턴 선택 트리

```
이 Context가 없을 때 컴포넌트가 기능을 제공할 수 있는가?
│
├─ YES → Graceful No-Op 패턴 (ADR-0013-A)
│        "장식적/보강적(enrichment) Context"
│
└─ NO → Fail-Fast 패턴 (ADR-0013-B)
         "필수(required) Context"
```

### ADR-0013-A: Graceful No-Op 패턴 구현 계약

```typescript
// 1. null sentinel로 Context 생성
const XxxContext = createContext<XxxContextValue | null>(null);

// 2. NO_OP_VALUE — 모든 함수는 (): void / (): false / (): defaultValue 반환
const NO_OP_VALUE: XxxContextValue = {
  state: INITIAL_STATE,
  doSomething: () => {}, // 부수 효과 없음
  checkSomething: () => false, // 판정 함수는 보수적 기본값
};

// 3. 훅: ?? 연산자로 no-op 반환
export function useXxx(): XxxContextValue {
  return useContext(XxxContext) ?? NO_OP_VALUE;
}
```

**명명 규칙:**

- 상수명: `NO_OP_VALUE` (도메인 prefix 없음 — 파일 스코프에서 유일)
- 훅명: `useXxx` (Provider 없이 호출 가능함을 JSDoc에 명시)
- 파일명: `xxx-context.tsx` (Provider export 포함)

**NO_OP_VALUE 불변 규칙:**

- 모든 함수는 부수 효과(state mutation, API 호출, navigation) 없음
- boolean 반환 함수는 `false` (보수적 기본 — "기능 없음")
- 객체 반환 함수는 INITIAL_STATE 참조 (새 객체 생성 금지 — referential equality)

### ADR-0013-B: Fail-Fast 패턴 구현 계약

```typescript
// 기존 AuthenticatedClientContext 패턴 — 변경 없음
const XxxContext = createContext<XxxContextValue | null>(null);

export function useXxx(): XxxContextValue {
  const v = useContext(XxxContext);
  if (!v) {
    throw new Error(
      'useXxx must be used within XxxProvider. ' +
        'Ensure your component is wrapped with <XxxProvider>.'
    );
  }
  return v;
}
```

## 적용 조건

**Graceful No-Op (ADR-0013-A) 적용 조건:**

1. Context가 **장식적/보강적(enrichment)** 데이터를 제공한다
   - 예: prefill 메타데이터, 셀 provenance, UI 힌트, 시각 강조
2. Context 없이도 컴포넌트가 **핵심 기능**(편집, 저장, 표시)을 수행할 수 있다
3. 다음 중 하나 이상의 사용 시나리오가 현재 또는 미래에 존재한다:
   - 단위 테스트 (Provider wrapper 없이 렌더링)
   - visual-fixtures / Storybook (독립 실행)
   - 다른 화면에서의 컴포넌트 재사용 (Provider 체인 없음)
4. Context 부재 시 **사용자에게 에러가 노출되지 않는** 격하(degradation)가 가능하다

**Fail-Fast (ADR-0013-B) 적용 조건:**

1. Context가 **필수 인프라**를 제공한다
   - 예: 인증 토큰, 세션, 네비게이션 상태, 레이아웃 컴포넌트
2. Context 없이 컴포넌트를 실행하면 **항상 버그**이다
3. Provider 누락이 **개발 오류**이며 런타임에서 즉시 발견되어야 한다
4. **보안 관련 Context는 예외 없이 Fail-Fast** — graceful no-op으로 보안 검사를 우회할 수 없다

## 금지 조건 (Graceful No-Op 절대 사용 금지)

다음 Context 유형에는 Graceful No-Op을 적용하지 않는다:

| 유형                                                | 이유                                   |
| --------------------------------------------------- | -------------------------------------- |
| 인증 Context (AuthenticatedClientContext 등)        | No-op 시 미인증 API 호출 — 보안 취약점 |
| 권한 Context (PermissionsContext 등)                | No-op 시 권한 검사 우회 가능           |
| 세션 Context                                        | No-op 시 사용자 데이터 노출 위험       |
| 결제/트랜잭션 Context                               | No-op 시 데이터 무결성 위반            |
| 필수 레이아웃 Context (NavigationPendingContext 등) | No-op 시 UX 버그가 조용히 숨겨짐       |

## 정규 사례 (Canonical Example)

`apps/frontend/lib/inspection/form-context.tsx` — `InspectionFormContext`

```typescript
// 설계 근거:
// - VisualTableEditor는 단독으로도 동작해야 함 (visual-fixtures, 다른 화면 재사용)
// - prefill 메타는 장식적 — 없으면 셀 provenance 시각만 비활성화, 편집은 정상
// - 단위 테스트에서 Provider 없이 렌더링 가능 (Section Autonomy 원칙)

const InspectionFormContext = createContext<InspectionFormContextValue | null>(null);

const NO_OP_VALUE: InspectionFormContextValue = {
  state: INITIAL_STATE,
  applyLatestPrefill: () => {},
  markCellModified: () => {},
  isPrefilledCell: () => false,
  // ... 모든 함수: 부수 효과 없음 / 보수적 기본값
};

export function useInspectionForm(): InspectionFormContextValue {
  return useContext(InspectionFormContext) ?? NO_OP_VALUE;
}
```

**배경**: LIMS(Laboratory Information Management System)에서 cell-level provenance tracking은 업계 표준 기능(LabWare, Veeva, Beamex)이며, prefill 시각화는 사용자 편의 기능이지 데이터 무결성 기능이 아니다. 따라서 graceful degradation이 적절하다.

## Consequences

### 긍정

- **테스트 용이성**: Provider 없이 컴포넌트 단위 테스트 가능 — 보일러플레이트 감소
- **재사용성**: 동일 컴포넌트를 visual-fixtures, Storybook, 다른 화면에서 Provider chain 없이 재사용
- **Section Autonomy 지원**: 4원칙(Provider-free testable) 직접 구현 (ADR-0013 ↔ section-autonomy-followup F-2 연계)
- **명시적 안전 등급**: 코드베이스 전반에서 Context 패턴을 보면 안전 요구사항을 즉시 파악 가능

### 부정

- **NO_OP_VALUE 유지 부담**: Context interface 추가 시 NO_OP_VALUE도 업데이트 필요 — TypeScript가 컴파일 시 강제
- **테스트 맹점**: Graceful no-op이 Provider 누락 버그를 조용히 숨길 수 있음 — 통합 테스트에서 Provider 포함 경로도 필수 검증

### 완화 (Mitigations)

- TypeScript strict: `NO_OP_VALUE: XxxContextValue` 타입 어노테이션으로 interface 변경 시 컴파일 에러 자동 발생
- JSDoc: `useXxx` 훅에 "Provider 부재 시 NO_OP_VALUE 반환" 명시 — 런타임 행동을 호출자가 예측 가능
- 통합 테스트: Provider 포함 경로를 별도 spec으로 커버 (verify-e2e Step 24 격리 원칙)

### Trigger Conditions for Reconsideration

이 ADR을 재검토해야 할 조건:

| 트리거                                       | 임계값                                     |
| -------------------------------------------- | ------------------------------------------ |
| Graceful no-op으로 인한 버그 보고            | 1건 이상 (보안/데이터 관련)                |
| NO_OP_VALUE 동기화 실수로 인한 런타임 에러   | 2건 이상                                   |
| Context 수 증가                              | 10개 초과 — 분류 체계 재검토               |
| React Server Component에서 Context 사용 필요 | RSC ↔ Client Component 경계 전략 변경 필요 |

## References

- 관련 ADR: ADR-0009 (Tab Subroute Architecture — Section Autonomy 기반)
- 연관 tech-debt: section-autonomy-followup F-1, F-2 (Provider-free testability)
- 코드 SSOT: `apps/frontend/lib/inspection/form-context.tsx` (InspectionFormContext)
- 업계 참조: React Context documentation — "Context provides a way to pass data through the component tree without having to pass props down manually"
- 반대 패턴: `apps/frontend/lib/api/authenticated-client-provider.tsx` (Fail-Fast)
