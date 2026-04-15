#!/usr/bin/env bats
# redis-liveness.sh unit tests

load helpers/mocks

setup() {
  setup_mock_bin
  install_redis_cli_mock
  SCRIPT="${BATS_TEST_DIRNAME}/../redis-liveness.sh"
}

teardown() {
  teardown_mock_bin
}

@test "PING → PONG → live (exit 0, 비밀번호 없음)" {
  MOCK_REDIS_RESPONSE=PONG run "${SCRIPT}"
  [ "${status}" -eq 0 ]
}

@test "PING → PONG → live (비밀번호 있음)" {
  MOCK_REDIS_RESPONSE=PONG REDIS_PASSWORD=secret run "${SCRIPT}"
  [ "${status}" -eq 0 ]
}

@test "PING → 빈 응답 → unhealthy (exit 1)" {
  MOCK_REDIS_RESPONSE='' run "${SCRIPT}"
  [ "${status}" -eq 1 ]
}

@test "PING → NOAUTH → unhealthy" {
  MOCK_REDIS_RESPONSE='NOAUTH Authentication required.' run "${SCRIPT}"
  [ "${status}" -eq 1 ]
}
