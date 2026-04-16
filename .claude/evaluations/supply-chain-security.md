---
slug: supply-chain-security
iteration: 1
verdict: FAIL
---

# Evaluation: Supply Chain Security

## MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | Syft SBOM이 backend/frontend 이미지 각각에 대해 생성된다 | PASS | `main.yml:483-488` "Generate SBOM — Backend (SPDX + CycloneDX)", `main.yml:502-507` "Generate SBOM — Frontend (SPDX + CycloneDX)" — 두 스텝 모두 존재 |
| M2 | SBOM이 SPDX JSON 형식으로 생성된다 | PASS | `main.yml:487,506` 각각 `-o spdx-json=backend-sbom.spdx.json`, `-o spdx-json=frontend-sbom.spdx.json` 플래그 확인 |
| M3 | Cosign keyless signing이 backend/frontend 이미지 각각에 적용된다 | PASS | `main.yml:493` `cosign sign --yes "$BACKEND_IMAGE"`, `main.yml:511` `cosign sign --yes "$FRONTEND_IMAGE"` |
| M4 | Cosign SBOM attestation이 이미지에 첨부된다 | PASS | `main.yml:498` `cosign attest --yes --predicate backend-sbom.spdx.json --type spdxjson "$BACKEND_IMAGE"`, `main.yml:517` frontend 동일 패턴 |
| M5 | 이미지 서명/검증은 digest 기반 (tag 아닌 immutable ref) | PASS | 모든 sign/attest/verify 스텝의 env 변수가 `...backend@${{ needs.docker-build.outputs.backend-digest }}` 형식 사용 (`main.yml:485,492,497,504,510,516,523,524`) |
| M6 | `id-token: write` 권한이 supply-chain job에만 스코프됨 | PASS | 워크플로우 수준 permissions (`main.yml:18-21`)에 `id-token`이 없음. `supply-chain` job에만 `id-token: write` 선언 (`main.yml:463`) |
| M7 | 모든 GitHub Action 참조가 SHA 핀으로 고정됨 | PASS | 전체 47개 `uses:` 참조 모두 40자 SHA 해시로 고정됨. 버전 주석(`# vX.X.X`)도 전부 존재 |
| M8 | SBOM이 CI artifact로 업로드됨 | PASS | `main.yml:536-546` `actions/upload-artifact` 스텝 존재. `if: always()` 조건으로 실패 시에도 업로드, retention-days: 90 설정, spdx + cdx 4개 파일 전부 포함 |
| M9 | supply-chain job이 docker-build 후에 실행됨 | PASS | `main.yml:460` `needs: docker-build` 확인 |
| M10 | deploy-staging이 supply-chain 완료 후 실행됨 | PASS | `main.yml:555` `needs: [docker-build, image-scan, supply-chain]` — supply-chain 포함 확인 |

## SHOULD Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| S1 | CycloneDX 형식 SBOM도 병렬 생성 | PASS | `main.yml:487,506` 각각 `-o cyclonedx-json=backend-sbom.cdx.json`, `-o cyclonedx-json=frontend-sbom.cdx.json` — 동일 syft 실행에서 병렬 출력 |
| S2 | 로컬 검증 스크립트 제공 | PASS | `infra/scripts/verify-supply-chain.sh` 존재. `set -euo pipefail`, 인자 검증, backend/frontend 양쪽 verify_image() 호출 확인 |
| S3 | CI에서 서명 검증 스텝 포함 | PASS | `main.yml:521-534` "Verify Signatures" 스텝에서 `cosign verify --certificate-oidc-issuer=... --certificate-identity-regexp=...` 양쪽 이미지 모두 검증 |
| S4 | docker-build job에서 digest를 output으로 전달 | PASS | `main.yml:366-368` `outputs.backend-digest: ${{ steps.build-backend.outputs.digest }}`, `outputs.frontend-digest: ${{ steps.build-frontend.outputs.digest }}` — step ID `build-backend`/`build-frontend` 실제 존재 (`main.yml:382,394`) |

## Issues Found

### Issue 1 (SECURITY — 보안 취약점): `verify-supply-chain.sh`의 `--certificate-identity-regexp`가 의도 없이 과도하게 넓음
- **File:** `infra/scripts/verify-supply-chain.sh:63,75,90`
- **Problem:** 로컬 검증 스크립트의 모든 `cosign verify`/`cosign verify-attestation` 호출이 `--certificate-identity-regexp="github.com/"` 를 사용함. 이는 GitHub Actions에서 서명된 **어떤 이미지든** 통과시킬 수 있음 — 다른 레포지토리에서 서명된 악의적 이미지도 검증 통과.
- **비교:** CI (`main.yml:528,532`)는 `"github.com/${{ github.repository }}"` 로 올바르게 레포지토리를 포함. 로컬 스크립트만 `"github.com/"` 에서 멈춤.
- **원인:** `GITHUB_REPO="${GITHUB_REPOSITORY:-}"` 변수(`verify-supply-chain.sh:30`)가 선언되었지만 실제 `--certificate-identity-regexp` 인자 구성에 사용되지 않음 (SC2034 unused variable). `${GITHUB_REPO}`는 스크립트 어디서도 참조되지 않음.
- **결과:** CI는 올바르게 범위가 한정되지만, 로컬 검증 스크립트는 공급망 검증 도구로서 사실상 무효화됨.

### Issue 2 (MINOR — 참고): `image-scan` job이 digest가 아닌 태그 기반 이미지 참조 사용
- **File:** `main.yml:426,434`
- **Scope:** `image-scan` job (계약 범위 외)
- **Problem:** `image-ref: '${{ secrets.DOCKER_HUB_USERNAME }}/equipment-management-backend:${{ github.sha }}'` — SHA 태그는 mutable (덮어쓸 수 있음). supply-chain job이 digest를 사용하는 것과 일관성이 없음. Trivy 스캔이 다른 이미지 레이어를 스캔할 이론적 가능성이 있음.
- **Severity:** 이 프로젝트에서 동일한 workflow run 내에서 동일 태그를 다른 이미지로 덮어쓸 가능성은 낮으나, 엄밀히는 불일치.

## Repair Instructions

### Issue 1 수정 (필수)

`infra/scripts/verify-supply-chain.sh`에서 `GITHUB_REPO` 변수를 실제로 사용하도록 수정:

```bash
# 현재 (잘못됨) — line 63, 75, 90
--certificate-identity-regexp="github.com/" \

# 수정 후
GITHUB_REPO="${GITHUB_REPOSITORY:-}"  # line 30 (기존 유지)

# 그리고 verify_image 함수 내에서:
if [[ -n "$GITHUB_REPO" ]]; then
  IDENTITY_REGEXP="github.com/${GITHUB_REPO}"
else
  # fallback — 경고 출력 후 넓은 범위로 진행 (또는 exit 1)
  echo "  WARN: GITHUB_REPOSITORY not set; using broad regexp github.com/"
  IDENTITY_REGEXP="github.com/"
fi

cosign verify \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
  --certificate-identity-regexp="${IDENTITY_REGEXP}" \
  "$image" 2>/dev/null
```

또는 더 간단하게, `GITHUB_REPO` 미설정 시 스크립트를 종료하는 방식:

```bash
# line 30 교체
GITHUB_REPO="${GITHUB_REPOSITORY:?ERROR: GITHUB_REPOSITORY must be set (e.g. owner/repo)}"
```

그리고 `--certificate-identity-regexp="github.com/${GITHUB_REPO}"` 로 변경.

로컬 실행 시에는:
```bash
GITHUB_REPOSITORY="your-org/equipment_management_system" bash infra/scripts/verify-supply-chain.sh myuser abc1234
```

### Issue 2 수정 (권고)

`image-scan` job의 `image-ref`를 digest 기반으로 변경:
```yaml
image-ref: '${{ secrets.DOCKER_HUB_USERNAME }}/equipment-management-backend@${{ needs.docker-build.outputs.backend-digest }}'
```
단, `image-scan` job의 `needs`에 `docker-build`가 포함되어 있어야 outputs 접근 가능 (현재 이미 `needs: docker-build` 있음).
