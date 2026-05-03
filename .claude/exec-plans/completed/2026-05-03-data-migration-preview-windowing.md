# 실행 계획: Data Migration Preview Windowing

## 목표

대용량 Excel preview에서 모든 행을 DOM에 렌더링하는 병목을 제거한다. 서버 API나 마이그레이션 실행 payload는 바꾸지 않고, preview 테이블 렌더링만 window 단위로 제한한다.

또한 장비 목록 URL `pageSize`가 shared pagination SSOT를 우회해 과대 렌더링/API 요청을 만들 수 있는 경계를 닫는다.

## 범위

### 수정 대상
- `apps/frontend/components/data-migration/PreviewStep.tsx`
- `apps/frontend/lib/config/data-migration-preview.ts`
- `apps/frontend/messages/ko/data-migration.json`
- `apps/frontend/messages/en/data-migration.json`
- `apps/frontend/lib/utils/equipment-filter-utils.ts`
- `apps/frontend/lib/utils/__tests__/equipment-filter-utils.test.ts`

### 제외
- backend data-migration API 변경
- Excel parser 변경
- 실제 실행 대상 `selectedRows` 계약 변경
- 장비/소프트웨어/케이블 목록 화면 virtualization

## 구현 단계

1. `data-migration-preview` 설정 SSOT 추가
   - preview table window size를 중앙 상수로 둔다.

2. `PreviewStep.tsx` 테이블 windowing
   - 장비 시트와 이력 시트 모두 visible rows만 렌더링한다.
   - 전체 선택/해제는 기존처럼 전체 selectable rows 기준을 유지한다.
   - page 변경과 rows 길이 변경 시 현재 page를 안전하게 clamp한다.

3. i18n 추가
   - ko/en `preview.table.paginationInfo`, `previousPage`, `nextPage` 추가.

4. 검증
   - `pnpm --filter frontend run lint`
   - `pnpm --filter frontend run type-check`
   - `pnpm --filter frontend test -- equipment-filter-utils.test.ts`
   - targeted grep:
     - `sheet.rows.map`이 테이블 body 렌더링에 남지 않았는지
     - SSOT 상수 import 확인
     - ko/en 메시지 parity 확인

## 예상 리스크

- 현재 페이지에 보이지 않는 선택 행을 실행 payload에 유지해야 한다.
- 탭 전환 또는 새 preview 결과 로드 시 page index가 유효 범위 밖으로 남으면 안 된다.
- table semantics를 깨는 virtualization wrapper는 피한다. 이번 작업은 DOM windowing pagination으로 해결한다.
