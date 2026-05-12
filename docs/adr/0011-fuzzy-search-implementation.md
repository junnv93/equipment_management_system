# ADR-0011: Fuzzy Search 자체 구현 유지 (fuse.js 미도입)

- **상태**: Accepted
- **일시**: 2026-05-12
- **결정자**: 시니어 개발 (sprint `checkouts-sprint4-followups-s2-s4-s5-s6` 의 S-5)
- **맥락 범위**: frontend (lib/utils/fuzzy-search.ts), 번들 크기, UX

## Context

`apps/frontend/lib/utils/fuzzy-search.ts` 는 NFD 정규화 + lowercase + token-split 부분 매칭 기반의 자체 구현이다 (~35 lines). 2026-05-10 sprint U-08 에서 `CheckoutDestinationCombobox` 가 처음 도입했고, 이후 후속 sprint S-5 에서 "외부 fuzzy 라이브러리(fuse.js 등) 도입 vs 자체 구현 유지" 결정이 필요해졌다.

결정을 미루면 두 가지 위험이 누적된다:

1. **미루기 비용**: 추후 다른 도메인(예: `useUserPicker`, `useEquipmentPicker`)에서 fuzzy 가 필요할 때마다 동일한 trade-off 토론이 반복.
2. **드리프트 위험**: 일부 컴포넌트는 자체, 일부는 fuse.js 를 쓰면 사용자 검색 정확도가 화면마다 달라져 UX 불일치.

본 결정은 **현재 데이터셋 규모와 UX 요구를 기반**으로 라이브러리 도입 여부를 정량 판단하고, 환경 변화 시 재검토할 트리거를 명시한다.

## Decision

**자체 구현(`lib/utils/fuzzy-search.ts`)을 단일 SSOT 로 유지한다.** 모든 frontend 자동완성/검색 컴포넌트는 본 구현의 `fuzzyMatch` / `fuzzyFilter` 를 사용한다. 외부 라이브러리(fuse.js 등) 도입은 아래 § "Trigger Conditions for Reconsideration" 의 임계값 충족 시까지 보류한다.

### 검토한 대안 (Options)

1. **Option A — 자체 구현 유지 (선택)**
   - 장점: 번들 +0KB, 한글/영어 NFD 처리 검증 완료, 의존성 0
   - 단점: 오타 1글자 허용 불가 (Levenshtein 미지원), `O(n)` full-scan
2. **Option B — fuse.js 도입**
   - 장점: Levenshtein 기반 fuzzy 매칭, weighted-key search (검색 가중치 지정), TypeScript 타입 강력
   - 단점: gzip 후 ~12KB 추가, dataset 작은 화면에서 ROI 낮음, 한글 NFD 처리는 별도 가공 필요
3. **Option C — `cmdk` 내장 fuzzy 사용 (combobox 한정)**
   - 장점: shadcn/ui 와 통합, 이미 의존성 보유 가능
   - 단점: combobox 외 도메인(검색 결과 페이지, 자동완성 외 필터)은 미적용 → SSOT 분기

## Consequences

### 긍정

- **번들 크기 0 증가** (현재 prod 번들 영향 없음)
- **한글 accent-insensitive 보장** (NFD + lowercase 검증 완료, MEMORY `feedback_no_fabricate_domain_data` 정합)
- **단일 SSOT** — 모든 fuzzy 호출이 한 함수를 거치므로 매칭 규칙 변경 시 1곳만 수정
- **의존성 0** — fuse.js 의 미래 보안 패치 / breaking change 영향 없음

### 부정

- **오타 허용 불가**: "Hyundai" 검색 시 "Hyndai" (1글자 누락) 매칭 안 됨. 사용자가 정확히 입력해야 함.
- **데이터셋 500+ 시 성능 저하**: 현재 단일 `useRecentDestinations` (20-50 entries) 에서는 무시 가능, 행 수 폭증 시 `O(n)` 부하.
- **weighted-key 미지원**: `{ label: '...', description: '...' }` 같은 객체에서 label 가중치를 높게 줄 수 없음. 콜러 측에서 `getLabel` 함수로 우회.

### 완화 (Mitigations)

- 본 ADR 의 Trigger Conditions 테이블로 재검토 시점을 정량 명시 — 자체 구현 한계가 실제 UX 문제로 드러나기 전에 ADR-0012 (또는 supersede) 작성 가능.
- `lib/utils/fuzzy-search.ts` 상단 JSDoc 에 `@see docs/adr/0011-fuzzy-search-implementation.md` 명시 — 향후 개발자가 라이브러리 추가 충동을 느낄 때 본 결정 근거 즉시 발견.
- fuse.js 미도입이 UX 한계로 드러나는 경우, sprint 우선순위에 "ADR-0011 재검토" 태스크 명시.

### Trigger Conditions for Reconsideration

| 트리거                              | 임계값           | 측정 방법                                                   |
| ----------------------------------- | ---------------- | ----------------------------------------------------------- |
| 단일 자동완성 도메인의 dataset 크기 | > 500 entries    | DB count(\*) — recent_destinations / users / equipments 등  |
| `fuzzyFilter` 호출 도메인 수        | ≥ 5 도메인       | `grep -rn "fuzzyFilter" apps/frontend/components/ \| wc -l` |
| "오타 N글자 허용" UX 요구 발생      | UX 리뷰에서 명시 | review-design 보고서 또는 사용자 피드백 ticket              |
| `fuzzyMatch` p95 latency            | > 16ms (1 frame) | 브라우저 DevTools Performance 또는 Web Vitals               |

위 4가지 중 **1건이라도 충족** 시 재검토 트리거. 결정 시 ADR-0012 작성 + 본 ADR 을 `Superseded by ADR-0012` 로 변경.

## References

- 관련 ADR: ADR-0008 (backend zod error i18n), ADR-0010 (drizzle manual SQL policy)
- 코드: `apps/frontend/lib/utils/fuzzy-search.ts`, `apps/frontend/components/checkouts/CheckoutDestinationCombobox.tsx`
- Sprint: `checkouts-sprint4-followups-s2-s4-s5-s6` (2026-05-12)
- 외부: [fuse.js](https://www.fusejs.io/) — 검토 대안 (도입 보류), [cmdk](https://cmdk.paco.me/) — 검토 대안 (combobox 한정)
- MEMORY: `feedback_evaluator_pass_senior_self_audit`, `feedback_repeated_self_audit`
