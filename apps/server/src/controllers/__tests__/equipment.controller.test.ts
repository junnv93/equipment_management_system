import { Request, Response } from 'express';
import { getEquipments, getEquipmentById } from '../equipment.controller';
import { redis } from '../../config/redis';
import { cacheMiddleware } from '../../middleware/cache';
import '@jest/globals';
import { ApiResponse } from '../../utils/response';
import { createTestEquipment } from '../../test/setup';

jest.mock('../../utils/logger');

describe('Equipment Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: ApiResponse<any>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn().mockImplementation((result) => {
      responseObject = result;
      return mockResponse;
    });

    mockRequest = {
      query: {},
      params: {},
      originalUrl: '/equipment',
    };
    mockResponse = {
      json: jsonMock,
      status: jest.fn().mockReturnThis(),
    };

    // Redis 모킹은 setup.ts의 beforeEach에서 처리됨
  });

  describe('getEquipments', () => {
    it('should return paginated equipment list', async () => {
      // 헬퍼 함수를 사용하여 테스트 장비 생성
      await createTestEquipment();

      mockRequest.query = { page: '1', limit: '10' };
      await getEquipments(mockRequest as Request, mockResponse as Response);

      expect(responseObject).toHaveProperty('status', 'success');
      expect(responseObject).toHaveProperty('data');
      expect(responseObject).toHaveProperty('pagination');
      expect(responseObject.pagination?.total).toBe(1);
    });

    it('should use cache on subsequent requests', async () => {
      const mockData = {
        status: 'success',
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      // Mock Redis get to return data on second call
      (redis.get as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(mockData));

      mockRequest.query = { page: '1', limit: '10' };
      
      // Apply cache middleware and execute controller
      const middleware = cacheMiddleware('equipments');
      const next = jest.fn(() => getEquipments(mockRequest as Request, mockResponse as Response));
      
      // First request
      await middleware(mockRequest as Request, mockResponse as Response, next);
      expect(next).toHaveBeenCalled();
      
      // Wait for the cache to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(redis.setex).toHaveBeenCalled();
      
      // Reset mocks for second request
      next.mockClear();
      jsonMock.mockClear();
      
      // Second request should use cached data
      await middleware(mockRequest as Request, mockResponse as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(responseObject).toEqual(mockData);
    });
  });

  describe('getEquipmentById', () => {
    it('should return equipment by id', async () => {
      // 헬퍼 함수를 사용하여 테스트 장비 생성
      const equipment = await createTestEquipment();

      mockRequest.params = { id: equipment.id };
      await getEquipmentById(mockRequest as Request, mockResponse as Response);

      expect(responseObject).toHaveProperty('status', 'success');
      expect(responseObject).toHaveProperty('data');
      expect(responseObject.data?.id).toBe(equipment.id);
    });

    it('should return 404 for non-existent equipment', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      await getEquipmentById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(responseObject).toHaveProperty('status', 'error');
      expect(responseObject).toHaveProperty('message', 'Equipment not found');
    });
  });
}); 