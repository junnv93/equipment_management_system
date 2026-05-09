# Prometheus Alert Rules — 운영 절차

본 문서는 `infra/monitoring/prometheus/alert.rules.yml` (rule SSOT) 의 추가/수정/배포
운영 절차를 정의합니다. 신규 alert 추가 시 본 문서의 Workflow 섹션을 따르고,
기존 alert 발생 시 §Runbook 섹션의 alert 별 절차를 참조합니다.

## 구성

| 컴포넌트               | 위치                                                 | 역할                                                   |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Prometheus rule SSOT   | `infra/monitoring/prometheus/alert.rules.yml`        | alert 정의                                             |
| Prometheus config      | `infra/monitoring/prometheus/prometheus.yml`         | rule 파일 mount + scrape target                        |
| AlertManager 라우팅    | `infra/monitoring/alertmanager/alertmanager.yml`     | severity 별 receiver (slack-critical / slack-warnings) |
| Backend MetricsService | `apps/backend/src/common/metrics/metrics.service.ts` | Counter/Histogram/Gauge 등록 SSOT                      |
| Backend `/api/metrics` | `prom-client` exposition (`@Public()` endpoint)      | scrape source                                          |

## Workflow — 신규 alert 추가

### 1. Counter/Histogram/Gauge 신설 (필요 시)

```typescript
// apps/backend/src/common/metrics/metrics.service.ts
this.myDomainCounter = new Counter({
  name: 'my_domain_events_total',
  help: 'Domain X events bucketed by Y',
  labelNames: ['route', 'reason'], // cardinality < 200 강제
  registers: [this.registry],
});
```

**카디널리티 룰**: 라벨 값의 곱은 **200 이하**로 통제 (Prometheus 모범 사례).
예: 50 routes × 4 buckets = 200. user_id / equipment_uuid 등 무한 cardinality 라벨 금지.

### 2. Alert rule 작성

```yaml
# infra/monitoring/prometheus/alert.rules.yml
- name: my-domain
  interval: 30s
  rules:
    - alert: MyDomainSpike
      expr: |
        sum(rate(my_domain_events_total[5m])) > 0.1
      for: 10m # warning: 10m / critical: 5m (escalation 패턴)
      labels:
        severity: warning # warning → #infra-warnings / critical → #infra-alerts
      annotations:
        summary: '한 줄 요약'
        description: |
          상세 설명 (원인 가능성 명시)
          value={{ $value | printf "%.3f" }} req/s
        runbook: |
          1. 즉시 행동 (Grafana 패널 / 로그 명령어)
          2. 조사 절차
          3. 단기 완화 옵션
          4. 에스컬레이션 트리거
        runbook_url: 'docs/operations/prometheus-alert-rules.md#mydomainspike'
```

**필수 필드**:

- `summary` — 한 줄, severity 명시 (warning/critical)
- `description` — 임계값 의미 + value placeholder
- `runbook` — **운영자가 alert 받는 즉시 따를 수 있는** 단계별 절차
- `runbook_url` — 본 문서 anchor 링크 (상세 절차 + ADR 연계)

**Slack 노출 보장**: alertmanager.yml Slack `text:` 템플릿이
`{{ if .Annotations.runbook }}*Runbook:* ```{{ .Annotations.runbook }}``` {{ end }}`

- `{{ if .Annotations.runbook_url }}*Details:* <URL|운영 절차 문서>{{ end }}` 가드 패턴으로
  runbook 보유 alert 만 노출 (미보유 alert 는 빈 섹션 출력 안 함). 신규 alert 에 runbook 추가 시
  별도 템플릿 변경 불필요 — 가드가 자동 포함.

### 3. 정적 검증 (커밋 전 필수)

```bash
docker run --rm --entrypoint promtool \
  -v "$(pwd)/infra/monitoring/prometheus:/etc/prometheus" \
  prom/prometheus:latest \
  check rules /etc/prometheus/alert.rules.yml
# 기대: SUCCESS: N rules found  (N = 기존 + 신규)
```

PromQL syntax / label selector / `for` duration parse 검증. 실패 시 commit 차단.

### 4. Prometheus reload (배포 후)

```bash
# Option A — Docker compose 환경
docker compose -f infra/docker-compose.prod.yml kill -s HUP prometheus

# Option B — HTTP API (Prometheus가 --web.enable-lifecycle 플래그로 기동된 경우)
curl -X POST http://prometheus:9090/-/reload
```

**검증**:

```bash
curl -s http://prometheus:9090/api/v1/rules | jq '.data.groups[].name'
# 기대: 신규 그룹 이름 출력
```

### 5. AlertManager 라우팅 검증 (severity 변경 시)

```bash
# 현재 라우팅 확인
docker compose exec alertmanager amtool config routes \
  --config.file=/etc/alertmanager/alertmanager.yml

# 시뮬레이션 (alert를 받았을 때 어느 receiver 로 가는지)
docker compose exec alertmanager amtool config routes test \
  severity=critical alertname=MyDomainSpike
# 기대: slack-critical
```

## Runbook — 기존 alert 별 즉시 행동 절차

### ZodValidationIssuesHighCount

**Severity**: warning · **for**: 10m · **임계**: `> 0.1 req/s` (5m rate)

`zod_validation_issues_total{issue_count_bucket="11+"}` 5분 평균 0.1건/초 (= 6건/분) 초과.

**Root cause 가능성**:

- 단일 폼의 광범위 검증 누락 (frontend Zod resolver 회귀)
- backend DTO schema 드리프트 (필수 필드 추가 후 frontend 미반영)
- bot/scraper 의 invalid payload 폭주 (경계 검증 부족)

**즉시 행동**:

1. **핫스팟 식별** — Grafana `Zod Validation Issues` 패널 또는 직접 query:
   ```promql
   topk(5, sum by (domain_route) (
     rate(zod_validation_issues_total{issue_count_bucket="11+"}[15m])
   ))
   ```
2. **backend 로그 조회**:
   ```bash
   docker compose logs --tail=200 backend | grep -i "ZodValidation\|VALIDATION_ERROR"
   ```
3. **frontend 회귀 점검** — 식별된 라우트의 form mutation 에서:
   - `react-hook-form` `resolver: zodResolver(...)` 누락 여부
   - 도메인 mapper hub fallback 호출 누락 여부 (ts-morph spec 회귀 — `pnpm --filter frontend test zod-fallback-coverage`)
4. **schema 변경 추적**:
   ```bash
   git log --since='1 week ago' packages/schemas/ apps/backend/src/modules/*/dto/
   ```
5. **30분 내 하강 미관측 시** → `ZodValidationIssuesPersistentSpike` critical 도달 가능 → 아래 절차로 전환

### ZodValidationIssuesPersistentSpike

**Severity**: critical · **for**: 5m · **임계**: `> 1 req/s` (5m rate)

5분 평균 1건/초 초과 — backend payload size +30% 위험 임계 도달.
**ADR-0008 §4 reconsideration 트리거 충족**.

**즉시 행동**:

1. **영향 평가** — 응답 시간 동시 상승 여부:
   ```promql
   histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
   ```
   p95 > 3s 동반 시 — 캐스케이드 장애 가능, oncall 에스컬레이션
2. **ADR-0008 §4 검토 시작** — 다음 옵션 평가:
   - **(a) 다중 issue 압축**: `packages/schemas/src/validation/zod-issue.ts`
     `serializeZodIssue` 측 truncate 로직 (issues array 길이 cap, 예: 10개)
   - **(b) Accept-Language 헤더 부분 도입** (Option A 부분 — backend 측 i18n 미적용 도메인)
   - **(c) frontend 사전 검증 강화** — 식별된 라우트의 form 측 Zod 검증 보강
3. **단기 완화 (1시간 내 적용 가능)**:
   ```typescript
   // packages/schemas/src/validation/zod-issue.ts
   export const MAX_ISSUES_PER_RESPONSE = 10;
   if (issues.length > MAX_ISSUES_PER_RESPONSE) {
     issues = issues.slice(0, MAX_ISSUES_PER_RESPONSE);
   }
   ```
4. **장기 해결**: ADR-0008 supersede 또는 §Decision 갱신 (backend 응답 i18n 부분 도입 등)

### HighCPUUsage / HighMemoryUsage / HighDiskUsage

표준 infrastructure alert. node_exporter 메트릭 기반.
**즉시 행동**: `docker stats` + `top` 으로 hotspot 컨테이너 식별 → resource limit 검토.

### BackendDown

**즉시 행동**:

1. `docker compose ps backend` — 컨테이너 상태 확인
2. `docker compose logs --tail=200 backend` — startup 에러 / OOM 점검
3. `docker compose restart backend` — 재기동 시도 (uncommitted DB 마이그레이션 없는지 확인)
4. 5분 내 복구 미관측 시 oncall 에스컬레이션

### HighErrorRate / HighResponseTime

application 메트릭 기반. **즉시 행동**: backend 로그 + `/api/health` 엔드포인트 응답 점검.

### SortRejectionRateHigh

**Severity**: warning · **for**: 5m · **임계**: `> 0.05 req/s` (5m rate, = 3건/분)

`sort_rejection_total` 5분 평균 0.05건/초 초과. 정상 사용자는 sort 필드를 잘못 보내지 않음.

**Root cause 가능성**:

- SQL injection 시도 (`reason=invalid_value`, `invalidValue` 필드에 SQL 패턴 포함)
- 자동화 스캔 또는 fuzzer (`reason=too_big`, DoS 의심)
- 클라이언트 라이브러리 버그 (`reason=invalid_type`, 타입 오류 반복)

**즉시 행동**:

1. **공격 route 식별** — Grafana 패널 또는 직접 query:
   ```promql
   topk(5, sum by (route, reason) (rate(sort_rejection_total[15m])))
   ```
2. **backend 로그 조회** (invalidValue 포함):
   ```bash
   docker compose logs --tail=200 backend | grep "Sort field rejection"
   ```
3. **reason=invalid_value** → SQL injection 패턴 확인 (`invalidValue` 필드 내용 점검)
   **reason=too_big** → DoS 시도 (payload size 확인)
4. **공격 IP 특정 가능 시** → nginx rate-limit 또는 deny 적용
   ```bash
   docker compose logs nginx | grep "422" | awk '{print $1}' | sort | uniq -c | sort -rn
   ```
5. **10분 내 하강 미관측 시** → `SortRejectionSustainedAttack` critical 도달 가능

### SortRejectionSustainedAttack

**Severity**: critical · **for**: 2m · **임계**: `drops{reason="rate-limit"} > 0.01 req/s` (5m rate)

분당 60건 초과로 rate-limiter가 DROP 처리 중. 자동화 스캔 또는 공격 확정.

**즉시 행동**:

1. **영향 평가** — HTTP 에러율 동시 상승 여부:
   ```promql
   sum(rate(http_requests_total{status=~"4.."}[5m])) by (route)
   ```
2. **공격 route 집중 식별**:
   ```promql
   topk(5, sum by (route) (rate(sort_rejection_drops_total[5m])))
   ```
3. **단기 완화** — nginx access log에서 IP 차단 검토:
   ```bash
   docker compose logs nginx | grep "422" | awk '{print $1}' | sort | uniq -c | sort -rn
   ```
4. **지속 2분 이상 시** → oncall 에스컬레이션
5. **rate-limit-fallback drop 동반** → Redis 장애 동시 발생 여부 점검:
   ```promql
   sum(rate(sort_rejection_drops_total{reason="rate-limit-fallback"}[5m]))
   ```
   Redis 장애 시 `docker compose ps redis` + `docker compose logs redis --tail=50`

## 트러블슈팅

### promtool check rules 실패

| 메시지                              | 원인                     | 해결                                       |
| ----------------------------------- | ------------------------ | ------------------------------------------ |
| `expected: }, received: ...`        | PromQL syntax 오류       | `expr` 라인 들여쓰기 확인 (yaml `\|` 블록) |
| `unexpected character: '...' (...)` | label selector 형식 오류 | `{label="value"}` 따옴표 / 등호 점검       |
| `for: invalid duration`             | duration 표기 오류       | `30s` / `5m` / `1h` 형식 확인              |

### Prometheus reload 후 rule 미적용

1. `curl -s http://prometheus:9090/api/v1/status/config | jq -r '.data.yaml'` — 실제 로드된 config 확인
2. mount 경로 (`/etc/prometheus/alert.rules.yml`) 와 docker-compose volume 매핑 일치 확인
3. `docker compose logs prometheus | grep -i "loading\|error"` — startup 에러 확인

### AlertManager 알림 미발송

1. `curl -s http://alertmanager:9093/api/v2/alerts` — alert 가 alertmanager 까지 도달했는지 확인
2. `${SLACK_WEBHOOK}` env 주입 확인 (`docker compose exec alertmanager env | grep SLACK`)
3. 라우팅 시뮬레이션 (위 §Workflow.5 참조)

## Baseline Measurement — Zod Validation Alert 임계값 보정 절차

`ZodValidationIssuesHighCount` / `ZodValidationIssuesPersistentSpike` 임계값은
**초기 추정값** (warning `> 0.1 req/s` / critical `> 1 req/s`) 으로 배포됨.
1-2주 정상 운영 후 아래 절차로 baseline 측정 + 임계값 보정.

### 1. 정상 운영 baseline 측정

```promql
-- 1주 운영 중 11+ bucket 최대 순간 rate (분 단위 샘플)
max_over_time(
  sum(rate(zod_validation_issues_total{issue_count_bucket="11+"}[5m]))[7d:1m]
)

-- p95 rate (이상값 배제)
histogram_quantile(0.95,
  sum(rate(zod_validation_issues_total_bucket[7d])) by (le)
)
```

### 2. 임계값 조정 기준

| 상황                                                | 조치                                                 |
| --------------------------------------------------- | ---------------------------------------------------- |
| False-positive 3회/주 이상 (정상 운영 중 경보 발생) | warning = max_over_time × 3; critical = warning × 10 |
| 임계 도달 없이 1개월 경과                           | 임계값 유지 (추정값이 충분히 보수적)                 |
| Critical alert 첫 발생 후 ADR-0008 §4 검토 필요     | ADR-0008 §4 Trigger Condition 4 절차 참조            |

### 3. 임계값 변경 절차

1. `infra/monitoring/prometheus/alert.rules.yml` `validation` 그룹 `expr` 수정
2. `promtool check rules` 정적 검증 (§Workflow.3)
3. Prometheus reload (§Workflow.4)
4. 본 섹션 "보정 이력" 업데이트

### 보정 이력

| 날짜       | warning     | critical  | 근거                                                   |
| ---------- | ----------- | --------- | ------------------------------------------------------ |
| 2026-05-09 | > 0.1 req/s | > 1 req/s | 초기 추정값 — ADR-0008 §Alert Threshold Rationale 참조 |

---

## 참조

- ADR-0008 Backend Zod Error i18n SSOT — `docs/adr/0008-backend-zod-error-i18n.md`
- MetricsService SSOT — `apps/backend/src/common/metrics/metrics.service.ts`
- 본 sprint closure — `.claude/contracts/completed/zod-hub-should-s4-followups.md`
