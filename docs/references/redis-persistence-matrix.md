# Redis Persistence Matrix

Equipment Management System의 환경별 Redis 운영 정책. JWT blacklist·cache 용도만
사용하며 BullMQ 등 queue 워크로드는 없음 (2026-04-15 기준).

## 매트릭스

| 환경          | Compose 파일                                | Persistence                                 | Volume                            | 근거                                                                                                |
| ------------- | ------------------------------------------- | ------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| **dev**       | `docker-compose.yml`                        | **Ephemeral** (`--save "" --appendonly no`) | 없음                              | 포맷 드리프트 방어 (defense-in-depth). JWT blacklist는 access token 15분 TTL이 흡수.                |
| **test / CI** | (별도 compose 없음; prod 구성 재사용 권장)  | **AOF**                                     | `redis_data`                      | prod parity — 보안 회귀 테스트에 blacklist 동작 재현 필요.                                          |
| **staging**   | `infra/docker-compose.prod.yml` (별도 .env) | **AOF**                                     | `redis_data`                      | prod parity.                                                                                        |
| **prod**      | `infra/docker-compose.prod.yml`             | **AOF** (`--appendonly yes`)                | `redis_data`                      | **refresh token revoke 유지 필수** (refresh 7일·절대만료 30일). Redis 재기동 시에도 blacklist 유지. |
| **lan**       | `infra/docker-compose.lan.yml`              | **AOF** (`--appendonly yes`)                | `/var/lib/equipment-system/redis` | 프로덕션 동등.                                                                                      |

## 왜 dev만 ephemeral인가

**장점:**

- **RDB/AOF 포맷 드리프트 구조적 차단.** 이미지 업/다운그레이드 시 호환성 이슈 원천 봉쇄. (2026-04-15 "Can't handle RDB format version 13" 사건 동종 재발 방지.)
- 볼륨 관리 부담 제거. 개발자 PC 이동·리셋 시 수동 청소 불요.
- Dev access token TTL 15분 → 로그아웃 후 즉시 재로그인해도 위험 노출 시간 ≤15분.

**trade-off:**

- Redis 재기동 시 blacklist 손실 → revoke된 **refresh token**이 최대 남은 TTL 동안 재유효.
  - dev 환경에서는 수용 가능한 위험 (실제 사용자 없음).
  - **test/staging/prod에는 이 옵션을 확산하지 말 것.** 해당 환경들은 AOF 유지.

## 왜 prod는 AOF인가 (RDB가 아닌)

- AOF는 **모든 쓰기 연산 기록** → revoke 직후 Redis 크래시해도 유실 없음.
- RDB는 스냅샷 주기(default 5분) 내 쓰기 손실 가능 → 보안 critical 데이터에 부적합.
- `maxmemory 256mb` + `allkeys-lru`와 병행. blacklist 엔트리는 TTL로 자연 정리.

## 근본 원인 이미 해결됨 vs 추가 방어

이 매트릭스는 **진짜 근본 원인인 이미지 태그 핀닝**(`d259ead5`·`0482fd49` 커밋)을
대체하지 않는다. 핀닝이 유지되는 한 포맷 드리프트는 구조적으로 불가능하다.
Ephemeral 전환은 **추가 방어층**이며 dev에만 적용해 blacklist 보안을 타협하지 않는다.

## 운영 가이드

### Dev에서 RDB 포맷 이슈 발생 시

```bash
# predev-guard가 자동 탐지·수복함 (package.json predev hook)
# 수동 실행:
bash infra/scripts/predev-guard.sh --dry-run   # 감지만
bash infra/scripts/predev-guard.sh             # 자동 수복
```

### Prod에서 Redis 버전 업그레이드

1. `infra/docker-compose.prod.yml`의 `redis:7.4-alpine` 이미지 태그 변경.
2. **AOF 파일(`appendonly.aof`)은 forward-compatible** — 상위 버전은 하위 AOF 읽기 가능.
3. **RDB는 forward-only** — 하위 버전으로 롤백 불가. 업그레이드 전 dump 백업 필수.
4. 업그레이드 후 `infra/docker-compose.lan.yml` · `docker-compose.yml`도 동시 업데이트 (SSOT).

## 참조

- `infra/healthchecks/redis-liveness.sh` — probe SSOT
- `infra/scripts/predev-guard.sh` — 포맷 드리프트 자동 탐지
- `apps/backend/src/common/cache/redis-cache.service.ts` — 캐시 클라이언트
- `apps/backend/src/modules/auth/blacklist/redis-blacklist.provider.ts` — 블랙리스트 저장소
