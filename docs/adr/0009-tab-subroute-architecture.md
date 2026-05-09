# ADR-0009: 장비 상세 탭(Tab) vs 서브라우트(Sub-route) 아키텍처

**날짜**: 2026-05-09  
**상태**: Accepted  
**결정자**: 시니어 아키텍처 검토 (harness Mode 2)

---

## Context

장비 상세 페이지(`/equipment/[id]`)에는 교정 이력, 교정 인자, 수리 이력, 사고 이력 등의 도메인 정보를 보여주는 탭(Tab)이 있다. 동시에, 동일 도메인에 대해 집중적 관리가 필요한 경우 서브라우트(`/equipment/[id]/calibration-history`, `/equipment/[id]/repair-history` 등)도 존재한다.

이 두 UI 패턴이 공존하면서 **역할 중복** 문제가 제기되었다:

- Tab: 요약 + 빠른 컨텍스트 확인
- Sub-route: 집중 필터 + 통계 + 워크플로 + 전체 목록

세 가지 추가 배경:

1. `CalibrationHistorySection.tsx`가 `result?: string`, `'pass' | 'fail' | 'conditional'` 인라인 union을 사용 — SSOT Rule 0 위반
2. Tab JSDoc에 역할 분리 근거가 없어 미래 기여자가 중복으로 오해할 위험
3. `EquipmentTabFooterLink`가 탭→서브라우트 전환 단일 진입점으로 이미 구현되어 있으나 ADR에 명문화되지 않음

---

## Decision

**Option C 채택: Tab(요약) + Sub-route(집중 관리) 공존, 역할 분리 명문화**

### 검토한 대안

| 옵션         | 설명                                                   | 결정     |
| ------------ | ------------------------------------------------------ | -------- |
| **Option A** | Sub-route 제거, Tab에 필터/통계 흡수                   | **거절** |
| **Option B** | Tab 제거, Sub-route만 유지                             | **거절** |
| **Option C** | Tab(요약) + Sub-route(집중 관리) 공존 + 역할 분리 결빙 | **채택** |
| **Option D** | 단일 컴포넌트에서 `mode` prop으로 Tab/Sub-route 분기   | **거절** |

#### Option A 거절 이유

Tab에 집중 필터 + 통계 카드를 넣으면:

- 장비 상세 페이지의 **스크롤 길이 폭발** (탭 전환 후 추가 스크롤)
- 다른 탭(수리, 사고, 인자)의 UX와 일관성 깨짐
- Tab = "요약 컨텍스트"라는 UL-QP-18 워크플로 기대 위반

#### Option B 거절 이유

Tab 제거 시:

- 장비 상세에서 **페이지 전환 없이 교정 이력 요약**을 볼 방법 소실
- 기존 워크플로(장비 상세 확인 → 교정 이력 빠른 확인 → 필요 시 서브라우트)가 2단계로 강제
- 다른 도메인 탭(수리/사고/인자)과 구조 불일치 → 탭 컴포넌트 일부만 제거하는 일관성 문제

#### Option D 거절 이유

`mode='tab'|'subroute'` prop 추가 시:

- 조건부 렌더링(필터 bar, 통계 카드, URL sync, breadcrumb) 복잡도 폭발
- 두 역할의 상태/쿼리 로직이 한 파일에 혼재 → SRP 위반
- 테스트 분기 경우의 수 2배

### Option C 상세 설계

```
Tab (요약, 빠른 확인)          Sub-route (집중 관리)
─────────────────────          ──────────────────────
CalibrationHistoryTab          CalibrationHistoryClient
  - 최근 N건 요약 테이블          - 통계 카드 (5종)
  - 차기 교정일 D-day             - 날짜/승인상태/결과 필터
  - EquipmentTabFooterLink  →    - URL 쿼리 sync
                                 - 전체 CalibrationListTable
```

**단일 진입점 SSOT**: `EquipmentTabFooterLink` 컴포넌트가 유일한 탭→서브라우트 전환 링크.
모든 탭은 이 컴포넌트만 사용한다. 직접 `<Link>` 작성 금지.

**데이터 SSOT**: Tab과 Sub-route가 같은 backend endpoint를 사용하되, 쿼리 파라미터(pageSize 등)가 다름.
`queryKeys.*` SSOT 준수 — 쿼리키 로컬 재정의 금지.

---

## Consequences

### 긍정

- **역할 분리 명확**: Tab = 빠른 확인, Sub-route = 집중 관리. 미래 기여자가 중복 추가 방지
- **워크플로 보존**: 장비 상세 → 탭 요약 → 서브라우트 심화 3단 탐색이 자연스러움
- **SSOT 강화**: `EquipmentTabFooterLink`가 탭→서브라우트 전환 단일 진입점. 경로 하드코딩 금지
- **점진적 확장**: Sub-route에만 복잡한 기능(bulk action, export, 필터 프리셋) 추가 가능
- **테스트 분리**: Tab spec과 Sub-route spec이 독립적 → 책임 명확

### 부정

- **두 컴포넌트 유지 비용**: 같은 도메인에 두 파일 존재 → 일관성 관리 필요
- **데이터 이중 fetch 가능성**: 장비 상세에서 Tab을 열면 요약 fetch, Sub-route 진입하면 별도 fetch
  - 완화: `placeholderData`/`initialData` + React Query deduplication으로 최소화

---

## Trigger Conditions for Reconsideration

| 조건                                                         | 권고 액션                               |
| ------------------------------------------------------------ | --------------------------------------- |
| Tab과 Sub-route가 동일 쿼리/필터를 3회 이상 중복 구현        | Option D(통합 컴포넌트) 재검토          |
| Sub-route 방문율이 Tab 방문율의 5% 미만 (analytics 기준)     | Option A(Sub-route 제거) 재검토         |
| Tab에 필터 UI 추가 요구가 반복적으로 제기                    | Sub-route로 기능 흡수 + Tab은 요약 고정 |
| `EquipmentTabFooterLink` 이외의 탭→서브라우트 직접 Link 발견 | 즉시 수정 (SSOT 위반)                   |

---

## Implementation Notes

- `CalibrationHistorySection.tsx`는 장비 생성/편집 폼(`EquipmentForm.tsx`)에서 사용하는 별도 컴포넌트. Tab/Sub-route 패턴과 무관하지만 동일 도메인이므로 SSOT(`CalibrationResult` 타입) 적용 동시 완료.
- 각 Tab 컴포넌트 상단 JSDoc에 이 ADR 번호(ADR-0009) 참조를 추가하여 컨텍스트 없이 파일 읽어도 의도를 파악 가능하게 함.
