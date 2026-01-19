import { Test, TestingModule } from '@nestjs/testing';
import { RentalsController } from '../rentals.controller';
import { RentalsService } from '../rentals.service';
import { CreateRentalDto } from '../dto/create-rental.dto';
import { UpdateRentalDto } from '../dto/update-rental.dto';
import { ReturnRequestDto, ReturnConditionEnum } from '../dto/return-request.dto';
import { ApproveReturnDto, ReturnApprovalStatusEnum } from '../dto/approve-return.dto';
import { ApproveRentalDto } from '../dto/approve-rental.dto';
import { RentalStatusEnum } from '../../../types/enums';
import { NotFoundException } from '@nestjs/common';

describe('RentalsController', () => {
  let controller: RentalsController;
  let service: RentalsService;

  // Mock RentalsService
  const mockRentalsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    requestReturn: jest.fn(),
    approveReturn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RentalsController],
      providers: [
        {
          provide: RentalsService,
          useValue: mockRentalsService,
        },
      ],
    }).compile();

    controller = module.get<RentalsController>(RentalsController);
    service = module.get<RentalsService>(RentalsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
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
        type: 'internal',
        startDate: new Date().toISOString(),
        expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        purpose: '테스트 목적',
        location: '테스트 위치',
      };

      const expectedResult = {
        id: 'test-rental-id',
        ...createRentalDto,
        status: RentalStatusEnum.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRentalsService.create.mockResolvedValue(expectedResult);

      // Mock request object
      const mockRequest = {
        user: {
          userId: 'test-user-id',
          teamId: 'test-team-id',
        },
      };

      // Execute controller method
      const result = await controller.create(createRentalDto, mockRequest);

      // Verify results
      expect(result).toBeDefined();
      expect(result.id).toBe('test-rental-id');
      expect(result.status).toBe(RentalStatusEnum.PENDING);
      expect(mockRentalsService.create).toHaveBeenCalled();
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

      const expectedResult = {
        items: rentals,
        meta: {
          totalItems: rentals.length,
          itemCount: rentals.length,
          itemsPerPage: query.pageSize,
          totalPages: 1,
          currentPage: query.page,
        },
      };

      mockRentalsService.findAll.mockResolvedValue(expectedResult);

      // Execute controller method
      const result = await controller.findAll(query as any);

      // Verify results
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(2);
      expect(mockRentalsService.findAll).toHaveBeenCalledWith(query);
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

      mockRentalsService.findOne.mockResolvedValue(rental);

      // Execute controller method
      const result = await controller.findOne('test-rental-id');

      // Verify results
      expect(result).toBeDefined();
      expect(result.id).toBe('test-rental-id');
      expect(mockRentalsService.findOne).toHaveBeenCalledWith('test-rental-id');
    });

    it('should throw NotFoundException when rental not found', async () => {
      mockRentalsService.findOne.mockRejectedValue(
        new NotFoundException('대여/반출을 찾을 수 없습니다.')
      );

      // Verify controller throws expected error
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(mockRentalsService.findOne).toHaveBeenCalledWith('non-existent-id');
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

      mockRentalsService.update.mockResolvedValue(updatedRental);

      // Execute controller method
      const result = await controller.update('test-rental-id', updateRentalDto);

      // Verify results
      expect(result).toBeDefined();
      expect(result.status).toBe(RentalStatusEnum.APPROVED);
      expect(result.notes).toBe('관리자 승인');
      expect(mockRentalsService.update).toHaveBeenCalledWith('test-rental-id', updateRentalDto);
    });
  });

  describe('approve', () => {
    it('should approve a rental', async () => {
      const approveDto: ApproveRentalDto = {
        comment: '승인합니다',
      };

      const approvedRental = {
        id: 'test-rental-id',
        status: RentalStatusEnum.APPROVED,
        approverId: 'test-approver-id',
        approverComment: '승인합니다',
        autoApproved: false,
      };

      mockRentalsService.approve.mockResolvedValue(approvedRental);

      const mockRequest = {
        user: {
          userId: 'test-approver-id',
          teamId: 'test-team-id',
        },
      };

      const result = await controller.approve('test-rental-id', approveDto, mockRequest);

      expect(result).toBeDefined();
      expect(result.status).toBe(RentalStatusEnum.APPROVED);
      expect(mockRentalsService.approve).toHaveBeenCalled();
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

      mockRentalsService.requestReturn.mockResolvedValue(returnedRental);

      // Execute controller method
      const result = await controller.requestReturn('test-rental-id', returnRequestDto);

      // Verify results
      expect(result).toBeDefined();
      expect(result.status).toBe(RentalStatusEnum.RETURN_REQUESTED);
      expect(mockRentalsService.requestReturn).toHaveBeenCalledWith(
        'test-rental-id',
        returnRequestDto
      );
    });
  });

  describe('approveReturn', () => {
    it('should approve a return request', async () => {
      const approvedRental = {
        id: 'test-rental-id',
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        status: RentalStatusEnum.RETURNED,
        notes: '반납 승인',
        approverId: 'test-admin-id',
        actualReturnDate: new Date(),
      };

      mockRentalsService.approveReturn.mockResolvedValue(approvedRental);

      // Execute controller method
      const result = await controller.approveReturn('test-rental-id');

      // Verify results
      expect(result).toBeDefined();
      expect(result.status).toBe(RentalStatusEnum.RETURNED);
      expect(result.approverId).toBe('test-admin-id');
      expect(result.actualReturnDate).toBeDefined();
      expect(mockRentalsService.approveReturn).toHaveBeenCalledWith('test-rental-id');
    });
  });

  describe('remove', () => {
    it('should remove a rental', async () => {
      // Mock data for the delete result
      const deleteResult = { deleted: true };

      mockRentalsService.remove.mockResolvedValue(deleteResult);

      // Execute controller method
      const result = await controller.remove('test-rental-id');

      // Verify results
      expect(result).toBeDefined();
      expect(mockRentalsService.remove).toHaveBeenCalledWith('test-rental-id');
    });
  });
});
