# 스프린트 계약: 교정 등록 SSOT 재정비 (Phase 0)

## 생성 시점
2026-04-20T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter frontend tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run lint` 에러 0
- [ ] 기존 프론트엔드 컴포넌트(`CalibrationRegisterDialog`, `CalibrationRegisterContent`, `CalibrationHistoryTab`)의 컴파일 오류 없음 — Phase 0은 non-breaking
- [ ] `apps/frontend/lib/schemas/calibration-form-schema.ts` 에 `createCalibrationFormSchema` factory 함수 export 존재
- [ ] `apps/frontend/lib/errors/calibration-errors.ts` 에 `CalibrationErrorCode` enum 정의 + 에러 코드 7개 이상 포함
- [ ] `queryKeys.documents.byCalibration` 이 `query-config.ts`의 `documents` 섹션에 존재
- [ ] `CalibrationCacheInvalidation.invalidateAfterCreate`가 `queryKeys.calibrations.all`, `queryKeys.approvals.countsAll`, `queryKeys.notifications.all` 포함
- [ ] SSOT 준수: `z.instanceof(File)` 는 packages/schemas가 아닌 frontend 전용 파일에서만 사용

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] `createCalibrationFormSchema`에 날짜 유효성 `.superRefine` 검증 포함 (next > calibration)
- [ ] `CalibrationErrorCode` 에 i18n 메시지 매핑 헬퍼 함수 포함
- [ ] verify-ssot PASS (SSOT 위반 없음)

### 적용 verify 스킬
- `verify-ssot` — packages/schemas 재정의 없음 확인
- `verify-hardcoding` — 에러 코드 하드코딩 없음
- `verify-implementation` — 변경 파일 기반 전반 점검

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
