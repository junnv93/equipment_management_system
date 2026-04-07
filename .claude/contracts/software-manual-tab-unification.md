# 스프린트 계약: 장비 상세 "소프트웨어/매뉴얼" 탭 통합 재설계

## 생성 시점
2026-04-04T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] GET /api/test-software/by-equipment/{equipmentId} → 연결된 SW 목록 JSON 반환
- [ ] SoftwareTab에 3개 섹션 존재: 펌웨어 정보 / 매뉴얼 / 관련 시험용 소프트웨어
- [ ] BasicInfoTab에서 매뉴얼 파일 섹션(280-319행 영역) + 펌웨어/매뉴얼 카드(321-345행 영역) 제거됨
- [ ] i18n ko/en 키 누락 없음 (softwareTab.* 신규 키 전부 등록)
- [ ] SSOT 준수: API_ENDPOINTS, FRONTEND_ROUTES, queryKeys에서 import (하드코딩 금지)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] 관련 시험용 SW 행 클릭 → FRONTEND_ROUTES.SOFTWARE.DETAIL(id)로 네비게이션
- [ ] 세 섹션 모두 비어있을 때 통합 empty state 표시
- [ ] 매뉴얼 파일 다운로드 동작 (documentApi 사용)

### 적용 verify 스킬
- verify-ssot (SSOT import 검증)
- verify-hardcoding (하드코딩 검출)
- verify-i18n (i18n 키 일관성)
- verify-frontend-state (TanStack Query 사용)
- verify-auth (서버사이드 권한 검증)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
