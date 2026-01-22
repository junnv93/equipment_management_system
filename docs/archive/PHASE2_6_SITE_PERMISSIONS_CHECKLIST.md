# 사이트별 권한 관리 시스템 구현 체크리스트

## 구현 완료 사항

### ✅ 1. 스키마 및 타입 정의

- [x] Zod 스키마에서 `site` 필드를 필수로 변경 (`packages/schemas/src/equipment.ts`)
- [x] Drizzle 스키마에서 `site` 필드에 `.notNull()` 추가 (`packages/db/src/schema/equipment.ts`)
- [x] `CreateEquipmentDto`에서 `site` 필드를 필수로 변경
- [x] `UpdateEquipmentDto`에 `site` 필드 포함 (선택적)
- [x] `EquipmentQueryDto`에 `site` 필터 추가

### ✅ 2. 데이터베이스 마이그레이션

- [x] 마이그레이션 파일 생성 (`0009_make_equipment_site_required.sql`)
  - [x] 기존 장비 데이터에 기본값 'suwon' 설정
  - [x] `site` 필드에 NOT NULL 제약조건 추가
  - [x] CHECK 제약조건으로 유효한 사이트 값만 허용
- [x] 마이그레이션 저널 업데이트 (`drizzle/meta/_journal.json`)

### ✅ 3. 권한 체크 로직 구현

- [x] 장비 목록 조회 (`findAll`): 시험실무자는 자신의 사이트 장비만 조회
- [x] 장비 상세 조회 (`findOne`): 시험실무자는 자신의 사이트 장비만 조회 가능
- [x] 팀별 장비 조회 (`findByTeam`): 사이트 필터링 적용
- [x] 교정 예정 장비 조회 (`findCalibrationDue`): 사이트 필터링 적용
- [x] 기술책임자/관리자는 모든 사이트 조회 가능

### ✅ 4. 팀별 권한 체크 (기존 구현 확인)

- [x] 반출 서비스: EMC팀은 RF팀 장비 반출 신청/승인 불가
- [x] 대여 서비스: EMC팀은 RF팀 장비 대여 신청/승인 불가

### ✅ 5. 테스트 파일 수정

- [x] `equipment.controller.spec.ts`: 모든 테스트에 `site` 필드 추가
- [x] `equipment.service.spec.ts`: 모든 테스트에 `site` 필드 추가
- [x] 컨트롤러 테스트에서 `req` 파라미터 추가

### ✅ 6. 타입 체크

- [x] `pnpm --filter @equipment-management/schemas build` 실행
- [x] equipment 관련 타입 오류 해결

## 진행 중/남은 작업

### ✅ 7. 마이그레이션 실행

- [x] 마이그레이션 파일 생성 완료 (`0009_make_equipment_site_required.sql`)
- [x] 마이그레이션 저널 업데이트 완료
- [x] `pnpm db:migrate` 실행 시도 (Drizzle 마이그레이션 오류 발생)
- [x] 직접 SQL 실행으로 마이그레이션 완료
- [x] 마이그레이션 성공 확인
- [x] 데이터베이스 스키마 검증 완료
  - [x] site 컬럼 NOT NULL 확인
  - [x] CHECK 제약조건 확인

### ✅ 8. 최종 타입 체크

- [x] `pnpm tsc --noEmit` 실행 (equipment 관련)
- [x] equipment 관련 타입 오류 모두 해결
- [x] 테스트 파일 타입 오류 해결
- [x] 전체 프로젝트 타입 체크 완료 (equipment 관련 오류 없음)

### ✅ 9. E2E 테스트 작성

- [x] 사이트별 조회 권한 테스트
  - [x] 시험실무자는 자신의 사이트 장비만 조회 가능
  - [x] 시험실무자는 다른 사이트 장비 상세 조회 시 403 오류
  - [x] 기술책임자는 모든 사이트 장비 조회 가능
  - [x] 기술책임자는 다른 사이트 장비 상세 조회 가능
  - [x] 관리자는 모든 사이트 장비 조회 가능
- [x] 사이트 필드 필수 검증 테스트
  - [x] 장비 등록 시 `site` 필드 없으면 400 오류
  - [x] 장비 등록 시 `site` 필드 있으면 성공
- [x] 사이트 필터 테스트
  - [x] 사이트 필터로 특정 사이트 장비만 조회 가능
- [x] 팀별 권한 제한 테스트 (스켈레톤 완성)
  - [x] EMC팀은 RF팀 장비 반출 신청 불가 (테스트 구조 완성)
  - [x] EMC팀은 RF팀 장비 대여 신청 불가 (테스트 구조 완성)
  - [x] 테스트 실행 완료
  - [x] 사이트 필드 필수 검증 테스트 통과 확인
  - [x] **모든 E2E 테스트 통과 (9/9) ✅**

## 검증 항목

### ✅ 기능 검증

- [x] 시험실무자로 로그인하여 자신의 사이트 장비만 조회되는지 확인 (테스트 통과)
- [x] 기술책임자로 로그인하여 모든 사이트 장비 조회되는지 확인 (테스트 통과)
- [x] 장비 등록 시 `site` 필드 없으면 400 오류 반환 확인 (테스트 통과)
- [x] 사이트 필터로 특정 사이트 장비만 조회 가능 (테스트 통과)
- [x] 시험실무자는 다른 사이트 장비 상세 조회 시 403 오류 (테스트 통과)
- [ ] EMC팀 사용자가 RF팀 장비 반출 신청 시 403 오류 반환 확인 (테스트 구조 완성, 실제 사용자 필요)

### 성능 검증

- [x] 사이트 필터링이 인덱스를 활용하는지 확인 (인덱스 생성 완료: `equipment_site_idx`)
- [ ] 대량 데이터에서도 빠른 조회 성능 유지 (프로덕션 환경에서 검증 필요)

### 보안 검증

- [x] 권한 없는 사용자가 다른 사이트 장비 조회 시도 시 차단 확인 (테스트 통과)
- [x] API 엔드포인트에서 일관된 권한 체크 확인 (컨트롤러 레벨에서 구현 완료)

## 참고 문서

- [API_STANDARDS.md](../development/API_STANDARDS.md)
- [AGENTS.md](../../AGENTS.md)
- [PHASE2_5_SITE_PERMISSIONS_COMPLETE.md](./PHASE2_5_SITE_PERMISSIONS_COMPLETE.md)
