# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.

## Open

- [x] **[2026-04-15 docker-infra-standards] S1 — CI quality-gate에 bats/shellcheck/hadolint/dclint 스텝 추가** — ✅ 완료 2026-04-16. shellcheck + hadolint + dclint + bats + SOPS 복호화 검증 스텝 추가. **후속**: GitHub Settings에서 `SOPS_AGE_KEY` secret 등록 필요 (수동).
- [x] **[2026-04-15 docker-infra-standards] Phase C — sops/age secret 관리 실제 도입** — ✅ 완료 2026-04-15. ADR-0005 Accepted 승격, `.sops.yaml` + `infra/secrets/` + `secrets-*.sh` 3종 + `docs/operations/secret-backup.md` + `secret-rotation.md` + pre-commit gitleaks + compose `--env-file` 경로 정비. 완료 exec-plan: `.claude/plans/linear-discovering-comet.md`. **후속**: GitHub Actions `SOPS_AGE_KEY` CI 통합은 Phase D로 이연.
- [ ] **[2026-04-15 docker-infra-standards] Phase G — 컨테이너 보안 하드닝** (read_only, cap_drop, no-new-privileges, init, non-root). base.yml에 단일 지점 적용.
- [ ] **[2026-04-15 docker-infra-standards] Phase E — rustfs 커스텀 이미지** (bind mount 제거, semver 태그, multi-arch).
- [ ] **[2026-04-15 docker-infra-standards] Phase J — 공급망 보안** (Syft SBOM, Cosign signing). Phase E 선행.
- [ ] **[2026-04-15 docker-infra-standards] Phase K — 백업·DR** (pg_dump cron + 복원 리허설 CI + runbook). 프로덕션 사용자 발생 시점.
- [ ] **[2026-04-15 docker-infra-standards] Phase L — 네트워크 세그멘테이션** (tier별 network, `internal: true`). prod는 이미 분리됨, dev/lan도 점검.
- [ ] **[2026-04-15 docker-infra-standards] Phase O — Renovate 도입 검토** (Dependabot과 중복 여부 판단).

## Resolved

(이번 세션 완료 항목은 완료된 exec-plan 문서로 이관됨.)
