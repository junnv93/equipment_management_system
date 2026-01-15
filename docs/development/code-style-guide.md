# 코드 스타일 가이드

## 개요

장비 관리 시스템의 일관된 코드 스타일을 유지하기 위한 가이드라인을 제공합니다. 모든 개발자는 이 가이드라인을 따라 코드를 작성해야 합니다.

## 기본 원칙

1. **가독성**: 코드는 명확하고 이해하기 쉬워야 합니다.
2. **일관성**: 전체 코드베이스에서 일관된 스타일을 유지해야 합니다.
3. **검증 가능성**: 모든 코드는 자동화된 도구로 스타일을 검증할 수 있어야 합니다.

## 환경 설정

### 사용 도구

- **ESLint**: 코드 품질 및 스타일 검사
- **Prettier**: 코드 포맷팅 자동화
- **TypeScript**: 타입 검사 및 규칙

### VS Code 설정

`.vscode/settings.json` 파일을 다음과 같이 구성하세요:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

## 명명 규칙

### 파일 및 디렉토리 명명

- **파일 확장자**:
  - TypeScript: `.ts`
  - TypeScript React: `.tsx`
  - JSON: `.json`
  - 환경 변수: `.env`, `.env.local`, `.env.development` 등

- **파일 명명 규칙**:
  - **컴포넌트 파일**: PascalCase (예: `EquipmentList.tsx`, `UserProfile.tsx`)
  - **훅 파일**: camelCase, `use` 접두사 사용 (예: `useEquipment.ts`, `useAuth.ts`)
  - **유틸리티 파일**: camelCase (예: `dateUtils.ts`, `formatters.ts`)
  - **타입 정의 파일**: PascalCase, `.types.ts` 확장자 (예: `Equipment.types.ts`)
  - **스타일 파일**: 연관된 컴포넌트와 동일한 이름, `.styles.ts` 확장자 (예: `EquipmentList.styles.ts`)
  - **테스트 파일**: 테스트 대상과 동일한 이름, `.test.ts` 또는 `.spec.ts` 확장자 (예: `EquipmentList.test.tsx`)

- **디렉토리 명명 규칙**:
  - 기능 디렉토리: kebab-case (예: `equipment-management`)
  - 컴포넌트 디렉토리: PascalCase (예: `EquipmentList`)
  - 유틸리티 및 일반 디렉토리: camelCase (예: `utils`, `hooks`, `services`)

### 변수 및 함수 명명

- **상수**: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`, `API_BASE_URL`)
- **변수**: camelCase (예: `equipmentId`, `userProfile`)
- **불리언 변수**: `is`, `has`, `should` 접두사 사용 (예: `isActive`, `hasPermission`, `shouldRefresh`)
- **함수**: camelCase, 동사로 시작 (예: `getEquipment()`, `createUser()`, `updateProfile()`)
- **컴포넌트**: PascalCase (예: `EquipmentList`, `UserProfile`)
- **인터페이스**: PascalCase, `I` 접두사 없음 (예: `User`, `Equipment`)
- **타입**: PascalCase (예: `UserRole`, `EquipmentStatus`)
- **열거형(Enum)**: PascalCase (예: `UserRole`, `EquipmentCategory`)

### CSS 클래스 명명

- **CSS 클래스**: kebab-case (예: `equipment-item`, `user-profile`)
- **컴포넌트 클래스 접두사**: 컴포넌트 이름에 BEM 방식 적용 (예: `equipment-list__item`, `equipment-list__item--active`)

## 코드 포맷팅

### 들여쓰기 및 공백

- **들여쓰기**: 2칸 공백 사용
- **라인 종료**: LF(Linux Feed) 사용, CRLF 사용 금지
- **파일 끝**: 모든 파일은 빈 줄로 끝나야 함
- **공백 라인**: 논리적 섹션 사이에 한 줄의 공백 사용
- **최대 줄 길이**: 100자 (예외: 문자열, URL)

### 따옴표 및 중괄호

- **문자열**: 작은따옴표(`'`) 사용
- **JSX 속성**: 큰따옴표(`"`) 사용
- **객체 키**: 필요한 경우만 따옴표 사용 (예: 공백이 있거나 특수 문자가 있는 경우)
- **중괄호**: 항상 사용, 한 줄 문장도 중괄호 필요

### 세미콜론

- 모든 구문 끝에 세미콜론(`;`) 사용

### 예시

```typescript
// 좋은 예
const MAX_ITEMS = 100;

function fetchEquipment(id: string): Promise<Equipment> {
  return api.get(`/equipment/${id}`);
}

const isActive = status === 'active';

// 나쁜 예
const max_items = 100;

function fetch_equipment(id: string): Promise<Equipment> {
  return api.get("/equipment/" + id)
}

const active = status === 'active';
```

## TypeScript 규칙

### 타입 사용

- **암시적 any 금지**: `noImplicitAny` 사용
- **명시적 타입 정의**: 함수 매개변수와 반환 값에 타입 명시
- **인터페이스 우선**: 일반적인 경우 `type` 대신 `interface` 사용
- **유니온 타입**: 여러 타입을 허용할 때 유니온 타입 사용 (예: `string | number`)
- **타입 가드**: 타입 안전성을 위해 타입 가드 활용

### 타입 정의 예시

```typescript
// 인터페이스 정의
interface Equipment {
  id: string;
  name: string;
  description?: string;
  status: 'available' | 'in-use' | 'maintenance';
  category: EquipmentCategory;
  purchaseDate: Date;
}

// 열거형 정의
enum EquipmentCategory {
  Computer = 'computer',
  Monitor = 'monitor',
  Peripheral = 'peripheral',
  Network = 'network',
  Other = 'other',
}

// 타입 가드
function isEquipment(obj: any): obj is Equipment {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    (typeof obj.status === 'string' &&
      ['available', 'in-use', 'maintenance'].includes(obj.status))
  );
}
```

## React 컴포넌트

### 컴포넌트 구조

- **함수형 컴포넌트**: 클래스 컴포넌트 대신 함수형 컴포넌트와 훅 사용
- **디렉토리 구조**: 각 컴포넌트는 자체 디렉토리에 포함 (예: 컴포넌트, 테스트, 스타일 파일)
- **컴포넌트 크기**: 한 컴포넌트는 300줄을 넘지 않도록 함
- **Props 인터페이스**: 모든 컴포넌트는 명시적 Props 인터페이스 정의

### 컴포넌트 예시

```tsx
// EquipmentItem.tsx
import React from 'react';
import { formatDate } from 'utils/dateUtils';

interface EquipmentItemProps {
  id: string;
  name: string;
  status: 'available' | 'in-use' | 'maintenance';
  category: string;
  purchaseDate: Date;
  onStatusChange?: (id: string, status: string) => void;
}

export const EquipmentItem: React.FC<EquipmentItemProps> = ({
  id,
  name,
  status,
  category,
  purchaseDate,
  onStatusChange,
}) => {
  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(id, newStatus);
    }
  };

  return (
    <div className="equipment-item">
      <h3 className="equipment-item__name">{name}</h3>
      <div className="equipment-item__details">
        <span className={`equipment-item__status equipment-item__status--${status}`}>
          {status}
        </span>
        <span className="equipment-item__category">{category}</span>
        <span className="equipment-item__date">{formatDate(purchaseDate)}</span>
      </div>
      {onStatusChange && (
        <div className="equipment-item__actions">
          <button
            onClick={() => handleStatusChange('available')}
            disabled={status === 'available'}
          >
            Mark Available
          </button>
          <button
            onClick={() => handleStatusChange('maintenance')}
            disabled={status === 'maintenance'}
          >
            Mark Maintenance
          </button>
        </div>
      )}
    </div>
  );
};
```

## NestJS 백엔드

### 구조화 규칙

- **모듈 구조**: 기능별 모듈 분리
- **컨트롤러**: API 엔드포인트 정의
- **서비스**: 비즈니스 로직 처리
- **리포지토리**: 데이터 액세스 로직
- **DTO**: 데이터 전송 객체 명시적 정의
- **엔티티**: 데이터베이스 스키마 정의

### NestJS 예시

```typescript
// equipment.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['available', 'in-use', 'maintenance'],
    default: 'available',
  })
  status: string;

  @Column()
  category: string;

  @Column({ type: 'date' })
  purchaseDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// equipment.dto.ts
import { IsNotEmpty, IsEnum, IsDate, IsString, IsOptional } from 'class-validator';

export class CreateEquipmentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(['available', 'in-use', 'maintenance'])
  status: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsDate()
  purchaseDate: Date;
}
```

## 주석 규칙

### 주석 유형

- **문서화 주석**: JSDoc 스타일로 함수, 클래스, 인터페이스 문서화
- **인라인 주석**: 복잡한 로직에 대한 설명
- **TODO 주석**: 미완성 기능이나 개선 사항 표시

### 주석 예시

```typescript
/**
 * 장비 상태를 업데이트하고 관련 이벤트를 기록합니다.
 * 
 * @param id - 업데이트할 장비의 ID
 * @param status - 새로운 장비 상태
 * @param userId - 상태를 변경한 사용자 ID
 * @returns 업데이트된 장비 객체
 * @throws NotFoundException - 장비를 찾을 수 없는 경우
 */
async function updateEquipmentStatus(
  id: string,
  status: string,
  userId: string
): Promise<Equipment> {
  // 장비 존재 여부 확인
  const equipment = await this.equipmentRepository.findById(id);
  if (!equipment) {
    throw new NotFoundException(`Equipment with ID ${id} not found`);
  }

  // 상태 변경 전 기존 상태 저장
  const previousStatus = equipment.status;

  // TODO: 권한 검사 로직 추가 필요
  equipment.status = status;
  equipment.updatedAt = new Date();

  // 변경 내용 저장
  await this.equipmentRepository.save(equipment);

  // 상태 변경 이벤트 기록
  await this.eventService.recordStatusChange({
    equipmentId: id,
    userId,
    previousStatus,
    newStatus: status,
    timestamp: equipment.updatedAt,
  });

  return equipment;
}
```

## 에러 처리

### 에러 처리 원칙

- **명시적 에러 처리**: 모든 에러 상황에 대한 명시적 처리
- **사용자 친화적 메시지**: 사용자에게 보여질 메시지는 이해하기 쉽게 작성
- **에러 로깅**: 개발자를 위한 상세 에러 정보 로깅

### 에러 처리 예시

```typescript
try {
  await equipmentService.updateStatus(id, newStatus);
} catch (error) {
  // 명시적 에러 타입 처리
  if (error instanceof NotFoundException) {
    logger.warn(`Equipment not found: ${id}`);
    throw new HttpException('장비를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
  } else if (error instanceof ForbiddenException) {
    logger.warn(`Permission denied for user ${userId} on equipment ${id}`);
    throw new HttpException('이 작업을 수행할 권한이 없습니다.', HttpStatus.FORBIDDEN);
  }

  // 일반 에러 처리
  logger.error('Failed to update equipment status', {
    equipmentId: id,
    newStatus,
    error: error.message,
    stack: error.stack,
  });
  throw new HttpException('장비 상태를 업데이트하는 중 오류가 발생했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
}
```

## 테스트 코드 스타일

### 테스트 구조

- **테스트 이름**: 명확하고 설명적인 이름 사용
- **테스트 구조**: Arrange-Act-Assert 패턴 사용
- **목 객체**: 외부 의존성에 대한 목(mock) 사용
- **테스트 범위**: 단위 테스트, 통합 테스트, E2E 테스트 구분

### 테스트 예시

```typescript
describe('EquipmentService', () => {
  describe('updateStatus', () => {
    // Arrange: 테스트 설정
    const equipmentId = 'eq-123';
    const userId = 'user-456';
    const newStatus = 'maintenance';
    const equipment = {
      id: equipmentId,
      status: 'available',
      name: '테스트 장비',
      updatedAt: new Date(),
    };

    beforeEach(() => {
      jest.resetAllMocks();
      equipmentRepository.findById.mockResolvedValue(equipment);
      equipmentRepository.save.mockResolvedValue({ ...equipment, status: newStatus });
      eventService.recordStatusChange.mockResolvedValue(undefined);
    });

    it('should update equipment status and record event', async () => {
      // Act: 테스트 대상 함수 실행
      const result = await equipmentService.updateStatus(equipmentId, newStatus, userId);

      // Assert: 결과 검증
      expect(result.status).toBe(newStatus);
      expect(equipmentRepository.findById).toHaveBeenCalledWith(equipmentId);
      expect(equipmentRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: equipmentId,
        status: newStatus,
      }));
      expect(eventService.recordStatusChange).toHaveBeenCalledWith({
        equipmentId,
        userId,
        previousStatus: 'available',
        newStatus,
        timestamp: expect.any(Date),
      });
    });

    it('should throw NotFoundException when equipment not found', async () => {
      // Arrange: 테스트 설정 변경
      equipmentRepository.findById.mockResolvedValue(null);

      // Act & Assert: 예외 검증
      await expect(
        equipmentService.updateStatus(equipmentId, newStatus, userId)
      ).rejects.toThrow(NotFoundException);
      expect(equipmentRepository.save).not.toHaveBeenCalled();
      expect(eventService.recordStatusChange).not.toHaveBeenCalled();
    });
  });
});
```

## Git 커밋 메시지 규칙

### 커밋 메시지 형식

커밋 메시지는 다음 형식을 따릅니다:

```
<타입>(<범위>): <제목>

<본문>

<푸터>
```

### 커밋 타입

- **feat**: 새로운 기능 추가
- **fix**: 버그 수정
- **docs**: 문서 변경
- **style**: 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)
- **refactor**: 코드 리팩토링
- **test**: 테스트 코드 추가 또는 수정
- **chore**: 빌드 프로세스, 도구, 설정 변경 등

### 커밋 예시

```
feat(equipment): 장비 상태 변경 히스토리 추가

- 장비 상태 변경 시 이력을 저장하는 기능 구현
- 상태 변경 이력 조회 API 추가

Closes #123
```

## 코드 리뷰 체크리스트

### 리뷰 항목

- **기능성**: 코드가 요구사항을 충족하는가?
- **가독성**: 코드가 명확하고 이해하기 쉬운가?
- **유지 보수성**: 코드가 향후 변경에 대응하기 쉬운가?
- **성능**: 코드가 효율적인가?
- **보안**: 보안 위험이 적절히 처리되었는가?
- **테스트**: 충분한 테스트가 포함되어 있는가?
- **스타일**: 코드 스타일 가이드를 준수하는가?

### 리뷰 예시

```
기능성: ✅ 요구사항에 맞게 구현되었습니다.
가독성: ⚠️ 상태 변경 로직이 복잡하여 주석 추가가 필요합니다.
유지 보수성: ✅ 모듈화가 잘 되어 있습니다.
성능: ⚠️ 상태 변경 시 DB 쿼리가 2번 발생합니다. 최적화 필요.
보안: ✅ 권한 검사가 적절히 구현되었습니다.
테스트: ❌ 주요 에러 케이스에 대한 테스트가 누락되었습니다.
스타일: ✅ 코드 스타일 가이드를 준수합니다.
```

## 참고 문서

- [TypeScript 스타일 가이드](https://google.github.io/styleguide/tsguide.html)
- [Airbnb React/JSX 스타일 가이드](https://github.com/airbnb/javascript/tree/master/react)
- [NestJS 공식 문서](https://docs.nestjs.com/)
- [Conventional Commits](https://www.conventionalcommits.org/) 