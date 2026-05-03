# Evaluation Report: Data Migration Preview Windowing

## 반복 #1 (2026-05-03T10:18:00+09:00)

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| Preview table 전체 행 렌더링 제거 | PASS | `sheet.rows.map()` 직접 table body 렌더링 제거. `usePreviewWindow()`의 `visibleRows.map()` 사용 |
| Preview window size SSOT | PASS | `apps/frontend/lib/config/data-migration-preview.ts`의 `DATA_MIGRATION_PREVIEW_PAGE_SIZE` 경유 |
| Equipment pageSize SSOT 제한 | PASS | `PAGE_SIZE_OPTIONS`에 없는 URL `pageSize`는 `DEFAULT_UI_FILTERS.pageSize`로 폴백 |
| 선택 semantics 보존 | PASS | 장비 전체 선택/해제와 `selectedRows` payload는 전체 selectable rows 기준 유지 |
| History sheet read-only 표시 보존 | PASS | read-only 안내, status badge, error/warning cell 유지 |
| ko/en i18n parity | PASS | preview pagination key ko/en 양쪽 추가 |
| `pnpm --filter frontend run lint` | PASS | exit 0 |
| `pnpm --filter frontend run type-check` | PASS | exit 0 |

## SHOULD 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| Preview pagination UI | PASS | 총 행 수, 표시 범위, 현재 페이지, 이전/다음 제공 |
| Invalid/oversized pageSize unit test | PASS | `equipment-filter-utils.test.ts` 35 tests PASS |
| Large table a11y state | PASS | pagination navigation `aria-label`, range text `aria-live` 유지 |
| Browser E2E | PASS | 계약상 fixture 부재 시 생략 가능. 정적/타입/단위 검증 통과 |

## 검증 명령

```bash
pnpm --filter frontend test -- equipment-filter-utils.test.ts
pnpm --filter frontend run type-check
pnpm --filter frontend run lint
git diff --check
```

## 전체 판정: PASS

## 비고

- 장비 목록은 이미 서버 페이지네이션을 사용하므로 virtualization보다 URL `pageSize` SSOT 경계 봉합이 낮은 리스크의 아키텍처 개선이다.
- Data migration preview는 업로드 결과 전체 행이 클라이언트에 존재하는 구조라 DOM windowing pagination을 적용했다.
