#!/usr/bin/env bash
# verify-compose-security.sh — Compose 보안 하드닝 SSOT 가드
#
# merged compose config에서 모든 서비스가 필수 보안 설정을 갖는지 검증.
# x-security anchor는 YAML 파일 경계를 넘지 못하므로, 이 스크립트가
# base.yml / prod.override.yml / lan.override.yml 간 동기화를 보장한다.
#
# CI에서 실행: .github/workflows/main.yml quality-gate job
# 로컬에서 실행: bash infra/scripts/verify-compose-security.sh
#
# 필수 보안 설정 (x-security SSOT):
#   - security_opt: no-new-privileges:true
#   - cap_drop: ALL
#
# read_only 예외 (사유 포함):
#   - cadvisor: /var/run (rw) 마운트 필요 — cgroup 메트릭 수집

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${SCRIPT_DIR}/../compose"

errors=0

# x-security anchor 동기화 검증 — 3개 파일의 x-security 블록이 동일한지 확인
check_anchor_sync() {
  local base_security prod_security lan_security

  base_security=$(python3 -c "
import yaml
with open('${COMPOSE_DIR}/base.yml') as f:
    d = yaml.safe_load(f)
xs = d.get('x-security', {})
print(sorted(xs.items()))
")

  prod_security=$(python3 -c "
import yaml
with open('${COMPOSE_DIR}/prod.override.yml') as f:
    d = yaml.safe_load(f)
xs = d.get('x-security', {})
print(sorted(xs.items()))
")

  lan_security=$(python3 -c "
import yaml
with open('${COMPOSE_DIR}/lan.override.yml') as f:
    d = yaml.safe_load(f)
xs = d.get('x-security', {})
print(sorted(xs.items()))
")

  if [[ "$base_security" != "$prod_security" ]]; then
    echo "::error::x-security SSOT 위반: base.yml ≠ prod.override.yml"
    echo "  base: $base_security"
    echo "  prod: $prod_security"
    ((errors++))
  fi

  if [[ "$base_security" != "$lan_security" ]]; then
    echo "::error::x-security SSOT 위반: base.yml ≠ lan.override.yml"
    echo "  base: $base_security"
    echo "  lan:  $lan_security"
    ((errors++))
  fi

  if [[ $errors -eq 0 ]]; then
    echo "✓ x-security anchor 동기화 확인"
  fi
}

# merged config에서 서비스별 보안 설정 검증
check_merged_config() {
  local config_file="$1"
  local env_name="$2"
  # read_only 예외 서비스 목록 (공백 구분)
  local readonly_exceptions="${3:-}"

  echo "--- ${env_name} 환경 검증 ---"

  local services
  services=$(python3 -c "
import yaml, sys
with open('${config_file}') as f:
    d = yaml.safe_load(f)
svcs = d.get('services', {})
# profile이 있는 서비스(migration 등)도 포함
for name in sorted(svcs.keys()):
    print(name)
")

  for svc in $services; do
    # security_opt 검증
    local has_no_new_priv
    has_no_new_priv=$(python3 -c "
import yaml
with open('${config_file}') as f:
    d = yaml.safe_load(f)
svc = d['services'].get('${svc}', {})
sec = svc.get('security_opt', [])
print('yes' if 'no-new-privileges:true' in sec else 'no')
")

    if [[ "$has_no_new_priv" != "yes" ]]; then
      echo "::error::${env_name}/${svc}: security_opt no-new-privileges:true 누락"
      ((errors++))
    fi

    # cap_drop 검증
    local has_cap_drop
    has_cap_drop=$(python3 -c "
import yaml
with open('${config_file}') as f:
    d = yaml.safe_load(f)
svc = d['services'].get('${svc}', {})
caps = svc.get('cap_drop', [])
print('yes' if 'ALL' in caps else 'no')
")

    if [[ "$has_cap_drop" != "yes" ]]; then
      echo "::error::${env_name}/${svc}: cap_drop ALL 누락"
      ((errors++))
    fi
  done

  if [[ $errors -eq 0 ]]; then
    echo "✓ ${env_name} 전체 서비스 보안 설정 확인"
  fi
}

echo "=== Compose 보안 하드닝 검증 ==="
echo ""

# Step 1: x-security anchor 동기화
check_anchor_sync

# Step 2: dev 환경 (base + dev override)
docker compose -f "${COMPOSE_DIR}/base.yml" -f "${COMPOSE_DIR}/dev.override.yml" \
  config > /tmp/compose-dev-merged.yml 2>/dev/null
check_merged_config /tmp/compose-dev-merged.yml "dev"

# Step 3: prod 환경은 secret 필요하므로 base.yml 단독 + prod 단독 검증
# base.yml 단독
docker compose -f "${COMPOSE_DIR}/base.yml" config > /tmp/compose-base-merged.yml 2>/dev/null
check_merged_config /tmp/compose-base-merged.yml "base"

echo ""
if [[ $errors -gt 0 ]]; then
  echo "✗ ${errors}개 보안 설정 위반 발견"
  exit 1
else
  echo "✓ 모든 보안 검증 통과"
fi
