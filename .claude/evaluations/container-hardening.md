# Evaluation Report: Container Security Hardening (Phase G)

**Date**: 2026-04-16
**Contract**: `.claude/contracts/container-hardening.md`
**Evaluator**: QA Agent (skeptical mode)
**Files evaluated**:
- `infra/compose/base.yml`
- `infra/compose/prod.override.yml`
- `infra/compose/lan.override.yml`

---

## Overall Verdict: CONDITIONAL PASS (4 FAIL items found)

---

## MUST Criteria

### M1 — base.yml의 postgres/redis/rustfs에 `security_opt: [no-new-privileges:true]` 적용
**PASS**

`x-security: &default-security` extension field에 `security_opt: [no-new-privileges:true]`가 정의되어 있고, postgres(L33), redis(L62), rustfs(L84) 모두 `<<: *default-security`로 merge되어 있다. `docker compose -f base.yml config` 출력에서 세 서비스 모두 `security_opt: [no-new-privileges:true]` 확인됨.

---

### M2 — base.yml의 postgres/redis/rustfs에 `cap_drop: [ALL]` 적용
**PASS**

동일 `x-security` anchor에 `cap_drop: [ALL]`이 포함되어 있으며 세 서비스 모두 적용됨. 주목할 점: postgres는 cap_add(CHOWN, DAC_OVERRIDE, FOWNER, SETGID, SETUID), redis는 cap_add(SETGID, SETUID)로 최소 복원함. rustfs에는 cap_add가 없음(검토 필요하나 M2 자체는 PASS).

---

### M3 — prod.override.yml의 앱/모니터링 서비스에 동일 보안 설정 적용
**FAIL**

**문제**: prod.override.yml에서 postgres/redis/rustfs 서비스 섹션에 `<<: *security` merge가 없다. 이 세 서비스는 base.yml에서 보안 설정을 상속받기 때문에 merged config에서는 올바르게 동작하지만, M3의 텍스트는 "앱 서비스와 모니터링 서비스"에 대한 보안 설정이다.

앱/모니터링 서비스 적용 현황:
- frontend: PASS (L82 `<<: *security`)
- backend: PASS (L122)
- nginx: PASS (L190)
- certbot: PASS (L229)
- prometheus: PASS (L248)
- grafana: PASS (L278)
- node-exporter: PASS (L308)
- cadvisor: PASS (L335)
- alertmanager: PASS (L358)
- loki: PASS (L382)
- promtail: PASS (L411)
- migration: PASS (L436)

M3 기준으로는 PASS이나, 아래 M4에서 파생되는 문제가 있어 주의 필요.

**판정 수정**: M3 자체는 PASS (모든 앱/모니터링 서비스에 security 적용됨).

---

### M4 — `read_only: true` 적용 시 tmpfs 마운트 필요 경로 확보
**FAIL (부분)**

**문제 1 — node-exporter: 주석-구현 불일치**
prod.override.yml L307 주석: `# read_only 적용하되 cap_drop은 예외 없이 적용`
실제 구현: `read_only` 필드가 존재하지 않음. 주석이 의도를 명시했지만 실제로 적용되지 않았다. 이것은 거짓 주석(misleading comment)으로 감사 트레일 문제이다.

**문제 2 — prometheus/grafana/loki/alertmanager/promtail: read_only 없음**
이 서비스들은 named volume에 쓰기 작업이 필요하므로 `read_only: true`가 실용적으로 불가능할 수 있으나, 계약이 요구하는 것은 "read_only 적용 시 tmpfs 확보"이지 "모든 서비스에 read_only 강제"는 아니다. 그러나 `cap_drop: ALL`만 적용하고 `read_only` 없이 named volume에 쓰는 것은 절반의 하드닝이다. 계약 기준 자체는 이를 명시적 FAIL로 다루지 않는다.

**실제 FAIL 요소**: node-exporter 주석(`read_only 적용하되`)과 구현(미적용) 불일치.

**문제 3 — lan.override.yml backend: /app/logs 마운트**
backend는 `read_only: true`이고 `/var/lib/equipment-system/logs/backend:/app/logs` bind mount가 있다. Docker는 `read_only: true` 컨테이너에서도 명시적으로 추가된 bind mount는 기본적으로 쓰기 가능으로 처리하므로 기능적으로는 작동한다. 그러나 이 마운트는 tmpfs가 아닌 호스트 경로이며, 계약의 "tmpfs로 필요 경로 확보" 원칙과 다른 패턴이다. 기술적 실패는 아니나 일관성 결여.

---

### M5 — 기존 healthcheck/volume/environment 설정 유지
**PASS**

base.yml의 postgres/redis/rustfs 모두:
- healthcheck: `<<: *default-healthcheck` + 서비스별 test 명령 유지됨
- volumes: healthchecks:ro, init-postgres.sql:ro (postgres), 환경별 data volume은 override에서 관리
- environment: 모든 기존 환경변수 유지됨

`docker compose -f base.yml -f prod.override.yml config` 출력에서 healthcheck 설정(interval, timeout, retries, start_period, test) 정상 확인됨.

---

### M6 — YAML 문법 유효
**PASS**

세 파일 모두 `python3 -c "import yaml; yaml.safe_load(open('FILE'))"` 통과.

```
base.yml: OK
prod.override.yml: OK
lan.override.yml: OK
```

---

### M7 — `docker compose -f infra/compose/base.yml config` 성공
**PASS**

```bash
docker compose -f infra/compose/base.yml config --quiet
Exit code: 0
```

---

## SHOULD Criteria

### S1 — YAML extension field (`x-security`) 사용하여 DRY 원칙 준수
**PARTIAL PASS**

- base.yml: `x-security: &default-security` 정의 후 postgres/redis/rustfs에 `<<: *default-security` 적용. DRY 준수.
- prod.override.yml: 별도의 `x-security: &security` 재정의(L15). 주석 `# base.yml x-security와 동일 (override 파일은 별도 정의 필요)` 있음. Docker Compose는 override 파일 간 anchor 공유를 지원하지 않으므로 재정의는 기술적으로 불가피하다. 내용은 동일. 허용 가능.
- lan.override.yml: 동일하게 `x-security: &security` 재정의(L14). 동일 패턴.

S1 DRY 원칙은 각 파일 내에서는 준수됨. 파일 간 중복은 기술적 제약으로 불가피. **PASS**.

---

### S2 — lan.override.yml의 추가 서비스에도 동일 보안 설정 적용
**PASS**

lan.override.yml의 app 서비스:
- backend: `<<: *security`, read_only, tmpfs 적용 (L51)
- frontend: `<<: *security`, read_only, tmpfs 적용 (L103)
- nginx: `<<: *security`, read_only, tmpfs 적용 (L136)
- migration: `<<: *security`, read_only, tmpfs 적용 (L161)

merged config에서도 security_opt, cap_drop, read_only 모두 확인됨.

---

### S3 — node-exporter/cadvisor 예외 처리 문서화
**PARTIAL PASS — 주석-구현 불일치로 감점**

cadvisor: L334 주석 `# 호스트 /var/run, /sys, Docker socket 마운트 필요 — cap_drop만 적용, read_only 불가` → 구현 일치. PASS.

node-exporter: L307 주석 `# 호스트 /proc, /sys, / 마운트 필요 — read_only 적용하되 cap_drop은 예외 없이 적용` → **구현 불일치**. 주석은 `read_only 적용`을 선언했으나 실제로 `read_only` 필드가 없다. S3 문서화 의도는 있으나 거짓 주석으로 신뢰성 손상.

---

## 발견된 결함 요약

| ID | 심각도 | 파일 | 서비스 | 내용 |
|----|--------|------|--------|------|
| F1 | HIGH | prod.override.yml | node-exporter | L307 주석 `read_only 적용하되`와 실제 미적용 불일치. 거짓 주석. |
| F2 | MEDIUM | prod.override.yml | prometheus, grafana, loki, alertmanager, promtail | `read_only` 없음. named volume에 쓰기하므로 기능적 필요는 이해되나, 절반의 하드닝. M4에서 명시적 FAIL 조건은 아니지만 보안 취약점. |
| F3 | LOW | lan.override.yml | backend | `/app/logs` 호스트 bind mount가 tmpfs 패턴 대신 사용됨. 기능은 작동하나 계약의 tmpfs 원칙과 불일치. |
| F4 | LOW | prod.override.yml | promtail | `/var/run/docker.sock:ro` 마운트. read_only로 마운트되어 있으나 Docker socket 접근은 사실상 root 권한 상당. cap_drop ALL이 적용되어 있어도 socket 자체가 위험. 계약 범위는 아니나 기록. |

---

## 계약 기준 최종 판정표

| 기준 | 판정 | 비고 |
|------|------|------|
| M1 | PASS | base.yml 세 서비스 모두 security_opt 적용 |
| M2 | PASS | base.yml 세 서비스 모두 cap_drop: ALL 적용 |
| M3 | PASS | 앱/모니터링 12개 서비스 모두 적용 |
| M4 | FAIL | node-exporter: 주석은 read_only 선언, 실제 미적용 |
| M5 | PASS | healthcheck/volume/environment 유지 확인 |
| M6 | PASS | 3개 파일 모두 YAML valid |
| M7 | PASS | base.yml 단독 파싱 성공 (exit 0) |
| S1 | PASS | x-security DRY (파일 내 기준) |
| S2 | PASS | lan.override.yml 앱 서비스 4개 적용 |
| S3 | PARTIAL PASS | cadvisor 문서화 정확, node-exporter 거짓 주석 |

**MUST 기준**: 6/7 PASS, **1 FAIL (M4)**

---

## 수정 권고사항

1. **node-exporter** (HIGH): `read_only: true` 추가하거나 주석 수정. node-exporter는 모든 볼륨을 `:ro`로 마운트하므로 `read_only: true` 추가가 가능해야 함.

2. **prometheus/grafana/loki/alertmanager/promtail** (MEDIUM): named volume이 쓰기 필요하면 `read_only` 불가를 주석으로 명시. cadvisor처럼 `# read_only 불가 — /prometheus에 쓰기 필요` 형태로 문서화하여 의도적 예외임을 표명할 것.

3. **lan backend /app/logs** (LOW): tmpfs로 전환하거나 로그는 stdout으로 내보내고 promtail에서 수집하는 구조 검토.
