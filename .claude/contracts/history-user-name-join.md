# Contract: history-user-name-join

## Summary
장비 이력 API (위치변동/유지보수/사고이력)에서 users 테이블 JOIN하여 사용자 이름 반환

## MUST Criteria
- [ ] `getLocationHistory` — users LEFT JOIN, `changedByName` 필드 반환
- [ ] `getMaintenanceHistory` — users LEFT JOIN, `performedByName` 필드 반환
- [ ] `getIncidentHistory` — users LEFT JOIN, `reportedByName` 필드 반환
- [ ] `tsc --noEmit` 통과 (backend)
- [ ] `backend test` 통과
- [ ] 기존 응답 필드 변경 없음 (하위 호환)

## SHOULD Criteria
- [ ] `getCheckoutHistory`의 기존 JOIN 패턴과 일관성 유지
- [ ] 불필요한 SELECT * 대신 명시적 컬럼 선택
