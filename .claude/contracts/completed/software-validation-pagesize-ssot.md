# 스프린트 계약: Software Validation optimistic pageSize SSOT

## 생성 시점
2026-05-03T11:15:42+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `SoftwareValidationContent.tsx`의 optimistic pagination fallback에서 `pageSize: 20` 매직넘버 2건이 제거되어야 한다.
- [ ] fallback pagination은 repository의 canonical pagination SSOT인 `DEFAULT_PAGE_SIZE`를 사용해야 한다.
- [ ] 변경은 software validation 화면의 optimistic fallback 범위로 제한하고, query key/API/상태 전이 로직을 변경하지 않아야 한다.
- [ ] `pnpm --filter frontend type-check` 성공.
- [ ] focused grep 검증에서 `SoftwareValidationContent.tsx` 내 `pageSize: 20`이 0건이어야 한다.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] 관련 tracker open item `software-validation-optimistic-pagesize-hardcoding`이 완료 기록으로 이동되어야 한다.
- [ ] 신규 하드코딩이나 도메인별 로컬 상수를 추가하지 않아야 한다.

### 적용 verify 스킬
- verify-hardcoding
- verify-ssot
- verify-implementation

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
