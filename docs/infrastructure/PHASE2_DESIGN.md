# Phase 2 설계 문서 (1-2주 내 구현)

## P2-1. Frontend Dockerfile 완전 교체 (Critical)

### 문제

`apps/frontend/docker/Dockerfile` 프로덕션 스테이지가 더미 `server.js`를 배포 중.
`docker-compose.prod.yml`이 이 파일을 사용하고 있어 **실제 Next.js 앱이 서비스되지 않음.**

### 해결

`docker-compose.prod.yml`의 frontend `dockerfile:` 경로를
`apps/frontend/docker/Dockerfile` → `apps/frontend/Dockerfile` 으로 교체.
(루트 Dockerfile은 올바른 multi-stage 빌드)

또는 `apps/frontend/docker/Dockerfile`을 루트 Dockerfile과 동기화.

### 검증

```bash
docker build -t frontend-test -f apps/frontend/Dockerfile --target production .
docker run -p 3000:3000 frontend-test
curl http://localhost:3000  # HTML 응답 확인 (더미가 아닌 실제 Next.js)
```

---

## P2-2. 배포 무중단 전략 (단일 서버 제약 내)

### 현재 문제

`docker compose up -d`는 컨테이너를 stop → start 순서로 재시작.
frontend+backend 동시 재시작 시 약 10-30초 다운타임 발생.

### 해결: 순차적 서비스별 재배포

```bash
# deploy.sh — 서비스 순서 제어
#!/bin/bash
set -e

echo "Backend 업데이트..."
docker compose -f docker-compose.prod.yml up -d --no-deps backend
sleep 15  # backend 헬스체크 대기

echo "Frontend 업데이트..."
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
sleep 10

echo "Nginx reload (다운타임 없음)..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "배포 완료"
```

### 롤백 스크립트

```bash
# rollback.sh <sha>
SHA="${1:-}"
if [ -z "$SHA" ]; then
  echo "사용법: ./rollback.sh <git-sha>"
  exit 1
fi

# Docker Hub에서 특정 SHA 이미지로 롤백
REGISTRY="${DOCKER_HUB_USERNAME}/equipment-management"
docker pull "${REGISTRY}-backend:${SHA}"
docker pull "${REGISTRY}-frontend:${SHA}"

docker tag "${REGISTRY}-backend:${SHA}" "${REGISTRY}-backend:latest"
docker tag "${REGISTRY}-frontend:${SHA}" "${REGISTRY}-frontend:latest"

docker compose -f docker-compose.prod.yml up -d --no-deps backend
sleep 15
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
```

---

## P2-3. NestJS 메트릭 통합 (Prometheus)

```bash
pnpm --filter backend add @willsoto/nestjs-prometheus prom-client
```

### 수집할 메트릭

| 메트릭                          | 설명                 | 알림 조건    |
| ------------------------------- | -------------------- | ------------ |
| `http_request_duration_seconds` | API 응답 시간        | p95 > 2초    |
| `http_requests_total`           | 엔드포인트별 요청 수 | -            |
| `http_request_errors_total`     | 5xx 에러 수          | 5분간 10개+  |
| `active_checkouts_total`        | 활성 반출 건수       | 비즈니스 KPI |
| `pending_approvals_total`       | 대기 중 승인 수      | 비즈니스 KPI |

---

## P2-4. Alertmanager + Slack 알림

```yaml
# monitoring/alertmanager/alertmanager.yml
route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#infra-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

---

## P2-5. DB 마이그레이션 전략

### 현재 문제

배포 시 DB 스키마 변경이 자동으로 실행되지 않음.

### 해결: 배포 전 Migration Job

```yaml
# docker-compose.prod.yml에 추가
migration:
  image: ${{ secrets.DOCKER_HUB_USERNAME }}/equipment-management-backend:$SHA
  command: ['node', 'apps/backend/dist/database/migrate.js']
  environment:
    - DATABASE_URL=${DATABASE_URL}
  depends_on:
    postgres:
      condition: service_healthy
  restart: 'no' # 1회 실행 후 종료
```

GitHub Actions 배포 스크립트에서 `migration` 서비스 먼저 실행 → 완료 후 backend 재시작.
