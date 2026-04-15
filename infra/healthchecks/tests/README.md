# Healthcheck Unit Tests (bats)

`infra/healthchecks/*.sh` 스크립트의 단위 테스트. command stub을 통해
`curl` · `redis-cli` · `pg_isready` 없이도 테스트가 수행된다.

## 실행

### 로컬 (Docker 경유 — 설치 불필요)

```bash
docker run --rm -v "$PWD:/code" -w /code bats/bats:1.11.0 \
  infra/healthchecks/tests/
```

### 로컬 (bats-core 설치 시)

```bash
bats infra/healthchecks/tests/
```

### CI (GitHub Actions 권장 스텝)

```yaml
- name: bats unit tests
  run: |
    docker run --rm -v "$PWD:/code" -w /code bats/bats:1.11.0 \
      infra/healthchecks/tests/
```

## 테스트 구성

| 파일                     | 대상                   | 케이스                                             |
| ------------------------ | ---------------------- | -------------------------------------------------- |
| `rustfs-liveness.bats`   | `rustfs-liveness.sh`   | 200/403=live, 404/500/000=unhealthy, PORT override |
| `redis-liveness.bats`    | `redis-liveness.sh`    | PONG/빈/NOAUTH + 비밀번호 유무                     |
| `postgres-liveness.bats` | `postgres-liveness.sh` | pg_isready exit 0/1/2/3                            |

## Mock 설계

`helpers/mocks.bash`가 `$PATH` 앞에 임시 bin 디렉토리를 얹어
`curl`/`redis-cli`/`pg_isready`를 stub로 대체한다. 각 stub은 env 변수로
응답·종료코드를 제어한다:

- `MOCK_HTTP_CODE` — curl stub이 반환할 HTTP 코드 (3자리)
- `MOCK_REDIS_RESPONSE` — redis-cli stub이 출력할 문자열
- `MOCK_PG_EXIT` — pg_isready stub의 종료 코드
