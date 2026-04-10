# Infrastructure

배포 및 인프라 관련 설정 파일들을 관리합니다.

## 디렉토리 구조

```
infra/
├── docker-compose.prod.yml   # 프로덕션 배포 (Nginx + 모니터링 + TLS)
├── docker-compose.lan.yml    # 내부 LAN 전용 배포 (단일 포트 9000)
├── nginx/                    # Nginx 설정 (리버스 프록시)
│   ├── nginx.conf.template   # 프로덕션용 (HTTPS + Certbot)
│   └── lan.conf              # LAN용 (HTTP 단일 포트)
├── monitoring/               # 모니터링 스택
│   ├── prometheus/           # Prometheus 설정 + 알림 규칙
│   ├── grafana/              # Grafana 프로비저닝
│   ├── alertmanager/         # Alertmanager 설정
│   ├── loki/                 # Loki 로그 수집 설정
│   └── promtail/             # Promtail 로그 전송 설정
└── certbot/                  # TLS 인증서 (배포 시 자동 생성)
```

## 사용법

모든 명령은 **프로젝트 루트**에서 실행합니다.

### 개발 환경

```bash
# 루트의 docker-compose.yml 사용 (PostgreSQL + Redis + RustFS만)
docker compose up -d
```

### LAN 배포 (사내 네트워크)

```bash
docker compose -f infra/docker-compose.lan.yml up -d

# DB 마이그레이션 (최초 또는 스키마 변경 시)
docker compose -f infra/docker-compose.lan.yml --profile migration run --rm migration
```

### 프로덕션 배포

```bash
docker compose -f infra/docker-compose.prod.yml up -d

# DB 마이그레이션
docker compose -f infra/docker-compose.prod.yml --profile migration run --rm migration
```

## 필수 환경 변수

프로덕션/LAN 배포 시 `.env` 파일에 다음 값이 필요합니다.

| 변수                   | 설명                       | 예시                            |
| ---------------------- | -------------------------- | ------------------------------- |
| `DB_PASSWORD`          | PostgreSQL 비밀번호        | —                               |
| `REDIS_PASSWORD`       | Redis 비밀번호             | —                               |
| `JWT_SECRET`           | JWT 서명 키                | —                               |
| `REFRESH_TOKEN_SECRET` | Refresh Token 서명 키      | —                               |
| `INTERNAL_API_KEY`     | 내부 API 키 (SSR 통신용)   | —                               |
| `S3_ACCESS_KEY`        | RustFS 접근 키             | —                               |
| `S3_SECRET_KEY`        | RustFS 비밀 키             | —                               |
| `FRONTEND_URL`         | 프론트엔드 공개 URL (CORS) | `https://equipment.example.com` |
| `SERVER_LAN_IP`        | LAN 서버 IP (LAN 전용)     | `192.168.1.100`                 |

> 전체 목록은 루트의 `.env.example` 참조

## Dockerfile 위치

| 서비스   | Dockerfile 경로                  |
| -------- | -------------------------------- |
| Backend  | `apps/backend/docker/Dockerfile` |
| Frontend | `apps/frontend/Dockerfile`       |
