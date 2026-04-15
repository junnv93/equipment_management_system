#!/usr/bin/env bats
# rustfs-liveness.sh unit tests

load helpers/mocks

setup() {
  setup_mock_bin
  install_curl_mock
  SCRIPT="${BATS_TEST_DIRNAME}/../rustfs-liveness.sh"
}

teardown() {
  teardown_mock_bin
}

@test "HTTP 200 → live (exit 0)" {
  MOCK_HTTP_CODE=200 run "${SCRIPT}"
  [ "${status}" -eq 0 ]
}

@test "HTTP 403 → live (exit 0, Rustfs unauthenticated root 정상)" {
  MOCK_HTTP_CODE=403 run "${SCRIPT}"
  [ "${status}" -eq 0 ]
}

@test "HTTP 404 → unhealthy (exit 1, 경로 부재)" {
  MOCK_HTTP_CODE=404 run "${SCRIPT}"
  [ "${status}" -eq 1 ]
  [[ "${output}" == *"unhealthy"* ]]
  [[ "${output}" == *"404"* ]]
}

@test "HTTP 500 → unhealthy (exit 1, 내부 오류)" {
  MOCK_HTTP_CODE=500 run "${SCRIPT}"
  [ "${status}" -eq 1 ]
}

@test "connection refused (code 000) → unhealthy" {
  MOCK_HTTP_CODE=000 run "${SCRIPT}"
  [ "${status}" -eq 1 ]
}

@test "RUSTFS_PORT env override 반영 (에러 메시지 체크는 생략)" {
  MOCK_HTTP_CODE=200 RUSTFS_PORT=9999 run "${SCRIPT}"
  [ "${status}" -eq 0 ]
}
