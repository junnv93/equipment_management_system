# 스프린트 계약: 소프트웨어 도메인 재설계 (잔여 작업)

## 생성 시점
2026-04-04T15:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [x] `pnpm --filter backend run tsc --noEmit` 에러 0
- [x] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [x] `pnpm --filter backend run build` 성공
- [x] `pnpm --filter frontend run build` 성공
- [x] `pnpm --filter backend run test` 기존 테스트 통과
- [x] equipment 테이블에서 softwareName, softwareType, softwareVersion 컬럼 제거 확인
- [x] equipment_test_software 중간 테이블 존재 (equipmentId + testSoftwareId FK, unique constraint)
- [x] test_software → softwareValidations 역방향 relation 정의됨
- [x] /software 라우트가 FRONTEND_ROUTES에 등록됨
- [x] /software 항목이 nav-config.ts 사이드바에 등록됨 (Permission.VIEW_TEST_SOFTWARE)
- [x] grep softwareName/softwareType/softwareVersion — 스키마/DTO/컴포넌트에서 0건 (test-software 관련 제외)
- [x] /software/create 페이지 존재

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개 (DEFERRED → PR 리뷰)
- [ ] verify-ssot PASS (DEFERRED → PR 리뷰)
- [ ] verify-hardcoding PASS (DEFERRED → PR 리뷰)
- [x] i18n 키 정리 완료 (equipment.json에서 softwareName/Type 관련 키 제거)

### 적용 verify 스킬
- verify-ssot, verify-hardcoding, verify-frontend-state, verify-nextjs, verify-security

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
