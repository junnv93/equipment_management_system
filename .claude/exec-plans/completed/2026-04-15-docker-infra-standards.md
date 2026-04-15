# Docker Infra Standards — Senior-Grade Blueprint (20-Phase)

## 프로젝트 맥락 (Planner 조사 요약)

- 1인 solo trunk-based 개발(main 직접 커밋, pre-push hook이 CI gate)
- LAN 단일 VM 배포(`infra/docker-compose.lan.yml`), `infra/docker-compose.prod.yml`은 대기 상태(workflow_dispatch)
- 프로덕션 사용자 아직 없음, K8s 전환 트리거 시그널 없음
- 기존 CI: `main.yml` 9-job (quality-gate → unit-test/build/dep-audit 병렬 → docker-build/trivy-scan/deploy)
- 기존 ADR: 001~003 (이번 세션에서 0001~0003으로 rename)
- 실제 배포 히스토리: Drizzle baseline squash (2026-04-07), Solo trunk 전환 (2026-04-08)

## 재그룹 Tier 구조 (원 20항목을 의존성 기반 재정렬)

### Tier 1 — Foundation (compose SSOT + shell 품질)
| Phase | 목표 | Size |
|---|---|---|
| A | Compose base/override 분리 (SSOT) | M |
| B | Healthcheck bats 단위 테스트 + shellcheck + dclint + hadolint | M |
| F | Predev guard confirmation 플래그 (default dry-run) | S |
| M | 리소스·로깅·stop_grace_period 일관성 | S |

### Tier 2 — Security & Supply Chain
| Phase | 목표 | Size |
|---|---|---|
| C | Secret 관리 sops/age (ADR-0005 승격 후) | M |
| G | 컨테이너 보안 하드닝 (read_only, cap_drop, no-new-privileges, init, non-root) | M |
| E | Rustfs 커스텀 이미지 (bind mount 제거, multi-arch, semver 태그) | L |
| J | 공급망 보안 (Trivy gate 강화, Syft SBOM, Cosign keyless) | M |
| P | Multi-arch buildx (amd64/arm64) | S |

### Tier 3 — Observability & Ops
| Phase | 목표 | Size |
|---|---|---|
| D | CI 검증 게이트 (compose config, bats, shellcheck, hadolint, dclint) | M |
| H | Readiness/Liveness/Startup probe 분리 | M |
| L | 네트워크 세그멘테이션 (tier별 network, `internal: true`) | S |
| K | 백업·DR (pg_dump cron + 복원 리허설 CI + runbook) | L |
| I | Observability (OTel opt-in, cAdvisor 기존 prod에 존재, 구조화 로그) | M |
| R | DB 운영 (migration dry-run CI, PgBouncer optional) | M |

### Tier 4 — Meta & Future
| Phase | 목표 | Size |
|---|---|---|
| S | ADR 인프라 (`docs/adr/`, adr-tools 규약) | S |
| T | K8s 전환 로드맵 ADR (ADR-0004, Proposed) | S |
| N | Secret 로드맵 ADR (ADR-0005, Proposed) | S |
| O | Renovate 이미지 업데이트 (Dependabot과 공존) | S |
| Q | DX (devcontainer, Taskfile) | M |

## 이번 세션 범위 — Tier 1 + Tier 4 ADR

**포함 Phase: S, T, N, A, M, B, F** (7개, 구현 순서)

근거:
1. Tier 1은 모든 후속 Tier의 전제. compose 중복·shell 품질 검증이 없으면 Tier 2 하드닝이 3곳에 각각 복붙되는 악순환 재발.
2. Tier 4의 ADR(S, T, N)은 결정 자체를 내리지 않고 **선택지를 문서화**하는 값싼 작업. 이번 세션 내 완료 가능.
3. Tier 2(C/G/E/J/P)는 secret 전략(ADR-0005) Accepted 승격 후 착수가 올바른 순서.
4. Tier 3(D/H/L/K/I/R)은 Tier 1 SSOT 위에서 작업해야 중복 방지.

## 사용자 의사결정 반영 (2026-04-15)

1. **ADR 번호**: 기존 001~003 → **0001~0003으로 rename** (git mv) + 신규는 0004~
2. **Phase A compose 재구성**: **컨테이너/볼륨/네트워크 이름 변경 허용**. dev 볼륨 1회성 재생성 수용. 구조 개선 우선.
3. **Predev guard**: **dry-run default** + `pnpm predev:reset` 신설
4. **Secret 전략**: sops/age Proposed 유지 (실제 도입은 Phase C)

## Build Sequence (이번 세션 실행 순서)

- [ ] **Pre**: ADR 001~003 → 0001~0003 rename + 참조 링크 업데이트
- [ ] Phase S: ADR 템플릿 + README 업데이트
- [ ] Phase T: ADR-0004 작성 (Proposed)
- [ ] Phase N: ADR-0005 작성 (Proposed)
- [ ] Phase A: compose base/override 분리
- [ ] Phase M: base.yml x-anchor로 리소스/로깅 SSOT (A 직후)
- [ ] Phase B: bats tests + shellcheck + hadolint + dclint
- [ ] Phase F: predev guard dry-run default + --confirm flag + pnpm predev:reset

## 후속 세션 우선순위
1. **Next**: Phase C (sops/age 도입, ADR-0005 Accepted 승격)
2. Phase G + L (하드닝 + 네트워크 세그멘테이션)
3. Phase D (CI 검증 게이트 추가)
4. Phase E + P + J (커스텀 rustfs 이미지 → multi-arch → SBOM/Cosign)
5. Phase K + R (프로덕션 사용자 발생 시점)
6. Phase H / I / O / Q (우선순위 최하)
