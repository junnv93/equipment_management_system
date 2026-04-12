# 스프린트 계약: 캐시 키 구조적 스코프 인코딩 소급 적용

## 생성 시점
2026-04-12T14:00:00+09:00

## 배경
43차 세션에서 equipment 서비스에 구조적 캐시 키 패턴(buildCacheKey + SCOPE_AWARE_SUFFIXES + deleteByPrefix)을 도입.
checkouts 서비스가 동일한 43차 이전 anti-pattern을 그대로 유지 중:
- JSON.stringify(params) — 키 순서 비결정론적 → 동일 파라미터가 다른 캐시 키 생성
- deleteByPattern(regex) — JSON infix 정규식 매칭 → 의도치 않은 키 삭제/미삭제 위험
- teamId가 JSON 값 안에 매립 → 스코프별 정밀 무효화 불가

calibration 서비스는 문자열 `_` 연결 방식으로 파라미터가 많아질수록 불안정.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend exec tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 테스트 통과
- [ ] checkouts.service.ts: deleteByPattern 호출 0건 (deleteByPrefix로 전환)
- [ ] checkouts.service.ts: buildCacheKey가 scope-aware (teamId → 구조적 segment)
- [ ] checkouts.service.ts: JSON.stringify params → sorted keys 결정론적 직렬화
- [ ] calibration.service.ts: buildCacheKey 문자열 연결 → sorted params 직렬화
- [ ] 기존 캐시 동작(무효화 범위)이 변경 전과 동일

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] non-conformances/calibration-factors도 scope-aware 패턴 적용
- [ ] 캐시 키 패턴 불변식 문서화 (코드 주석)
- [ ] review-architecture Critical 이슈 0개

### 적용 verify 스킬
- verify-implementation (변경 영역 자동 선택)
- verify-hardcoding (캐시 키 문자열 리터럴 확인)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
