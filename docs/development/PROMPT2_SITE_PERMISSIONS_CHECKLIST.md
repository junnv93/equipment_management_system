# 프롬프트 2: 사이트별 권한 관리 - 검증 체크리스트

**프롬프트**: PROMPTS_FOR_IMPLEMENTATION.md - 프롬프트 2  
**작성일**: 2025-01-28  
**상태**: 검증 진행 중

---

## 📋 요구사항 체크리스트

### 요구사항

- [x] **장비 테이블에 site 필드 추가**

  - `packages/db/src/schema/equipment.ts`: `site: varchar('site', { length: 20 }).notNull()` ✅
  - 인덱스 추가: `equipment_site_idx` ✅

- [x] **팀 테이블에 site 필드 추가**

  - `packages/db/src/schema/teams.ts`: `site: varchar('site', { length: 20 })` ✅

- [x] **장비 등록/수정 시 사이트 지정 필수**

  - `CreateEquipmentDto`: `site: 'suwon' | 'uiwang'` 필수 필드 ✅
  - Zod 스키마에서 필수 검증 ✅

- [x] **조회 권한: 시험실무자는 자신의 사이트 장비만 조회 가능**

  - `EquipmentController.findAll`: 역할 기반 사이트 필터링 구현 ✅
  - `EquipmentService.buildQueryConditions`: `userSite` 파라미터 사용 ✅

- [x] **기술책임자/관리자는 모든 사이트 조회 가능**

  - `EquipmentController.findAll`: `canViewAllSites` 로직 구현 ✅

- [x] **팀별 권한: EMC팀은 RF팀 장비 반출 신청/승인 불가**

  - `CheckoutsService.checkTeamPermission`: 팀별 권한 체크 메서드 구현 ✅
  - `create`, `approveFirst`, `approveFinal`에서 호출 ✅

- [x] **장비 등록 시 관리 팀 구분자 등록**
  - `teamId` 필드로 관리 팀 지정 가능 ✅

### 파일 수정

- [x] `packages/db/src/schema/equipment.ts` - site 필드 추가 ✅
- [x] `packages/db/src/schema/teams.ts` - site 필드 추가 ✅
- [x] `apps/backend/src/modules/equipment/equipment.service.ts` - 사이트 필터링 로직 ✅
- [x] `apps/backend/src/modules/equipment/equipment.controller.ts` - 사이트별 권한 체크 ✅
- [x] `apps/backend/src/modules/auth/guards/permissions.guard.ts` - 확인 필요 (사이트별 권한 체크)
- [x] `apps/backend/src/modules/checkouts/checkouts.service.ts` - 팀별 권한 체크 ✅
- [x] `apps/backend/src/modules/rentals/rentals.service.ts` - 팀별 권한 체크 ✅
- [x] `apps/backend/drizzle/0006_add_site_to_equipment_and_teams.sql` - 마이그레이션 생성 ✅
- [x] `apps/backend/drizzle/0009_make_equipment_site_required.sql` - site 필수 제약 추가 ✅

### 제약사항

- [x] **기존 장비 데이터 마이그레이션 필요 (기본값: 'suwon')**

  - 마이그레이션 0006에서 기본값 설정 ✅

- [x] **API_STANDARDS 준수**

  - 확인 필요

- [x] **근본적 해결**

  - 모든 관련 파일 일괄 수정 완료 ✅

- [x] **중복 제거**

  - 단일 소스 원칙 준수 ✅

- [x] **권한 체크는 가드에서 일관되게 처리**
  - 확인 필요 (현재는 서비스에서 처리)

### 검증

- [ ] **pnpm db:migrate**

  - 마이그레이션 적용 확인 필요

- [ ] **pnpm tsc --noEmit**

  - 타입 체크 필요

- [ ] **권한 테스트 작성 (E2E)**

  - 사이트별 조회 테스트 작성 필요
  - 팀별 권한 제한 테스트 작성 필요

- [ ] **사이트별 조회 테스트**

  - 시험실무자: 자신의 사이트만 조회 가능 확인
  - 기술책임자/관리자: 모든 사이트 조회 가능 확인

- [ ] **팀별 권한 제한 테스트**
  - EMC팀이 RF팀 장비 반출 신청 시도 → 403 Forbidden 확인
  - EMC팀이 RF팀 장비 반출 승인 시도 → 403 Forbidden 확인

---

## 🔍 상세 확인 사항

### 1. PermissionsGuard에서 사이트별 권한 체크

현재 `PermissionsGuard`는 역할 기반 권한만 체크하고 있습니다. 사이트별 권한 체크는 서비스 레이어에서 처리되고 있습니다.

**확인 필요**: 프롬프트에서 "권한 체크는 가드에서 일관되게 처리"라고 했지만, 현재는 서비스에서 처리 중입니다. 이 부분을 가드로 이동할지, 아니면 현재 구조를 유지할지 결정해야 합니다.

### 2. E2E 테스트

현재 사이트별 권한과 팀별 권한에 대한 E2E 테스트가 있는지 확인이 필요합니다.

---

## 📝 다음 단계

1. 데이터베이스 마이그레이션 확인
2. 타입 체크 실행
3. E2E 테스트 작성 및 실행
4. 문서 업데이트
