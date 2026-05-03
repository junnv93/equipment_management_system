# phase-k-backup-dr

## Scope

- Close the Phase K backup/DR tracker item with concrete automation and runbook evidence.
- Preserve the existing production backup/restore scripts.
- Add CI restore rehearsal coverage that proves a compressed PostgreSQL dump can be restored into a fresh database and queried.

## Acceptance

- A pg_dump cron runbook exists for production/LAN operation.
- A restore runbook exists and documents the restore command.
- CI runs a restore rehearsal against PostgreSQL:
  - creates a probe row,
  - creates a gzip-compressed dump,
  - verifies gzip integrity,
  - restores into a fresh database,
  - queries the restored probe checksum.

## Verification

- `bash -n scripts/backup/pg-backup.sh scripts/backup/pg-restore.sh`
- `pnpm exec prettier --check .github/workflows/main.yml scripts/backup/README.md`
