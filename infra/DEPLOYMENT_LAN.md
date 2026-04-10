# 수원랩 내부 LAN 배포 가이드

## 개요

이 가이드는 **회사 데스크탑을 운영 서버**로 사용하여 수원랩 내부 유선 LAN에서만 접속 가능하도록 배포하는 방법을 설명합니다.

---

## 1. 사전 준비

### 1.1 운영 서버 데스크탑 요구사항

| 항목     | 최소 사양                   | 권장 사양               |
| -------- | --------------------------- | ----------------------- |
| CPU      | 4 Core                      | 8 Core                  |
| RAM      | 8GB                         | 16GB 이상               |
| 디스크   | 100GB 여유 공간             | 500GB SSD               |
| 네트워크 | 유선 LAN (100Mbps)          | 기가비트 이더넷 (1Gbps) |
| OS       | Ubuntu 20.04+ / Windows 10+ | Ubuntu 22.04 LTS        |

### 1.2 필수 소프트웨어 설치

#### Ubuntu/Linux

```bash
# Docker & Docker Compose 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose V2
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 재로그인 후 확인
docker --version
docker compose version
```

#### Windows

1. **WSL 2 설치** (PowerShell 관리자 권한)

   ```powershell
   wsl --install
   wsl --set-default-version 2
   ```

2. **Docker Desktop 설치**
   - https://www.docker.com/products/docker-desktop 다운로드
   - WSL 2 backend 활성화

---

## 2. 네트워크 설정

### 2.1 고정 IP 할당 (권장)

**운영 서버가 항상 같은 IP를 유지해야 합니다.**

#### Ubuntu

```bash
# 현재 IP 확인
ip addr show

# Netplan 설정 파일 편집
sudo nano /etc/netplan/01-netcfg.yaml
```

```yaml
network:
  version: 2
  ethernets:
    eth0: # 인터페이스 이름 (ip addr로 확인)
      dhcp4: no
      addresses:
        - 192.168.1.100/24 # 고정 IP 설정
      routes:
        - to: default
          via: 192.168.1.1 # 게이트웨이 (라우터 IP)
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

```bash
# 설정 적용
sudo netplan apply
```

#### Windows

1. **설정 > 네트워크 및 인터넷 > 이더넷**
2. **IP 설정 편집 → 수동**
3. 고정 IP 입력 (예: 192.168.1.100)

### 2.2 방화벽 설정

#### Ubuntu (ufw)

```bash
# 방화벽 활성화
sudo ufw enable

# 필요한 포트만 LAN에서 허용
sudo ufw allow from 192.168.1.0/24 to any port 80 proto tcp   # HTTP
sudo ufw allow from 192.168.1.0/24 to any port 3000 proto tcp # Frontend
sudo ufw allow from 192.168.1.0/24 to any port 3001 proto tcp # Backend

# 상태 확인
sudo ufw status
```

**⚠️ 외부 인터넷에서는 접근 불가능 (방화벽 차단)**

---

## 3. 배포 실행

### 3.1 환경변수 설정

```bash
cd /home/kmjkds/equipment_management_system

# 템플릿 복사
cp .env.production.template .env.production

# 환경변수 편집 (중요!)
nano .env.production
```

**필수 변경 항목:**

```bash
# 1. DB 비밀번호 (강력한 비밀번호 사용)
DB_PASSWORD=your_secure_password_here

# 2. Redis 비밀번호
REDIS_PASSWORD=your_redis_password_here

# 3. JWT 시크릿 생성
# 아래 명령어로 랜덤 문자열 생성
openssl rand -base64 32  # 결과를 복사하여 사용

JWT_SECRET=생성된_랜덤_문자열_1
REFRESH_TOKEN_SECRET=생성된_랜덤_문자열_2
NEXTAUTH_SECRET=생성된_랜덤_문자열_3

# 4. 운영 서버 LAN IP (ipconfig 또는 ip addr로 확인)
SERVER_LAN_IP=192.168.1.100
```

### 3.2 데이터 디렉토리 생성

```bash
# 영구 저장소 디렉토리 생성
sudo mkdir -p /var/lib/equipment-system/{postgres,redis,backups,logs/backend}
sudo chown -R $USER:$USER /var/lib/equipment-system
```

### 3.3 Docker 이미지 빌드 및 실행

```bash
# 1. 이미지 빌드 (최초 1회, 10~15분 소요)
docker compose -f docker-compose.lan.yml build

# 2. 컨테이너 실행
docker compose -f docker-compose.lan.yml up -d

# 3. 로그 확인
docker compose -f docker-compose.lan.yml logs -f

# 4. 컨테이너 상태 확인
docker ps
```

**실행 확인:**

```bash
# 모든 컨테이너가 "Up" 상태여야 함
CONTAINER ID   IMAGE                        STATUS
abcd1234       equipment_frontend_prod      Up 2 minutes
efgh5678       equipment_backend_prod       Up 2 minutes (healthy)
ijkl9012       equipment_postgres_prod      Up 2 minutes (healthy)
mnop3456       equipment_redis_prod         Up 2 minutes (healthy)
qrst7890       equipment_nginx_prod         Up 2 minutes
```

### 3.4 DB 마이그레이션 실행

```bash
# Backend 컨테이너 접속
docker exec -it equipment_backend_prod sh

# 마이그레이션 실행
npm run db:migrate

# 시드 데이터 로딩 (선택사항)
npm run db:seed

# 컨테이너 종료
exit
```

---

## 4. 접속 확인

### 4.1 로컬 (운영 서버)에서 확인

```bash
# Frontend
curl http://localhost:3000

# Backend API
curl http://localhost:3001/api/health

# Nginx (통합 포트)
curl http://localhost:80
```

### 4.2 다른 PC (같은 LAN)에서 확인

**브라우저에서 접속:**

```
http://192.168.1.100:80        # Nginx 통합 포트 (권장)
http://192.168.1.100:3000      # Frontend 직접
http://192.168.1.100:3001/api  # Backend 직접
```

### 4.3 hosts 파일 설정 (선택사항)

**각 클라이언트 PC에서 도메인 이름 사용:**

#### Windows

```
C:\Windows\System32\drivers\etc\hosts
```

#### Linux/Mac

```
/etc/hosts
```

**추가할 내용:**

```
192.168.1.100  equipment.suwon.local
```

**접속:**

```
http://equipment.suwon.local
```

---

## 5. 백업 관리

### 5.1 자동 백업 설정 (Cron)

```bash
# Crontab 편집
crontab -e

# 매일 새벽 2시에 자동 백업 (아래 라인 추가)
0 2 * * * /home/kmjkds/equipment_management_system/scripts/backup-database.sh
```

### 5.2 수동 백업

```bash
# 백업 실행
./scripts/backup-database.sh

# 백업 파일 확인
ls -lh /var/lib/equipment-system/backups/
```

### 5.3 복원

```bash
# 백업 파일 목록 확인
ls -lh /var/lib/equipment-system/backups/

# 특정 백업 복원
./scripts/restore-database.sh /var/lib/equipment-system/backups/postgres_equipment_2026-02-15_02-00-00.sql.gz
```

### 5.4 외부 저장소 백업 (권장)

**NAS, USB 외장 하드, 네트워크 드라이브로 백업 복사:**

```bash
# 예: NAS로 복사 (매일 새벽 3시)
0 3 * * * rsync -av /var/lib/equipment-system/backups/ /mnt/nas/equipment-backups/
```

---

## 6. 모니터링 & 관리

### 6.1 로그 확인

```bash
# 모든 컨테이너 로그
docker compose -f docker-compose.lan.yml logs -f

# 특정 서비스만
docker compose -f docker-compose.lan.yml logs -f backend
docker compose -f docker-compose.lan.yml logs -f postgres

# 애플리케이션 로그 파일
tail -f /var/lib/equipment-system/logs/backend/app.log
```

### 6.2 리소스 사용량 확인

```bash
# Docker 컨테이너 리소스 사용량
docker stats

# 디스크 사용량
df -h /var/lib/equipment-system
```

### 6.3 서비스 관리

```bash
# 재시작
docker compose -f docker-compose.lan.yml restart

# 중지
docker compose -f docker-compose.lan.yml stop

# 시작
docker compose -f docker-compose.lan.yml start

# 완전 삭제 (⚠️ 주의: 데이터는 보존됨)
docker compose -f docker-compose.lan.yml down
```

---

## 7. 스토리지 관리

### 7.1 디스크 사용량 모니터링

```bash
# 전체 디스크 사용량
du -sh /var/lib/equipment-system/*

# 백업 파일 크기
du -sh /var/lib/equipment-system/backups

# PostgreSQL 데이터 크기
docker exec equipment_postgres_prod du -sh /var/lib/postgresql/data
```

### 7.2 정리 작업

```bash
# Docker 미사용 이미지 정리
docker image prune -a

# Docker 미사용 볼륨 정리 (⚠️ 주의!)
docker volume prune

# 오래된 로그 삭제 (30일 이전)
find /var/lib/equipment-system/logs -name "*.log" -mtime +30 -delete
```

### 7.3 용량 확장 계획

| 데이터 유형   | 예상 증가량      | 관리 방법                    |
| ------------- | ---------------- | ---------------------------- |
| PostgreSQL DB | 월 1~5GB         | 정기 백업 후 아카이빙        |
| 로그 파일     | 월 500MB~1GB     | Docker log rotation (설정됨) |
| 백업 파일     | 백업당 100MB~1GB | 30일 보관 후 자동 삭제       |

**권장: 최소 100GB 여유 공간 유지**

---

## 8. 보안 고려사항

### 8.1 네트워크 격리 확인

```bash
# 외부 인터넷에서 접근 불가능 확인 (외부 PC에서)
curl http://your-public-ip:3000  # → Connection refused (OK)
```

### 8.2 비밀번호 관리

- `.env.production` 파일 권한 설정

  ```bash
  chmod 600 .env.production
  ```

- DB 비밀번호 주기적 변경 (3~6개월)

### 8.3 접근 제어

- Azure AD 통합으로 회사 계정만 로그인 가능
- 역할 기반 권한 관리 (RBAC) 활성화됨
- 감사 로그 자동 기록

---

## 9. 문제 해결

### 9.1 컨테이너가 시작되지 않을 때

```bash
# 로그 확인
docker compose -f docker-compose.lan.yml logs backend

# 컨테이너 상태 확인
docker ps -a

# 컨테이너 재생성
docker compose -f docker-compose.lan.yml up -d --force-recreate
```

### 9.2 DB 연결 실패

```bash
# PostgreSQL 컨테이너 로그 확인
docker logs equipment_postgres_prod

# 컨테이너 내부 접속하여 확인
docker exec -it equipment_postgres_prod psql -U postgres -d postgres_equipment
```

### 9.3 디스크 용량 부족

```bash
# Docker 정리
docker system prune -a --volumes

# 오래된 백업 삭제
find /var/lib/equipment-system/backups -name "*.sql.gz" -mtime +60 -delete
```

### 9.4 성능 저하

```bash
# 리소스 사용량 확인
docker stats

# PostgreSQL 성능 분석
docker exec equipment_postgres_prod psql -U postgres -d postgres_equipment -c "SELECT * FROM pg_stat_activity;"

# Redis 캐시 초기화
docker exec equipment_redis_prod redis-cli -a ${REDIS_PASSWORD} FLUSHALL
```

---

## 10. 운영 체크리스트

### 일일 점검

- [ ] 서비스 정상 동작 확인 (http://192.168.1.100)
- [ ] 디스크 여유 공간 확인 (최소 10GB 이상)

### 주간 점검

- [ ] 백업 파일 생성 확인
- [ ] 로그 파일 크기 확인
- [ ] 시스템 리소스 사용량 (CPU, RAM) 확인

### 월간 점검

- [ ] 백업 복원 테스트 (테스트 환경)
- [ ] Docker 이미지 업데이트
- [ ] 보안 패치 적용
- [ ] 감사 로그 아카이빙

---

## 11. 연락처 & 지원

### 시스템 관리자

- 이름: [관리자 이름]
- 이메일: [이메일]
- 내선: [내선번호]

### 긴급 상황

1. **서비스 다운**: 백업에서 즉시 복원
2. **데이터 손실**: 최근 백업으로 복구
3. **보안 사고**: 즉시 컨테이너 중지 후 로그 분석

---

## 12. 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [PostgreSQL 백업 가이드](https://www.postgresql.org/docs/current/backup.html)
- [프로젝트 CLAUDE.md](./CLAUDE.md)
