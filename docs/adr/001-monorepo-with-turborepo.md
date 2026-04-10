# ADR-001: Turborepo 기반 모노레포 구조

- **상태**: 채택 (Accepted)
- **일시**: 2025-12
- **맥락**: 프로젝트 초기 구조 설계

## 배경

장비 관리 시스템은 NestJS 백엔드 + Next.js 프론트엔드로 구성되며, 두 앱이 Zod 스키마, Enum, 권한 상수, API 엔드포인트 정의를 공유해야 합니다.

## 검토한 대안

### 1. 멀티레포 (Backend / Frontend 별도 저장소)

- **장점**: 독립 배포, 팀별 소유권 명확
- **단점**: 공유 코드 동기화 문제 (npm publish 필요), 스키마 변경 시 양쪽 레포 동시 수정, 1인 개발에서 오버헤드만 증가

### 2. 모노레포 — Nx

- **장점**: 강력한 의존성 그래프, affected 빌드
- **단점**: 설정 복잡도가 높음, 학습 곡선, 1인 프로젝트에 과한 스캐폴딩

### 3. 모노레포 — Turborepo (채택)

- **장점**: 설정 최소 (`turbo.json` 하나), pnpm workspace와 자연스러운 통합, 캐시 기반 빌드 가속
- **단점**: Nx 대비 기능이 적지만, 현재 규모에서는 불필요한 기능

## 결정

**Turborepo + pnpm workspace** 채택.

```
packages/
├── db/                # Drizzle 스키마 — Backend 전용
├── schemas/           # Zod 스키마 + Enum — Frontend/Backend 공유 (SSOT)
└── shared-constants/  # 권한, API 엔드포인트 — Frontend/Backend 공유
```

## 근거

1. **SSOT 보장**: `packages/schemas`에서 Enum과 Zod 스키마를 한 번 정의하면, 프론트/백 모두 같은 타입을 import. 스키마 불일치로 인한 런타임 오류 원천 차단.
2. **빌드 순서 자동화**: `turbo.json`의 `dependsOn: ["^build"]`로 packages → apps 순 빌드가 자동 보장.
3. **1인 개발 효율**: `pnpm dev` 한 번으로 Frontend + Backend 동시 실행. 레포 간 context switching 없음.
4. **확장 가능**: 향후 팀 확장 시 멀티레포로 전환해도 `packages/` 구조가 npm 패키지 발행 단위와 일치하여 마이그레이션 용이.

## 결과

- 공유 스키마 변경 시 한 곳만 수정 → `tsc --noEmit`로 양쪽 영향 즉시 확인
- pre-push hook에서 전체 타입체크 + 테스트가 30초 내 완료 (Turborepo 캐시 활용)
