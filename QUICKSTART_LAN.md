# 수원랩 내부 LAN 배포 - 빠른 시작 가이드

## 5분 안에 배포하기

### 1단계: 환경변수 설정 (2분)

```bash
cd /home/kmjkds/equipment_management_system

# 환경변수 템플릿 복사
cp .env.production.template .env.production

# 필수 값 변경
nano .env.production
```

**반드시 변경해야 할 값:**

```bash
DB_PASSWORD=강력한_비밀번호_입력
REDIS_PASSWORD=Redis_비밀번호_입력
JWT_SECRET=$(openssl rand -base64 32)           # 자동 생성
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32) # 자동 생성
NEXTAUTH_SECRET=$(openssl rand -base64 32)      # 자동 생성
SERVER_LAN_IP=192.168.1.100  # 실제 서버 IP로 변경
```

### 2단계: 데이터 디렉토리 생성 (1분)

```bash
sudo mkdir -p /var/lib/equipment-system/{postgres,redis,backups,logs/backend}
sudo chown -R $USER:$USER /var/lib/equipment-system
```

### 3단계: 배포 실행 (2분)

```bash
# Docker Compose로 전체 시스템 실행
docker compose -f docker-compose.lan.yml up -d

# 로그 확인 (모든 컨테이너가 "Up" 상태 확인)
docker ps
```

### 4단계: 접속 확인

**브라우저에서:**

```
http://192.168.1.100:80
```

---

## 주요 명령어 요약

### 시스템 제어

| 작업      | 명령어                                             |
| --------- | -------------------------------------------------- |
| 시작      | `docker compose -f docker-compose.lan.yml up -d`   |
| 중지      | `docker compose -f docker-compose.lan.yml stop`    |
| 재시작    | `docker compose -f docker-compose.lan.yml restart` |
| 로그 확인 | `docker compose -f docker-compose.lan.yml logs -f` |
| 상태 확인 | `docker ps`                                        |

### 백업 & 복원

| 작업           | 명령어                                                 |
| -------------- | ------------------------------------------------------ |
| 수동 백업      | `./scripts/backup-database.sh`                         |
| 백업 목록      | `ls -lh /var/lib/equipment-system/backups/`            |
| 복원           | `./scripts/restore-database.sh <백업파일경로>`         |
| 자동 백업 설정 | `crontab -e` → `0 2 * * * /path/to/backup-database.sh` |

### 헬스체크

```bash
# 전체 시스템 상태 확인
./scripts/healthcheck.sh
```

---

## 문제 해결 3단계

### 1단계: 로그 확인

```bash
docker compose -f docker-compose.lan.yml logs backend
```

### 2단계: 컨테이너 재시작

```bash
docker compose -f docker-compose.lan.yml restart
```

### 3단계: 완전 재배포

```bash
docker compose -f docker-compose.lan.yml down
docker compose -f docker-compose.lan.yml up -d --force-recreate
```

---

## 네트워크 접근 설정

### 클라이언트 PC에서 접속

**옵션 1: IP 직접 사용**

```
http://192.168.1.100:80
```

**옵션 2: 도메인 이름 사용 (권장)**

1. **hosts 파일 편집**

   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - Linux/Mac: `/etc/hosts`

2. **아래 라인 추가**

   ```
   192.168.1.100  equipment.suwon.local
   ```

3. **접속**
   ```
   http://equipment.suwon.local
   ```

---

## 자동 시작 설정 (선택사항)

### Ubuntu (systemd)

```bash
# 서비스 파일 생성
sudo nano /etc/systemd/system/equipment-system.service
```

```ini
[Unit]
Description=Equipment Management System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/kmjkds/equipment_management_system
ExecStart=/usr/bin/docker compose -f docker-compose.lan.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.lan.yml stop
User=kmjkds

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 활성화
sudo systemctl enable equipment-system.service
sudo systemctl start equipment-system.service

# 상태 확인
sudo systemctl status equipment-system.service
```

---

## 일일 운영 체크리스트

- [ ] 시스템 접근 가능 확인 (http://192.168.1.100)
- [ ] 디스크 여유 공간 확인 (`df -h`)
- [ ] 백업 파일 생성 확인 (매일 새벽 2시)
- [ ] 주요 에러 로그 확인 (`docker logs`)

---

## 연락처

| 항목          | 정보                                |
| ------------- | ----------------------------------- |
| 시스템 관리자 | [이름] ([이메일])                   |
| 내부 URL      | http://192.168.1.100                |
| 백업 위치     | `/var/lib/equipment-system/backups` |
| 로그 위치     | `/var/lib/equipment-system/logs`    |

---

## 추가 문서

- 📖 [상세 배포 가이드](./DEPLOYMENT_LAN.md)
- 📖 [프로젝트 문서](./CLAUDE.md)
- 📖 [개발 가이드](./README.md)
