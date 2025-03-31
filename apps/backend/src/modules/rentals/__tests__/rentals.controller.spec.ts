import { Test, TestingModule } from '@nestjs/testing';
import { RentalsController } from '../rentals.controller';
import { RentalsService } from '../rentals.service';
import { CreateRentalDto } from '../dto/create-rental.dto';
import { UpdateRentalDto } from '../dto/update-rental.dto';
import { ReturnRequestDto, ReturnConditionEnum } from '../dto/return-request.dto';
import { ApproveReturnDto, ReturnApprovalStatusEnum } from '../dto/approve-return.dto';
import { RentalStatusEnum, RentalTypeEnum } from '../../../types/enums';
import { CacheModule } from '../../../common/cache/cache.module';
import { DrizzleModule } from '../../../database/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RentalsController', () => {
  let controller: RentalsController;
  let service: RentalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        DrizzleModule,
        CacheModule,
      ],
      controllers: [RentalsController],
      providers: [RentalsService],
    }).compile();

    controller = module.get<RentalsController>(RentalsController);
    service = module.get<RentalsService>(RentalsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new rental', async () => {
      // Mock data
      const createRentalDto: CreateRentalDto = {
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        type: 'INTERNAL',
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        purpose: '테스트 목적',
        location: '테스트 위치',
      };

      // Mock service method
      jest.spyOn(service, 'create').mockImplementation(async () => {
        return {
          id: 'test-rental-id',
          ...createRentalDto,
          status: RentalStatusEnum.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      });

      // Execute controller method
      const result = await controller.create(createRentalDto);

      // Verify results
      expect(result).toBeDefined();
      expect(result.id).toBe('test-rental-id');
      expect(result.status).toBe(RentalStatusEnum.PENDING);
      expect(service.create).toHaveBeenCalledWith(createRentalDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of rentals', async () => {
      // Mock data
      const rentals = [
        {
          id: 'test-rental-id-1',
          equipmentId: 'test-equipment-id-1',
          userId: 'test-user-id-1',
          status: RentalStatusEnum.APPROVED,
        },
        {
          id: 'test-rental-id-2',
          equipmentId: 'test-equipment-id-2',
          userId: 'test-user-id-2',
          status: RentalStatusEnum.PENDING,
        },
      ];

      // Mock query params
      const query = {
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      // Mock service method
      jest.spyOn(service, 'findAll').mockImplementation(async () => {
        return {
          items: rentals,
          total: rentals.length,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: Math.ceil(rentals.length / query.pageSize),
        } as any;
      });

      // Execute controller method
      const result = await controller.findAll(query as any);

      // Verify results
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(2);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a rental by id', async () => {
      // Mock data
      const rental = {
        id: 'test-rental-id',
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        status: RentalStatusEnum.APPROVED,
      };

      // Mock service method
      jest.spyOn(service, 'findOne').mockImplementation(async () => rental as any);

      // Execute controller method
      const result = await controller.findOne('test-rental-id');

      // Verify results
      expect(result).toBeDefined();
      expect(result.id).toBe('test-rental-id');
      expect(service.findOne).toHaveBeenCalledWith('test-rental-id');
    });

    it('should throw NotFoundException when rental not found', async () => {
      // Mock service method to throw error
      jest.spyOn(service, 'findOne').mockImplementation(async () => {
        throw new NotFoundException('대여/반출을 찾을 수 없습니다.');
      });

      // Verify controller throws expected error
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('update', () => {
    it('should update a rental', async () => {
      // Mock data
      const updateRentalDto: UpdateRentalDto = {
        status: RentalStatusEnum.APPROVED,
        notes: '관리자 승인',
      };

      const updatedRental = {
        id: 'test-rental-id',
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        status: RentalStatusEnum.APPROVED,
        notes: '관리자 승인',
      };

      // Mock service method
      jest.spyOn(service, 'update').mockImplementation(async () => updatedRental as any);

      // Execute controller method
      const result = await controller.update('test-rental-id', updateRentalDto);

      // Verify results
      expect(result).toBeDefined();
      expect(result.status).toBe(RentalStatusEnum.APPROVED);
      expect(result.notes).toBe('관리자 승인');
      expect(service.update).toHaveBeenCalledWith('test-rental-id', updateRentalDto);
    });
  });

  describe('requestReturn', () => {
    it('should request return for a rental', async () => {
      // Mock data
      const returnRequestDto: ReturnRequestDto = {
        returnCondition: ReturnConditionEnum.GOOD,
        returnNotes: '정상 반납',
      };

      const returnedRental = {
        id: 'test-rental-id',
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        status: RentalStatusEnum.RETURN_REQUESTED,
        notes: '정상 반납',
      };

      // Mock service method
      jest.spyOn(service, 'requestReturn').mockImplementation(async () => returnedRental as any);

      // Execute controller method
      const result = await controller.requestReturn('test-rental-id', returnRequestDto);

      // Verify results
      expect(result).toBeDefined();
      expect(result.status).toBe(RentalStatusEnum.RETURN_REQUESTED);
      expect(service.requestReturn).toHaveBeenCalledWith('test-rental-id', returnRequestDto);
    });
  });

  describe('approveReturn', () => {
    it('should approve a return request', async () => {
      // Mock data
      const approveReturnDto: ApproveReturnDto = {
        status: ReturnApprovalStatusEnum.APPROVED,
        notes: '반납 승인',
        approverId: 'test-admin-id',
      };

      const approvedRental = {
        id: 'test-rental-id',
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        status: RentalStatusEnum.RETURNED,
        notes: '반납 승인',
        approverId: 'test-admin-id',
        actualEndDate: new Date(),
      };

      // Mock service method
      jest.spyOn(service, 'approveReturn').mockImplementation(async () => approvedRental as any);

      // Execute controller method
      const result = await controller.approveReturn('test-rental-id');

      // Verify results
      expect(result).toBeDefined();
      expect(result.status).toBe(RentalStatusEnum.RETURNED);
      expect(result.approverId).toBe('test-admin-id');
      expect(result.actualEndDate).toBeDefined();
      expect(service.approveReturn).toHaveBeenCalledWith('test-rental-id');
    });
  });

  describe('remove', () => {
    it('should remove a rental', async () => {
      // Mock data for the delete result
      const deleteResult = { deleted: true };
      
      // Mock service method
      jest.spyOn(service, 'remove').mockImplementation(async () => deleteResult as any);

      // Execute controller method
      const result = await controller.remove('test-rental-id');

      // Verify results
      expect(result).toBeDefined();
      expect(service.remove).toHaveBeenCalledWith('test-rental-id');
    });
  });
}); 