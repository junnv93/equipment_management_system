# 리팩토링 방향성 분석

## 현재 상황 분석

### 1. 장비 선택 패턴의 다양성

각 create 페이지마다 다른 요구사항이 있습니다:

#### `rentals/create` (단일 선택, 리스트)

- 단일 장비 선택
- 리스트 형태 UI
- 간단한 검색 기능

#### `checkouts/create` (다중 선택, 테이블)

- 여러 장비 선택 가능
- 테이블 형태 UI
- 선택된 장비 목록 표시
- 추가/제거 기능

#### `maintenance/create` (단일 선택, 그리드)

- 단일 장비 선택
- 그리드 레이아웃 (카드 형태)
- URL 파라미터로 장비 ID 전달 가능
- 장비 상세 정보 표시

#### `reservations/create` (단일 선택, 리스트)

- 단일 장비 선택
- 리스트 형태 UI
- 체크 아이콘 표시

### 2. 현재 리팩토링의 장단점

#### ✅ 장점

1. **코드 중복 제거**: `rentals/create`에서 중복 코드 제거
2. **일관성**: 공통 컴포넌트 사용으로 일관된 UX
3. **유지보수성**: 한 곳 수정으로 여러 페이지에 반영
4. **타입 안전성**: TypeScript 타입 보장

#### ⚠️ 단점 및 우려사항

1. **과도한 추상화**: 모든 페이지가 동일한 패턴을 따르지 않음
2. **유연성 부족**: 특수한 요구사항(다중 선택, 그리드 레이아웃) 처리 어려움
3. **YAGNI 원칙**: 아직 필요하지 않은 추상화를 미리 만듦
4. **커스터마이징 어려움**: 각 페이지의 고유한 요구사항 반영 어려움

## 장기적인 관점에서의 권장 방향

### 옵션 1: 점진적 통합 (권장) ⭐

**접근 방식**:

- 공통 패턴만 추출 (검색, 로딩, 에러 처리)
- UI는 각 페이지에서 유지
- 공통 로직만 훅으로 분리

**장점**:

- 유연성 유지
- 각 페이지의 특수 요구사항 반영 가능
- 과도한 추상화 방지
- 점진적 개선 가능

**구현 예시**:

```typescript
// 공통 로직만 훅으로
function useEquipmentSearch(filters: EquipmentFilter) {
  return useEquipmentList(filters);
}

// UI는 각 페이지에서
// rentals/create: EquipmentSelector 사용
// checkouts/create: 자체 테이블 UI 유지
// maintenance/create: 자체 그리드 UI 유지
```

### 옵션 2: 컴포넌트 변형 패턴

**접근 방식**:

- 기본 컴포넌트 + 변형 컴포넌트
- `EquipmentSelector` (기본)
- `EquipmentSelectorMulti` (다중 선택)
- `EquipmentSelectorGrid` (그리드 레이아웃)

**장점**:

- 명확한 변형 제공
- 타입 안전성 유지

**단점**:

- 컴포넌트 수 증가
- 유지보수 복잡도 증가

### 옵션 3: 현재 방향 유지 (비권장)

**문제점**:

- 모든 페이지를 동일한 컴포넌트로 강제
- 특수 요구사항 처리 어려움
- 과도한 추상화

## 최종 권장사항

### 단기 (현재)

1. ✅ `useFormSubmission` 훅 유지 - 폼 제출 로직은 공통 패턴이 많음
2. ✅ `EquipmentSelector`는 `rentals/create`, `reservations/create`에만 적용
3. ⚠️ `checkouts/create`, `maintenance/create`는 자체 UI 유지

### 중기 (3-6개월)

1. 공통 패턴 분석 후 점진적 통합
2. 실제 사용 패턴 확인 후 추상화
3. 테스트 커버리지 확보

### 장기 (6개월 이상)

1. 사용자 피드백 기반 UI 통일
2. 디자인 시스템 구축
3. 컴포넌트 라이브러리화

## 구체적 개선 제안

### 1. `useFormSubmission` 개선

현재 구조는 좋지만, 더 유연하게:

```typescript
// 현재: 모든 경우에 리다이렉트
redirectPath?: string;

// 개선: 조건부 리다이렉트
onSuccess?: (data: TData) => void | Promise<void>;
```

### 2. `EquipmentSelector` 개선

현재는 단일 선택만 지원. 다중 선택을 위한 별도 컴포넌트:

```typescript
// EquipmentSelector (단일 선택) - 현재 유지
// EquipmentSelectorMulti (다중 선택) - 새로 생성
```

### 3. 공통 유틸리티 함수

UI는 다르지만 로직은 공통:

```typescript
// hooks/use-equipment-selection.ts
export function useEquipmentSelection(filters: EquipmentFilter) {
  // 공통 로직: 검색, 필터링, 로딩 상태
  return {
    equipmentList,
    isLoading,
    search,
    // ...
  };
}
```

## 결론

**현재 방향은 부분적으로 올바릅니다**, 하지만:

1. ✅ **`useFormSubmission`**: 완전히 올바른 방향 - 유지 권장
2. ⚠️ **`EquipmentSelector`**: 제한적 적용 - 단일 선택 패턴에만 사용
3. ❌ **전면 통합**: 비권장 - 각 페이지의 특수성 고려 필요

**권장 접근**:

- 공통 로직은 훅으로 추출 ✅
- UI 컴포넌트는 점진적 통합 ⚠️
- 실제 사용 패턴 확인 후 추상화 결정 ✅
