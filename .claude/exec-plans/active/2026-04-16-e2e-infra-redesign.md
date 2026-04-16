# Backend E2E 테스트 인프라 재설계

## 메타
- 생성: 2026-04-16T09:00:00+09:00
- 모드: Mode 2
- 예상 변경: ~27개 파일 (5개 신규 헬퍼 + 22개 기존 테스트 수정)

## 설계 철학
22개 E2E 테스트 파일에 걸쳐 반복되는 환경변수 설정, 앱 부트스트랩, 인증, 정리 로직을 공유 헬퍼로 추출하여 테스트 코드가 비즈니스 로직 검증에만 집중하도록 한다. 각 테스트 파일의 기능적 동작은 변경하지 않으며, 인프라 코드만 교체한다.

## 아키텍처 결정
| 결정 | 선택 | 근거 |
|------|------|------|
| 앱 인스턴스 공유 | 파일별 독립 인스턴스 유지 | Jest --runInBand 환경에서도 각 파일이 독립된 NestJS 앱을 사용해야 테스트 격리 보장. 싱글턴 패턴은 테스트 간 상태 오염 위험 |
| 환경변수 중앙화 | jest-setup.ts에 통합 | setupFilesAfterEnv로 이미 실행됨. 개별 파일에서 process.env 설정을 제거하고 jest-setup.ts에 전체 env 블록 통합 |
| 앱 부트스트랩 헬퍼 | createTestApp() 팩토리 함수 | Test.createTestingModule + compile + createNestApplication + init을 한 줄로 압축. 옵션으로 전역 prefix 등 설정 가능 |
| 인증 헬퍼 | loginAs(app, role) 패턴 | admin/manager/user 3가지 역할을 상수화. 토큰 캐싱으로 불필요한 중복 로그인 방지 |
| 테스트 픽스쳐 | createTestEquipment(app, token, overrides?) 등 | 장비/사용자/부적합 등 테스트 엔티티 생성을 팩토리로 추출. 각 팩토리가 생성 ID를 반환하여 정리에 활용 |
| 정리 전략 | CreatedResources 트래커 패턴 | 각 테스트에서 생성한 리소스 ID를 수집하고, afterAll에서 일괄 정리. 역순 삭제로 FK 위반 방지 |
| UUID 헬퍼 | 공유 유틸로 추출 | generateUUID(), isValidUUID()가 4개 파일에 중복 |
| REDIS_URL 포트 불일치 | 6379로 통일 (docker compose 기본값) | 일부 파일이 6380, 일부가 6379 사용. jest-setup.ts에서 6379로 통일 |

## 구현 Phase

### Phase 1: 공유 헬퍼 생성 + jest-setup.ts 강화
**목표:** 테스트 인프라 기반 파일 5개를 생성하고, 기존 jest-setup.ts를 확장한다.
**변경 파일:**
1. `apps/backend/test/jest-setup.ts` — 수정. 모든 환경변수를 여기에 통합 (NODE_ENV, REDIS_URL, JWT_SECRET, NEXTAUTH_SECRET, AZURE_AD_CLIENT_ID, AZURE_AD_TENANT_ID, DEV_ADMIN_PASSWORD, DEV_MANAGER_PASSWORD, DEV_USER_PASSWORD, UPLOAD_DIR). REDIS_URL을 6379로 통일
2. `apps/backend/test/helpers/test-app.ts` — 신규. createTestApp() 함수: TestingModule 생성 + NestApplication 초기화를 캡슐화. closeTestApp() 함수
3. `apps/backend/test/helpers/test-auth.ts` — 신규. TEST_USERS 상수 (email/password/role 매핑), loginAs(app, role) 함수 (토큰 반환), loginMultipleRoles(app, roles[]) 함수
4. `apps/backend/test/helpers/test-fixtures.ts` — 신규. createTestEquipment(app, token, overrides?), createTestCheckout(app, token, equipmentId), createTestNonConformance(app, token, equipmentId), createTestCable(app, token, overrides?), seedTestUsers(db, users[]) 등 팩토리 함수
5. `apps/backend/test/helpers/test-cleanup.ts` — 신규. ResourceTracker 클래스: track(type, id) + cleanupAll(app, token) 메서드. 역순 삭제 (checkouts → non-conformances → equipment)
6. `apps/backend/test/helpers/test-utils.ts` — 신규. generateUUID(), isValidUUID(), uniqueSuffix() 등 공통 유틸

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
# 헬퍼 파일만 타입 체크 통과 확인
```

### Phase 2: 간단한 테스트 파일 마이그레이션 (환경변수 제거 + 앱 부트스트랩 교체 + 인증 교체)
**목표:** 복잡도가 낮은 10개 파일을 먼저 마이그레이션한다. 이 파일들은 단일 역할 인증 + 간단한 정리 패턴을 사용한다.
**변경 파일:**
1. `apps/backend/test/auth.e2e-spec.ts` — 수정. env 제거, createTestApp 사용, loginAs 사용
2. `apps/backend/test/audit-logs.e2e-spec.ts` — 수정. 동일 패턴
3. `apps/backend/test/cables.e2e-spec.ts` — 수정. 동일 패턴 + ResourceTracker
4. `apps/backend/test/calibration-filter.e2e-spec.ts` — 수정. env 제거, createTestApp + loginAs
5. `apps/backend/test/equipment-filters.e2e-spec.ts` — 수정. 동일 패턴
6. `apps/backend/test/intermediate-check.e2e-spec.ts` — 수정. 동일 패턴
7. `apps/backend/test/team-filter.e2e-spec.ts` — 수정. 동일 패턴 (2개 역할 로그인)
8. `apps/backend/test/data-migration.e2e-spec.ts` — 수정. 동일 패턴
9. `apps/backend/test/repair-history.e2e-spec.ts` — 수정. createTestApp + loginAs + createTestEquipment + ResourceTracker
10. `apps/backend/test/shared-equipment.e2e-spec.ts` — 수정. 동일 패턴 + generateUUID 제거 (공유 유틸 사용)

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test:e2e -- --testPathPattern="auth|audit-logs|cables|calibration-filter|equipment-filters|intermediate-check|team-filter|data-migration|repair-history|shared-equipment"
```

### Phase 3: 중간 복잡도 테스트 파일 마이그레이션
**목표:** 다중 역할 인증 또는 복잡한 정리 로직을 가진 7개 파일을 마이그레이션한다.
**변경 파일:**
1. `apps/backend/test/users.e2e-spec.ts` — 수정. 복잡한 fallback 로그인 로직을 loginAs로 교체
2. `apps/backend/test/calibration-factors.e2e-spec.ts` — 수정. createTestEquipment + generateUUID 제거
3. `apps/backend/test/calibration-plans.e2e-spec.ts` — 수정. createTestEquipment + ResourceTracker
4. `apps/backend/test/checkouts.e2e-spec.ts` — 수정. createTestEquipment + ResourceTracker + generateUUID 제거
5. `apps/backend/test/equipment.e2e-spec.ts` — 수정. createTestApp + loginAs + ResourceTracker
6. `apps/backend/test/equipment-history.e2e-spec.ts` — 수정. createTestEquipment + ResourceTracker
7. `apps/backend/test/non-conformances.e2e-spec.ts` — 수정. createTestEquipment + ResourceTracker + generateUUID 제거

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test:e2e -- --testPathPattern="users|calibration-factors|calibration-plans|checkouts|equipment\\.e2e|equipment-history|non-conformances"
```

### Phase 4: 고복잡도 테스트 파일 마이그레이션
**목표:** DB 직접 접근, 다중 역할, 복잡한 워크플로우를 포함하는 5개 파일을 마이그레이션한다.
**변경 파일:**
1. `apps/backend/test/equipment-approval.e2e-spec.ts` — 수정. 3개 역할 로그인 + seedTestUsers + ResourceTracker. postgres 직접 연결 제거 (DB 인스턴스 사용)
2. `apps/backend/test/history-card-export.e2e-spec.ts` — 수정. DB 인스턴스 접근 + createTestApp
3. `apps/backend/test/incident-non-conformance-integration.e2e-spec.ts` — 수정. DB 인스턴스 접근 + createTestEquipment(DB 직접 생성 패턴 유지)
4. `apps/backend/test/manager-role-constraint.e2e-spec.ts` — 수정. DB 인스턴스 접근 + createTestApp + loginAs
5. `apps/backend/test/site-permissions.e2e-spec.ts` — 수정. 3개 역할 로그인 + 2개 사이트 장비 생성

**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test:e2e
# 전체 22개 파일 테스트 통과 확인
```

### Phase 5: 최종 검증 + 코드 품질
**목표:** 전체 테스트 수이트 통과 확인 및 코드 품질 점검.
**변경 파일:** 없음 (검증만)
**검증:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test:e2e
pnpm --filter backend run lint
```

## 전체 변경 파일 요약

### 신규 생성
| 파일 | 목적 |
|------|------|
| `apps/backend/test/helpers/test-app.ts` | NestJS 테스트 앱 부트스트랩 팩토리 |
| `apps/backend/test/helpers/test-auth.ts` | 역할별 인증 헬퍼 (TEST_USERS 상수 + loginAs) |
| `apps/backend/test/helpers/test-fixtures.ts` | 테스트 엔티티 생성 팩토리 (장비, 반출, 부적합 등) |
| `apps/backend/test/helpers/test-cleanup.ts` | ResourceTracker 기반 일관된 정리 |
| `apps/backend/test/helpers/test-utils.ts` | 공통 유틸 (UUID 생성/검증, 고유 접미사 등) |

### 수정
| 파일 | 변경 의도 |
|------|----------|
| `apps/backend/test/jest-setup.ts` | 모든 환경변수 통합, REDIS_URL 포트 통일 (6379) |
| `apps/backend/test/auth.e2e-spec.ts` | env 제거, createTestApp/loginAs 사용 |
| `apps/backend/test/users.e2e-spec.ts` | env 제거, createTestApp/loginAs 사용, 복잡한 fallback 로직 제거 |
| `apps/backend/test/audit-logs.e2e-spec.ts` | env 제거, createTestApp/loginAs 사용 |
| `apps/backend/test/cables.e2e-spec.ts` | env 제거, createTestApp/loginAs + ResourceTracker |
| `apps/backend/test/calibration-factors.e2e-spec.ts` | env 제거, createTestApp/loginAs + createTestEquipment + 로컬 UUID 함수 제거 |
| `apps/backend/test/calibration-filter.e2e-spec.ts` | env 제거, createTestApp/loginAs |
| `apps/backend/test/calibration-plans.e2e-spec.ts` | env 제거, createTestApp/loginAs + createTestEquipment + ResourceTracker |
| `apps/backend/test/checkouts.e2e-spec.ts` | env 제거, createTestApp/loginAs + createTestEquipment + ResourceTracker + 로컬 UUID 함수 제거 |
| `apps/backend/test/equipment.e2e-spec.ts` | env 제거, createTestApp/loginAs + ResourceTracker |
| `apps/backend/test/equipment-approval.e2e-spec.ts` | env 제거, createTestApp/loginMultipleRoles + seedTestUsers + ResourceTracker |
| `apps/backend/test/equipment-filters.e2e-spec.ts` | env 제거, createTestApp/loginAs |
| `apps/backend/test/equipment-history.e2e-spec.ts` | env 제거, createTestApp/loginAs + createTestEquipment + ResourceTracker |
| `apps/backend/test/history-card-export.e2e-spec.ts` | env 제거, createTestApp/loginAs |
| `apps/backend/test/incident-non-conformance-integration.e2e-spec.ts` | env 제거, createTestApp/loginAs |
| `apps/backend/test/intermediate-check.e2e-spec.ts` | env 제거, createTestApp/loginAs |
| `apps/backend/test/manager-role-constraint.e2e-spec.ts` | env 제거, createTestApp/loginAs |
| `apps/backend/test/non-conformances.e2e-spec.ts` | env 제거, createTestApp/loginAs + createTestEquipment + ResourceTracker + 로컬 UUID 함수 제거 |
| `apps/backend/test/repair-history.e2e-spec.ts` | env 제거, createTestApp/loginAs + createTestEquipment + ResourceTracker |
| `apps/backend/test/shared-equipment.e2e-spec.ts` | env 제거, createTestApp/loginAs + 로컬 UUID 함수 제거 |
| `apps/backend/test/site-permissions.e2e-spec.ts` | env 제거, createTestApp/loginMultipleRoles + createTestEquipment |
| `apps/backend/test/team-filter.e2e-spec.ts` | env 제거, createTestApp/loginAs |
| `apps/backend/test/data-migration.e2e-spec.ts` | env 제거, createTestApp/loginAs |

## 의사결정 로그

### 2026-04-16: 싱글턴 앱 vs 파일별 앱
싱글턴 패턴(전체 테스트 수이트에서 하나의 NestJS 앱 공유)을 고려했으나, 각 테스트 파일이 독립된 모듈 상태를 필요로 하고 Jest의 `--runInBand` 환경에서도 파일 간 상태 오염이 발생할 수 있어 파일별 독립 인스턴스를 유지하기로 결정. 대신 `createTestApp()` 팩토리로 보일러플레이트를 줄인다.

### 2026-04-16: 인증 토큰 캐싱 범위
파일 내에서만 캐싱하고, 파일 간 공유는 하지 않는다. 이유: 각 파일이 독립된 앱 인스턴스를 사용하므로 토큰도 앱별로 발급해야 한다. loginAs가 내부적으로 Map에 캐싱하여 같은 파일의 여러 describe에서 중복 로그인을 방지한다.

### 2026-04-16: REDIS_URL 포트 불일치 해결
`jest-setup.ts`의 기존 설정이 없었고, 개별 파일에서 6379/6380이 혼재. docker compose의 Redis 포트가 6379이므로 6379로 통일. `jest-setup.ts`에서 `process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'`로 설정.

### 2026-04-16: main.ts의 setGlobalPrefix('api')와 테스트
main.ts에서 `app.setGlobalPrefix('api')`를 설정하지만, 테스트에서는 설정하지 않는다. 이는 의도적인 설계 — 테스트 앱은 프로덕션과 다른 설정을 가지며, 라우트 경로가 `/auth/login`이 아닌 `/api/auth/login`이 되면 모든 테스트가 깨진다. createTestApp에서도 globalPrefix를 설정하지 않는다.

### 2026-04-16: Phase 순서 결정 기준
- Phase 1: 공유 인프라 우선 (다른 Phase의 의존성)
- Phase 2: 간단한 파일 먼저 (단일 역할, 간단한 정리 → 헬퍼 API 검증)
- Phase 3: 중간 복잡도 (다중 역할, 복잡한 정리 → 헬퍼의 실전 검증)
- Phase 4: 고복잡도 (DB 직접 접근, 시드 데이터 → 특수 케이스)
- Phase 5: 전체 검증

### 2026-04-16: DB 직접 접근 파일 처리 방식
equipment-approval, history-card-export, incident-non-conformance-integration, manager-role-constraint 파일은 `moduleFixture.get<AppDatabase>('DRIZZLE_INSTANCE')`로 DB에 직접 접근한다. 이 패턴은 유지하되, createTestApp이 TestingModule을 반환하도록 하여 DB 인스턴스 접근을 지원한다.

### 2026-04-16: ResourceTracker 설계
cleanup 순서가 중요하다 (FK 제약). 등록된 리소스를 역순으로 삭제하되, 리소스 타입별 우선순위도 적용한다:
1. checkouts/rentals (장비 참조)
2. non-conformances (장비 참조)
3. calibration-factors (장비 참조)
4. calibration-plans
5. repair-history
6. equipment (마지막에 삭제)
7. cables

DELETE 엔드포인트가 없는 리소스(cables)는 retired 상태로 변경하는 방식 유지.
