import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateRentalDto, UpdateRentalDto, RentalQueryDto } from './dto';
import { Rental, RentalListResponse } from '@equipment-management/schemas';
import { RentalStatusEnum, RentalTypeEnum } from '../../types/enums';

// 타입이 안전한 임시 데이터
const rentals: Rental[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    equipmentId: '550e8400-e29b-41d4-a716-446655440100',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    type: RentalTypeEnum.INTERNAL as any,
    status: RentalStatusEnum.APPROVED as any,
    startDate: new Date('2023-06-01T09:00:00Z'),
    expectedEndDate: new Date('2023-06-15T18:00:00Z'),
    actualEndDate: null,
    purpose: 'RF 방사 테스트 진행',
    location: '연구소 2층 RF 시험실',
    approverId: '550e8400-e29b-41d4-a716-446655440000',
    notes: '프로젝트 A에 사용 예정',
    createdAt: new Date('2023-05-30T10:00:00Z'),
    updatedAt: new Date('2023-05-31T14:30:00Z')
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    equipmentId: '550e8400-e29b-41d4-a716-446655440101',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    type: RentalTypeEnum.EXTERNAL as any,
    status: RentalStatusEnum.RETURNED as any,
    startDate: new Date('2023-05-15T08:00:00Z'),
    expectedEndDate: new Date('2023-05-25T17:00:00Z'),
    actualEndDate: new Date('2023-05-24T16:30:00Z'),
    purpose: '고객사 현장 데모',
    location: '서울 강남구 고객사 사무실',
    approverId: '550e8400-e29b-41d4-a716-446655440001',
    notes: '데모 후 즉시 반납 완료',
    createdAt: new Date('2023-05-10T09:15:00Z'),
    updatedAt: new Date('2023-05-24T16:45:00Z')
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    equipmentId: '550e8400-e29b-41d4-a716-446655440102',
    userId: '550e8400-e29b-41d4-a716-446655440003',
    type: RentalTypeEnum.INTERNAL as any,
    status: RentalStatusEnum.PENDING as any,
    startDate: new Date('2023-06-10T10:00:00Z'),
    expectedEndDate: new Date('2023-06-20T18:00:00Z'),
    actualEndDate: null,
    purpose: 'EMC 테스트 진행',
    location: 'EMC 시험실',
    approverId: null,
    notes: '승인 대기 중',
    createdAt: new Date('2023-06-05T11:20:00Z'),
    updatedAt: new Date('2023-06-05T11:20:00Z')
  }
];

@Injectable()
export class RentalsService {
  async findAll(query: RentalQueryDto): Promise<RentalListResponse> {
    let filteredRentals = [...rentals];
    
    // 장비 ID 필터링
    if (query.equipmentId) {
      filteredRentals = filteredRentals.filter(rental => 
        rental.equipmentId === query.equipmentId
      );
    }
    
    // 사용자 ID 필터링
    if (query.userId) {
      filteredRentals = filteredRentals.filter(rental => 
        rental.userId === query.userId
      );
    }
    
    // 승인자 ID 필터링
    if (query.approverId) {
      filteredRentals = filteredRentals.filter(rental => 
        rental.approverId === query.approverId
      );
    }
    
    // 대여/반출 유형 필터링
    if (query.types) {
      const types = query.types.split(',');
      filteredRentals = filteredRentals.filter(rental => 
        types.includes(rental.type as string)
      );
    }
    
    // 상태 필터링
    if (query.statuses) {
      const statuses = query.statuses.split(',');
      filteredRentals = filteredRentals.filter(rental => 
        statuses.includes(rental.status as string)
      );
    }
    
    // 시작 날짜 범위 필터링
    if (query.startFrom) {
      const startFrom = new Date(query.startFrom);
      filteredRentals = filteredRentals.filter(rental => {
        const rentalStartDate = rental.startDate instanceof Date 
          ? rental.startDate 
          : new Date(rental.startDate);
        return rentalStartDate >= startFrom;
      });
    }
    
    if (query.startTo) {
      const startTo = new Date(query.startTo);
      filteredRentals = filteredRentals.filter(rental => {
        const rentalStartDate = rental.startDate instanceof Date 
          ? rental.startDate 
          : new Date(rental.startDate);
        return rentalStartDate <= startTo;
      });
    }
    
    // 종료 예정 날짜 범위 필터링
    if (query.endFrom) {
      const endFrom = new Date(query.endFrom);
      filteredRentals = filteredRentals.filter(rental => {
        const rentalEndDate = rental.expectedEndDate instanceof Date 
          ? rental.expectedEndDate 
          : new Date(rental.expectedEndDate);
        return rentalEndDate >= endFrom;
      });
    }
    
    if (query.endTo) {
      const endTo = new Date(query.endTo);
      filteredRentals = filteredRentals.filter(rental => {
        const rentalEndDate = rental.expectedEndDate instanceof Date 
          ? rental.expectedEndDate 
          : new Date(rental.expectedEndDate);
        return rentalEndDate <= endTo;
      });
    }
    
    // 검색어 필터링
    if (query.search) {
      const searchLowerCase = query.search.toLowerCase();
      filteredRentals = filteredRentals.filter(rental =>
        (rental.purpose && rental.purpose.toLowerCase().includes(searchLowerCase)) ||
        (rental.location && rental.location.toLowerCase().includes(searchLowerCase)) ||
        (rental.notes && rental.notes.toLowerCase().includes(searchLowerCase))
      );
    }
    
    // 정렬
    if (query.sort) {
      const [field, direction] = query.sort.split('.');
      const sortDir = direction === 'desc' ? -1 : 1;
      
      filteredRentals.sort((a, b) => {
        if (a[field] < b[field]) return -1 * sortDir;
        if (a[field] > b[field]) return 1 * sortDir;
        return 0;
      });
    } else {
      // 기본 정렬: 시작일 내림차순 (최신순)
      filteredRentals.sort((a, b) => {
        const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
        const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
        return dateB.getTime() - dateA.getTime();
      });
    }
    
    // 페이지네이션
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const total = filteredRentals.length;
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;
    
    const items = filteredRentals.slice(skip, skip + pageSize);
    
    return {
      items,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  async findOne(id: string): Promise<Rental | null> {
    const rental = rentals.find(rental => rental.id === id);
    return rental || null;
  }

  async create(createRentalDto: CreateRentalDto): Promise<Rental> {
    // 실제 구현에서는 장비 존재 여부, 사용자 존재 여부, 대여 가능 여부 등을 확인
    
    const now = new Date();
    
    // DTO에서 받은 대소문자 값을 소문자로 변환
    const typeValue = createRentalDto.type.toLowerCase();
    const typeEnumValue = typeValue === 'internal' 
      ? RentalTypeEnum.INTERNAL 
      : RentalTypeEnum.EXTERNAL;
    
    // 타입 안전한 방식으로 생성
    const rental: Rental = {
      id: randomUUID(),
      equipmentId: createRentalDto.equipmentId,
      userId: createRentalDto.userId,
      type: typeEnumValue as any,
      status: RentalStatusEnum.PENDING as any,
      startDate: createRentalDto.startDate,
      expectedEndDate: createRentalDto.expectedEndDate,
      actualEndDate: null,
      purpose: createRentalDto.purpose,
      location: createRentalDto.location,
      approverId: createRentalDto.approverId,
      notes: createRentalDto.notes,
      createdAt: now,
      updatedAt: now
    };
    
    rentals.push(rental);
    return rental;
  }

  async update(id: string, updateRentalDto: UpdateRentalDto): Promise<Rental | null> {
    const rentalIndex = rentals.findIndex(rental => rental.id === id);
    if (rentalIndex === -1) {
      return null;
    }
    
    // 상태값 처리
    const parsedDto: any = { ...updateRentalDto };
    
    // status 값이 있으면 enum 값으로 변환
    if (updateRentalDto.status) {
      switch(updateRentalDto.status) {
        case 'PENDING':
        case 'pending':
          parsedDto.status = RentalStatusEnum.PENDING;
          break;
        case 'APPROVED':
        case 'approved':
          parsedDto.status = RentalStatusEnum.APPROVED;
          break;
        case 'REJECTED':
        case 'rejected':
          parsedDto.status = RentalStatusEnum.REJECTED;
          break;
        case 'BORROWED':
        case 'borrowed':
          parsedDto.status = RentalStatusEnum.BORROWED;
          break;
        case 'RETURNED':
        case 'returned':
          parsedDto.status = RentalStatusEnum.RETURNED;
          break;
        case 'OVERDUE':
        case 'overdue':
          parsedDto.status = RentalStatusEnum.OVERDUE;
          break;
        case 'CANCELED':
        case 'canceled':
          parsedDto.status = RentalStatusEnum.CANCELED;
          break;
      }
    }
    
    const updatedRental = {
      ...rentals[rentalIndex],
      ...parsedDto,
      updatedAt: new Date()
    };
    
    rentals[rentalIndex] = updatedRental;
    return updatedRental;
  }

  async remove(id: string): Promise<boolean> {
    const rentalIndex = rentals.findIndex(rental => rental.id === id);
    if (rentalIndex === -1) {
      return false;
    }
    
    // 실제 구현에서는 삭제 전 검증 로직 필요
    
    rentals.splice(rentalIndex, 1);
    return true;
  }
  
  async approve(id: string, approverId: string): Promise<Rental | null> {
    const rental = await this.findOne(id);
    if (!rental) {
      return null;
    }
    
    if (rental.status !== RentalStatusEnum.PENDING) {
      throw new BadRequestException('대기 중인 대여/반출만 승인할 수 있습니다.');
    }
    
    return this.update(id, { 
      status: 'APPROVED',
      approverId
    });
  }
  
  async reject(id: string, approverId: string, reason?: string): Promise<Rental | null> {
    const rental = await this.findOne(id);
    if (!rental) {
      return null;
    }
    
    if (rental.status !== RentalStatusEnum.PENDING) {
      throw new BadRequestException('대기 중인 대여/반출만 거절할 수 있습니다.');
    }
    
    return this.update(id, { 
      status: 'REJECTED',
      approverId,
      notes: reason || '거절 사유 없음'
    });
  }
  
  async complete(id: string): Promise<Rental | null> {
    const rental = await this.findOne(id);
    if (!rental) {
      return null;
    }
    
    if (rental.status !== RentalStatusEnum.BORROWED && rental.status !== RentalStatusEnum.APPROVED) {
      throw new BadRequestException('대여 중이거나 승인된 대여/반출만 완료할 수 있습니다.');
    }
    
    const updateData: UpdateRentalDto = {
      status: 'RETURNED'
    };
    
    // actualEndDate는 UpdateRentalDto에 없기 때문에 별도 처리
    return this.update(id, updateData).then(updatedRental => {
      if (updatedRental) {
        updatedRental.actualEndDate = new Date();
        const index = rentals.findIndex(r => r.id === id);
        if (index !== -1) {
          rentals[index] = updatedRental;
        }
      }
      return updatedRental;
    });
  }
  
  async cancel(id: string): Promise<Rental | null> {
    const rental = await this.findOne(id);
    if (!rental) {
      return null;
    }
    
    if (rental.status !== RentalStatusEnum.PENDING && rental.status !== RentalStatusEnum.APPROVED) {
      throw new BadRequestException('대기 중이거나 승인된 대여/반출만 취소할 수 있습니다.');
    }
    
    return this.update(id, { 
      status: 'CANCELED'
    });
  }
} 