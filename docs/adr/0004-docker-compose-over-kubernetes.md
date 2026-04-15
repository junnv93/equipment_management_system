# ADR-0004: Docker Compose 유지 vs Kubernetes 전환

- **상태**: Proposed
- **일시**: 2026-04-15
- **결정자**: 1인 개발 (maintainer)
- **맥락 범위**: Infrastructure, Deployment

## Context

Equipment Management System은 현재 Docker Compose 기반 스택(postgres / redis / rustfs / backend / frontend / nginx)으로 운영된다. `infra/docker-compose.lan.yml`이 실제 배포 대상(사내 LAN 단일 VM, nginx:9000)이며, `infra/docker-compose.prod.yml`은 대기 상태다 (`.github/workflows/main.yml`의 `docker-build` job이 `workflow_dispatch`로만 실행).

"업계 표준 컨테이너 오케스트레이션"을 이야기할 때 Kubernetes가 기본 답으로 제시되지만, 현재 프로젝트 맥락은 다음과 같다:

- 프로덕션 사용자 아직 없음 (실 배포는 LAN 사내 검증 단계)
- 1인 solo 개발 (main 직접 커밋 + pre-push 게이트)
- 배포 빈도: 월 수회
- 호스팅: 사내 LAN 단일 VM (클라우드 계정 Azure AD 외 없음)
- 다운타임 허용: 수분~수십분 (LAN 내부 업무 시간 외 가능)

이 맥락에서 **K8s 도입의 운영 비용이 얻는 이득을 초과할 가능성**이 높다. 본 ADR은 지금 이동하지 않는 이유와 이동을 유발할 조건을 명시적으로 기록하여, 미래의 자신 또는 후임이 섣부른 플랫폼 변경을 피하도록 한다.

## Decision

**현 시점에서는 Docker Compose 유지. Kubernetes 전환은 미뤄둔다. (Status: Proposed)**

### 검토한 대안 (Options)

**1. Docker Compose 유지 (현행 연장)**

- 장점
  - 단일 VM 기준 설정 파일 4~5개로 전체 스택 파악 가능
  - `docker compose up`로 원자적 배포
  - 1인 개발자의 인지 부하 최소
  - CI에 이미 완비된 build/scan/deploy 파이프라인 재사용
  - 백업은 볼륨 디렉토리 tar 수준으로 충분
- 단점
  - multi-node HA 불가
  - rolling update 불가 (짧은 downtime)
  - 노드 장애 시 수동 복구
  - HPA 불가

**2. k3s (경량 K8s) on 동일 VM**

- 장점
  - K8s API / Helm / kubectl 생태계 활용
  - 추후 멀티노드 확장 경로
  - Ingress · ConfigMap · Secret · NetworkPolicy 등 표준 객체
- 단점
  - 1인 운영 시 YAML 파일 ~수십 개
  - helm values 관리 복잡도 급증
  - 단일 VM에서 k3s의 이점(HA, 롤링, 스케일)이 실현되지 않음 → **K8s 이점 0, 복잡도 +++**

**3. Managed K8s (EKS/GKE/AKS)**

- 장점
  - 진짜 HA, managed control plane, auto-scaling
- 단점
  - 클라우드 비용 월 $70~
  - LAN-only 배포 요구와 상충 (회사 네트워크 정책)
  - 사용자 없는 상태에서 과잉
  - Azure AD 이외 클라우드 계정 없음

### 선택: Option 1

1인·LAN·사용자 0 맥락에서 Compose가 최적. 향후 맥락 변화 시 재평가.

## Consequences

### 긍정

- 운영 복잡도 최소 유지
- `pnpm dev` · `docker compose up` 단일 커맨드 DX 보존
- 기존 CI 9-job 파이프라인 재사용
- 집중을 제품 기능 구현에 할당 가능

### 부정

- multi-node HA 불가 → 하드웨어 장애 시 RTO가 VM 재구축 시간과 동일
- rolling update 불가 → 배포 시 수십 초 다운타임 (LAN 내부라 허용 가능)
- K8s 생태계 학습·네트워크 미축적 → 미래 전환 비용이 한 번에 발생
- HPA 없음 → 스파이크 트래픽 발생 시 수동 VM 스케일업

### 완화 (Mitigations)

- 배포 전 `docker compose -f infra/docker-compose.lan.yml up -d --no-deps --build backend` 식 **점진 재기동** 스크립트 제공 (Phase K의 runbook)
- 이미지 ORAS 아티팩트 + Cosign 서명(Phase J)으로 K8s 전환 시 재사용 가능한 공급망 자산 누적
- Compose 구조를 K8s와 매핑 가능한 형태로 설계: `base + override` 분리(Phase A) = `base + kustomize overlay` 패턴과 동형 → 미래 전환 시 점진 치환 용이
- 프로덕션 사용자 발생 시점에 본 ADR의 트리거 지표를 `docs/development/` 메트릭으로 모니터링 시작

### Trigger Conditions for Reconsideration

아래 트리거 중 **2개 이상** 충족 시 k3s 또는 Managed K8s 마이그레이션 ADR(신규)을 열어 결정을 승격한다:

| 트리거            | 임계값                                   |
| ----------------- | ---------------------------------------- |
| 동시 접속 사용자  | 지속 100명↑ 또는 peak 500명↑             |
| 다운타임 허용 SLO | 월 5분 미만 (현 "수분~수십분 허용" 대비) |
| 배포 빈도         | 주 10회↑ (현 월 수회)                    |
| 서버 노드 수      | 2대↑ (HA 요구)                           |
| 팀 규모           | 2인↑ + 엔지니어 중 1명이 K8s 운영 경험자 |
| 지역 분산         | 한국 외 타 리전 서비스 요구              |

## References

- 관련 ADR: [ADR-0005](0005-secret-management-roadmap.md) — Secret 관리도 같은 맥락 축
- 외부: [Kelsey Hightower on When Not to Use Kubernetes](https://twitter.com/kelseyhightower/status/1073978207679864832)
- 내부 문서: [infra/README.md](../../infra/README.md), [DEPLOYMENT_LAN.md](../../infra/DEPLOYMENT_LAN.md)
