# Contract — Docker Infrastructure Standards (Tier 1 + Tier 4 ADR)

## Scope
본 harness 세션 검증 범위는 **Phase: Pre (ADR rename), S, T, N, A, M, B, F** 에 한한다.

## MUST (위반 시 merge 불가)

### M1. Compose config 3-환경 통과
```bash
docker compose config -q
docker compose -f infra/docker-compose.lan.yml config -q
docker compose -f infra/docker-compose.prod.yml config -q
```
모두 exit 0.

### M2. `pnpm dev` regression 없음 (3 컨테이너 Healthy)
```bash
docker compose down -v && pnpm dev
# 60초 내 postgres / redis / rustfs Healthy
```

### M3. Bats 테스트 전 항목 PASS
```bash
bats infra/healthchecks/tests/
```

### M4. Shellcheck zero warning
```bash
shellcheck -s sh infra/healthchecks/*.sh
shellcheck infra/scripts/*.sh
```
exit 0.

### M5. Hadolint — 새 error 0
```bash
hadolint apps/backend/docker/Dockerfile apps/frontend/Dockerfile
```
기존 대비 새 error 0. 기존 warning은 allowlist 또는 후속 PR.

### M6. Compose linter 통과 (dclint)
```bash
npx -y dclint docker-compose.yml infra/docker-compose.lan.yml infra/docker-compose.prod.yml
```
critical issue 0건.

### M7. TypeScript 회귀 없음
```bash
pnpm --filter backend run type-check
pnpm --filter frontend run type-check
```
exit 0.

### M8. Secret 평문 유출 없음 (Phase C 이후 강화)
```bash
# 전통적 grep 검증
git grep -nE "(password|secret|api[_-]?key)\\s*[:=]\\s*['\"][^'\"]{8,}" \
  -- ':!*.example' ':!*.md' ':!docs/adr/*' ':!apps/backend/**/*.spec.ts' ':!apps/backend/test/**' \
     ':!infra/secrets/*.sops.yaml'
# gitleaks 전체 스캔 (CI 동일)
gitleaks detect --redact --no-banner --exit-code=1
# sops 파일 암호화 상태 검증
for f in infra/secrets/*.env.sops.yaml; do
  [ -f "$f" ] || continue
  grep -q '^sops:' "$f" || { echo "FAIL: $f 암호화 안 됨"; exit 1; }
done
```
실제 값 커밋 없음 + sops 파일은 모두 암호화 상태.

### M9. ADR 파일 존재 + 템플릿 준수
- `docs/adr/0001-*.md`, `docs/adr/0002-*.md`, `docs/adr/0003-*.md` 존재 (rename 결과)
- `docs/adr/0004-docker-compose-over-kubernetes.md` 존재, Status=Proposed, Context/Decision/Consequences 포함
- `docs/adr/0005-secret-management-roadmap.md` 존재, Status=Proposed, sops/age 대 Vault 2안
- `docs/adr/template.md` 존재
- `docs/adr/README.md`가 0001~0005 목록 반영

### M10. Predev guard 기본 non-destructive
```bash
# RDB 오염 상태에서
bash infra/scripts/predev-guard.sh         # 볼륨 삭제 금지, exit 0, 경고만
docker volume ls | grep redis              # 볼륨 유지 확인
bash infra/scripts/predev-guard.sh --confirm  # 이때만 삭제 수행
```

### M11. base/override 구조 통합 확인
- `infra/compose/base.yml` · `dev.override.yml` · `lan.override.yml` · `prod.override.yml` 네 파일 존재
- 기존 최상위 3 compose는 `include:` shim 형태로 축소 (compose v2.20+)
- 네 파일의 postgres/redis/rustfs 서비스 정의가 base.yml 한 곳에서 나옴 (SSOT)

### M12. 기존 ADR 참조 링크 업데이트
```bash
! git grep -l "adr/001-\|adr/002-\|adr/003-"
```
잔존 참조 0건.

## SHOULD (best-effort)

### S1. Bats + shellcheck + dclint + hadolint를 CI에 추가
`.github/workflows/main.yml`의 quality-gate job에 step 추가. 이번 세션에서 미완료 시 Phase D로 이연.

### S2. Predev guard compose hash 동작 재검증
base/override 분리 후 hash 계산이 여전히 변경 감지를 트리거하는지 확인.

### S3. Rustfs bats 테스트의 경량 실행
curl 바이너리 없이 mock/stub만으로 작동.

## OUT OF SCOPE
- Trivy/Syft/Cosign 수준의 공급망 보안 (Phase J)
- 컨테이너 `read_only` / `cap_drop` 하드닝 (Phase G)
- 백업·복원 리허설 (Phase K)
- K8s manifest 작성 (ADR-0004 Accepted 후)
- GitHub Actions `SOPS_AGE_KEY` CI 통합 (Phase D 후속 세션)

## Definition of Done
- [ ] MUST 12개 전부 PASS
- [ ] SHOULD 실패 항목은 tech-debt-tracker.md에 기록
- [ ] `docker compose ps --filter health=healthy` 3줄
- [ ] 세션 종료 시 evaluations/docker-infra-standards.md 생성
