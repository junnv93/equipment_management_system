# 스프린트 계약: E2E 63건 테스트 실패 수정 (v2 — 감사 보정)

## 생성 시점
2026-04-16T12:30:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter backend run build` 성공
- [ ] `pnpm --filter backend run test` 기존 단위 테스트 통과
- [ ] `pnpm --filter backend run test:e2e` 실패 건수 63건 → 0건
- [ ] calibration-filter: `calibrationDue: -1` 테스트 PASS
- [ ] repair-history: 삭제된 필드(repairedBy/cost/repairCompany) 단언 제거 후 PASS
- [ ] shared-equipment: POST /equipment/shared 라우트 구현 + 테스트 PASS
- [ ] calibration-factors: approve/reject/delete에 version 포함 → PASS
- [ ] non-conformances: version 포함, closedBy body 제거 → PASS
- [ ] calibration-plans: manager 역할 사용 → PASS
- [ ] equipment-approval: version body 포함 → PASS
- [ ] cables: measurementDate YYYY-MM-DD → PASS
- [ ] equipment-history: response.body.items 사용 → PASS
- [ ] audit-logs: 응답 구조 맞춤 → PASS
- [ ] equipment-filters: 기대값 수정 → PASS
- [ ] users: 올바른 권한 역할 → PASS

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록
- [ ] review-architecture Critical 이슈 0개
- [ ] 모든 22개 E2E 스펙 파일 PASS (일부 skip은 허용)
- [ ] SSOT 위반 0건 (로컬 재정의 없음)
- [ ] 하드코딩 없음 (API 경로, 쿼리키 등)

### 적용 verify 스킬
- verify-cas: versionedSchema 사용 패턴 검증
- verify-zod: Zod 스키마 변경 일관성 검증
- verify-ssot: packages/schemas, packages/db 변경 시 SSOT 준수
- verify-security: Rule 2 (Server-Side User Extraction) 위반 없음
- verify-e2e: E2E 테스트 패턴 준수
- verify-implementation: 전체 구현 검증

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
