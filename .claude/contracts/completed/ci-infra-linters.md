# Contract: CI Infra Linters (Phase D)

## Slug: ci-infra-linters

## Scope

`.github/workflows/main.yml` quality-gate job에 인프라 린터 4종 + SOPS_AGE_KEY CI 통합.

## MUST Criteria

- [ ] **M1**: shellcheck 스텝이 quality-gate에 존재하고 `infra/scripts/*.sh` + `infra/healthchecks/*.sh`를 검사
- [ ] **M2**: hadolint 스텝이 quality-gate에 존재하고 `apps/backend/docker/Dockerfile` + `apps/frontend/Dockerfile`을 검사
- [ ] **M3**: dclint 스텝이 quality-gate에 존재하고 `docker-compose.yml` + `infra/compose/*.yml`을 검사
- [ ] **M4**: bats 스텝이 quality-gate에 존재하고 `infra/healthchecks/tests/` 테스트를 실행
- [ ] **M5**: 기존 quality-gate 스텝(lint, tsc, security:check, drizzle drift)이 변경 없이 유지
- [ ] **M6**: 새 스텝들이 Node.js setup/cache 이후에 위치 (기존 스텝 순서 보존)
- [ ] **M7**: GitHub Actions 문법 유효 (yaml 파싱 오류 없음)
- [ ] **M8**: hadolint이 `.hadolint.yaml` 설정 파일을 자동 참조

## SHOULD Criteria

- [ ] **S1**: SOPS_AGE_KEY secret이 필요한 스텝에서 참조 가능하도록 구성
- [ ] **S2**: 인프라 린터 스텝에 한국어 주석으로 목적 설명
- [ ] **S3**: 각 린터가 변경된 파일에만 실행되지 않고 전체 대상 검사 (CI는 전수 검사)
