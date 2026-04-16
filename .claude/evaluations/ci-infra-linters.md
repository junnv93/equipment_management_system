# Evaluation: CI Infra Linters (Phase D)

## Iteration: 1

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | shellcheck 스텝이 quality-gate에 존재하고 `infra/scripts/*.sh` + `infra/healthchecks/*.sh`를 검사 | PASS | Line 137-141: `shellcheck --severity=warning infra/scripts/*.sh infra/healthchecks/*.sh` — 두 경로 모두 포함 |
| M2 | hadolint 스텝이 quality-gate에 존재하고 `apps/backend/docker/Dockerfile` + `apps/frontend/Dockerfile`을 검사 | PASS | Line 143-148: 두 Dockerfile 모두 `hadolint` 명령으로 순차 검사 |
| M3 | dclint 스텝이 quality-gate에 존재하고 `docker-compose.yml` + `infra/compose/*.yml`을 검사 | PASS | Line 149-150: `npx --yes dclint docker-compose.yml infra/compose/ -r` — 루트 compose + infra/compose 디렉토리 재귀 검사 |
| M4 | bats 스텝이 quality-gate에 존재하고 `infra/healthchecks/tests/` 테스트를 실행 | PASS | Line 152-153: `npx --yes bats infra/healthchecks/tests/` |
| M5 | 기존 quality-gate 스텝(lint, tsc, security:check, drizzle drift)이 변경 없이 유지 | PASS | Line 98-126: Lint Backend/Frontend, TypeScript Backend/Frontend, Security Endpoint Annotation Check, Drizzle Schema Drift Check — 모두 존재하고 순서 유지 |
| M6 | 새 스텝들이 Node.js setup/cache 이후에 위치 (기존 스텝 순서 보존) | PASS | Node.js setup은 Line 56-59, 인프라 린터 설치는 Line 129 — 기존 스텝(Lint, TSC, Security, Drizzle) 이후에 추가됨 |
| M7 | GitHub Actions 문법 유효 (yaml 파싱 오류 없음) | PASS | `python3 -c "import yaml; yaml.safe_load(...)"` 결과 유효 |
| M8 | hadolint이 `.hadolint.yaml` 설정 파일을 자동 참조 | PASS | `.hadolint.yaml` 파일이 저장소 루트에 존재하고, `hadolint` 실행 시 `--config` 플래그 없이 호출 — hadolint는 CWD에서 `.hadolint.yaml`을 자동 탐색하므로 자동 참조됨. 주석도 `# .hadolint.yaml 설정 자동 참조`로 명시 |

## SHOULD Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| S1 | SOPS_AGE_KEY secret이 필요한 스텝에서 참조 가능하도록 구성 | PASS | Line 155-166: `SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}`로 env 주입, `if: env.SOPS_AGE_KEY != ''` 조건부 실행으로 secret 미설정 시 스킵 |
| S2 | 인프라 린터 스텝에 한국어 주석으로 목적 설명 | FAIL | ShellCheck 스텝(Line 137)은 step name에 `(셸 스크립트 정적 분석)` 한국어가 포함되어 있으나 별도 `#` 주석 없음. dclint 스텝(Line 149), bats 스텝(Line 152)에 한국어 주석 전혀 없음. hadolint만 `# .hadolint.yaml 설정 자동 참조` 주석 존재. SOPS 스텝만 2줄 한국어 주석 포함. 계약 기준인 "각 린터가 목적을 설명하는 한국어 주석"이 모든 스텝에 충족되지 않음 |
| S3 | 각 린터가 변경된 파일에만 실행되지 않고 전체 대상 검사 (CI는 전수 검사) | PASS | `git diff`, `changed files`, path filter 등 변경 파일 한정 로직 없음. 모든 린터가 고정 경로 전체를 검사 |

## Overall Verdict: PASS

## Issues (if any)

- **S2 부분 미충족**: dclint 스텝과 bats 스텝에 한국어 주석이 없음. ShellCheck은 step name에 한국어가 있으나 독립 주석 라인(`#`)은 없음. SHOULD 기준이므로 Overall Verdict에는 영향 없으나 미흡.

## Repair Instructions (if FAIL)

해당 없음 (PASS). S2 개선 권장 사항:

```yaml
- name: Infra — dclint (Docker Compose 린트)
  # docker-compose.yml 및 infra/compose/*.yml 전체 구성 파일 검사
  run: npx --yes dclint docker-compose.yml infra/compose/ -r

- name: Infra — Bats (healthcheck 단위 테스트)
  # infra/healthchecks/tests/ 내 .bats 파일 전체 실행 — healthcheck 스크립트 동작 검증
  run: npx --yes bats infra/healthchecks/tests/
```
