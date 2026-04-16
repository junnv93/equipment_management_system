#!/usr/bin/env bash
# verify-supply-chain.sh — 이미지 서명 + SBOM 증명 로컬 검증
#
# 사용법:
#   GITHUB_REPOSITORY=owner/repo bash infra/scripts/verify-supply-chain.sh <docker-hub-username> <image-tag-or-digest>
#
# 예시:
#   GITHUB_REPOSITORY=myorg/equipment-management-system \
#     bash infra/scripts/verify-supply-chain.sh myuser abc1234  # git SHA 태그
#
# 사전 조건:
#   - cosign CLI 설치 (brew install cosign / go install github.com/sigstore/cosign/v2/cmd/cosign@latest)
#   - Docker Hub 접근 가능 (public 이미지 또는 docker login 완료)
#   - GITHUB_REPOSITORY 환경변수 설정 (서명 identity 범위 제한)

set -euo pipefail

# ── 인자 검증 ──

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <docker-hub-username> <image-tag-or-digest>"
  echo ""
  echo "Examples:"
  echo "  $0 myuser abc1234def5678"
  echo "  $0 myuser sha256:f1b59053332cdaa00c6a..."
  exit 1
fi

DOCKER_USER="$1"
IMAGE_REF="$2"
GITHUB_REPO="${GITHUB_REPOSITORY:?ERROR: GITHUB_REPOSITORY env var required (e.g. owner/repo)}"

# digest vs tag 판별
if [[ "$IMAGE_REF" == sha256:* ]]; then
  BACKEND_IMAGE="${DOCKER_USER}/equipment-management-backend@${IMAGE_REF}"
  FRONTEND_IMAGE="${DOCKER_USER}/equipment-management-frontend@${IMAGE_REF}"
else
  BACKEND_IMAGE="${DOCKER_USER}/equipment-management-backend:${IMAGE_REF}"
  FRONTEND_IMAGE="${DOCKER_USER}/equipment-management-frontend:${IMAGE_REF}"
fi

# ── 도구 확인 ──

if ! command -v cosign &>/dev/null; then
  echo "ERROR: cosign CLI not found. Install: https://docs.sigstore.dev/cosign/system_config/installation/"
  exit 1
fi

# ── 검증 함수 ──

verify_image() {
  local image="$1"
  local name="$2"
  local exit_code=0

  echo "━━━ ${name} ━━━"
  echo "Image: ${image}"
  echo ""

  # 1. 서명 검증
  echo "  [1/3] Signature verification..."
  if cosign verify \
    --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
    --certificate-identity-regexp="github.com/${GITHUB_REPO}" \
    "$image" 2>/dev/null; then
    echo "  PASS: Signature valid (Sigstore keyless)"
  else
    echo "  FAIL: Signature verification failed"
    exit_code=1
  fi

  # 2. SBOM attestation 검증
  echo "  [2/3] SBOM attestation verification..."
  if cosign verify-attestation \
    --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
    --certificate-identity-regexp="github.com/${GITHUB_REPO}" \
    --type spdxjson \
    "$image" 2>/dev/null; then
    echo "  PASS: SBOM attestation valid (SPDX JSON)"
  else
    echo "  FAIL: SBOM attestation verification failed"
    exit_code=1
  fi

  # 3. SBOM 내용 추출 (선택적)
  echo "  [3/3] Extracting SBOM summary..."
  local sbom_file
  sbom_file=$(mktemp)
  if cosign verify-attestation \
    --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
    --certificate-identity-regexp="github.com/${GITHUB_REPO}" \
    --type spdxjson \
    "$image" 2>/dev/null | jq -r '.payload' | base64 -d | jq -r '.predicate' > "$sbom_file" 2>/dev/null; then
    local pkg_count
    pkg_count=$(jq '.packages | length' "$sbom_file" 2>/dev/null || echo "N/A")
    echo "  INFO: SBOM contains ${pkg_count} packages"
  else
    echo "  WARN: Could not extract SBOM content (signature valid, extraction optional)"
  fi
  rm -f "$sbom_file"

  echo ""
  return "$exit_code"
}

# ── 실행 ──

echo "=========================================="
echo "  Supply Chain Verification"
echo "=========================================="
echo ""

FAILURES=0

verify_image "$BACKEND_IMAGE" "Backend" || FAILURES=$((FAILURES + 1))
verify_image "$FRONTEND_IMAGE" "Frontend" || FAILURES=$((FAILURES + 1))

# ── 결과 ──

echo "=========================================="
if [[ "$FAILURES" -eq 0 ]]; then
  echo "  RESULT: ALL PASSED"
  echo "  Both images are signed and SBOM-attested."
else
  echo "  RESULT: ${FAILURES} FAILED"
  echo "  Review failures above."
fi
echo "=========================================="

exit "$FAILURES"
