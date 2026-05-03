# phase-k-backup-dr Evaluation

## Result

PASS

## Evidence

- Existing runbook `scripts/backup/README.md` documents crontab:
  `0 2 * * * /opt/equipment-management/scripts/backup/pg-backup.sh >> /var/log/pg-backup.log 2>&1`
- Existing scripts:
  - `scripts/backup/pg-backup.sh` runs `pg_dump` through the postgres container and validates the resulting gzip file.
  - `scripts/backup/pg-restore.sh` drops/recreates the target DB and restores `gunzip -c` into `psql`.
- Added `.github/workflows/main.yml` job `backup-restore-rehearsal`.
- Added runbook section describing the CI restore rehearsal in `scripts/backup/README.md`.

## Commands

- `bash -n scripts/backup/pg-backup.sh scripts/backup/pg-restore.sh`
- `pnpm exec prettier --check .github/workflows/main.yml scripts/backup/README.md`
