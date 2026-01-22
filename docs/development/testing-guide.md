# 테스트 가이드

## 개요

장비 관리 시스템의 테스트 프레임워크와 환경 설정, 테스트 작성 방법, 테스트 실행 방법 등을 설명합니다.

## 테스트 환경

본 프로젝트는 다음 테스트 도구를 사용합니다:

- **Jest/Vitest**: 백엔드 및 프론트엔드 단위 테스트
- **React Testing Library**: 리액트 컴포넌트 테스트
- **Supertest**: API 엔드포인트 테스트
- **Playwright**: E2E 테스트

## 테스트 설정

### 테스트 의존성 설치

모든 테스트 의존성은 프로젝트 설정에 이미 포함되어 있습니다. 의존성을 설치하려면:

```bash
pnpm install
```

### 테스트 환경 구성

각 워크스페이스는 자체 테스트 구성을 가집니다:

- **Frontend**: `apps/frontend/jest.config.js`
- **Backend**: `apps/backend/jest.config.js`
- **공유 패키지**: 각 패키지 디렉토리의 `jest.config.js`

## 테스트 실행

### 모든 테스트 실행

모든 워크스페이스의 테스트를 한 번에 실행:

```bash
pnpm test
```

### 특정 워크스페이스 테스트 실행

특정 애플리케이션이나 패키지의 테스트만 실행:

```bash
# 프론트엔드 테스트 실행
pnpm frontend test

# 백엔드 테스트 실행
pnpm backend test

# 스키마 패키지 테스트 실행
pnpm schemas test
```

### 감시 모드로 테스트 실행

파일이 변경될 때마다 테스트를 자동으로 다시 실행:

```bash
# 모든 워크스페이스의 테스트를 감시 모드로 실행
pnpm test:watch

# 특정 워크스페이스의 테스트를 감시 모드로 실행
pnpm frontend test:watch
```

### 특정 테스트 파일 실행

```bash
# 특정 테스트 파일 실행
pnpm frontend test -- -t "컴포넌트명"

# 특정 테스트 파일 경로로 실행
pnpm backend test -- src/modules/equipment/equipment.service.spec.ts
```

### 코드 커버리지 확인

테스트 코드 커버리지 보고서 생성:

```bash
pnpm test --coverage
```

커버리지 보고서는 각 워크스페이스의 `coverage` 디렉토리에 생성됩니다.

## 테스트 작성 가이드

### 단위 테스트 (Unit Tests)

단위 테스트는 작은 단위의 코드(함수, 클래스, 컴포넌트 등)를 격리하여 테스트합니다.

#### 백엔드 서비스 테스트 예시

```typescript
// src/modules/equipment/equipment.service.spec.ts
import { Test } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { EquipmentRepository } from './equipment.repository';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let repository: EquipmentRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: EquipmentRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<EquipmentService>(EquipmentService);
    repository = moduleRef.get<EquipmentRepository>(EquipmentRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of equipment', async () => {
      const result = [{ id: 1, name: '장비1' }];
      jest.spyOn(repository, 'findAll').mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  // 더 많은 테스트 케이스...
});
```

#### 프론트엔드 컴포넌트 테스트 예시

```typescript
// src/components/EquipmentList/EquipmentList.test.tsx
import { render, screen } from '@testing-library/react';
import EquipmentList from './EquipmentList';

// 목 데이터
const mockEquipments = [
  { id: 1, name: '장비1', status: 'available' },
  { id: 2, name: '장비2', status: 'in-use' },
];

describe('EquipmentList', () => {
  it('renders equipment items correctly', () => {
    render(<EquipmentList items={mockEquipments} />);

    expect(screen.getByText('장비1')).toBeInTheDocument();
    expect(screen.getByText('장비2')).toBeInTheDocument();
  });

  it('shows correct status for each equipment', () => {
    render(<EquipmentList items={mockEquipments} />);

    const availableStatus = screen.getByText('available');
    const inUseStatus = screen.getByText('in-use');

    expect(availableStatus).toBeInTheDocument();
    expect(inUseStatus).toBeInTheDocument();
  });

  // 더 많은 테스트 케이스...
});
```

### 통합 테스트 (Integration Tests)

통합 테스트는 여러 구성 요소가 함께 작동하는 방식을 테스트합니다.

#### 백엔드 API 엔드포인트 테스트 예시

```typescript
// src/modules/equipment/equipment.controller.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Equipment Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/equipment (GET) should return all equipment', () => {
    return request(app.getHttpServer())
      .get('/equipment')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBeTruthy();
      });
  });

  it('/equipment/:id (GET) should return specific equipment', () => {
    return request(app.getHttpServer())
      .get('/equipment/1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('name');
      });
  });

  // 더 많은 테스트 케이스...
});
```

### 엔드투엔드 테스트 (E2E Tests)

엔드투엔드 테스트는 사용자 시나리오를 시뮬레이션하여 전체 애플리케이션을 테스트합니다.

#### Playwright를 사용한 E2E 테스트 예시

```typescript
// apps/frontend/e2e/equipment-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Equipment Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/equipment');
  });

  test('should display the equipment list', async ({ page }) => {
    await expect(page.getByTestId('equipment-list')).toBeVisible();
  });

  test('should be able to add new equipment', async ({ page }) => {
    await page.getByTestId('add-equipment-button').click();
    await page.getByTestId('equipment-name-input').fill('새 장비');
    await page.getByTestId('equipment-status-select').selectOption('available');
    await page.getByTestId('save-equipment-button').click();
    await expect(page.getByTestId('equipment-list')).toContainText('새 장비');
  });

  // 더 많은 테스트 케이스...
});
```

#### E2E 테스트 실행

```bash
# E2E 테스트 실행
pnpm test:e2e

# UI 모드로 실행 (디버깅용)
pnpm test:e2e:ui
```

## 목(Mock) 데이터 관리

### 목 데이터 생성

테스트에 사용할 목 데이터 및 목 함수:

#### 목 객체 생성하기

```typescript
// mocks/equipment.mock.ts
export const mockEquipment = {
  id: 1,
  name: '테스트 장비',
  description: '테스트 설명',
  status: 'available',
  category: '컴퓨터',
  purchaseDate: new Date('2023-01-01'),
};

export const mockEquipmentArray = [
  mockEquipment,
  {
    id: 2,
    name: '또 다른 장비',
    description: '또 다른 설명',
    status: 'in-use',
    category: '모니터',
    purchaseDate: new Date('2023-02-01'),
  },
];
```

#### 목 서비스 생성하기

```typescript
// mocks/equipment.service.mock.ts
import { mockEquipment, mockEquipmentArray } from './equipment.mock';

export const mockEquipmentService = {
  findAll: jest.fn().mockResolvedValue(mockEquipmentArray),
  findById: jest.fn().mockImplementation((id) => {
    if (id === 1) return Promise.resolve(mockEquipment);
    return Promise.resolve(null);
  }),
  create: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 3, ...dto })),
  update: jest.fn().mockImplementation((id, dto) => Promise.resolve({ id, ...dto })),
  remove: jest.fn().mockResolvedValue({ affected: 1 }),
};
```

### 공통 목 재사용

테스트 간에 공통 목을 재사용하려면:

```typescript
// 테스트 헬퍼 모듈 생성
// test/helpers/testing-module.helper.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from '../../src/modules/equipment/equipment.service';
import { mockEquipmentService } from '../mocks/equipment.service.mock';

export async function createTestingModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [
      {
        provide: EquipmentService,
        useValue: mockEquipmentService,
      },
      // 다른 모의 서비스...
    ],
  }).compile();
}
```

## 테스트 커버리지 목표

프로젝트의 테스트 커버리지 목표는 다음과 같습니다:

- **전체 코드 커버리지**: 70% 이상
- **핵심 비즈니스 로직**: 90% 이상
- **유틸리티 함수**: 80% 이상
- **UI 컴포넌트**: 60% 이상

## CI/CD에서의 테스트

GitHub Actions에서 테스트가 자동으로 실행됩니다:

```yaml
# .github/workflows/test.yml 예시
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Upload coverage reports
        uses: actions/upload-artifact@v3
        with:
          name: coverage-reports
          path: '**/coverage'
```

## 문제 해결

### 일반적인 테스트 문제

1. **테스트 실패 분석**

   - 실패한 테스트에 대한 자세한 로그 보기:
     ```bash
     pnpm test -- --verbose
     ```

2. **타임아웃 문제**

   - Jest 타임아웃 값 늘리기:
     ```bash
     pnpm test -- --testTimeout=30000
     ```

3. **테스트 분리 문제**

   - 테스트 환경 초기화:
     ```bash
     pnpm test -- --clearCache
     ```

4. **테스트 환경 변수**

   - 테스트 전용 환경 변수 설정:
     ```bash
     # .env.test 파일 생성
     # 테스트 실행 시 환경 변수 지정
     NODE_ENV=test pnpm test
     ```

## 테스트 모범 사례

1. **테스트의 독립성**

   - 각 테스트는 다른 테스트에 의존하지 않고 독립적으로 실행될 수 있어야 합니다.

2. **테스트 가독성**

   - 테스트 이름은 명확하고 설명적이어야 합니다.
   - 각 테스트는 설정(Arrange), 실행(Act), 검증(Assert) 패턴을 따르는 것이 좋습니다.

3. **테스트 데이터 관리**

   - 테스트 데이터는 코드에서 분리하여 관리하는 것이 좋습니다.
   - 필요한 경우 테스트 데이터베이스를 사용합니다.

4. **반복 작업 줄이기**

   - `beforeEach`, `afterEach`, `beforeAll`, `afterAll` 훅을 활용하여 반복 작업을 줄입니다.

5. **실제 사용 사례 테스트**
   - 사용자가 애플리케이션을 어떻게 사용할지 시나리오를 기반으로 테스트합니다.

## 추가 리소스

- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library 공식 문서](https://testing-library.com/docs/react-testing-library/intro/)
- [NestJS 테스팅 가이드](https://docs.nestjs.com/fundamentals/testing)
- [Playwright 공식 문서](https://playwright.dev/docs/intro)
