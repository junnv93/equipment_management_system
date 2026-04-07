# Contract: M:N 장비↔시험용SW 링크 CRUD

## Slug: mn-link-crud
## Mode: 2
## Date: 2026-04-05

## MUST Criteria

| # | Criterion |
|---|-----------|
| M1 | `pnpm tsc --noEmit` error 0 |
| M2 | `pnpm --filter backend run build` 성공 |
| M3 | `pnpm --filter frontend run build` 성공 |
| M4 | `pnpm --filter backend run test` 전체 통과 |
| M5 | POST /api/test-software/:id/equipment로 장비 연결 가능 |
| M6 | DELETE /api/test-software/:id/equipment/:equipmentId로 연결 해제 가능 |
| M7 | GET /api/test-software/:id/equipment로 연결된 장비 목록 조회 가능 |
| M8 | 중복 연결 시 409 Conflict 반환 (500 아님) |
| M9 | 미존재 연결 해제 시 404 반환 |
| M10 | 백엔드 캐시 무효화: by-equipment + linked-equipment 양방향 |
| M11 | @RequirePermissions 3개 엔드포인트 모두 적용 |
| M12 | ParseUUIDPipe 모든 UUID 파라미터에 적용 |
| M13 | API_ENDPOINTS SSOT — 프론트엔드 하드코딩 없음 |
| M14 | queryKeys.testSoftware.linkedEquipment(id) 등록 |
| M15 | SoftwareTab.tsx에 연결/해제 UI 존재 |
| M16 | TestSoftwareDetailContent.tsx에 연결된 장비 섹션 존재 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | @AuditLog 데코레이터 link/unlink에 적용 |
| S2 | Toast 피드백 (성공/에러) |
| S3 | 해제 전 확인 다이얼로그 |
| S4 | i18n en/ko 키 완전 |
| S5 | 프론트엔드 mutation onSettled에서 양방향 캐시 무효화 |
