# ADR-0005: Secret 관리 전략 — sops/age 채택 및 Vault 이행 경로

- **상태**: Accepted
- **일시**: 2026-04-15 (Proposed) → 2026-04-15 (Accepted)
- **결정자**: 1인 개발 (maintainer)
- **맥락 범위**: Security, Ops

## Context

Secret (JWT, DB 비밀번호, S3 키, Azure AD 클라이언트 시크릿, SMTP 자격증명 등) 저장·배포·로테이션 체계가 부재하다. 현재 상태:

- `.env.example` — 플레이스홀더 (OK)
- 개발자 로컬 `.env` — 평문, git 제외 (OK)
- LAN 배포 서버 `.env` — **평문, 수동 복사 (RISK)**
- GitHub Actions — Secrets API (OK, 단 로테이션 자동화 없음)
- `.github/workflows/main.yml` — Gitleaks 스캔은 **커밋된 secret만** 탐지 (커밋 전/저장소 외 평문은 못 잡음)

실제 유출 사고가 없음에도 다음 리스크가 누적된다:

1. LAN 서버 `.env`를 개발자끼리 Slack/메신저로 전달하는 비공식 관행
2. Secret 회전 시 누가 어디서 바꿨는지 추적 불가
3. 과거 `.env` 스냅샷이 dev PC 여러 대에 존재 ([feedback_multi_pc_sync.md](../../) 참조)
4. 복원 시 secret을 다시 수동 입력해야 함 — DR 시나리오에서 SLO 악화
5. 비밀 변경 이력이 없어 감사/규제 대응 불가

## Decision

**Phase 1 (즉시, ADR 승인 후 Phase C에서 구현): sops + age 채택.**
**Phase 2 (트리거 조건 충족 시): Vault / OpenBao / Azure Key Vault 전환 ADR 신설.**

### 검토한 대안 (Options)

**1. `.env` + Password Manager (현행 연장)**

- 장점: 도구 추가 0
- 단점: 감사 추적 없음 / 회전 자동화 없음 / 배포 파이프라인과 분리

**2. sops + age (채택)**

- 장점
  - age 키는 ssh-ed25519처럼 간단한 파일 / GPG 불필요
  - `.env` 대신 `*.sops.yaml`을 **git에 커밋** — 모든 secret 변경이 git 이력에 남음 (감사 추적)
  - `sops -d` 로 런타임 복호화 / `env_file` 대신 entrypoint에서 decrypt
  - 1인 개발자 운영 가능 (Vault 대비 백그라운드 서비스 0)
  - GitHub Actions에서도 `SOPS_AGE_KEY` secret 하나로 복호화 → CI 비밀 주입 경로 통일
- 단점
  - dynamic credential 불가 (TTL DB 계정 발급 등)
  - 회전 시 수동 — 다만 git commit으로 감사 유지
  - shell/entrypoint 레이어 추가 필요

**3. HashiCorp Vault / OpenBao (self-hosted)**

- 장점: dynamic credentials, PKI, 자동 회전, audit log 완비
- 단점
  - self-hosted HA 세팅 운영 부담 (1인 개발자 기준 큼)
  - 초기 seal/unseal 절차 / Raft backend 백업 / 토큰 관리
  - 단일 VM LAN 환경에서는 Vault 자체가 SPOF

**4. Cloud KMS (AWS KMS, Azure Key Vault)**

- 장점: managed, 감사 로그 완비
- 단점
  - LAN-only 배포 요구와 충돌 / 인터넷 상시 연결 가정
  - Azure Key Vault는 기존 Azure AD 통합이 있어 후보 가능하나, 단일 VM LAN에 과잉 (후속 검토 여지)

### 선택: Option 2 (Phase 1) → Option 3 or 4 (Phase 2, 트리거 시)

## Consequences

### 긍정

- Secret 변경이 git 이력으로 감사 가능
- 로컬 / LAN / CI 세 경로가 단일 도구로 통합
- 1인 운영 부담 거의 없음 (Vault 대비)
- 미래 Vault 전환 시 **seed 소스로 재사용**

### 부정

- age 개인 키 분실 = 복호화 불가 → **키 백업 절차 필수**
- Dynamic credential 불가 → DB 비밀번호는 수동 회전
- Entrypoint 복호화 레이어 — rootfs에 평문 잔존 리스크 (tmpfs 마운트로 완화)

### 완화 (Mitigations)

- age 키 백업 runbook을 `docs/operations/secret-backup.md`에 명문화 (Phase C에서)
- 복호화된 `.env`는 tmpfs(`/run`)에만 위치, 컨테이너 stop 시 사라짐
- `.sops.yaml`의 creation_rules에 다수 public key 등록 → 키 1개 분실해도 다른 키로 복호화
- 키 로테이션 절차를 Phase C에서 스크립트로 자동화

### Trigger Conditions for Reconsideration

아래 중 **1개라도** 충족 시 Vault 또는 OpenBao 도입 ADR(신규)을 연다. sops의 `*.sops.yaml`은 그때 **Vault seed**로만 사용(bootstrap 후 제거).

| 트리거                  | 임계값                                  |
| ----------------------- | --------------------------------------- |
| 엔지니어 수             | 3명↑ (키 관리 복잡도 급증)              |
| DB 접근 주체            | 애플리케이션 외 분석/ETL 팀이 직접 접근 |
| 규제 요구               | ISO 27001 / SOC2 audit log 의무화       |
| Dynamic credential 필요 | 마이크로서비스 간 mTLS PKI 자동 발급    |
| 토큰 회전 빈도          | 주 1회 이상 자동 회전 요구              |

### 후속 행동

- ~~본 ADR Accepted 승격 = Phase C (sops/age 실제 도입) 착수 트리거~~ — **2026-04-15 Phase C 착수 완료** ([`.claude/exec-plans/completed/`](../../.claude/exec-plans/completed/) 참조)
- 3개월 후 트리거 지표 재평가 (사용자 증가 여부) → Vault 이행 필요 시 ADR-0006으로
- Azure Key Vault 옵션은 Azure AD 통합 심화 시 ADR-0005.1 또는 ADR-0006으로 별도 재검토

### 승격 근거 (2026-04-15)

Reconsideration Trigger 조건(엔지니어 3명↑ / 프로덕션 사용자 / ISO27001) 은 현재 미충족이나, **§Context 의 실재 리스크 4항목**(특히 "LAN 서버 .env 수동 복사")을 프로덕션 사용자 발생 전에 해소하는 것이 리팩토링 비용이 작다. Option 2 (sops+age) 는 Vault 대비 백그라운드 서비스 0 + 1인 운영 부담 거의 없음이므로 **선제 도입이 과잉 설계가 아니다**.

## References

- 관련 ADR: [ADR-0004](0004-docker-compose-over-kubernetes.md) — 같은 축(over-engineering 회피)
- 외부: [sops](https://github.com/getsops/sops), [age](https://github.com/FiloSottile/age)
- 이전 사고: [feedback_multi_pc_sync.md](../../) — PC 간 .env 드리프트 문제
