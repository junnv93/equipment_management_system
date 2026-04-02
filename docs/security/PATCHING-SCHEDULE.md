# Server Patching & Vulnerability Management Schedule

**Effective Date:** 2026-04-02
**Owner:** Myeongjun Kwon, Laboratory Engineer Associate
**Review Cadence:** Quarterly

---

## Monthly Patching Window

**Schedule:** First Monday of each month, 18:00-20:00 KST (after business hours)

### 1. Host OS (Windows)

| Task                   | Tool                  | Frequency                              |
| ---------------------- | --------------------- | -------------------------------------- |
| Windows Update         | Windows Update / WSUS | Monthly (Patch Tuesday + first Monday) |
| BitLocker health check | `manage-bde -status`  | Monthly                                |
| WSL2 kernel update     | `wsl --update`        | Monthly                                |

### 2. Docker Container Images

| Image                  | Current Version | Update Method              | Frequency |
| ---------------------- | --------------- | -------------------------- | --------- |
| `node:20-alpine`       | 20.x LTS        | Rebuild with `--pull`      | Monthly   |
| `postgres:15`          | 15.x            | `docker pull postgres:15`  | Monthly   |
| `redis:alpine`         | 7.x             | `docker pull redis:alpine` | Monthly   |
| `nginx:alpine`         | Latest Alpine   | `docker pull nginx:alpine` | Monthly   |
| `rustfs/rustfs:latest` | Latest          | `docker pull`              | Monthly   |

**Procedure:**

```bash
# 1. Pull latest images
docker compose -f docker-compose.prod.yml pull

# 2. Recreate containers with new images (zero-downtime for stateless services)
docker compose -f docker-compose.prod.yml up -d --force-recreate

# 3. Verify health
docker compose -f docker-compose.prod.yml ps
curl -k https://localhost/api/monitoring/health
```

### 3. Application Dependencies

| Task                      | Tool           | Frequency                          |
| ------------------------- | -------------- | ---------------------------------- |
| npm dependency updates    | Dependabot PRs | Weekly (automated)                 |
| npm audit (High/Critical) | CI pipeline    | Every push/PR (automated)          |
| CodeQL SAST scan          | GitHub Actions | Weekly + every push/PR (automated) |
| Manual dependency review  | `pnpm audit`   | Monthly (during patching window)   |

### 4. Monitoring Stack

| Image                    | Version Policy                    | Frequency |
| ------------------------ | --------------------------------- | --------- |
| `grafana/loki:2.9.4`     | Pinned — update on minor releases | Quarterly |
| `grafana/promtail:2.9.4` | Pinned — matches Loki version     | Quarterly |
| `prom/prometheus:latest` | Latest — auto-update on pull      | Monthly   |
| `grafana/grafana:latest` | Latest — auto-update on pull      | Monthly   |

---

## Vulnerability Response SLAs

| Severity                  | Response Time       | Resolution Time       |
| ------------------------- | ------------------- | --------------------- |
| **Critical** (CVSS 9.0+)  | 24 hours            | 72 hours              |
| **High** (CVSS 7.0-8.9)   | 1 week              | 2 weeks               |
| **Medium** (CVSS 4.0-6.9) | 2 weeks             | Next monthly window   |
| **Low** (CVSS 0.1-3.9)    | Next monthly window | Next quarterly review |

**Automated enforcement:**

- CI pipeline blocks merge on Critical npm vulnerabilities (`pnpm audit --prod --audit-level=critical`)
- CodeQL blocks merge on High/Critical SAST findings
- Dependabot creates automated PRs for vulnerable dependencies

---

## Patching Log

| Date | Scope | Changes | Verified By |
| ---- | ----- | ------- | ----------- |
|      |       |         |             |

---

## Exceptions

- **Emergency patches** (Critical/zero-day): Applied immediately, outside regular window
- **Database schema changes**: Not part of OS patching — managed via Drizzle ORM migrations in separate release process
- **Monitoring stack**: Quarterly update cycle (lower risk, isolated network)
