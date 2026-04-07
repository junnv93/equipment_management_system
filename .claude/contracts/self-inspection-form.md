# 스프린트 계약: 자체점검 생성 폼 구현

## 생성 시점
2026-04-06T14:00:00+09:00

## 성공 기준

### 필수 (MUST)
- [ ] `pnpm tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run build` 성공
- [ ] 비교정 장비 상세 → 점검 탭에서 "점검 기록 작성" 버튼이 표시됨
- [ ] 버튼 클릭 → 자체점검 폼 다이얼로그가 열림
- [ ] 폼 필드: 점검일, 점검 항목(유연 추가/삭제), 종합결과(pass/fail), 비고
- [ ] 제출 시 `createSelfInspection` API 호출
- [ ] 생성 후 캐시 무효화: selfInspections + equipment.detail
- [ ] i18n: 폼 관련 키가 ko/en 양쪽에 존재
- [ ] E2E: 비교정 장비 점검 탭에서 생성 버튼 visible

### 권장 (SHOULD)
- [ ] VERSION_CONFLICT 에러 처리
- [ ] 기존 SelfInspectionTab의 읽기 전용 테이블 구조 유지

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 3회 반복 초과 → 수동 개입
