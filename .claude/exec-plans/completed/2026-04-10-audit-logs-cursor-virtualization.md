# Execution Plan: audit-logs-cursor-virtualization

**Date**: 2026-04-10
**Mode**: 2 (Full Harness)
**Slug**: `audit-logs-cursor-virtualization`

## Goal

audit_logs 목록 API를 offset → cursor 기반 페이지네이션으로 전환하고,
프론트엔드를 useInfiniteQuery + react-window 가상화로 전환하여
deep-page 성능 문제를 구조적으로 해결한다.

## Architecture Decisions

1. **파티셔닝 Skip** — 개발 단계에서 premature optimization. cursor pagination만으로 O(1) seek 달성. tech-debt-tracker에 장기 과제로 유지.
2. **커서 설계** — `(timestamp DESC, id DESC)` 복합 키셋. base64 인코딩 opaque 토큰.
3. **하위 호환** — `page` 파라미터 → 기존 offset 모드, `cursor` 파라미터 → 새 커서 모드. 동일 엔드포인트.
4. **가상화** — 기존 `react-window` + `react-window-infinite-loader` 패턴 재사용 (VirtualizedEquipmentList.tsx 선례).
5. **Summary 분리** — 첫 페이지에서만 GROUP BY summary 포함, 후속 페이지는 items + nextCursor만.

## Phase 1: Shared Types (packages/schemas)

### File 1: `packages/schemas/src/audit-log.ts`
- `AuditLogFilter`에 `cursor?: string` 필드 추가
- `CursorPaginatedAuditLogsResponse` 인터페이스 신규:
  ```
  { items: AuditLog[], nextCursor: string | null, hasMore: boolean, summary?: Record<string, number> }
  ```

## Phase 2: Backend — Cursor Pagination

### File 2: `apps/backend/src/modules/audit/dto/audit-log-query.dto.ts`
- `auditLogQuerySchema`에 `cursor: z.string().optional()` 추가

### File 3: `apps/backend/src/modules/audit/audit.service.ts`
- 새 메서드 `findAllCursor(filter, cursor?, limit?)` 추가
  - 커서 디코딩: `JSON.parse(atob(cursor))` → `{ t: ISO timestamp, i: UUID }`
  - WHERE: 기존 필터 조건 AND `(timestamp, id) < (cursor.t, cursor.i)` (SQL row value comparison)
  - LIMIT: `limit + 1` (hasMore 감지)
  - Summary: cursor=null (첫 페이지)일 때만 GROUP BY 병렬 실행
  - 캐시: 기존 prefix 재사용, cursor 포함 키

### File 4: `apps/backend/src/modules/audit/audit.controller.ts`
- `findAll()` 메서드: query.cursor 존재 → `findAllCursor()`, page 존재 → 기존 `findAll()`
- API 문서 `cursor` 파라미터 추가

## Phase 3: Database Index

### File 5: `packages/db/src/schema/audit-logs.ts`
- 복합 인덱스 추가: `(timestamp DESC, id DESC)` — `audit_logs_timestamp_id_cursor_idx`

### File 6: Drizzle migration (자동 생성)
- `pnpm --filter backend run db:generate` → `db:migrate`

## Phase 4: Frontend — API Client + Filter Utils

### File 7: `apps/frontend/lib/api/audit-api.ts`
- `getAuditLogsCursor(filter)` 함수 추가 — cursor 응답 타입 반환
- 기존 `getAuditLogs` 유지 (하위 호환)

### File 8: `apps/frontend/lib/api/audit-api-server.ts`
- `getAuditLogsListCursor(query)` 함수 추가 — SSR 첫 페이지용

### File 9: `apps/frontend/lib/utils/audit-log-filter-utils.ts`
- `convertFiltersToApiParamsCursor(filters)` 함수 추가 — page/limit 제외, cursor 모드용

### File 10: `apps/frontend/lib/api/query-config.ts`
- `queryKeys.auditLogs.infiniteList(filters)` 추가

## Phase 5: Frontend — Infinite Scroll + Virtualization

### File 11: `apps/frontend/app/(dashboard)/admin/audit-logs/AuditLogsContent.tsx`
- `useQuery` → `useInfiniteQuery` 전환
- 페이지네이션 UI (prev/next 버튼) → 제거
- hasNextPage/fetchNextPage를 AuditTimelineFeed에 전달
- summary: 첫 페이지에서 추출

### File 12: `apps/frontend/components/audit-logs/AuditTimelineFeed.tsx`
- react-window `VariableSizeList` + react-window-infinite-loader 통합
- flat items 배열로 변환 (date header sentinel + log entry)
- loadMoreRows → fetchNextPage 연결

### File 13: `apps/frontend/app/(dashboard)/admin/audit-logs/page.tsx`
- SSR 첫 페이지를 cursor 모드로 fetch
- initialData를 useInfiniteQuery 형식으로 변환: `{ pages: [firstPage], pageParams: [undefined] }`

## Verification

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter backend run build
pnpm --filter frontend run build
```
