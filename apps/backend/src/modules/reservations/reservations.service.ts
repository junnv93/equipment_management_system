import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { EquipmentService } from '../equipment/equipment.service';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../database/drizzle/schema';
import { loans } from '../../database/drizzle/schema/loans';
import { and, eq, lt, gt, ne, or, isNull, sql } from 'drizzle-orm';
import { ReservationStatus } from './entities/reservation.entity';

// 서비스에서 사용할 문자열 리터럴 타입
type LoanStatus = 'pending' | 'active' | 'returned' | 'overdue';

// ReservationStatus(대문자 열거형)를 LoanStatus(소문자 문자열)로 변환하는 함수
const mapReservationStatusToLoanStatus = (status: ReservationStatus): LoanStatus => {
  switch (status) {
    case ReservationStatus.PENDING:
      return 'pending';
    case ReservationStatus.APPROVED:
      return 'active';
    case ReservationStatus.COMPLETED:
      return 'returned';
    case ReservationStatus.REJECTED:
    case ReservationStatus.CANCELED:
    default:
      return 'pending';
  }
};

// LoanStatus(소문자 문자열)를 ReservationStatus(대문자 열거형)로 변환하는 함수
const mapLoanStatusToReservationStatus = (status: LoanStatus): ReservationStatus => {
  switch (status) {
    case 'pending':
      return ReservationStatus.PENDING;
    case 'active':
      return ReservationStatus.APPROVED;
    case 'returned':
      return ReservationStatus.COMPLETED;
    case 'overdue':
      return ReservationStatus.APPROVED; // 오버듀는 여전히 승인 상태로 간주
    default:
      return ReservationStatus.PENDING;
  }
};

@Injectable()
export class ReservationsService {
  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private equipmentService: EquipmentService,
  ) {}

  async create(createReservationDto: CreateReservationDto) {
    // 장비 존재 여부 확인
    const equipment = await this.equipmentService.findOne(createReservationDto.equipmentId);
    if (!equipment) {
      throw new NotFoundException(`장비 ID ${createReservationDto.equipmentId}를 찾을 수 없습니다.`);
    }

    // 예약 충돌 검사
    await this.checkReservationConflict(
      createReservationDto.equipmentId,
      new Date(createReservationDto.startDate),
      new Date(createReservationDto.endDate),
    );

    // 새 예약 ID 생성 - UUID 자동 생성을 사용
    const newReservation = {
      equipmentId: createReservationDto.equipmentId,
      borrowerId: createReservationDto.userId, // userId를 borrowerId로 매핑
      status: 'pending' as LoanStatus,
      expectedReturnDate: new Date(createReservationDto.endDate),
      notes: createReservationDto.purpose || '',
      // createdAt, updatedAt은 스키마에서 자동 설정
    };

    try {
      // Drizzle을 사용한 데이터 삽입
      const result = await this.db.insert(loans).values(newReservation).returning();
      return result[0];
    } catch (error) {
      console.error('예약 생성 중 오류 발생:', error);
      throw new BadRequestException('예약을 생성할 수 없습니다.');
    }
  }

  async findAll(query: ReservationQueryDto) {
    const { status, equipmentId, userId, startDate, endDate, page = 1, limit = 10 } = query;
    
    try {
      // 기본 쿼리 생성
      const dbQuery = this.db.select().from(loans);
      
      // 필터 적용
      const conditions = [];
      
      if (status) {
        // ReservationStatus를 LoanStatus로 변환
        const loanStatus = status ? mapReservationStatusToLoanStatus(status as any) : undefined;
        if (loanStatus) {
          conditions.push(eq(loans.status, loanStatus));
        }
      }
      
      if (equipmentId) {
        conditions.push(eq(loans.equipmentId, equipmentId));
      }
      
      if (userId) {
        conditions.push(eq(loans.borrowerId, userId)); // userId를 borrowerId로 매핑
      }
      
      if (startDate) {
        // loanDate가 null이면 제외
        conditions.push(or(
          gt(loans.loanDate, new Date(startDate)),
          isNull(loans.loanDate)
        ));
      }
      
      if (endDate) {
        conditions.push(lt(loans.expectedReturnDate, new Date(endDate)));
      }
      
      // where 조건 적용
      const queryWithConditions = conditions.length > 0 
        ? dbQuery.where(and(...conditions))
        : dbQuery;
      
      // 총 개수 카운트 쿼리 수정
      const totalCount = await this.db.select()
        .from(loans)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .then(results => results.length);
      
      // 페이지네이션
      const skip = (page - 1) * limit;
      
      // 정렬 및 페이지네이션 적용
      const items = await queryWithConditions.orderBy(loans.createdAt).limit(limit).offset(skip);
      
      return [items, totalCount];
    } catch (error) {
      console.error('예약 목록 조회 중 오류 발생:', error);
      return [[], 0];
    }
  }

  async findOne(id: string) {
    try {
      const [reservation] = await this.db.select().from(loans).where(eq(loans.id, id)).limit(1);
      
      if (!reservation) {
        throw new NotFoundException(`ID ${id}의 예약을 찾을 수 없습니다.`);
      }
      
      return reservation;
    } catch (error) {
      console.error('예약 조회 중 오류 발생:', error);
      throw new NotFoundException(`ID ${id}의 예약을 찾을 수 없습니다.`);
    }
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    const reservation = await this.findOne(id);
    
    // 날짜가 변경되었을 경우 충돌 검사
    if (
      (updateReservationDto.endDate && new Date(updateReservationDto.endDate).getTime() !== new Date(reservation.expectedReturnDate).getTime())
    ) {
      await this.checkReservationConflict(
        reservation.equipmentId,
        new Date(reservation.loanDate || new Date()),
        updateReservationDto.endDate ? new Date(updateReservationDto.endDate) : new Date(reservation.expectedReturnDate),
        id // 현재 예약은 충돌 검사에서 제외
      );
    }
    
    // 필드 업데이트 - loan 스키마에 맞게 변환
    const updatedData = {};
    
    if (updateReservationDto.status) {
      // ReservationStatus를 LoanStatus로 변환
      updatedData['status'] = mapReservationStatusToLoanStatus(updateReservationDto.status);
    }
    
    if (updateReservationDto.endDate) {
      updatedData['expectedReturnDate'] = new Date(updateReservationDto.endDate);
    }
    
    if (updateReservationDto.purpose) {
      updatedData['notes'] = updateReservationDto.purpose;
    }
    
    try {
      await this.db.update(loans)
        .set(updatedData)
        .where(eq(loans.id, id));
      
      // 업데이트된 예약 반환
      return await this.findOne(id);
    } catch (error) {
      console.error('예약 업데이트 중 오류 발생:', error);
      throw new BadRequestException('예약을 업데이트할 수 없습니다.');
    }
  }

  async remove(id: string): Promise<void> {
    const reservation = await this.findOne(id);
    
    try {
      await this.db.delete(loans).where(eq(loans.id, id));
    } catch (error) {
      console.error('예약 삭제 중 오류 발생:', error);
      throw new BadRequestException('예약을 삭제할 수 없습니다.');
    }
  }

  async checkReservationConflict(
    equipmentId: string, 
    startDate: Date, 
    endDate: Date,
    excludeReservationId?: string
  ): Promise<void> {
    try {
      // 기본 충돌 조건
      const conflictConditions = [
        eq(loans.equipmentId, equipmentId),
        ne(loans.status, 'returned'),
        or(
          lt(loans.loanDate, endDate),
          isNull(loans.loanDate)
        ),
        gt(loans.expectedReturnDate, startDate)
      ];
      
      // ID 제외 조건 추가
      if (excludeReservationId) {
        conflictConditions.push(ne(loans.id, excludeReservationId));
      }
      
      const conflictingReservations = await this.db.select({ id: loans.id })
        .from(loans)
        .where(and(...conflictConditions));
      
      if (conflictingReservations.length > 0) {
        throw new ConflictException('해당 장비는 선택한 기간에 이미 예약되어 있습니다.');
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('예약 충돌 확인 중 오류 발생:', error);
      throw new BadRequestException('예약 충돌을 확인할 수 없습니다.');
    }
  }
  
  // 특정 기간 내 사용 가능한 장비 조회 (새 기능)
  async findAvailableEquipment(startDate: Date, endDate: Date): Promise<string[]> {
    try {
      // 해당 기간에 예약된 장비 ID 목록 조회
      const reservedEquipmentIds = await this.db
        .selectDistinct({ equipmentId: loans.equipmentId })
        .from(loans)
        .where(
          and(
            ne(loans.status, 'returned'),
            or(
              lt(loans.loanDate, endDate),
              isNull(loans.loanDate)
            ),
            gt(loans.expectedReturnDate, startDate)
          )
        );
      
      // 모든 장비 ID 조회 (Equipment 서비스 활용)
      const allEquipmentIds = await this.equipmentService.findAllEquipmentIds();
      
      // 예약되지 않은 장비 ID 필터링
      const reservedIds = reservedEquipmentIds.map(r => r.equipmentId);
      return allEquipmentIds.filter(id => !reservedIds.includes(id));
    } catch (error) {
      console.error('사용 가능한 장비 조회 중 오류 발생:', error);
      return [];
    }
  }
  
  // 예약 취소 메서드 (새 기능)
  async cancelReservation(id: string, userId: string) {
    const reservation = await this.findOne(id);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (reservation.status === ReservationStatus.COMPLETED || 
        reservation.status === ReservationStatus.CANCELED) {
      throw new BadRequestException(
        '이미 완료되었거나 취소된 예약은 취소할 수 없습니다.'
      );
    }

    // 장비 상태를 사용 가능으로 변경
    await this.equipmentService.updateStatus(
      reservation.equipmentId,
      'available'
    );

    await this.update(id, {
      status: ReservationStatus.CANCELED
    });

    return {
      success: true,
      message: '예약이 성공적으로 취소되었습니다.'
    };
  }

  /**
   * 예약을 완료하고 장비를 반납처리합니다.
   * @param id 예약 ID
   * @param userId 반납을 처리하는 사용자 ID
   * @returns 완료된 예약 정보
   */
  async completeReservation(id: string) {
    const reservation = await this.findOne(id);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException('Reservation is already completed');
    }

    // 장비 상태를 사용 가능으로 변경
    await this.equipmentService.updateStatus(
      reservation.equipmentId,
      'available'
    );

    // 먼저 상태만 업데이트
    await this.update(id, {
      status: ReservationStatus.COMPLETED,
    });

    // 그 다음 actual_return_date를 직접 SQL로 업데이트
    try {
      await this.db.execute(
        sql`UPDATE ${loans} SET actual_return_date = NOW() WHERE id = ${id}`
      );
      console.log(`Updated actual return date for reservation ${id}`);
    } catch (error) {
      console.error(`Error updating actual return date: ${error.message}`, error.stack);
    }

    return {
      success: true,
      message: 'Reservation completed successfully',
    };
  }
} 