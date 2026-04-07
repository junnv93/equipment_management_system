# 스프린트 계약: 담당자(정/부) 이름 JOIN 누락 + Create/Edit 폼 필드 보완

## 생성 시점
2026-04-05T09:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] GET /api/test-software → items[].primaryManagerName에 실제 사용자 이름 반환 (null이 아닌 string)
- [ ] GET /api/test-software/:uuid → primaryManagerName, secondaryManagerName 포함
- [ ] 등록 폼(CreateTestSoftwareContent)에 담당자(정), 담당자(부), 설치일자, 사이트 입력 필드 존재
- [ ] 수정 폼(TestSoftwareDetailContent)에 동일 필드 존재
- [ ] i18n: en/ko software.json에 새 필드 라벨 키 추가
- [ ] verify-implementation 변경 영역 PASS

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture Critical 이슈 0개
- [ ] 기존 백엔드 테스트 통과 (`pnpm --filter backend run test`)

### 적용 verify 스킬
- verify-ssot (import 출처)
- verify-hardcoding (API 경로, 쿼리키)
- verify-frontend-state (TanStack Query 패턴)
- verify-i18n (en/ko 키 일치)
- verify-security (req.user 추출)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
