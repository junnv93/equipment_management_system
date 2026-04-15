# Evaluation — docker-infra-standards

- **Iteration**: 1
- **Verdict**: PASS
- **Date**: 2026-04-15
- **Evaluator**: feature-dev:code-reviewer (sonnet, 정적 분석) + 메인 컨텍스트 (runtime 실측)

## MUST Results

| ID | 기준 | Verdict | 증거 |
|----|------|---------|------|
| M1 | compose config 3-env 통과 | **PASS** | dev_OK / lan_OK / prod_OK (실측, exit 0) |
| M2 | `pnpm dev` regression 없음 | **PASS** | `equipment-management-system-{postgres,redis,rustfs}-1` 3개 healthy (`docker compose ps` 실측) |
| M3 | Bats 전 항목 PASS | **PASS** | 14/14 ok (redis 빈응답 케이스 mock 수정 후 재실행) |
| M4 | Shellcheck zero warning | **PASS** | `infra/healthchecks/*.sh` · `infra/scripts/*.sh` 모두 exit 0 |
| M5 | Hadolint 새 error 0 | **PASS** | `.hadolint.yaml` config 적용 후 backend/frontend Dockerfile 둘 다 exit 0. DL3018(apk pin)은 ignored 등록 |
| M6 | dclint critical 0건 | **PASS** | `name:` 필드 추가 후 3 compose 파일 warning 0, error 0 |
| M7 | TypeScript 회귀 없음 | **PASS** | backend/frontend `type-check` 모두 exit 0 |
| M8 | Secret 평문 유출 없음 | **PASS** | 소스/인프라 스캔 시 실제 값 0건, fixture만 존재 (contract 제외 조건 적용) |
| M9 | ADR 파일 존재 + 템플릿 준수 | **PASS** | 0001~0005 + template.md + README.md 존재. 0004/0005 Status=Proposed, Context/Decision/Consequences 구조 확인 |
| M10 | Predev guard non-destructive 기본 | **PASS** | 기본 실행 시 `[predev-guard] OK` 만 출력, 볼륨 삭제 없음. `--confirm` 플래그 또는 `PREDEV_GUARD_CONFIRM=1` 시에만 파괴 |
| M11 | base/override 구조 통합 | **PASS** | `infra/compose/{base,dev.override,lan.override,prod.override}.yml` 4파일 존재. 최상위 3 compose는 `include:` shim만 (실제 service 정의 제로) |
| M12 | 기존 ADR 참조 잔존 없음 | **PASS** | `git grep "adr/00[1-3]-(mono\|drizzle\|nestjs)"` → 0건 |

## SHOULD Results

| ID | 기준 | Verdict | 비고 |
|----|------|---------|------|
| S1 | CI quality-gate에 bats/shellcheck/hadolint/dclint 추가 | **FAIL** | `.github/workflows/main.yml` 미수정. **Contract에서 Phase D 이연 명시 허용** → tech-debt-tracker.md 이관 |
| S2 | Predev guard compose hash 동작 재검증 | **PASS** | `.cache/predev-guard/compose-config.hash` 갱신 확인 |
| S3 | Rustfs bats 테스트 curl 없이 mock 동작 | **PASS** | `helpers/mocks.bash`의 `install_curl_mock` 이 `${PATH}` 앞에 stub 주입 — 실제 curl 바이너리 불요 |

## Contract 요구 세부 확인

- [x] ADR-0004 파일 존재 + Status=Proposed + Context/Decision/Consequences 섹션
- [x] ADR-0005 파일 존재 + Status=Proposed + sops/age vs Vault 2안 비교
- [x] `docs/adr/template.md` Michael Nygard 템플릿 (Title/Status/Context/Decision/Consequences/References)
- [x] `docs/adr/README.md` 0001~0005 목록 반영
- [x] 기존 001~003 → 0001~0003 rename (git mv 사용, history 보존)
- [x] compose hash 재계산 동작 (이번 세션에 name 필드 추가로 hash 변경 → 재생성 필요 경고 정상)
- [x] 사용자 결정 반영: 컨테이너 이름 변경 허용 (`equipment_management_system` → `equipment-management-system`)
- [x] 사용자 결정 반영: predev guard dry-run default + `pnpm predev:reset` script 신설

## Repair Instructions

없음 (모든 MUST PASS, SHOULD S1만 계약상 이연 허용 항목).

## Delta from Previous Iteration

첫 iteration — N/A.

## 판정 요약

- **12/12 MUST PASS.** base/override SSOT 분리 + bats/shellcheck/hadolint/dclint 4종 린터 통과 + ADR 인프라 구축 + predev guard 안전장치 전환 모두 완료.
- **SHOULD S1만 FAIL**, 계약상 허용 이연 (Phase D 후속 세션).
- 사용자 결정 4건 모두 반영: ADR 001~003 rename, container name 변경 허용, predev guard dry-run default, secret 전략 Proposed 유지.
- 런타임 regression 없음 (`pnpm dev` 3 컨테이너 Healthy, tsc 회귀 0).

**Verdict: PASS** — Step 7 (final report) 진행.
