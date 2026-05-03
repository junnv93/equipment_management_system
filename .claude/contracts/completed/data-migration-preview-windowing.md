# 스프린트 계약: Data Migration Preview Windowing

## 생성 시점
2026-05-03T10:11:15+09:00

## 문제

`apps/frontend/components/data-migration/PreviewStep.tsx`는 Excel preview 결과의 `sheet.rows` 전체를 테이블 DOM으로 즉시 렌더링한다. 장비 마이그레이션은 파일 업로드 기반이라 서버 페이지네이션이 적용된 목록 화면보다 대용량 행 수 리스크가 크다.

추가로 `parseEquipmentFiltersFromSearchParams()`는 URL `pageSize`에 임의의 양수를 허용한다. `/equipment?pageSize=999999`가 API 쿼리와 렌더링 범위로 흘러가기 전에 frontend SSOT에서 차단되어야 한다.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `PreviewStep.tsx`의 장비/이력 시트 테이블은 `sheet.rows.map()` 전체 렌더링을 하지 않고 현재 preview window만 렌더링한다.
- [ ] preview window 크기는 하드코딩 숫자가 아니라 단일 SSOT 상수에서 온다.
- [ ] 장비 목록 `pageSize` URL 파라미터는 `PAGE_SIZE_OPTIONS` SSOT에 포함된 값만 허용하고, 그 외 값은 기본값으로 폴백한다.
- [ ] 선택 semantics가 보존된다: 장비 시트의 전체 선택/해제는 현재 페이지가 아니라 등록 가능한 전체 행 기준으로 동작하고, 실행 시 `selectedRows`는 전체 선택 상태를 반영한다.
- [ ] 이력 시트는 read-only 안내와 행 상태/오류 표시를 유지한다.
- [ ] ko/en `data-migration.json` 메시지 parity가 유지된다.
- [ ] `pnpm --filter frontend run lint` 에러 0.
- [ ] `pnpm --filter frontend run type-check` 에러 0.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] preview pagination UI가 총 행 수, 현재 표시 범위, 이전/다음 이동을 제공한다.
- [ ] equipment filter util unit test가 invalid/oversized `pageSize` 회귀를 막는다.
- [ ] 큰 테이블 주변에 `aria-live`/`aria-label` 등 상태 전달이 유지된다.
- [ ] 별도 브라우저 E2E는 시드/업로드 파일 fixture가 없으면 생략 가능하되, 정적 검증과 타입 검증은 반드시 통과한다.

### 적용 verify 스킬
- `harness`
- `verify-implementation`
- `verify-nextjs`
- `verify-i18n`
- `verify-design-tokens`
- `verify-hardcoding`

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제
- SHOULD 실패는 종료 조건에 영향 없음
