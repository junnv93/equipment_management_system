# PostgreSQL 백업/복구 가이드

## 자동 백업 설정 (crontab)

```bash
# 편집: crontab -e
# 매일 새벽 2시 자동 백업 (7일 보관)
0 2 * * * /opt/equipment-management/scripts/backup/pg-backup.sh >> /var/log/pg-backup.log 2>&1
```

## 환경변수

| 변수             | 기본값                                       | 설명                |
| ---------------- | -------------------------------------------- | ------------------- |
| `BACKUP_DIR`     | `/opt/equipment-management/backups/postgres` | 백업 저장 경로      |
| `DB_NAME`        | `equipment_management`                       | 데이터베이스 이름   |
| `DB_USER`        | `postgres`                                   | PostgreSQL 사용자   |
| `RETAIN_DAYS`    | `7`                                          | 백업 보관 일수      |
| `CONTAINER_NAME` | `equipment-management-postgres-1`            | postgres 컨테이너명 |

## 수동 백업

```bash
./scripts/backup/pg-backup.sh
```

## 복구

```bash
./scripts/backup/pg-restore.sh /opt/equipment-management/backups/postgres/equipment_management_20260217_020000.sql.gz
```

## RTO/RPO 목표

| 지표                 | 목표               |
| -------------------- | ------------------ |
| RPO (복구 시점 목표) | 24시간 (일일 백업) |
| RTO (복구 시간 목표) | 30분 이내          |
