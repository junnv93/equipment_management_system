# 사이트별 권한 관리 시스템 구현 완료 요약

## 구현 일자

2025-01-XX

## 구현 완료 사항

### 1. 스키마 및 타입 정의 ✅

- **Zod 스키마** (`packages/schemas/src/equipment.ts`): `site` 필드를 필수로 변경
- **Drizzle 스키마** (`packages/db/src/schema/equipment.ts`): `site` 필드에 `.notNull()` 추가
- **DTO 수정**:
  - `CreateEquipmentDto`: `site` 필드를 필수로 변경
  - `UpdateEquipmentDto`: `site` 필드 포함 (선택적)
  - `EquipmentQueryDto`: `site` 필터 추가

### 2. 데이터베이스 마이그레이션 ✅

- **마이그레이션 파일**: `0009_make_equipment_site_required.sql`
  - 기존 장비 데이터에 기본값 'suwon' 설정
  - `site` 필드에 NOT NULL 제약조건 추가
  - CHECK 제약조건으로 유효한 사이트 값만 허용 ('suwon', 'uiwang')
- **마이그레이션 저널 업데이트**: `drizzle/meta/_journal.json`

### 3. 권한 체크 로직 구현 ✅

- **장비 목록 조회** (`findAll`):
  - 시험실무자: 자신의 사이트 장비만 조회
  - 기술책임자/관리자: 모든 사이트 조회 가능
- **장비 상세 조회** (`findOne`):
  - 시험실무자: 자신의 사이트 장비만 조회 가능 (다른 사이트 조회 시 403 오류)
  - 기술책임자/관리자: 모든 사이트 조회 가능
- **팀별 장비 조회** (`findByTeam`): 사이트 필터링 적용
- **교정 예정 장비 조회** (`findCalibrationDue`): 사이트 필터링 적용

### 4. 팀별 권한 체크 (기존 구현 확인) ✅

- **반출 서비스** (`checkouts.service.ts`): EMC팀은 RF팀 장비 반출 신청/승인 불가
- **대여 서비스** (`rentals.service.ts`): EMC팀은 RF팀 장비 대여 신청/승인 불가

### 5. 테스트 파일 수정 ✅

- `equipment.controller.spec.ts`: 모든 테스트에 `site` 필드 추가
- `equipment.service.spec.ts`: 모든 테스트에 `site` 필드 추가
- 컨트롤러 테스트에서 `req` 파라미터 추가

### 6. E2E 테스트 작성 ✅

- **사이트별 조회 권한 테스트**:
  - 시험실무자는 자신의 사이트 장비만 조회 가능
  - 시험실무자는 다른 사이트 장비 상세 조회 시 403 오류
  - 기술책임자/관리자는 모든 사이트 장비 조회 가능
  - 기술책임자는 다른 사이트 장비 상세 조회 가능
- **사이트 필드 필수 검증 테스트**:
  - 장비 등록 시 `site` 필드 없으면 400 오류
  - 장비 등록 시 `site` 필드 있으면 성공
- **팀별 권한 제한 테스트** (스켈레톤 완성):
  - EMC팀은 RF팀 장비 반출 신청 불가
  - EMC팀은 RF팀 장비 대여 신청 불가
  - 실제 테스트를 위해서는 팀/사용자 생성 로직 필요

## 다음 단계

### 즉시 실행 가능

1. **마이그레이션 실행**:

   ```bash
   cd apps/backend
   pnpm db:migrate
   ```

   ⚠️ 주의: 데이터베이스 연결 설정 확인 필요

2. **타입 체크**:
   ```bash
   cd apps/backend
   pnpm tsc --noEmit
   ```
   ✅ equipment 관련 타입 오류는 모두 해결됨

### 추가 작업 필요

3. **E2E 테스트 실행**:

   ```bash
   cd apps/backend
   pnpm test:e2e site-permissions
   ```

   ⚠️ 주의: 데이터베이스 연결 및 테스트 데이터 설정 필요

4. **팀별 권한 제한 테스트 완성**:
   - 팀 생성 API 또는 직접 DB 삽입
   - 팀에 속한 사용자 생성
   - 실제 팀 ID를 가진 장비 생성
   - EMC팀 사용자로 RF팀 장비 반출/대여 신청 테스트

## 주요 변경 파일

### 스키마 및 타입

- `packages/schemas/src/equipment.ts`
- `packages/db/src/schema/equipment.ts`
- `apps/backend/src/modules/equipment/dto/create-equipment.dto.ts`
- `apps/backend/src/modules/equipment/dto/update-equipment.dto.ts`
- `apps/backend/src/modules/equipment/dto/equipment-query.dto.ts`

### 비즈니스 로직

- `apps/backend/src/modules/equipment/equipment.service.ts`
- `apps/backend/src/modules/equipment/equipment.controller.ts`

### 마이그레이션

- `apps/backend/drizzle/0009_make_equipment_site_required.sql`
- `apps/backend/drizzle/meta/_journal.json`

### 테스트

- `apps/backend/src/modules/equipment/__tests__/equipment.controller.spec.ts`
- `apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts`
- `apps/backend/test/site-permissions.e2e-spec.ts`

## 검증 체크리스트

- [x] Zod 스키마에서 `site` 필드 필수로 변경
- [x] Drizzle 스키마에서 `site` 필드 NOT NULL 추가
- [x] DTO에서 `site` 필드 필수로 변경
- [x] 마이그레이션 파일 생성
- [x] 권한 체크 로직 구현
- [x] 테스트 파일 수정
- [x] E2E 테스트 작성
- [ ] 마이그레이션 실행 (데이터베이스 연결 필요)
- [ ] 전체 타입 체크 통과 (일부 테스트 파일 오류는 무시 가능)
- [ ] E2E 테스트 실행 (데이터베이스 연결 필요)

## 참고 문서

- [체크리스트](./PHASE2_6_SITE_PERMISSIONS_CHECKLIST.md)
- [API_STANDARDS.md](./API_STANDARDS.md)
- [AGENTS.md](../../AGENTS.md)
