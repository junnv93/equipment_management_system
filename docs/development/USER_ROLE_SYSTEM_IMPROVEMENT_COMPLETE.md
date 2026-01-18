# 사용자 역할 시스템 개선 완료 ✅

**완료일**: 2025-01-28  
**상태**: 완료

---

## 🎉 완료된 작업

### 1. 역할 시스템 변경 ✅

기존 역할을 새로운 역할 시스템으로 변경했습니다:

| 기존 역할  | 새로운 역할         | 설명                       |
| ---------- | ------------------- | -------------------------- |
| `USER`     | `test_operator`     | 시험실무자                 |
| `MANAGER`  | `technical_manager` | 기술책임자                 |
| `ADMIN`    | `site_admin`        | 시험소별 관리자            |
| `approver` | `technical_manager` | 승인자 (기술책임자로 매핑) |

### 2. 사용자 테이블 필드 추가 ✅

다음 필드가 `users` 테이블에 추가되었습니다:

- **`site`**: 사이트 정보 (`'suwon' | 'uiwang'`)
- **`location`**: 시험소 위치 정보 (`'수원랩' | '의왕랩'`)
- **`position`**: 직위/직책 정보

### 3. Azure AD 자동 매핑 ✅

Azure AD 그룹 정보를 자동으로 팀과 위치로 매핑하는 로직이 구현되었습니다:

- **그룹 패턴**: `LST.{SITE}.{TEAM}`
  - 예: `LST.SUW.RF` → RF팀 + 수원랩
  - 예: `LST.UIW.SAR` → SAR팀 + 의왕랩

### 4. 파일 업데이트 ✅

#### 데이터베이스 스키마

- ✅ `packages/db/src/schema/users.ts` - 새로운 역할 시스템 및 필드 추가
- ✅ `apps/backend/src/database/drizzle/schema/users.ts` - 레거시 스키마 업데이트

#### 스키마 패키지

- ✅ `packages/schemas/src/types/user-role.enum.ts` - 새로운 역할 enum
- ✅ `packages/schemas/src/enums.ts` - UserRoleEnum 업데이트

#### 백엔드

- ✅ `apps/backend/src/modules/auth/rbac/roles.enum.ts` - 새로운 역할 enum
- ✅ `apps/backend/src/modules/auth/rbac/role-permissions.ts` - 권한 재정의
- ✅ `apps/backend/src/modules/auth/auth.service.ts` - Azure AD 매핑 로직

#### 문서

- ✅ `docs/development/API_STANDARDS.md` - 사용자 역할 표준 업데이트

#### 마이그레이션

- ✅ `apps/backend/drizzle/0005_update_user_roles_and_add_site_location.sql` - 기존 마이그레이션 확인

---

## 🔄 하위 호환성

### 역할 매핑 테이블

기존 역할은 자동으로 새로운 역할로 매핑됩니다:

```typescript
// apps/backend/src/modules/auth/auth.service.ts
const roleMap: Record<string, UserRole> = {
  SiteAdmin: UserRole.SITE_ADMIN,
  TechnicalManager: UserRole.TECHNICAL_MANAGER,
  TestOperator: UserRole.TEST_OPERATOR,
  // 하위 호환성을 위한 기존 역할 매핑
  Admin: UserRole.SITE_ADMIN,
  Manager: UserRole.TECHNICAL_MANAGER,
  User: UserRole.TEST_OPERATOR,
};
```

### 타입 별칭

```typescript
// apps/backend/src/types/enums.ts
export enum UserRoleEnum {
  TEST_OPERATOR = 'test_operator',
  TECHNICAL_MANAGER = 'technical_manager',
  SITE_ADMIN = 'site_admin',
  // 하위 호환성을 위한 별칭
  /** @deprecated Use TEST_OPERATOR instead */
  USER = 'test_operator',
  /** @deprecated Use TECHNICAL_MANAGER instead */
  MANAGER = 'technical_manager',
  /** @deprecated Use SITE_ADMIN instead */
  ADMIN = 'site_admin',
}
```

---

## 📋 마이그레이션 스크립트

기존 데이터를 새로운 역할 시스템으로 변환하는 마이그레이션이 이미 생성되어 있습니다:

```sql
-- apps/backend/drizzle/0005_update_user_roles_and_add_site_location.sql

-- 1. 새 컬럼 추가
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "site" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "location" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "position" VARCHAR(100);

-- 2. 역할 변환
UPDATE "users" SET "role" = 'site_admin' WHERE "role" = 'admin';
UPDATE "users" SET "role" = 'technical_manager' WHERE "role" = 'manager';
UPDATE "users" SET "role" = 'test_operator' WHERE "role" = 'user';
UPDATE "users" SET "role" = 'technical_manager' WHERE "role" = 'approver';

-- 3. 기본값 업데이트
ALTER TABLE "users"
  ALTER COLUMN "role" SET DEFAULT 'test_operator';
```

---

## ✅ 검증 완료

### 타입 체크

```bash
pnpm tsc --noEmit
# ✅ 통과
```

### 하위 호환성 확인

- ✅ Azure AD 역할 매핑 로직 확인
- ✅ 기존 역할 자동 변환 확인
- ✅ 타입 별칭으로 인한 호환성 확인

---

## 📝 다음 단계

### 권장 사항

1. **마이그레이션 실행**

   ```bash
   cd apps/backend
   pnpm db:migrate
   ```

2. **기존 데이터 확인**

   ```sql
   SELECT role, COUNT(*) as count
   FROM users
   GROUP BY role
   ORDER BY role;
   ```

3. **Azure AD 테스트**

   - Azure AD 로그인 테스트
   - 그룹 매핑 확인
   - 사이트/위치 자동 설정 확인

4. **API 테스트**
   - 인증 플로우 테스트
   - 권한 기반 접근 제어 테스트
   - 사이트별 필터링 테스트

---

## 🔍 참고 파일

- **스키마 정의**: `packages/db/src/schema/users.ts`
- **역할 enum**: `packages/schemas/src/enums.ts`
- **권한 매핑**: `apps/backend/src/modules/auth/rbac/role-permissions.ts`
- **Azure AD 매핑**: `apps/backend/src/modules/auth/auth.service.ts`
- **API 표준**: `docs/development/API_STANDARDS.md`
- **마이그레이션**: `apps/backend/drizzle/0005_update_user_roles_and_add_site_location.sql`

---

**마지막 업데이트**: 2025-01-28
