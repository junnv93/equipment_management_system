import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { EquipmentService } from '../equipment/equipment.service';
import { EquipmentStatusEnum } from '../../types/enums';
import { Equipment } from '../equipment/entities/equipment.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private equipmentService: EquipmentService,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
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

    const reservation = this.reservationRepository.create(createReservationDto);
    return this.reservationRepository.save(reservation);
  }

  async findAll(query: ReservationQueryDto): Promise<[Reservation[], number]> {
    const { status, equipmentId, userId, startDate, endDate, page = 1, limit = 10 } = query;
    
    const queryBuilder = this.reservationRepository.createQueryBuilder('reservation');
    
    // 기본 조인
    queryBuilder.leftJoinAndSelect('reservation.equipment', 'equipment')
                .leftJoinAndSelect('reservation.user', 'user');
    
    // 필터 적용
    if (status) {
      queryBuilder.andWhere('reservation.status = :status', { status });
    }
    
    if (equipmentId) {
      queryBuilder.andWhere('reservation.equipmentId = :equipmentId', { equipmentId });
    }
    
    if (userId) {
      queryBuilder.andWhere('reservation.userId = :userId', { userId });
    }
    
    if (startDate) {
      queryBuilder.andWhere('reservation.startDate >= :startDate', { startDate });
    }
    
    if (endDate) {
      queryBuilder.andWhere('reservation.endDate <= :endDate', { endDate });
    }
    
    // 페이지네이션
    queryBuilder.skip((page - 1) * limit)
                .take(limit);
    
    // 정렬
    queryBuilder.orderBy('reservation.createdAt', 'DESC');
    
    return queryBuilder.getManyAndCount();
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({ 
      where: { id },
      relations: ['equipment', 'user'] 
    });
    
    if (!reservation) {
      throw new NotFoundException(`ID ${id}의 예약을 찾을 수 없습니다.`);
    }
    
    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);
    
    // 날짜가 변경되었을 경우 충돌 검사
    if (
      (updateReservationDto.startDate && new Date(updateReservationDto.startDate).getTime() !== reservation.startDate.getTime()) || 
      (updateReservationDto.endDate && new Date(updateReservationDto.endDate).getTime() !== reservation.endDate.getTime())
    ) {
      await this.checkReservationConflict(
        reservation.equipmentId,
        updateReservationDto.startDate ? new Date(updateReservationDto.startDate) : reservation.startDate,
        updateReservationDto.endDate ? new Date(updateReservationDto.endDate) : reservation.endDate,
        id // 현재 예약은 충돌 검사에서 제외
      );
    }
    
    // 필드 업데이트
    Object.assign(reservation, updateReservationDto);
    
    return this.reservationRepository.save(reservation);
  }

  async remove(id: string): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepository.remove(reservation);
  }

  async checkReservationConflict(
    equipmentId: string, 
    startDate: Date, 
    endDate: Date,
    excludeReservationId?: string
  ): Promise<void> {
    const queryBuilder = this.reservationRepository.createQueryBuilder('reservation')
      .where('reservation.equipmentId = :equipmentId', { equipmentId })
      .andWhere('reservation.status != :canceledStatus', { canceledStatus: 'CANCELED' })
      .andWhere(
        '(reservation.startDate < :endDate AND reservation.endDate > :startDate)',
        { startDate, endDate }
      );
    
    // 특정 예약 ID를 제외하기 위한 조건 (수정 시 필요)
    if (excludeReservationId) {
      queryBuilder.andWhere('reservation.id != :excludeReservationId', { excludeReservationId });
    }
    
    const conflictingReservations = await queryBuilder.getCount();
    
    if (conflictingReservations > 0) {
      throw new ConflictException('해당 장비는 선택한 기간에 이미 예약되어 있습니다.');
    }
  }
  
  // 특정 기간 내 사용 가능한 장비 조회 (새 기능)
  async findAvailableEquipment(startDate: Date, endDate: Date): Promise<string[]> {
    // 해당 기간에 예약된 장비 ID 목록 조회
    const reservedEquipmentIds = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('DISTINCT reservation.equipmentId')
      .where('reservation.status != :canceledStatus', { canceledStatus: 'CANCELED' })
      .andWhere(
        '(reservation.startDate < :endDate AND reservation.endDate > :startDate)',
        { startDate, endDate }
      )
      .getRawMany()
      .then(results => results.map(result => result.reservation_equipmentId));
    
    // 모든 장비 ID 조회 (Equipment 서비스 활용)
    const allEquipmentIds = await this.equipmentService.findAllEquipmentIds();
    
    // 예약되지 않은 장비 ID 필터링
    return allEquipmentIds.filter(id => !reservedEquipmentIds.includes(id));
  }
  
  // 예약 취소 메서드 (새 기능)
  async cancelReservation(id: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    
    if (reservation.status === ReservationStatus.CANCELED) {
      throw new ConflictException('이미 취소된 예약입니다.');
    }
    
    reservation.status = ReservationStatus.CANCELED;
    return this.reservationRepository.save(reservation);
  }

  /**
   * 예약을 완료하고 장비를 반납처리합니다.
   * @param id 예약 ID
   * @param userId 반납을 처리하는 사용자 ID
   * @returns 완료된 예약 정보
   */
  async completeReservation(id: string, userId: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    
    if (reservation.status !== ReservationStatus.APPROVED) {
      throw new BadRequestException('승인된 예약만 완료할 수 있습니다.');
    }
    
    // 예약 상태를 완료로 변경
    reservation.status = ReservationStatus.COMPLETED;
    reservation.completedAt = new Date();
    reservation.completedById = userId;
    
    // 장비 상태를 사용 가능으로 변경
    await this.equipmentService.updateStatus(
      reservation.equipmentId,
      EquipmentStatusEnum.AVAILABLE
    );
    
    return this.reservationRepository.save(reservation);
  }
} 