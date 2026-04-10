# Contract: audit-logs-cursor-virtualization

## MUST Criteria (루프 차단)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter backend run tsc --noEmit` PASS | CLI |
| M2 | `pnpm --filter frontend run tsc --noEmit` PASS | CLI |
| M3 | `pnpm --filter backend run build` PASS | CLI |
| M4 | `pnpm --filter frontend run build` PASS | CLI |
| M5 | `pnpm --filter backend run test` 기존 테스트 회귀 0 | CLI |
| M6 | 커서 엔드포인트: `GET /api/audit-logs?limit=30` → `{ items, nextCursor, hasMore, summary }` 응답 | curl/test |
| M7 | 커서 후속: `GET /api/audit-logs?cursor=<token>&limit=30` → `{ items, nextCursor, hasMore }` (summary 없음) | curl/test |
| M8 | offset 하위호환: `GET /api/audit-logs?page=1&limit=20` → 기존 `{ items, meta, summary }` 응답 유지 | curl/test |
| M9 | DB 마이그레이션: `(timestamp DESC, id DESC)` 복합 인덱스 존재 | psql |
| M10 | 프론트엔드: useInfiniteQuery 사용, offset 페이지네이션 버튼 제거 | code review |
| M11 | SSOT: `CursorPaginatedAuditLogsResponse` 타입이 `@equipment-management/schemas`에 정의 | code review |

## SHOULD Criteria (비차단, tech-debt 기록)

| # | Criterion |
|---|-----------|
| S1 | react-window 가상화 적용 (DOM 노드 수 제한) |
| S2 | 커서 모드 백엔드 unit test 추가 |
| S3 | SSR initialData가 useInfiniteQuery 형식으로 전달 |
| S4 | 필터 변경 시 infinite query 자동 리셋 확인 |
