# ADR-002: Drizzle ORM 선택

- **상태**: 채택 (Accepted)
- **일시**: 2025-12
- **맥락**: ORM / Query Builder 선택

## 배경

NestJS 생태계에서 TypeORM이 사실상 표준이지만, 프로젝트 요구사항(타입 안전성, 마이그레이션 제어, SQL 가시성)에 맞는 ORM을 평가했습니다.

## 검토한 대안

### 1. TypeORM

- **장점**: NestJS 공식 통합 (`@nestjs/typeorm`), ActiveRecord/DataMapper 패턴, 풍부한 예제
- **단점**: 타입 안전성 부족 (런타임 에러 발생 가능), 마이그레이션 자동생성이 불안정, 복잡한 쿼리에서 TypeScript 타입 추론 실패, 메타데이터 기반이라 번들 크기 증가

### 2. Prisma

- **장점**: 뛰어난 DX (Prisma Studio, prisma generate), 마이그레이션 안정적
- **단점**: 별도 스키마 언어 (`.prisma` 파일) 학습 필요, TypeScript 네이티브가 아님, 커스텀 SQL 작성이 번거로움, Edge 환경 제약

### 3. Drizzle ORM (채택)

- **장점**: TypeScript-first (스키마가 `.ts` 파일), SQL-like 문법으로 학습 곡선 낮음, 완전한 타입 추론, 경량 (번들 크기 최소), `drizzle-kit`으로 마이그레이션 SQL 직접 생성/검토 가능
- **단점**: NestJS 공식 통합 없음 (직접 Provider 작성 필요), TypeORM 대비 커뮤니티 규모 작음

## 결정

**Drizzle ORM** 채택.

## 근거

1. **SQL 가시성**: `drizzle-kit generate`가 생성하는 마이그레이션 파일이 순수 SQL이라, 실행 전 정확히 어떤 DDL이 적용되는지 리뷰 가능. TypeORM의 자동 동기화(`synchronize: true`)로 인한 데이터 손실 위험을 원천 차단.
2. **타입 안전성**: SELECT 결과의 타입이 쿼리 컬럼에 따라 자동 추론. JOIN, 서브쿼리에서도 타입 추론이 유지되어, `any` 타입 사용 없이 전체 데이터 계층을 TypeScript로 커버.
3. **스키마 공유**: Drizzle 스키마가 TypeScript 파일이므로, `packages/db`에서 정의한 스키마를 프론트엔드의 타입 추론에도 활용 가능. Prisma의 `.prisma` 파일은 이 공유가 자연스럽지 않음.
4. **CAS (낙관적 잠금) 패턴**: Drizzle의 `where` 절에서 `eq(table.version, expectedVersion)` 조건을 직접 걸 수 있어, CAS 기반 동시성 제어를 ORM 수준에서 자연스럽게 구현.

## 결과

- `packages/db/`에 스키마 정의, `apps/backend/drizzle/`에 마이그레이션 SQL 관리
- NestJS에서 `DrizzleModule` 커스텀 Provider로 DI 통합
- 마이그레이션 워크플로우: `db:generate` → SQL 리뷰 → `db:migrate`
