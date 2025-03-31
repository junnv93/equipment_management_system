import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import '@jest/globals';

jest.mock('../config/redis', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
  },
}));

export const prisma = new PrismaClient();

/**
 * 테스트용 카테고리 생성 헬퍼 함수
 */
export const createTestCategory = async (name = 'Test Category') => {
  return await prisma.category.create({
    data: {
      name,
      description: 'Test Description',
    },
  });
};

/**
 * 테스트용 위치 생성 헬퍼 함수
 */
export const createTestLocation = async (name = 'Test Location') => {
  return await prisma.location.create({
    data: {
      name,
      description: 'Test Description',
    },
  });
};

/**
 * 테스트용 장비 생성 헬퍼 함수
 */
export const createTestEquipment = async (options: {
  name?: string;
  serialNumber?: string;
  categoryId?: string;
  locationId?: string;
} = {}) => {
  const category = options.categoryId || (await createTestCategory()).id;
  const location = options.locationId || (await createTestLocation()).id;

  return await prisma.equipment.create({
    data: {
      name: options.name || 'Test Equipment',
      serialNumber: options.serialNumber || 'TEST123',
      purchaseDate: new Date(),
      categoryId: category,
      locationId: location,
    },
    include: {
      category: true,
      location: true,
    },
  });
};

/**
 * Redis 모킹 초기화 헬퍼 함수
 */
export const resetRedisMocks = () => {
  (redis.get as jest.Mock).mockReset();
  (redis.setex as jest.Mock).mockReset();
  (redis.get as jest.Mock).mockResolvedValue(null);
  (redis.setex as jest.Mock).mockResolvedValue('OK');
};

beforeAll(async () => {
  // Clear Redis cache mock
  (redis.flushall as jest.Mock).mockResolvedValue('OK');
});

afterAll(async () => {
  // Clean up database
  await prisma.$disconnect();
  // Clear Redis mock
  (redis.quit as jest.Mock).mockResolvedValue('OK');
});

beforeEach(async () => {
  // Clear all tables
  const tables = ['Equipment', 'Category', 'Location', 'MaintenanceRecord'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
  // Reset Redis mock
  resetRedisMocks();
}); 