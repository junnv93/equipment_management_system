import { Test, TestingModule } from '@nestjs/testing';
import { RentalsService } from '../rentals.service';
import { CreateRentalDto } from '../dto/create-rental.dto';
import { ReturnRequestDto, ReturnConditionEnum } from '../dto/return-request.dto';
import { ApproveReturnDto, ReturnApprovalStatusEnum } from '../dto/approve-return.dto';
import { RentalStatusEnum, RentalTypeEnum } from '../../../types/enums';

describe('RentalsService', () => {
  let service: RentalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RentalsService],
    }).compile();

    service = module.get<RentalsService>(RentalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestReturn', () => {
    it('should change status to RETURN_REQUESTED when requesting return', async () => {
      // 테스트용 대여 데이터 생성
      const createRentalDto: CreateRentalDto = {
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        type: 'INTERNAL' as any,
        startDate: '2023-06-01',
        expectedEndDate: '2023-06-15',
        purpose: '테스트 목적',
        location: '테스트 위치'
      };
      
      // 대여 생성
      const rental = await service.create(createRentalDto);
      
      // 생성된 대여의 상태를 APPROVED로 변경 (대여 중 상태)
      await service.update(rental.id, { status: 'APPROVED' as any });
      
      // 반납 요청 DTO
      const returnRequestDto: ReturnRequestDto = {
        returnCondition: ReturnConditionEnum.GOOD,
        returnNotes: '테스트 반납 메모'
      };
      
      // 반납 요청
      const returnedRental = await service.requestReturn(rental.id, returnRequestDto);
      
      // 검증
      expect(returnedRental).toBeDefined();
      expect(returnedRental?.status).toBe(RentalStatusEnum.RETURN_REQUESTED);
      expect(returnedRental?.notes).toContain(returnRequestDto.returnNotes);
    });
    
    it('should throw BadRequestException when requesting return for non-approved rental', async () => {
      // 테스트용 대여 데이터 생성
      const createRentalDto: CreateRentalDto = {
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        type: 'INTERNAL' as any,
        startDate: '2023-06-01',
        expectedEndDate: '2023-06-15',
        purpose: '테스트 목적',
        location: '테스트 위치'
      };
      
      // 대여 생성 (기본 상태는 PENDING)
      const rental = await service.create(createRentalDto);
      
      // 반납 요청 DTO
      const returnRequestDto: ReturnRequestDto = {
        returnCondition: ReturnConditionEnum.GOOD,
        returnNotes: '테스트 반납 메모'
      };
      
      // 대여 중 상태가 아닌 대여에 대한 반납 요청은 오류가 발생해야 함
      await expect(service.requestReturn(rental.id, returnRequestDto))
        .rejects.toThrow('승인된 대여/반출만 반납 요청할 수 있습니다.');
    });
  });

  describe('approveReturn', () => {
    it('should change status to RETURNED when approving return request', async () => {
      // 테스트용 대여 데이터 생성
      const createRentalDto: CreateRentalDto = {
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        type: 'INTERNAL' as any,
        startDate: '2023-06-01',
        expectedEndDate: '2023-06-15',
        purpose: '테스트 목적',
        location: '테스트 위치'
      };
      
      // 대여 생성
      const rental = await service.create(createRentalDto);
      
      // 생성된 대여의 상태를 APPROVED로 변경 (대여 중 상태)
      await service.update(rental.id, { status: 'APPROVED' as any });
      
      // 반납 요청 DTO
      const returnRequestDto: ReturnRequestDto = {
        returnCondition: ReturnConditionEnum.GOOD,
        returnNotes: '테스트 반납 메모'
      };
      
      // 반납 요청
      const returnRequestedRental = await service.requestReturn(rental.id, returnRequestDto);
      
      // 반납 승인 DTO
      const approveReturnDto: ApproveReturnDto = {
        status: ReturnApprovalStatusEnum.APPROVED,
        approverId: 'test-admin-id',
        notes: '테스트 승인 메모'
      };
      
      // 반납 승인
      const approvedRental = await service.approveReturn(returnRequestedRental.id, approveReturnDto);
      
      // 검증
      expect(approvedRental).toBeDefined();
      expect(approvedRental?.status).toBe(RentalStatusEnum.RETURNED);
      expect(approvedRental?.notes).toBe(approveReturnDto.notes);
      expect(approvedRental?.approverId).toBe(approveReturnDto.approverId);
      expect(approvedRental?.actualEndDate).toBeDefined();
    });
    
    it('should change status back to APPROVED when rejecting return request', async () => {
      // 테스트용 대여 데이터 생성
      const createRentalDto: CreateRentalDto = {
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        type: 'INTERNAL' as any,
        startDate: '2023-06-01',
        expectedEndDate: '2023-06-15',
        purpose: '테스트 목적',
        location: '테스트 위치'
      };
      
      // 대여 생성
      const rental = await service.create(createRentalDto);
      
      // 생성된 대여의 상태를 APPROVED로 변경 (대여 중 상태)
      await service.update(rental.id, { status: 'APPROVED' as any });
      
      // 반납 요청 DTO
      const returnRequestDto: ReturnRequestDto = {
        returnCondition: ReturnConditionEnum.GOOD,
        returnNotes: '테스트 반납 메모'
      };
      
      // 반납 요청
      const returnRequestedRental = await service.requestReturn(rental.id, returnRequestDto);
      
      // 반납 거절 DTO
      const rejectReturnDto: ApproveReturnDto = {
        status: ReturnApprovalStatusEnum.REJECTED,
        approverId: 'test-admin-id',
        notes: '테스트 거절 메모'
      };
      
      // 반납 거절
      const rejectedRental = await service.approveReturn(returnRequestedRental.id, rejectReturnDto);
      
      // 검증
      expect(rejectedRental).toBeDefined();
      expect(rejectedRental?.status).toBe(RentalStatusEnum.APPROVED);
      expect(rejectedRental?.notes).toBe(rejectReturnDto.notes);
    });
    
    it('should throw BadRequestException when approving return for non-return-requested rental', async () => {
      // 테스트용 대여 데이터 생성
      const createRentalDto: CreateRentalDto = {
        equipmentId: 'test-equipment-id',
        userId: 'test-user-id',
        type: 'INTERNAL' as any,
        startDate: '2023-06-01',
        expectedEndDate: '2023-06-15',
        purpose: '테스트 목적',
        location: '테스트 위치'
      };
      
      // 대여 생성 (기본 상태는 PENDING)
      const rental = await service.create(createRentalDto);
      
      // 반납 승인 DTO
      const approveReturnDto: ApproveReturnDto = {
        status: ReturnApprovalStatusEnum.APPROVED,
        approverId: 'test-admin-id',
        notes: '테스트 승인 메모'
      };
      
      // 반납 요청 상태가 아닌 대여에 대한 반납 승인은 오류가 발생해야 함
      await expect(service.approveReturn(rental.id, approveReturnDto))
        .rejects.toThrow('반납 요청 상태인 대여/반출만 승인할 수 있습니다.');
    });
  });
}); 