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

## 복원 리허설 CI

GitHub Actions `Backup Restore Rehearsal` job은 PR/push마다 PostgreSQL 15.13 service DB에 probe row를 만들고,
`pg_dump | gzip` 백업을 생성한 뒤 새 DB(`equipment_management_restore_rehearsal`)에 복원합니다.
복원 후 `dr_rehearsal_probe.checksum`을 조회해 백업 파일 무결성(`gzip -t`)과 실제 restore 경로를 함께 검증합니다.

## RTO/RPO 목표

| 지표                 | 목표               |
| -------------------- | ------------------ |
| RPO (복구 시점 목표) | 24시간 (일일 백업) |
| RTO (복구 시간 목표) | 30분 이내          |
