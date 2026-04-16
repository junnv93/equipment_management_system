# Contract: tech-debt-s2s4

## Scope
tech-debt-tracker S2~S4 항목 해결: lint 에러 제거, beforeAll/afterAll 축소

## MUST Criteria — 전체 PASS

1. **S2-LINT**: ✅ PASS — 미사용 변수 4개 + MulterFile import 제거, lint exit 0
2. **S3-BEFOREALL**: ✅ PASS — 26줄→9줄 (≤15 충족)
3. **S4-AFTERALL**: ✅ PASS — 27줄→3줄 (≤10 충족)
4. **TSC**: ✅ PASS — `pnpm tsc --noEmit` exit 0
5. **TEST-UNIT**: ✅ PASS — 3/3 통과
6. **EXISTING-BEHAVIOR**: ✅ PASS — E2E 실행 검증 완료, 기존 통과 테스트 전부 유지
7. **SSOT**: ✅ PASS — ResourceTracker가 API_ENDPOINTS에서 경로 도출, 하드코딩 제거

## SHOULD Criteria

1. ✅ ResourceTracker 확장이 기존 스펙(checkouts, cables 등)에 영향 없음 확인
2. ✅ beforeAll/afterAll 가독성 유지
3. ✅ jest-e2e.json에 shared-constants moduleNameMapper 추가
