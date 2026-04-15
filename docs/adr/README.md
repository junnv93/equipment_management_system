# Architecture Decision Records (ADR)

이 디렉토리는 프로젝트의 주요 기술 결정과 그 배경을 기록합니다.

> **ADR이란?** 중요한 아키텍처·도구·프로세스 결정을 **결정 당시의 맥락과 함께** 문서화하는 관행. 원문: [Michael Nygard (2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## 작성 규칙

- 파일명: `NNNN-kebab-case-title.md` (4자리 zero-pad, `adr-tools` 표준)
- 템플릿: [template.md](template.md) 참조 — Michael Nygard 포맷
- **Status 범례**:
  - `Proposed` — 초안, 승인 대기
  - `Accepted` — 현재 유효
  - `Deprecated` — 더 이상 권장되지 않음 (하지만 아직 존재)
  - `Superseded by ADR-XXXX` — 새 결정으로 대체됨

- **불변성**: Accepted된 ADR은 수정하지 않는다. 환경이 바뀌면 새 ADR을 추가하고 기존을 Superseded 처리.
- **트리거 조건**: ADR 재검토를 유발할 지표·임계값을 명시 (빈 ADR 방지).

## 목록

| ADR                                            | 제목                                                | 상태     | 맥락       |
| ---------------------------------------------- | --------------------------------------------------- | -------- | ---------- |
| [0001](0001-monorepo-with-turborepo.md)        | Turborepo 기반 모노레포 구조                        | Accepted | 빌드/캐싱  |
| [0002](0002-drizzle-orm-over-typeorm.md)       | Drizzle ORM 선택 (vs TypeORM, Prisma)               | Accepted | DB         |
| [0003](0003-nestjs-nextjs-app-router.md)       | NestJS + Next.js App Router 프레임워크 선택         | Accepted | 프레임워크 |
| [0004](0004-docker-compose-over-kubernetes.md) | Docker Compose 유지 vs Kubernetes 전환              | Proposed | Infra      |
| [0005](0005-secret-management-roadmap.md)      | Secret 관리 전략 — sops/age 채택 및 Vault 이행 경로 | Accepted | Security   |

> 기존 스키마 아키텍처 결정 문서: [schema-architecture-decision.md](../development/schema-architecture-decision.md)

## 새 ADR 추가 절차

1. `template.md` 복사 → 다음 번호로 저장
2. Status `Proposed`로 초안 작성
3. PR 리뷰/의논
4. 합의 시 Status → `Accepted`, 본 README 표에 추가
5. 추후 대체 시 기존 ADR에 `Superseded by ADR-XXXX` 업데이트

## 도구 (선택)

[`adr-tools`](https://github.com/npryce/adr-tools)가 4자리 zero-pad 번호를 자동 관리한다.
현재 저장소는 수동 관리 중이며, `adr-tools` 도입 여부는 3개 이상 ADR이 월 주기로
추가될 때 재검토.
