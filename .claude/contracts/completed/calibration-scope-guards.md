# 스프린트 계약: Calibration 리소스 스코프 가드 보강

## 생성 시점
2026-05-03T17:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run type-check` 에러 0
- [ ] `pnpm --filter backend run test -- calibration-factors.controller` 성공
- [ ] `pnpm --filter backend run test -- calibration.service` 성공
- [ ] `calibration-factors.controller.ts`의 create/findByEquipment/findOne/approve/reject/remove 경로가 `enforceSiteAccess` 또는 동일한 post-fetch 스코프 검증을 통과한다.
- [ ] `calibration.controller.ts`의 create/findOne/findByEquipment/중간점검/예정/담당자/요약 조회 경로가 `@SiteScoped`+`CurrentEnforcedScope` 또는 post-fetch `enforceSiteAccess`를 통과한다.
- [ ] 클라이언트는 보정계수 생성 요청 body에 `requestedBy`를 포함하지 않는다.
- [ ] `registeredBy`, `calibrationManagerId`, `requestedBy`, `approvedBy` 계열 행위자 필드는 계속 서버 인증 컨텍스트에서 추출한다.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] 변경 파일 수는 보안 스코프 보강에 필요한 controller/service/spec/frontend 호출부로 제한한다.
- [ ] 컬렉션 조회의 클라이언트 제공 `site`/`teamId`는 enforced scope 밖으로 확장되지 않는다.

### 적용 verify 스킬
- verify-auth
- review-architecture
- verify-frontend-state (프론트 호출부 변경 확인)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제로 수동 개입 요청
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음
