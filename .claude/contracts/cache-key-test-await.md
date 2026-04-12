# 스프린트 계약: scope-aware-cache-key 단위 테스트 + onVersionConflict await 통일

## 생성 시점
2026-04-12T15:30:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm exec tsc --noEmit --project apps/backend/tsconfig.json` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 + 신규 테스트 전체 통과
- [ ] scope-aware-cache-key.spec.ts 존재 + 7개 이상 테스트 케이스
- [ ] equipment-imports.service.ts onVersionConflict에 await 추가
- [ ] disposal.service.ts onVersionConflict에 await 추가
- [ ] calibration.service.ts invalidateCalibrationCache 정밀 scope 무효화 (`:t:<teamId>:` 단위)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] 테스트가 edge case 포함 (빈 params, 특수문자 suffix 등)

### 적용 verify 스킬
- verify-implementation

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제
- 3회 반복 초과 → 수동 개입 요청
