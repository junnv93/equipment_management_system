# 스프린트 계약: 점검 기능 장비 중심 재배치

## 생성 시점
2026-04-06T12:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm tsc --noEmit` 에러 0 (기존 에러 제외)
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter frontend run build` 성공
- [ ] verify-ssot: 중간점검 API 관련 import가 SSOT 패턴 준수 (API_ENDPOINTS 상수 사용)
- [ ] verify-auth: EquipmentIntermediateInspectionsController에 @RequirePermissions 적용
- [ ] verify-hardcoding: 새 API 경로가 하드코딩되지 않음 (API_ENDPOINTS 사용)
- [ ] verify-frontend-state: 중간점검 목록이 TanStack Query 사용, useState로 서버 데이터 관리하지 않음
- [ ] verify-i18n: 새로 추가된 i18n 키가 ko/en 양쪽에 존재

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-architecture: Critical 이슈 0개
- [ ] verify-zod: 새 엔드포인트에 ZodValidationPipe 적용
- [ ] CalibrationContent에서 제거된 import가 깔끔하게 정리됨

### 적용 verify 스킬
- verify-ssot (패키지 import 검증)
- verify-auth (서버사이드 인증 검증)
- verify-hardcoding (하드코딩 검출)
- verify-frontend-state (프론트엔드 상태 관리)
- verify-i18n (다국어 키 일관성)
- verify-zod (Zod 검증 파이프)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
