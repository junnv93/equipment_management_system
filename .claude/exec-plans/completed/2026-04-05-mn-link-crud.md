# M:N 장비↔시험용SW 링크 CRUD 구현 계획

## 메타
- 생성: 2026-04-05
- 모드: Mode 2
- 예상 변경: ~10개 파일 (신규 1, 수정 ~9)

## Phase 1: 백엔드 DTO
- (신규) `dto/link-equipment.dto.ts` — Zod schema, Pipe, type export

## Phase 2: 백엔드 서비스
- (수정) `test-software.service.ts` — linkEquipment, unlinkEquipment, findLinkedEquipment, invalidateLinkCaches

## Phase 3: 백엔드 컨트롤러
- (수정) `test-software.controller.ts` — POST/DELETE/GET 엔드포인트 3개

## Phase 4: 공유 상수
- (수정) `api-endpoints.ts` — LINKED_EQUIPMENT, LINK_EQUIPMENT, UNLINK_EQUIPMENT

## Phase 5: 프론트엔드 API + queryKeys
- (수정) `software-api.ts` — linkEquipment, unlinkEquipment, listLinkedEquipment
- (수정) `query-config.ts` — linkedEquipment key

## Phase 6: 프론트엔드 UI
- (수정) `SoftwareTab.tsx` — 소프트웨어 연결/해제 버튼 + 다이얼로그
- (수정) `TestSoftwareDetailContent.tsx` — "연결된 장비" 섹션

## Phase 7: i18n
- (수정) en/ko equipment.json, software.json — 링크/언링크 라벨

## 검증
1. `pnpm tsc --noEmit` error 0
2. `pnpm --filter backend run build` 성공
3. `pnpm --filter frontend run build` 성공
4. `pnpm --filter backend run test` 전체 통과
