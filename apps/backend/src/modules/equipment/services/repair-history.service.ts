import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import {
  CreateRepairHistoryDto,
  UpdateRepairHistoryDto,
  RepairHistoryQueryDto,
} from '../dto/repair-history.dto';
import { v4 as uuidv4 } from 'uuid';
import { NonConformancesService } from '../../non-conformances/non-conformances.service';
import { NonConformanceStatus } from '../../non-conformances/dto/non-conformance-query.dto';
import { RepairResultValues } from '@equipment-management/schemas';

// Backward compatibility alias
const RepairResultEnum = RepairResultValues;

// 수리 이력 인터페이스 (UUID PK로 통일됨)
export interface RepairHistoryRecord {
  id: string; // UUID
  equipmentId: string; // UUID
  repairDate: Date;
  repairDescription: string;
  repairResult: string | null;
  notes: string | null;
  attachmentPath: string | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 임시 인메모리 저장소 (UUID PK)
const repairHistoryStore: RepairHistoryRecord[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    equipmentId: '550e8400-e29b-41d4-a716-446655440001',
    repairDate: new Date('2024-01-15'),
    repairDescription: '전원부 고장으로 인한 전원 보드 교체',
    repairResult: 'completed',
    notes: '보증 기간 내 무상 수리',
    attachmentPath: null,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: '550e8400-e29b-41d4-a716-446655440001',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    equipmentId: '550e8400-e29b-41d4-a716-446655440001',
    repairDate: new Date('2024-06-20'),
    repairDescription: '프로브 커넥터 불량으로 커넥터 교체',
    repairResult: 'completed',
    notes: '자체 수리',
    attachmentPath: null,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: '550e8400-e29b-41d4-a716-446655440001',
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-20'),
  },
];

@Injectable()
export class RepairHistoryService {
  constructor(
    @Inject(forwardRef(() => NonConformancesService))
    private nonConformancesService: NonConformancesService
  ) {}

  /**
   * 장비별 수리 이력 목록 조회
   */
  async findByEquipment(
    equipmentUuid: string,
    query: RepairHistoryQueryDto
  ): Promise<{
    items: RepairHistoryRecord[];
    meta: {
      totalItems: number;
      currentPage: number;
      itemsPerPage: number;
      totalPages: number;
    };
  }> {
    const {
      fromDate,
      toDate,
      repairResult,
      includeDeleted = false,
      sort = 'repairDate.desc',
    } = query;

    // 쿼리 파라미터를 숫자로 변환 (문자열로 전달될 수 있음)
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 20;

    // 임시: equipmentUuid를 equipmentId로 매핑 (실제로는 DB 조회 필요)
    // 여기서는 모든 레코드를 필터링
    let filteredRecords = [...repairHistoryStore];

    // 삭제된 항목 필터
    if (!includeDeleted) {
      filteredRecords = filteredRecords.filter((r) => !r.isDeleted);
    }

    // 날짜 필터
    if (fromDate) {
      const from = new Date(fromDate);
      filteredRecords = filteredRecords.filter((r) => r.repairDate >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      filteredRecords = filteredRecords.filter((r) => r.repairDate <= to);
    }

    // 수리 결과 필터
    if (repairResult) {
      filteredRecords = filteredRecords.filter((r) => r.repairResult === repairResult);
    }

    // 정렬
    const [sortField, sortOrder] = sort.split('.');
    const isAsc = sortOrder === 'asc';
    filteredRecords.sort((a, b) => {
      const aVal = a[sortField as keyof RepairHistoryRecord];
      const bVal = b[sortField as keyof RepairHistoryRecord];
      if (aVal === null) return isAsc ? 1 : -1;
      if (bVal === null) return isAsc ? -1 : 1;
      if (aVal < bVal) return isAsc ? -1 : 1;
      if (aVal > bVal) return isAsc ? 1 : -1;
      return 0;
    });

    // 페이지네이션
    const totalItems = filteredRecords.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedRecords = filteredRecords.slice(offset, offset + pageSize);

    return {
      items: paginatedRecords,
      meta: {
        totalItems,
        currentPage: page,
        itemsPerPage: pageSize,
        totalPages,
      },
    };
  }

  /**
   * 수리 이력 상세 조회
   */
  async findOne(uuid: string): Promise<RepairHistoryRecord> {
    const record = repairHistoryStore.find((r) => r.id === uuid && !r.isDeleted);
    if (!record) {
      throw new NotFoundException({
        code: 'REPAIR_HISTORY_NOT_FOUND',
        message: `Repair history not found: ${uuid}`,
      });
    }
    return record;
  }

  /**
   * 수리 이력 생성
   * 부적합 ID가 제공되면 자동으로 연결하고, 수리 완료 시 부적합 상태 업데이트
   */
  async create(
    equipmentUuid: string,
    dto: CreateRepairHistoryDto,
    createdBy: string
  ): Promise<RepairHistoryRecord> {
    const now = new Date();
    const newRecord: RepairHistoryRecord = {
      id: uuidv4(),
      equipmentId: equipmentUuid,
      repairDate: new Date(dto.repairDate),
      repairDescription: dto.repairDescription,
      repairResult: dto.repairResult || null,
      notes: dto.notes || null,
      attachmentPath: dto.attachmentPath || null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    repairHistoryStore.push(newRecord);

    // 부적합 ID가 제공된 경우 연결
    if (dto.nonConformanceId) {
      await this.nonConformancesService.linkRepair(dto.nonConformanceId, newRecord.id);

      // 수리가 완료 상태면 자동으로 부적합을 'corrected'로 변경
      if (dto.repairResult === RepairResultEnum.COMPLETED) {
        await this.nonConformancesService.markCorrected(dto.nonConformanceId, {
          correctionContent: `수리 완료: ${dto.repairDescription}`,
          correctionDate: new Date(dto.repairDate),
          correctedBy: createdBy,
        });
      }
    }

    return newRecord;
  }

  /**
   * 수리 이력 수정
   * repairResult가 'completed'로 변경되면 연결된 부적합 상태 자동 업데이트
   */
  async update(uuid: string, dto: UpdateRepairHistoryDto): Promise<RepairHistoryRecord> {
    const index = repairHistoryStore.findIndex((r) => r.id === uuid && !r.isDeleted);
    if (index === -1) {
      throw new NotFoundException({
        code: 'REPAIR_HISTORY_NOT_FOUND',
        message: `Repair history not found: ${uuid}`,
      });
    }

    const previousRecord = repairHistoryStore[index];
    const previousResult = previousRecord.repairResult;

    const now = new Date();
    const updatedRecord: RepairHistoryRecord = {
      ...repairHistoryStore[index],
      ...(dto.repairDate && { repairDate: new Date(dto.repairDate) }),
      ...(dto.repairDescription && { repairDescription: dto.repairDescription }),
      ...(dto.repairResult !== undefined && { repairResult: dto.repairResult || null }),
      ...(dto.notes !== undefined && { notes: dto.notes || null }),
      ...(dto.attachmentPath !== undefined && { attachmentPath: dto.attachmentPath || null }),
      updatedAt: now,
    };

    repairHistoryStore[index] = updatedRecord;

    // repairResult가 'completed'로 변경되면 연결된 부적합 자동 업데이트
    if (
      dto.repairResult === RepairResultEnum.COMPLETED &&
      previousResult !== RepairResultEnum.COMPLETED
    ) {
      const linkedNC = await this.nonConformancesService.findByRepairId(uuid);

      if (linkedNC && linkedNC.status !== NonConformanceStatus.CORRECTED) {
        await this.nonConformancesService.markCorrected(linkedNC.id, {
          correctionContent: `수리 완료: ${updatedRecord.repairDescription}`,
          correctionDate: updatedRecord.repairDate,
          correctedBy: updatedRecord.createdBy,
        });
      }
    }

    return updatedRecord;
  }

  /**
   * 수리 이력 삭제 (소프트 삭제)
   */
  async remove(uuid: string, deletedBy: string): Promise<{ deleted: boolean; id: string }> {
    const index = repairHistoryStore.findIndex((r) => r.id === uuid && !r.isDeleted);
    if (index === -1) {
      throw new NotFoundException({
        code: 'REPAIR_HISTORY_NOT_FOUND',
        message: `Repair history not found: ${uuid}`,
      });
    }

    const now = new Date();
    repairHistoryStore[index] = {
      ...repairHistoryStore[index],
      isDeleted: true,
      deletedAt: now,
      deletedBy,
      updatedAt: now,
    };

    return { deleted: true, id: uuid };
  }

  /**
   * 최근 수리 이력 조회
   */
  async getRecentRepairs(equipmentUuid: string, limit: number = 5): Promise<RepairHistoryRecord[]> {
    return repairHistoryStore
      .filter((r) => !r.isDeleted)
      .sort((a, b) => b.repairDate.getTime() - a.repairDate.getTime())
      .slice(0, limit);
  }
}
