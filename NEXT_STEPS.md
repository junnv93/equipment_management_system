# 다음 단계 작업 가이드

이 문서는 프로젝트의 다음 작업 단계를 안내합니다.

## 🎯 즉시 수행할 작업 (우선순위 1)

### 1. 타입 생성 자동화 설정

**목표**: Drizzle 스키마에서 자동으로 TypeScript 타입 생성

**단계:**

```bash
# 1. Drizzle Kit 최신 버전 확인
cd apps/backend
pnpm add -D drizzle-kit@latest

# 2. 타입 생성 스크립트 추가 (package.json)
{
  "scripts": {
    "db:generate-types": "drizzle-kit introspect:pg",
    "db:push": "drizzle-kit push:pg"
  }
}

# 3. 실행
pnpm db:generate-types
```

### 2. 공유 스키마 패키지 업데이트

**파일**: `packages/schemas/src/equipment.ts`

```typescript
// Drizzle 스키마를 기반으로 Zod 스키마 생성
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { equipment } from '../../apps/backend/src/database/drizzle/schema/equipment';

// Zod 스키마 자동 생성
export const equipmentSchema = createSelectSchema(equipment);
export const createEquipmentSchema = createInsertSchema(equipment);
export const updateEquipmentSchema = createInsertSchema(equipment).partial();

// TypeScript 타입
export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;
```

### 3. 백엔드 DTO 재구성

**파일**: `apps/backend/src/modules/equipment/dto/create-equipment.dto.ts`

```typescript
import { createZodDto } from 'nestjs-zod';
import { createEquipmentSchema } from '@equipment-management/schemas';

// Zod 스키마에서 자동 생성된 DTO
export class CreateEquipmentDto extends createZodDto(createEquipmentSchema) {}

// 더 이상 수동으로 @IsString(), @IsNumber() 등을 작성할 필요 없음!
```

**필요한 패키지 설치:**
```bash
cd apps/backend
pnpm add nestjs-zod zod
```

### 4. 환경 변수 표준화

**변경할 파일들:**

1. **apps/backend/src/database/drizzle/index.ts**
   - ✅ 이미 완료됨

2. **docker-compose.yml**
   ```yaml
   services:
     backend:
       environment:
         - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/equipment_management
         - DB_HOST=postgres
         - DB_PORT=5432
         # ... 기타
   ```

3. **.env 파일들**
   - ✅ `.env.example` 이미 생성됨
   - ❌ `.env`, `.env.local` 직접 업데이트 필요

**작업 순서:**
```bash
# 1. .env.example을 복사
cp .env.example .env
cp .env.example apps/backend/.env
cp .env.example apps/frontend/.env.local

# 2. 각 파일에 실제 값 입력
# 3. Docker Compose 재시작
pnpm docker:restart
```

---

## 📋 후속 작업 (우선순위 2)

### 5. 테스트 작성

**우선 작성할 테스트:**

1. **Equipment Service 테스트**
   ```typescript
   // apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts
   describe('EquipmentService', () => {
     it('장비를 생성할 수 있어야 함', async () => {
       const dto = { name: '테스트 장비', ... };
       const result = await service.create(dto);
       expect(result.name).toBe('테스트 장비');
     });
   });
   ```

2. **Equipment API 통합 테스트**
   ```typescript
   // apps/backend/test/equipment.e2e-spec.ts
   it('/api/equipment (POST)', () => {
     return request(app.getHttpServer())
       .post('/api/equipment')
       .send(mockEquipment)
       .expect(201);
   });
   ```

### 6. API 문서화 완성

**모든 컨트롤러에 Swagger 데코레이터 추가:**

```typescript
@Controller('equipment')
@ApiTags('Equipment')
@ApiBearerAuth()
export class EquipmentController {
  @Post()
  @ApiOperation({ summary: '장비 등록' })
  @ApiResponse({ status: 201, description: '장비가 성공적으로 등록됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiBody({ type: CreateEquipmentDto })
  async create(@Body() dto: CreateEquipmentDto) {
    // ...
  }
}
```

### 7. 프론트엔드 페이지 완성

**우선 순위 페이지:**

1. **대시보드** (`app/(dashboard)/page.tsx`)
   - 장비 통계 카드
   - 최근 활동 목록
   - 교정 예정 알림

2. **장비 목록** (`app/equipment/page.tsx`)
   - 검색 및 필터링
   - 페이지네이션
   - 정렬 기능

3. **장비 상세** (`app/equipment/[id]/page.tsx`)
   - 장비 정보 표시
   - 대여/반출 이력
   - 교정 이력

---

## 🔧 기술 부채 해결

### 8. 남은 타입 불일치 수정

**확인이 필요한 파일:**

```bash
# 타입 불일치를 찾기 위한 검색
rg "parseInt.*teamId" apps/backend
rg "toString\(\)" apps/backend/src/modules
```

**수정 방향:**
- Drizzle 스키마의 타입을 기준으로
- DTO에서 변환 로직 제거
- 필요시 Zod transform 사용

### 9. 중복 코드 제거

**확인할 영역:**

1. **enum 정의 중복**
   ```typescript
   // ❌ 여러 곳에 정의됨
   // packages/schemas/src/enums.ts
   // apps/backend/src/types/enums.ts
   // apps/backend/src/database/drizzle/schema/equipment.ts
   ```

   **해결**: 단일 소스로 통합

2. **API 클라이언트 중복**
   ```typescript
   // ❌ 중복
   // apps/frontend/lib/api/*.ts
   // packages/api-client/src/*.ts
   ```

   **해결**: packages/api-client로 통합

---

## 📚 문서화 작업

### 10. README 업데이트

**각 앱과 패키지의 README:**

- [ ] apps/backend/README.md ✅ (완료)
- [ ] apps/frontend/README.md
- [ ] packages/schemas/README.md
- [ ] packages/api-client/README.md
- [ ] packages/ui/README.md

### 11. API 사용 가이드 작성

**파일**: `docs/api/USAGE_GUIDE.md`

**내용:**
- 인증 방법
- 주요 엔드포인트 사용 예제
- 에러 처리 방법
- Rate limiting 정보

---

## 🚀 배포 준비

### 12. Docker 환경 최종 점검

```bash
# 1. 프로덕션 빌드 테스트
docker-compose -f docker-compose.prod.yml build

# 2. 프로덕션 환경 실행 테스트
docker-compose -f docker-compose.prod.yml up

# 3. 헬스 체크 확인
curl http://localhost:3001/api/health
```

### 13. CI/CD 파이프라인 설정

**GitHub Actions 워크플로우:**

- [ ] 린트 체크
- [ ] 테스트 실행
- [ ] 빌드 검증
- [ ] Docker 이미지 빌드 및 푸시
- [ ] 자동 배포 (선택)

---

## ✅ 체크리스트

### 즉시 작업
- [ ] 타입 생성 자동화 설정
- [ ] 공유 스키마 패키지 업데이트
- [ ] 백엔드 DTO 재구성
- [ ] 환경 변수 표준화 완료

### 후속 작업
- [ ] Equipment Service 테스트 작성
- [ ] API 통합 테스트 작성
- [ ] Swagger 문서화 완성
- [ ] 대시보드 페이지 완성
- [ ] 장비 목록 페이지 완성

### 기술 부채
- [ ] 타입 불일치 수정
- [ ] 중복 enum 정의 통합
- [ ] API 클라이언트 통합

### 문서화
- [ ] 각 패키지 README 작성
- [ ] API 사용 가이드 작성
- [ ] 배포 가이드 작성

### 배포
- [ ] Docker 환경 최종 점검
- [ ] CI/CD 파이프라인 설정
- [ ] 프로덕션 배포

---

## 📞 도움이 필요하면

1. **GitHub 이슈 생성**
   - 버그나 기능 요청

2. **팀 채널 문의**
   - 개발 관련 질문

3. **문서 참조**
   - `PROJECT_ANALYSIS.md`
   - `MIGRATION_GUIDE.md`
   - 각 패키지의 README

---

**다음 작업을 시작하기 전에 이 문서를 확인하고, 완료된 항목은 체크하세요!**
