# 스프린트 계약: NextAuth CSRF On-prem/Prod Routing Verification

## 생성 시점
2026-05-04T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `bash scripts/verify-routing-origin.sh` 성공
- [ ] `pnpm --filter @equipment-management/shared-constants run test -- api-routing` 성공
- [ ] `infra/nginx/lan.conf`가 `/api/auth/csrf`를 frontend로 라우팅하고 backend auth 경로와 disjoint
- [ ] `infra/nginx/nginx.conf.template`가 onprem과 동일한 NextAuth handler 분기를 유지
- [ ] On-prem compose 실행 환경에서 `GET /api/auth/csrf`가 200 JSON 응답을 반환하거나, 현재 머신에서 실행 불가한 사유가 명확히 기록됨

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] `pnpm compose:onprem` 운영 명령과 문서/후속 작업에 적힌 명령이 불일치하지 않음
- [ ] 동일 증상 재발 시 수집할 Phase 0 network trace 절차가 운영 문서에 남아 있음

### 적용 verify 스킬
- `verify-routing-origin` 상당의 `scripts/verify-routing-origin.sh`
- Shared constants routing invariant unit test

## 종료 조건
- 필수 기준 전체 PASS → 성공
- On-prem/prod 실제 Docker 배포가 현재 머신 권한/secret/호스트 볼륨 제약으로 불가하면 해당 항목은 BLOCKED로 기록하고, 정적 라우팅 검증과 운영 실행 명령의 정확성을 별도 판정한다.
