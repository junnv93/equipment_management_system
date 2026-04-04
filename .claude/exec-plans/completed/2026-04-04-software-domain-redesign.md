# 소프트웨어 도메인 재설계 — 잔여 작업 구현 계획

## 메타
- 생성: 2026-04-04T15:00:00+09:00
- 모드: Mode 2
- 예상 변경: ~25개 파일 (신규 2, 수정 ~23)

## 설계 철학
장비 펌웨어(equipment.firmwareVersion)와 시험용 소프트웨어(test_software 테이블)를 명확히 분리하고,
M:N 중간 테이블로 장비↔시험용SW 관계를 모델링한다. 기존 혼동 필드를 제거하고 네비게이션을 완성한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| 장비↔시험용SW 관계 | equipment_test_software 중간 테이블 (M:N) | 표준 패턴, 메타데이터(notes) 첨부 가능, 인덱싱 가능 |
| equipment 필드 정리 | softwareName/softwareType/softwareVersion 삭제, firmwareVersion 유지 | 시험용 SW는 test_software 테이블이 SSOT |
| 네비게이션 위치 | operations 섹션, non-conformances 아래 | 운영 모듈 그룹핑 |

## 구현 Phase

### Phase 1: DB 스키마 변경
**목표:** equipment 레거시 필드 제거, M:N 중간 테이블 생성, 역방향 relation 추가
**변경 파일:**
1. `packages/db/src/schema/equipment.ts` — (수정) softwareName, softwareType, softwareVersion 컬럼 + softwareNameIdx 인덱스 제거
2. `packages/db/src/schema/equipment-test-software.ts` — (신규) M:N 중간 테이블 + relations
3. `packages/db/src/schema/test-software.ts` — (수정) many(softwareValidations) 역방향 relation 추가
4. `packages/db/src/schema/index.ts` — (수정) equipment-test-software export 추가
**검증:** `pnpm --filter @equipment-management/db run build`

### Phase 2: 백엔드 변경
**목표:** equipment DTO/Zod에서 레거시 필드 제거, 시드 데이터 정리
**변경 파일:**
1. `packages/schemas/src/equipment.ts` — (수정) softwareVersion, softwareName, softwareType 제거
2. `apps/backend/src/modules/equipment/dto/create-equipment.dto.ts` — (수정) softwareVersion 필드 제거
3. `apps/backend/src/modules/equipment/dto/update-equipment.dto.ts` — (수정) softwareVersion 필드 제거
4. `apps/backend/src/modules/equipment/__tests__/equipment.controller.spec.ts` — (수정) softwareVersion: null 제거
5. `apps/backend/src/database/seed-data/core/equipment.seed.ts` — (수정) softwareName/softwareType 참조 제거
6. `apps/backend/src/database/seed-data/admin/audit-logs.seed.ts` — (수정) softwareName 참조 제거
7. `apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts` — (수정) softwareName 매핑 제거
**검증:** `pnpm --filter backend run tsc --noEmit && pnpm --filter backend run test`

### Phase 3: 프론트엔드 변경
**목표:** /software 네비게이션 등록, /software/create 페이지 생성, equipment 상세에서 레거시 필드 제거
**변경 파일:**
1. `packages/shared-constants/src/frontend-routes.ts` — (수정) SOFTWARE 라우트 추가
2. `apps/frontend/lib/navigation/nav-config.ts` — (수정) /software 사이드바 항목 추가
3. `apps/frontend/app/(dashboard)/software/create/page.tsx` — (신규) 시험용 SW 등록 페이지
4. `apps/frontend/components/equipment/BasicInfoTab.tsx` — (수정) softwareVersion 참조 제거
5. `apps/frontend/components/equipment/EquipmentForm.tsx` — (수정) softwareVersion 폼 필드 제거
6. `apps/frontend/components/equipment/StatusLocationSection.tsx` — (수정) softwareVersion 필드 제거
7. `apps/frontend/components/equipment/EditEquipmentClient.tsx` — (수정) softwareVersion 매핑 제거
8. `apps/frontend/components/equipment/BasicInfoSection.tsx` — (수정) softwareVersion 인터페이스 제거
9. `apps/frontend/components/approvals/detail-renderers.tsx` — (수정) software 관련 필드명 업데이트
10. `apps/frontend/messages/en/equipment.json` — (수정) softwareName/Type 관련 i18n 키 제거
11. `apps/frontend/messages/ko/equipment.json` — (수정) 동일
**검증:** `pnpm --filter frontend run tsc --noEmit && pnpm --filter frontend run build`

### Phase 4: 정리 및 검증
**목표:** 잔여 참조 제거, 전체 빌드 확인
**액션:**
1. grep softwareName/softwareType/SoftwareType — 비문서 파일에서 0건 확인
2. 전체 타입 체크 + 빌드 + 테스트
**검증:** `pnpm tsc --noEmit && pnpm build && pnpm --filter backend run test`

## 전체 변경 파일 요약
### 신규 생성
| 파일 | 목적 |
|------|------|
| `packages/db/src/schema/equipment-test-software.ts` | M:N 중간 테이블 |
| `apps/frontend/app/(dashboard)/software/create/page.tsx` | 시험용 SW 등록 페이지 |

### 수정
| 파일 | 변경 의도 |
|------|----------|
| `packages/db/src/schema/equipment.ts` | 레거시 SW 컬럼 3개 + 인덱스 제거 |
| `packages/db/src/schema/test-software.ts` | 역방향 relation 추가 |
| `packages/db/src/schema/index.ts` | 새 스키마 export |
| `packages/schemas/src/equipment.ts` | Zod에서 SW 필드 제거 |
| equipment DTOs (2파일) | softwareVersion 필드 제거 |
| equipment 테스트 (1파일) | 테스트 픽스처 정리 |
| seed 데이터 (2파일) | softwareName/Type 참조 제거 |
| column-mapping (1파일) | 마이그레이션 매핑 정리 |
| frontend-routes.ts | SOFTWARE 라우트 추가 |
| nav-config.ts | 사이드바 항목 추가 |
| equipment 컴포넌트 (5파일) | softwareVersion 참조 제거 |
| i18n (2파일) | 레거시 키 제거 |

## 의사결정 로그
- 2026-04-04: 장비 펌웨어 vs 시험용 SW 도메인 구분 확정 (사용자 확인)
- 2026-04-04: M:N 관계 결정 (하나의 SW가 여러 장비 제어, 하나의 장비가 여러 SW로 제어)
- 2026-04-04: softwareVersion + firmwareVersion → firmwareVersion 통합 결정
