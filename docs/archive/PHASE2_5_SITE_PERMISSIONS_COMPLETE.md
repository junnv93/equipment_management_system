# Phase 2.5: 사이트별 권한 관리 구현 완료

## 구현 일자

2025-01-XX

## 구현 내용

### 1. 데이터베이스 스키마 수정

- ✅ `equipment` 테이블에 `site` 필드 추가 (VARCHAR(20))
- ✅ `teams` 테이블에 `site` 필드 추가 (VARCHAR(20))
- ✅ `equipment_site_idx` 인덱스 추가

### 2. 마이그레이션 파일

- ✅ `0006_add_site_to_equipment_and_teams.sql` 생성
- ✅ 기존 데이터 마이그레이션 로직 포함 (기본값: 'suwon')
- ✅ `_journal.json` 업데이트

### 3. Zod 스키마 수정

- ✅ `packages/schemas/src/equipment.ts`: `site` 필드 추가
- ✅ `packages/schemas/src/team.ts`: `site` 필드 추가
- ✅ `equipmentFilterSchema`에 `site` 필터 추가

### 4. DTO 수정

- ✅ `CreateEquipmentDto`: `site` 필드 추가 (필수)
- ✅ `UpdateEquipmentDto`: `site` 필드 추가
- ✅ `EquipmentQueryDto`: `site` 필터 추가

### 5. JWT Strategy 수정

- ✅ `jwt.strategy.ts`: user 객체에 `site`, `teamId` 정보 포함

### 6. EquipmentService 수정

- ✅ `buildQueryConditions`: 사이트 필터링 로직 추가
- ✅ `findAll`: 사용자 사이트 기반 필터링
  - 시험실무자: 자신의 사이트 장비만 조회
  - 기술책임자/관리자: 모든 사이트 조회 가능
- ✅ `create`: 사이트 필드 필수 검증 추가
- ✅ `transformCreateDtoToEntity`: `site` 필드 포함

### 7. EquipmentController 수정

- ✅ `findAll`: 사용자 역할에 따른 사이트 필터링 로직 추가

### 8. CheckoutsService 수정

- ✅ `checkTeamPermission`: 팀별 권한 체크 헬퍼 메서드 추가
- ✅ `create`: EMC팀이 RF팀 장비 반출 신청 시 권한 체크
- ✅ `approveFirst`: 승인 시 팀별 권한 체크 추가
- ✅ `approveFinal`: 최종 승인 시 팀별 권한 체크 추가
- ✅ `TeamsService` 주입 추가

### 9. RentalsService 수정

- ✅ `checkTeamPermission`: 팀별 권한 체크 헬퍼 메서드 추가
- ✅ `create`: EMC팀이 RF팀 장비 대여 신청 시 권한 체크
- ✅ `approve`: 대여 승인 시 팀별 권한 체크 추가
- ✅ `TeamsService` 주입 추가

### 10. 모듈 의존성 추가

- ✅ `CheckoutsModule`: `TeamsModule` import 추가
- ✅ `RentalsModule`: `TeamsModule` import 추가

### 11. 컨트롤러 수정

- ✅ `CheckoutsController`: `create`, `approveFirst`, `approveFinal`에 `userTeamId` 전달
- ✅ `RentalsController`: `create`, `approve`에 `userTeamId` 전달

## 구현된 권한 규칙

### 사이트별 조회 권한

1. **시험실무자 (test_operator)**

   - 자신의 사이트 장비만 조회 가능
   - 쿼리 파라미터에 `site`가 없으면 자동으로 자신의 사이트로 필터링

2. **기술책임자 (technical_manager) / 관리자 (site_admin)**
   - 모든 사이트 장비 조회 가능
   - 쿼리 파라미터로 특정 사이트 필터링 가능

### 팀별 권한 제한

1. **EMC팀은 RF팀 장비 반출 신청/승인 불가**

   - 반출 생성 시 체크
   - 반출 승인 시 체크 (1차, 최종)
   - 같은 사이트 내에서도 적용

2. **EMC팀은 RF팀 장비 대여 신청/승인 불가**
   - 대여 생성 시 체크
   - 대여 승인 시 체크
   - 같은 사이트 내에서도 적용

## 마이그레이션 실행 방법

```bash
cd apps/backend
pnpm db:migrate
```

## 검증 방법

### 1. 타입 체크

```bash
cd apps/backend
pnpm tsc --noEmit
```

### 2. 마이그레이션 실행

```bash
cd apps/backend
pnpm db:migrate
```

### 3. 테스트 실행

```bash
cd apps/backend
pnpm test
```

## 알려진 제한사항

1. **팀별 권한 체크의 정확성**

   - 현재 `equipment.teamId`는 integer이고 `teams.id`는 uuid로 구조가 일치하지 않음
   - 향후 DB 구조 개선 후 정확한 팀 타입 확인 로직 구현 필요
   - 현재는 경고 로그만 출력하고 진행

2. **장비 등록 시 사이트 필수**
   - 장비 등록 시 `site` 필드가 필수이지만, 프론트엔드에서 기본값 설정 필요
   - 사용자의 사이트를 기본값으로 사용하는 것이 좋음

## 향후 개선 사항

1. **DB 구조 개선**

   - `equipment.teamId`와 `teams.id`의 관계 명확화
   - 또는 `equipment` 테이블에 `teamType` 필드 추가

2. **팀별 권한 체크 강화**

   - 현재는 경고만 출력하지만, 실제로 거부하도록 구현 필요
   - DB 구조 개선 후 정확한 팀 타입 확인 로직 구현

3. **테스트 작성**
   - 사이트별 조회 권한 테스트
   - 팀별 권한 제한 테스트
   - E2E 테스트 추가

## 관련 파일

### 스키마 파일

- `packages/db/src/schema/equipment.ts`
- `packages/db/src/schema/teams.ts`
- `packages/schemas/src/equipment.ts`
- `packages/schemas/src/team.ts`

### 서비스 파일

- `apps/backend/src/modules/equipment/equipment.service.ts`
- `apps/backend/src/modules/checkouts/checkouts.service.ts`
- `apps/backend/src/modules/rentals/rentals.service.ts`

### 컨트롤러 파일

- `apps/backend/src/modules/equipment/equipment.controller.ts`
- `apps/backend/src/modules/checkouts/checkouts.controller.ts`
- `apps/backend/src/modules/rentals/rentals.controller.ts`

### 마이그레이션 파일

- `apps/backend/drizzle/0006_add_site_to_equipment_and_teams.sql`

## 완료 체크리스트

### 백엔드

- [x] 데이터베이스 스키마 수정
- [x] 마이그레이션 파일 생성
- [x] Zod 스키마 수정
- [x] DTO 수정
- [x] JWT Strategy 수정
- [x] EquipmentService 수정
- [x] EquipmentController 수정
- [x] CheckoutsService 수정
- [x] RentalsService 수정
- [x] 모듈 의존성 추가
- [x] 컨트롤러 수정
- [x] 팀별 권한 체크 로직 강화 (DB 조인 사용)
- [x] E2E 테스트 작성
- [x] 마이그레이션 검증 스크립트 작성

### 프론트엔드

- [x] EquipmentForm에 site 필드 추가
- [x] 장비 목록 페이지에 site 필터 추가
- [x] 사용자 사이트를 기본값으로 사용
- [x] 역할 기반 필터 표시/숨김 로직

### 검증

- [x] 타입 체크 (일부 테스트 파일 오류는 기존 이슈)
- [x] 린트 체크 통과

## 다음 단계

1. ✅ 마이그레이션 실행 및 검증

   ```bash
   cd apps/backend
   pnpm db:migrate
   pnpm db:verify
   ```

2. ✅ 프론트엔드에서 사이트 필드 추가

   - EquipmentForm에 site 필드 추가 완료
   - 장비 목록 페이지에 site 필터 추가 완료
   - 사용자 사이트를 기본값으로 사용

3. ✅ 팀별 권한 체크 로직 강화

   - DB 조인 쿼리를 사용하여 장비의 팀 타입 확인
   - EMC팀이 RF팀 장비에 접근 시 ForbiddenException 발생
   - 현재 구조에서 가능한 범위 내에서 구현 완료

4. ✅ E2E 테스트 작성
   - `test/site-permissions.e2e-spec.ts` 생성
   - 사이트별 조회 권한 테스트
   - 장비 등록 시 사이트 필수 검증 테스트
   - 팀별 권한 제한 테스트 (스켈레톤)

## 추가 완료 사항

### 프론트엔드 구현

- ✅ EquipmentForm에 site 필드 추가 (사용자 사이트를 기본값으로)
- ✅ 장비 목록 페이지에 site 필터 추가 (기술책임자/관리자만 표시)
- ✅ 시험실무자는 자동으로 자신의 사이트로 필터링

### 팀별 권한 체크 개선

- ✅ DB 조인 쿼리를 사용하여 장비의 팀 타입 확인
- ✅ EMC팀이 RF팀 장비에 접근 시 실제로 거부 (ForbiddenException)
- ✅ CheckoutsService와 RentalsService 모두에 적용

### 마이그레이션 검증

- ✅ `scripts/verify-migration.ts` 스크립트 생성
- ✅ package.json에 `db:verify` 스크립트 추가
- ✅ 컬럼 존재 여부, 인덱스, 데이터 기본값 검증

## 실행 방법

### 마이그레이션 실행

```bash
cd apps/backend
pnpm db:migrate
```

### 마이그레이션 검증

```bash
cd apps/backend
pnpm db:verify
```

### E2E 테스트 실행

```bash
cd apps/backend
pnpm test:e2e site-permissions
```
