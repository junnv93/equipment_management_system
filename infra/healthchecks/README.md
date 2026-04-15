# Healthcheck SSOT Scripts

Docker Compose `healthcheck.test`에서 호출하는 liveness probe 스크립트 모음.
3개 compose 파일(dev/lan/prod)이 **동일 스크립트 파일**을 bind mount하여 사용하므로
probe 로직은 **이 디렉토리가 유일한 진실의 원천**이다.

## 스크립트

| 파일                   | 대상        | 핵심 로직                                                                  |
| ---------------------- | ----------- | -------------------------------------------------------------------------- |
| `rustfs-liveness.sh`   | Rustfs (S3) | `curl /` → 200 또는 403만 live (Rustfs는 dedicated health endpoint 미제공) |
| `redis-liveness.sh`    | Redis       | `redis-cli PING` → PONG                                                    |
| `postgres-liveness.sh` | Postgres    | `pg_isready` exit 0                                                        |

모든 스크립트는 POSIX sh 호환(`#!/bin/sh`)이며 env 치환을 통해 포트·타임아웃을
외부에서 주입 받는다. 하드코딩 없음.

## Compose 연동

```yaml
services:
  rustfs:
    volumes:
      - ./infra/healthchecks:/healthchecks:ro
    healthcheck:
      test: ['CMD', '/healthchecks/rustfs-liveness.sh']
```

`:ro` (read-only) 마운트로 컨테이너 내부에서 스크립트 변조 차단.

## 단위 테스트 (bash)

```bash
# 문법 검사
bash -n infra/healthchecks/*.sh

# 컨테이너 내부에서 실행
docker exec rustfs_equipment /healthchecks/rustfs-liveness.sh && echo OK

# 음성 테스트 (포트 변경)
RUSTFS_PORT=9999 docker exec -e RUSTFS_PORT=9999 rustfs_equipment \
  /healthchecks/rustfs-liveness.sh; echo "exit=$?"   # 기대: exit=1
```

## 설계 결정

### Rustfs `200|403` 엄격 매칭 근거

- `^[234]$` 같은 느슨한 매칭은 404(다른 서비스가 포트 점유)·500(내부 오류)까지
  통과시켜 false-positive 유발.
- Rustfs에서 실제 관찰되는 live 신호는 두 가지뿐:
  - `GET /` unauthenticated → `403 Forbidden` (S3 규약)
  - `GET /` with signed request → `200 OK`
- Upstream에 dedicated endpoint가 추가되면 본 스크립트만 교체(컨테이너 재빌드 불요).

### Bind mount vs 컨테이너 이미지 내 포함

Bind mount 선택 이유:

- **반복 iterable**: 이미지 재빌드 없이 스크립트 수정 즉시 반영.
- **이미지 재사용**: upstream rustfs/redis/postgres 공식 이미지 그대로 사용.
- **단위 테스트 가능**: 호스트에서 `bash -n`·`shellcheck` 실행.

## Upstream 추적

- Rustfs health endpoint 부재: github.com/rustfs/rustfs 에 `/healthz` 추가 제안
  (외부 action, 본 프로젝트 범위 외).
