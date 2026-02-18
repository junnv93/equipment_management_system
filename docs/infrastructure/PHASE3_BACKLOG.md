# Phase 3 백로그 (착수 트리거 조건 명시)

## P3-1. ELK Stack → Loki/Promtail 경량화 전환

### 착수 트리거

- 서버 메모리가 지속적으로 85%+ 점유 (ELK가 768MB+ 소모)
- 또는 Elasticsearch 인덱스 관리 비용이 운영팀에게 과도한 부담이 될 때

### 설계

```
[컨테이너 로그] → Promtail → Loki → Grafana
```

**장점:**

- ELK 대비 메모리 10배 절약 (Loki: ~50MB vs ES: 512MB)
- Grafana와 동일 스택 (별도 Kibana 불필요)
- LogQL이 PromQL과 유사 → 학습 비용 최소

**마이그레이션 전략:**

1. ELK와 Loki 병행 운영 2주
2. 로그 쿼리 패턴 검증
3. ELK 서비스 제거

---

## P3-2. WAL 아카이빙 (RPO 개선)

### 착수 트리거

- 데이터 손실 허용 범위가 24시간 → 1시간 이하로 요구될 때
- 규정 감사에서 더 짧은 RPO가 요구될 때

### 설계

```bash
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'gzip -c %p > /backup/wal/%f.gz'
```

---

## P3-3. SSL/HTTPS 적용 (외부 접근 시)

### 착수 트리거

- 시스템이 외부 인터넷에 노출될 때
- Azure AD 리다이렉트 URI가 공인 도메인으로 변경될 때

### 현재 nginx/lan.conf가 내부망 전용으로 HTTP만 사용.

Let's Encrypt + Certbot은 이미 docker-compose.prod.yml에 포함됨.

`nginx/conf.d/ssl.conf` 추가만으로 활성화 가능.

---

## P3-4. Dependabot 자동 의존성 업데이트

### 착수 트리거

- 팀이 수동 패키지 업데이트에 30분/주 이상 소모할 때

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    groups:
      production-dependencies:
        dependency-type: 'production'
  - package-ecosystem: 'docker'
    directory: '/'
    schedule:
      interval: 'weekly'
  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'weekly'
```
