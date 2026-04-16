# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.

## Open

- [x] **[2026-04-15 docker-infra-standards] S1 — CI quality-gate에 bats/shellcheck/hadolint/dclint 스텝 추가** — ✅ 완료 2026-04-16. shellcheck + hadolint + dclint + bats + SOPS 복호화 검증 스텝 추가. **후속**: GitHub Settings에서 `SOPS_AGE_KEY` secret 등록 필요 (수동).
- [x] **[2026-04-15 docker-infra-standards] Phase C — sops/age secret 관리 실제 도입** — ✅ 완료 2026-04-15. ADR-0005 Accepted 승격, `.sops.yaml` + `infra/secrets/` + `secrets-*.sh` 3종 + `docs/operations/secret-backup.md` + `secret-rotation.md` + pre-commit gitleaks + compose `--env-file` 경로 정비. 완료 exec-plan: `.claude/plans/linear-discovering-comet.md`. **후속**: GitHub Actions `SOPS_AGE_KEY` CI 통합은 Phase D로 이연.
- [x] **[2026-04-15 docker-infra-standards] Phase G — 컨테이너 보안 하드닝** — ✅ 완료 2026-04-16. `x-security` anchor로 `cap_drop: ALL` + `no-new-privileges` + `read_only: true` + 서비스별 최소 `cap_add` + `tmpfs`. base/prod/lan 전체 적용, dev 환경 Healthy 확인.
- [x] **[2026-04-15 docker-infra-standards] Phase E — rustfs 커스텀 이미지** — ✅ 완료 2026-04-16. `infra/rustfs/Dockerfile` 신규, healthcheck 스크립트 COPY로 bind mount 제거, base image digest ARG 관리, `COPY --chmod=755` 활용. dev 환경 Healthy 확인.
- [x] **[2026-04-15 docker-infra-standards] Phase J — 공급망 보안** — ✅ 완료 2026-04-16. Syft SBOM (SPDX + CycloneDX) + Cosign keyless signing + SBOM attestation. 별도 `supply-chain` CI job으로 분리 (id-token: write job-scoped). digest 기반 이미지 참조. 로컬 검증 스크립트 `verify-supply-chain.sh` 추가.
- [ ] **[2026-04-15 docker-infra-standards] Phase K — 백업·DR** (pg_dump cron + 복원 리허설 CI + runbook). 프로덕션 사용자 발생 시점.
- [x] **[2026-04-15 docker-infra-standards] Phase L — 네트워크 세그멘테이션** — ✅ 완료 2026-04-16. prod/lan 2-tier 구조 (`data-network: internal` + `app-network`) 적용. prod `app-network` internal 해제 (backend SMTP 외부 발신 불가 결함 수정). dev는 호스트 기반 개발로 변경 불필요.
- [x] **[2026-04-15 docker-infra-standards] Phase O — Renovate 도입 검토** — ✅ 완료 2026-04-16. Renovate 불필요 판정 (Dependabot이 npm+Actions+Docker 전 커버). `infra/compose/` + `infra/rustfs/` Docker 이미지 추적 gap 발견 → dependabot.yml에 경로 추가.
- [x] **[2026-04-16 e2e-infra-redesign] S2 — data-migration.service.spec.ts lint 에러** — ✅ 완료 2026-04-16. 미사용 변수 4개 + MulterFile import 제거, lint 통과.
- [x] **[2026-04-16 e2e-infra-redesign] S3 — beforeAll 축소** — ✅ 완료 2026-04-16. `equipment-approval.e2e-spec.ts` 26줄→9줄 (try/catch→.catch() 패턴). `calibration-plans.e2e-spec.ts` 이미 14줄로 충족.
- [x] **[2026-04-16 e2e-infra-redesign] S4 — afterAll 축소** — ✅ 완료 2026-04-16. `equipment-history.e2e-spec.ts` 27줄→3줄. ResourceTracker에 history 타입 3종 추가 + API_ENDPOINTS SSOT 기반으로 전면 리팩토링. `toTestPath` 유틸리티로 globalPrefix 차이 중앙화.
- [ ] **[2026-04-16 tech-debt-s2s4] E2E globalPrefix 통합** — createTestApp에 setGlobalPrefix('api') 추가 + 22개 E2E 스펙 경로를 API_ENDPOINTS 기반으로 마이그레이션. 현재 toTestPath로 중앙화된 상태.

## Resolved

(이번 세션 완료 항목은 완료된 exec-plan 문서로 이관됨.)
