---
slug: supply-chain-security
phase: "J — 공급망 보안"
scope: CI/CD pipeline supply chain security (Syft SBOM + Cosign keyless signing)
---

# Contract: Supply Chain Security

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| M1 | Syft SBOM이 backend/frontend 이미지 각각에 대해 생성된다 | CI workflow에 syft 실행 스텝 존재 |
| M2 | SBOM이 SPDX JSON 형식으로 생성된다 | `-o spdx-json` 플래그 확인 |
| M3 | Cosign keyless signing이 backend/frontend 이미지 각각에 적용된다 | `cosign sign --yes` 스텝 존재 |
| M4 | Cosign SBOM attestation이 이미지에 첨부된다 | `cosign attest` 스텝 존재 |
| M5 | 이미지 서명/검증은 digest 기반 (tag 아닌 immutable ref) | `@sha256:` 형식으로 이미지 참조 |
| M6 | `id-token: write` 권한이 supply-chain job에만 스코프됨 | workflow 전체가 아닌 job-level permissions |
| M7 | 모든 GitHub Action 참조가 SHA 핀으로 고정됨 | 기존 워크플로우 컨벤션 준수 |
| M8 | SBOM이 CI artifact로 업로드됨 | `actions/upload-artifact` 스텝 존재 |
| M9 | supply-chain job이 docker-build 후에 실행됨 | `needs: docker-build` |
| M10 | deploy-staging이 supply-chain 완료 후 실행됨 | `needs` 배열에 supply-chain 포함 |

## SHOULD Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| S1 | CycloneDX 형식 SBOM도 병렬 생성 | `-o cyclonedx-json` 플래그 |
| S2 | 로컬 검증 스크립트 제공 | `infra/scripts/verify-supply-chain.sh` 존재 |
| S3 | CI에서 서명 검증 스텝 포함 | `cosign verify` 스텝 존재 |
| S4 | docker-build job에서 digest를 output으로 전달 | `outputs.backend-digest`, `outputs.frontend-digest` |
