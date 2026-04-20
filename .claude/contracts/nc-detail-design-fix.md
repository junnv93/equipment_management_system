# Contract: nc-detail-design-fix

## Scope
부적합 상세 페이지 디자인 이슈 5종 수정 (review-design AP-01~AP-05 기반)

## Changed Files
- `apps/frontend/lib/design-tokens/components/non-conformance.ts`
- `apps/frontend/components/non-conformances/NCDetailClient.tsx`

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter frontend run tsc --noEmit` 통과 | CLI |
| M2 | `closed` 스텝 아이콘이 XCircle(취소/오류 의미)이 아닌 다른 아이콘 사용 | Grep `NC_STEP_ICONS` in NCDetailClient.tsx |
| M3 | XCircle import 제거 또는 rejection alert에만 사용 (중복 용도 제거) | Grep `XCircle` usage in NCDetailClient.tsx |
| M4 | NC_DETAIL_HEADER_TOKENS.title이 SUB_PAGE_HEADER_TOKENS.title을 그대로 상속하지 않고 독립 문자열 오버라이드 | Read non-conformance.ts |
| M5 | NC_WORKFLOW_TOKENS.container에 elevation(shadow-sm 이상) 추가 | Grep `shadow` in non-conformance.ts |
| M6 | NC_ACTION_BAR_TOKENS.container에 elevation 추가 | Grep NC_ACTION_BAR_TOKENS in non-conformance.ts |
| M7 | NC_COLLAPSIBLE_TOKENS에 emptyState 토큰 추가 | Grep `emptyState` in non-conformance.ts |
| M8 | NCDetailClient.tsx 빈 상태 렌더링이 NC_COLLAPSIBLE_TOKENS.emptyState 토큰 사용 | Grep `emptyState` in NCDetailClient.tsx |
| M9 | 모든 색상 변경이 CSS 변수 체인(brand-*, foreground 등) 경유 — raw hex/rgb 금지 | Grep `#[0-9a-fA-F]` in changed files |
| M10 | 변경된 파일에 eslint-disable 추가 없음 | Grep `eslint-disable` in changed files |

## SHOULD Criteria (루프 차단 안 함)

| # | Criterion |
|---|-----------|
| S1 | 플레이라이트 e2e suite-31 NC 상세 UI 테스트 통과 |
| S2 | SUB_PAGE_HEADER_TOKENS은 변경되지 않음 (다른 서브 페이지 영향 없음) |
| S3 | XCircle이 rejection alert에는 여전히 사용됨 (semantic OK — 반려는 오류 의미) |

## Domain Rules
- 모든 색상: `brand.ts` CSS 변수 경유
- 간격/폰트: `primitives.ts` 또는 Tailwind 스케일
- 아이콘 매핑(React 컴포넌트): 컴포넌트 파일에만 위치 (design-token 파일 금지)
- `dark:` prefix 불필요 — CSS 변수가 :root/.dark 양쪽 정의
