#!/usr/bin/env bats
# postgres-liveness.sh unit tests

load helpers/mocks

setup() {
  setup_mock_bin
  install_pg_isready_mock
  SCRIPT="${BATS_TEST_DIRNAME}/../postgres-liveness.sh"
}

teardown() {
  teardown_mock_bin
}

@test "pg_isready exit 0 → live" {
  MOCK_PG_EXIT=0 run "${SCRIPT}"
  [ "${status}" -eq 0 ]
}

@test "pg_isready exit 1 (rejecting connections, 초기화 중) → unhealthy" {
  MOCK_PG_EXIT=1 run "${SCRIPT}"
  [ "${status}" -eq 1 ]
}

@test "pg_isready exit 2 (no response) → unhealthy" {
  MOCK_PG_EXIT=2 run "${SCRIPT}"
  [ "${status}" -eq 1 ]
}

@test "pg_isready exit 3 (syntax error) → unhealthy" {
  MOCK_PG_EXIT=3 run "${SCRIPT}"
  [ "${status}" -eq 1 ]
}
