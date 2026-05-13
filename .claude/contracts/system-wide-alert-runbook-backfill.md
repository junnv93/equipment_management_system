---
name: system-wide-alert-runbook-backfill
description: Prometheus 11개 기존 alert에 runbook + runbook_url annotation backfill + docs 확장
metadata:
  type: project
---

# Contract — system-wide-alert-runbook-backfill

## Scope

`infra/monitoring/prometheus/alert.rules.yml` 의 11개 기존 alert에
`runbook` (즉시 행동 단계) + `runbook_url` annotation backfill.
`docs/operations/prometheus-alert-rules.md` §Runbook 섹션 확장 (기존 one-liner → 상세 절차).

**11개 대상 alert**:
HighCPUUsage / CriticalCPUUsage / HighMemoryUsage / CriticalMemoryUsage /
HighDiskUsage / CriticalDiskUsage / ContainerRestarting / ContainerHighMemory /
BackendDown / HighErrorRate / HighResponseTime

**변경 파일 (2개)**:
- `infra/monitoring/prometheus/alert.rules.yml`
- `docs/operations/prometheus-alert-rules.md`

---

## MUST Criteria

### M-1: 11개 alert 전수 runbook 보유

```bash
grep -c "runbook:" infra/monitoring/prometheus/alert.rules.yml
# 기대: 15 (기존 4 + 신규 11)
```

### M-2: 11개 alert 전수 runbook_url 보유

```bash
grep -c "runbook_url:" infra/monitoring/prometheus/alert.rules.yml
# 기대: 15 (기존 4 + 신규 11)
```

### M-3: runbook_url anchor 일관성 — 소문자 연속 패턴

```bash
# 기존 패턴: 'docs/operations/prometheus-alert-rules.md#alertnamelowercase'
grep "runbook_url:" infra/monitoring/prometheus/alert.rules.yml | grep -v "#"
# 기대: 출력 없음 (모든 runbook_url이 # anchor 포함)
```

### M-4: docs 섹션 anchor 11개 전수 존재

docs/operations/prometheus-alert-rules.md 에 11개 alert 각각의 `### AlertName` 섹션 존재.

```bash
for alert in HighCPUUsage CriticalCPUUsage HighMemoryUsage CriticalMemoryUsage \
             HighDiskUsage CriticalDiskUsage ContainerRestarting ContainerHighMemory \
             BackendDown HighErrorRate HighResponseTime; do
  grep -c "### ${alert}" docs/operations/prometheus-alert-rules.md || echo "MISSING: ${alert}"
done
# 기대: 모두 1 이상 출력
```

### M-5: promtool check rules 성공

```bash
docker run --rm --entrypoint promtool \
  -v "$(pwd)/infra/monitoring/prometheus:/etc/prometheus" \
  prom/prometheus:latest \
  check rules /etc/prometheus/alert.rules.yml
# 기대: SUCCESS
```

(Docker 미기동 환경: YAML 문법 파싱 오류 없음 — `python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)" < infra/monitoring/prometheus/alert.rules.yml && echo OK`)

### M-6: 기존 4개 alert runbook 내용 보존

SortRejectionRateHigh / SortRejectionSustainedAttack / ZodValidationIssuesHighCount / ZodValidationIssuesPersistentSpike 의 runbook 내용이 변경되지 않음.

```bash
grep -A3 "runbook_url: 'docs/operations/prometheus-alert-rules.md#sortrejectionratehigh'" \
  infra/monitoring/prometheus/alert.rules.yml
# 기대: 해당 라인 존재
```

---

## SHOULD Criteria

### S-1: 각 runbook이 최소 3단계 포함

runbook annotation 내에 번호 매긴 단계 (`1.` / `2.` / `3.`) 가 최소 3개 이상.

### S-2: critical alert runbook에 "oncall 에스컬레이션" 단계 포함

CriticalCPUUsage / CriticalMemoryUsage / CriticalDiskUsage / BackendDown runbook 에
oncall 에스컬레이션 명시.

### S-3: docker compose 명령어 일관성

runbook 내 컨테이너 명령어가 `docker compose` (v2) 형식 사용 (하이픈 없는 형식).
`docker-compose` (v1 deprecated) 사용 금지.
