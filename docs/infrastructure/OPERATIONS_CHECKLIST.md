# 운영 체크리스트

## 일일 점검 (자동화 가능)

| 항목                      | 점검 방법                                                               | 자동화 | 자동화 방법                                  |
| ------------------------- | ----------------------------------------------------------------------- | ------ | -------------------------------------------- |
| 서비스 헬스               | `docker compose -f docker-compose.prod.yml ps`                          | ✅     | Prometheus + AlertRule `ContainerRestarting` |
| 디스크 사용률             | `df -h`                                                                 | ✅     | AlertRule `HighDiskUsage` (85%+)             |
| 백업 파일 생성 확인       | `ls -la backups/postgres/`                                              | ✅     | crontab 로그: `/var/log/pg-backup.log`       |
| 에러 로그 확인            | Kibana → `equipment-mgmt-backend-*` 인덱스 → level:error                | ✅     | Logstash 필터 → 에러 시 Slack 알림 (Phase 2) |
| Nginx 접근 로그 이상 패턴 | `docker logs nginx --since 24h \| grep -E "(4[0-9][0-9]\|5[0-9][0-9])"` | 부분   | Filebeat → 에러율 Grafana 패널               |

## 주간 점검 (수동)

| 항목                  | 점검 방법                                                         | 예상 소요 시간 |
| --------------------- | ----------------------------------------------------------------- | -------------- |
| 백업 복구 테스트      | `./scripts/backup/pg-restore.sh <최신_백업>` (스테이징 서버 권장) | 30분           |
| Docker 이미지 정리    | `docker image ls \| grep equipment` → 오래된 SHA 태그 제거        | 5분            |
| pnpm audit 실행       | `pnpm audit --prod` (CI 외 로컬 점검)                             | 5분            |
| Grafana 대시보드 확인 | 주요 지표 추세 확인 (CPU, 메모리, 에러율)                         | 15분           |
| SSL 인증서 만료 확인  | `docker logs certbot --since 7d`                                  | 5분            |

## 월간 점검 (수동)

| 항목                       | 점검 방법                                                            | 예상 소요 시간 |
| -------------------------- | -------------------------------------------------------------------- | -------------- |
| PostgreSQL VACUUM/ANALYZE  | `docker compose exec postgres psql -U postgres -c "VACUUM ANALYZE;"` | 가변           |
| 로그 인덱스 용량           | Kibana → Management → Index Management                               | 10분           |
| Elasticsearch 인덱스 정리  | 30일 이상 인덱스 삭제                                                | 15분           |
| GitHub Actions 사용량 확인 | Settings → Billing → Actions (2,000분/월 무료)                       | 5분            |
| 보안 의존성 리뷰           | OWASP 리포트 아티팩트 검토                                           | 30분           |
| JWT_SECRET 로테이션 검토   | 이상 징후 없으면 유지, 있으면 로테이션                               | 가변           |

## 이상 징후 대응 절차

### 서비스 다운 감지

```bash
# 1. 상태 확인
docker compose -f docker-compose.prod.yml ps

# 2. 로그 확인
docker compose -f docker-compose.prod.yml logs --tail=100 backend
docker compose -f docker-compose.prod.yml logs --tail=100 frontend

# 3. 재시작
docker compose -f docker-compose.prod.yml restart backend

# 4. 안 되면 최신 이미지로 재배포
docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d

# 5. 그래도 안 되면 롤백 (Phase 2 구현 후 가능)
./scripts/deploy/rollback.sh <이전-sha>
```

### DB 연결 실패

```bash
# DB 상태 확인
docker compose -f docker-compose.prod.yml ps postgres

# 연결 테스트
docker compose exec postgres pg_isready -U postgres

# 로그 확인
docker compose -f docker-compose.prod.yml logs postgres --tail=50

# 최후 수단: 백업에서 복구
./scripts/backup/pg-restore.sh <최신_백업>
```

### 디스크 용량 부족

```bash
# 공간 확보 순서:
# 1. 오래된 백업 삭제 (RETAIN_DAYS 기본 7일)
find /opt/equipment-management/backups -name "*.sql.gz" -mtime +7 -delete

# 2. Elasticsearch 오래된 인덱스 삭제
curl -X DELETE "localhost:9200/equipment-mgmt-*-$(date -d '30 days ago' +%Y.%m)*"

# 3. Docker dangling 이미지/볼륨 정리
docker system prune -f

# 4. Nginx 로그 정리 (max-file: 5 설정으로 자동 관리됨)
```
