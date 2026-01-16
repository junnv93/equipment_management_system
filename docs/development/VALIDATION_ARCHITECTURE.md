# 검증 아키텍처: Zod 기반 통일

## 개요

장비 관리 시스템의 모든 API 검증은 **Zod 스키마**를 기반으로 합니다. 이는 Single Source of Truth 원칙을 준수하여 타입 안전성, 일관성, 유지보수성을 보장합니다.

## 핵심 원칙

### ✅ Single Source of Truth

- **모든 검증 스키마**: `@equipment-management/schemas` 패키지
- **데이터베이스 스키마**: `@equipment-management/db` 패키지 (Drizzle)
- **검증 파이프**: `ZodValidationPipe` 사용

### 검증 전략

1. **Zod 스키마 정의**: `packages/schemas/src/` 디렉토리
2. **컨트롤러에서 명시적 사용**: `@UsePipes(ZodValidationPipe)`
3. **전역 ValidationPipe 제거**: 충돌 방지

## 아키텍처 변경사항

### 이전 (문제점)

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({ ... })); // 전역 파이프

// equipment.controller.ts
@UsePipes(UpdateEquipmentValidationPipe) // Zod 파이프
update(@Body() dto: UpdateEquipmentDto) { ... }
```

**문제점**:

- 전역 ValidationPipe와 ZodValidationPipe가 함께 실행되어 충돌
- class-validator와 Zod 중복 검증
- 검증 로직이 여러 곳에 분산

### 현재 (해결책)

```typescript
// main.ts
// 전역 ValidationPipe 제거됨 ✅

// equipment.controller.ts
@UsePipes(UpdateEquipmentValidationPipe) // Zod 파이프만 사용
update(@Param('uuid', ParseUUIDPipe) uuid: string, @Body() dto: UpdateEquipmentDto) {
  return this.equipmentService.update(uuid, dto);
}
```

**장점**:

- ✅ 단일 검증 파이프만 실행 (충돌 없음)
- ✅ Zod 스키마가 단일 소스
- ✅ 타입 안전성 보장
- ✅ 프론트엔드/백엔드 스키마 공유

## 사용 방법

### 1. Zod 스키마 정의

```typescript
// packages/schemas/src/equipment.ts
export const baseEquipmentSchema = z.object({
  name: z.string().min(2).max(100),
  managementNumber: z.string().min(2).max(50),
  status: EquipmentStatusEnum.optional(),
  // ...
});

export const createEquipmentSchema = baseEquipmentSchema;
export const updateEquipmentSchema = baseEquipmentSchema.partial();
```

### 2. DTO 클래스 정의 (Swagger 문서화용)

```typescript
// apps/backend/src/modules/equipment/dto/create-equipment.dto.ts
export class CreateEquipmentDto implements CreateEquipmentInput {
  @ApiProperty({ description: '장비명' })
  name: string;

  // ... (Swagger 문서화용, 실제 검증은 Zod가 담당)
}

// Zod 검증 파이프 생성
export const CreateEquipmentValidationPipe = new ZodValidationPipe(createEquipmentSchema);
```

### 3. 컨트롤러에서 사용

```typescript
// apps/backend/src/modules/equipment/equipment.controller.ts
@Post()
@UsePipes(CreateEquipmentValidationPipe)
create(@Body() createEquipmentDto: CreateEquipmentDto) {
  return this.equipmentService.create(createEquipmentDto);
}
```

## 마이그레이션 상태

### ✅ 완료된 모듈

- **Equipment 모듈**: Zod 기반 검증 완료
- **Reservations 모듈**: Zod 기반 검증 완료

### ⚠️ 마이그레이션 필요

- **Users 모듈**: 아직 class-validator 사용 중
- **Auth 모듈**: 아직 class-validator 사용 중
- **Calibration 모듈**: 아직 class-validator 사용 중
- **기타 모듈들**: 점진적 마이그레이션 필요

## 마이그레이션 가이드

### 단계별 마이그레이션

1. **Zod 스키마 생성**

   ```typescript
   // packages/schemas/src/user.ts
   export const createUserSchema = z.object({
     email: z.string().email(),
     name: z.string().min(1).max(100),
     role: UserRoleEnum,
     // ...
   });
   ```

2. **DTO 업데이트**

   ```typescript
   // apps/backend/src/modules/users/dto/create-user.dto.ts
   export class CreateUserDto implements CreateUserInput {
     // class-validator 데코레이터 제거
     // @ApiProperty만 유지 (Swagger 문서화용)
   }

   // Zod 검증 파이프 추가
   export const CreateUserValidationPipe = new ZodValidationPipe(createUserSchema);
   ```

3. **컨트롤러 업데이트**
   ```typescript
   @Post()
   @UsePipes(CreateUserValidationPipe)
   create(@Body() createUserDto: CreateUserDto) {
     return this.usersService.create(createUserDto);
   }
   ```

## 장점 요약

1. **타입 안전성**: Zod 스키마에서 TypeScript 타입 자동 추론
2. **일관성**: 프론트엔드와 백엔드가 동일한 스키마 사용
3. **유지보수성**: 한 곳(`@equipment-management/schemas`)에서 스키마 관리
4. **중복 제거**: class-validator와 Zod 중복 검증 제거
5. **충돌 방지**: 전역 ValidationPipe 제거로 파이프 충돌 없음

## 참고 문서

- [API 표준 문서](./API_STANDARDS.md)
- [AGENTS.md](../../AGENTS.md)
- [Zod 공식 문서](https://zod.dev/)
