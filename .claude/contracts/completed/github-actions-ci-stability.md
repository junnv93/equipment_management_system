# 스프린트 계약: GitHub Actions CI Stability

## 생성 시점
2026-05-03T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `shellcheck --severity=warning infra/scripts/*.sh infra/healthchecks/*.sh` 성공
- [ ] `INTERNAL_BACKEND_URL=http://localhost:3001 NEXTAUTH_URL=http://localhost:3000 NEXTAUTH_SECRET=ci-contract-secret DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder pnpm build` 성공 또는 CI와 동일한 frontend build env 전달 실패가 재발하지 않음을 검증
- [ ] `lhci autorun` 설정 검증에서 Lighthouse formFactor/screenEmulation 충돌 없음
- [ ] `.github/workflows/stale-branches.yml`의 action ref가 upstream에서 resolve 가능한 ref
- [ ] GitHub Actions 최신 실행에서 `CI/CD Pipeline`, `Performance Audit (Lighthouse CI)`, `CodeQL Security Analysis`, `Stale Branch Cleanup`이 성공

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] CI 환경 변수는 워크플로우별 ad hoc 우회가 아니라 Turbo task env SSOT로 선언
- [ ] Lighthouse audit 대상이 desktop/mobile 중 하나로 명확히 고정되어 성능 비교가 안정적
- [ ] stale branch cleanup은 삭제 권한을 가진 action을 검증 가능한 버전으로 고정

### 적용 verify 스킬
워크플로우/CI 설정 변경이므로 harness evaluator가 shellcheck, build, GitHub Actions 재실행 결과를 직접 대조한다.

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
