#!/bin/bash
# ─────────────────────────────────────────────
# 프로덕션 비밀 키 일괄 생성 스크립트
# 사용법:
#   ./scripts/generate-secrets.sh              # stdout 출력 (검토용)
#   ./scripts/generate-secrets.sh --update-env  # .env 파일 직접 업데이트
# ─────────────────────────────────────────────

set -euo pipefail

# ─────────────────────────────────────────────
# 의존성 확인
# ─────────────────────────────────────────────
command -v openssl >/dev/null 2>&1 || { echo "오류: openssl이 필요합니다" >&2; exit 1; }

# ─────────────────────────────────────────────
# 공통 유틸리티 로드 (SSOT)
# ─────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/secret-utils.sh"

# ─────────────────────────────────────────────
# 시크릿 생성 (SSOT: 모든 프로덕션 시크릿을 여기서 관리)
# ─────────────────────────────────────────────
JWT_SECRET=$(generate_secret 48)
REFRESH_TOKEN_SECRET=$(generate_secret 48)
NEXTAUTH_SECRET=$(generate_secret 48)
INTERNAL_API_KEY=$(generate_secret 48)
REDIS_PASSWORD=$(generate_secret 32)
DB_PASSWORD=$(generate_secret 24)
S3_ACCESS_KEY=$(openssl rand -hex 16)
S3_SECRET_KEY=$(openssl rand -hex 32)
GRAFANA_ADMIN_PASSWORD=$(generate_secret 24)

# ─────────────────────────────────────────────
# 출력 / 업데이트
# ─────────────────────────────────────────────
if [ "${1:-}" = "--update-env" ]; then
  ENV_FILE="${ENV_FILE:-.env}"

  if [ ! -f "$ENV_FILE" ]; then
    echo "오류: ${ENV_FILE} 파일이 존재하지 않습니다" >&2
    echo "먼저 .env.example을 복사하세요: cp .env.example .env" >&2
    exit 1
  fi

  # 공통 update_env_var 함수 사용 (scripts/lib/secret-utils.sh)
  update_env_var "JWT_SECRET" "$JWT_SECRET" "$ENV_FILE"
  update_env_var "REFRESH_TOKEN_SECRET" "$REFRESH_TOKEN_SECRET" "$ENV_FILE"
  update_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "$ENV_FILE"
  update_env_var "INTERNAL_API_KEY" "$INTERNAL_API_KEY" "$ENV_FILE"
  update_env_var "REDIS_PASSWORD" "$REDIS_PASSWORD" "$ENV_FILE"
  update_env_var "DB_PASSWORD" "$DB_PASSWORD" "$ENV_FILE"
  update_env_var "S3_ACCESS_KEY" "$S3_ACCESS_KEY" "$ENV_FILE"
  update_env_var "S3_SECRET_KEY" "$S3_SECRET_KEY" "$ENV_FILE"
  update_env_var "GRAFANA_ADMIN_PASSWORD" "$GRAFANA_ADMIN_PASSWORD" "$ENV_FILE"

  # 파일 권한 제한 (소유자만 읽기/쓰기)
  chmod 600 "$ENV_FILE"

  echo "✅ ${ENV_FILE} 파일의 시크릿이 업데이트되었습니다."
  echo ""
  echo "업데이트된 항목:"
  echo "  - JWT_SECRET (${#JWT_SECRET}자)"
  echo "  - REFRESH_TOKEN_SECRET (${#REFRESH_TOKEN_SECRET}자)"
  echo "  - NEXTAUTH_SECRET (${#NEXTAUTH_SECRET}자)"
  echo "  - INTERNAL_API_KEY (${#INTERNAL_API_KEY}자)"
  echo "  - REDIS_PASSWORD (${#REDIS_PASSWORD}자)"
  echo "  - DB_PASSWORD (${#DB_PASSWORD}자)"
  echo "  - S3_ACCESS_KEY (${#S3_ACCESS_KEY}자)"
  echo "  - S3_SECRET_KEY (${#S3_SECRET_KEY}자)"
  echo "  - GRAFANA_ADMIN_PASSWORD (${#GRAFANA_ADMIN_PASSWORD}자)"
  echo ""
  echo "⚠️  DATABASE_URL도 새 DB_PASSWORD에 맞게 업데이트하세요."
else
  # stdout 출력 (검토용 또는 수동 복사)
  cat <<EOF
# ─────────────────────────────────────────────
# 프로덕션 시크릿 ($(date '+%Y-%m-%d %H:%M:%S') 생성)
# 아래 값을 .env 파일에 복사하세요
# ─────────────────────────────────────────────

# JWT 인증 (Access Token 서명)
JWT_SECRET=${JWT_SECRET}

# Refresh Token 서명 (JWT_SECRET과 반드시 다른 값)
REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}

# NextAuth 세션 암호화
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# 서비스 간 통신 (Frontend → Backend 내부 API)
INTERNAL_API_KEY=${INTERNAL_API_KEY}

# Redis 인증
REDIS_PASSWORD=${REDIS_PASSWORD}

# PostgreSQL 인증
DB_PASSWORD=${DB_PASSWORD}

# S3/RustFS 오브젝트 스토리지
S3_ACCESS_KEY=${S3_ACCESS_KEY}
S3_SECRET_KEY=${S3_SECRET_KEY}

# Grafana 관리자
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
EOF
fi
