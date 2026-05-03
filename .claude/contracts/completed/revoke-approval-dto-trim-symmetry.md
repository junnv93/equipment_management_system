# 스프린트 계약: revoke-approval DTO trim symmetry spec

## 생성 시점
2026-05-03T10:43:44+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter backend run type-check` 에러 0
- [ ] `pnpm --filter backend run lint:ci` 에러 0
- [ ] `revoke-approval.dto.spec.ts` 단위 테스트 통과
- [ ] `revokeApprovalSchema`가 `VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH`를 기준으로 trim 후 reject/accept 양방향을 검증한다
- [ ] `revokeApprovalSchema`가 `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` max boundary를 검증한다
- [ ] `versionedSchema`의 version 필수/positive boundary를 회귀 테스트한다
- [ ] DTO는 approverId를 노출하지 않고 Zod strip 동작을 검증한다
- [ ] 기존 `revoke-approval.dto.ts` 검증 정책을 완화하지 않는다

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] `tech-debt-tracker.md`의 `revoke-approval-dto-spec-trim-symmetry` 항목을 완료 이력으로 정리한다
- [ ] 기존 dirty files outside scope를 변경하지 않는다

### 적용 verify 스킬
- verify-zod: trim/min/max boundary coverage
- verify-implementation: focused backend DTO spec

## 종료 조건
- 필수 기준 전체 PASS → 성공
- SHOULD 실패는 종료 조건에 영향 없음
