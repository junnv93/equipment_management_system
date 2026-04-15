#!/usr/bin/env bash
# Test helpers — bats 테스트에서 사용하는 command stub 설정.
#
# 각 bats 파일이 `load helpers/mocks` 로 로드하여 사용.
# PATH의 앞에 임시 bin 디렉토리를 얹어 stub를 우선 호출하게 한다.

setup_mock_bin() {
  MOCK_BIN="$(mktemp -d)"
  export PATH="${MOCK_BIN}:${PATH}"
}

teardown_mock_bin() {
  if [ -n "${MOCK_BIN:-}" ] && [ -d "${MOCK_BIN}" ]; then
    rm -rf "${MOCK_BIN}"
  fi
}

# curl stub — HTTP_CODE env를 기반으로 `curl -w %{http_code}` 동작 재현
# 사용: MOCK_HTTP_CODE=200 run script
install_curl_mock() {
  cat > "${MOCK_BIN}/curl" <<'SH'
#!/bin/sh
# 플래그 파싱 없이 MOCK_HTTP_CODE 반환 — 테스트용
printf '%s' "${MOCK_HTTP_CODE:-000}"
SH
  chmod +x "${MOCK_BIN}/curl"
}

# redis-cli stub — MOCK_REDIS_RESPONSE 변수 값 반환
# `${VAR-PONG}` (콜론 없음): unset 시에만 PONG, 빈 문자열은 그대로 전달
install_redis_cli_mock() {
  cat > "${MOCK_BIN}/redis-cli" <<'SH'
#!/bin/sh
printf '%s\n' "${MOCK_REDIS_RESPONSE-PONG}"
SH
  chmod +x "${MOCK_BIN}/redis-cli"
}

# pg_isready stub — MOCK_PG_EXIT 으로 종료코드 제어
install_pg_isready_mock() {
  cat > "${MOCK_BIN}/pg_isready" <<'SH'
#!/bin/sh
exit "${MOCK_PG_EXIT:-0}"
SH
  chmod +x "${MOCK_BIN}/pg_isready"
}
