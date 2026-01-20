import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateRepairHistoryDto,
  UpdateRepairHistoryDto,
  RepairHistoryQueryDto,
  RepairHistoryResponseDto,
} from '../dto/repair-history.dto';
import { v4 as uuidv4 } from 'uuid';

// 수리 이력 인터페이스
export interface RepairHistoryRecord {
  id: number;
  uuid: string;
  equipmentId: number;
  repairDate: Date;
  repairDescription: string;
  repairedBy: string | null;
  repairCompany: string | null;
  cost: number | null;
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

// 임시 인메모리 저장소
const repairHistoryStore: RepairHistoryRecord[] = [
  {
    id: 1,
    uuid: '11111111-1111-1111-1111-111111111111',
    equipmentId: 1,
    repairDate: new Date('2024-01-15'),
    repairDescription: '전원부 고장으로 인한 전원 보드 교체',
    repairedBy: '홍길동',
    repairCompany: '키사이트 코리아',
    cost: 500000,
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
    id: 2,
    uuid: '22222222-2222-2222-2222-222222222222',
    equipmentId: 1,
    repairDate: new Date('2024-06-20'),
    repairDescription: '프로브 커넥터 불량으로 커넥터 교체',
    repairedBy: '김기사',
    repairCompany: null,
    cost: 50000,
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

let nextId = 3;

@Injectable()
export class RepairHistoryService {
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
      repairCompany,
      includeDeleted = false,
      sort = 'repairDate.desc',
      page = 1,
      pageSize = 20,
    } = query;

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

    // 수리 업체 필터
    if (repairCompany) {
      filteredRecords = filteredRecords.filter(
        (r) => r.repairCompany && r.repairCompany.includes(repairCompany)
      );
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
    const record = repairHistoryStore.find((r) => r.uuid === uuid && !r.isDeleted);
    if (!record) {
      throw new NotFoundException(`수리 이력을 찾을 수 없습니다: ${uuid}`);
    }
    return record;
  }

  /**
   * 수리 이력 생성
   */
  async create(
    equipmentUuid: string,
    dto: CreateRepairHistoryDto,
    createdBy: string
  ): Promise<RepairHistoryRecord> {
    // 임시: equipmentUuid를 equipmentId로 변환 (실제로는 DB 조회 필요)
    const equipmentId = 1; // 임시 값

    const now = new Date();
    const newRecord: RepairHistoryRecord = {
      id: nextId++,
      uuid: uuidv4(),
      equipmentId,
      repairDate: new Date(dto.repairDate),
      repairDescription: dto.repairDescription,
      repairedBy: dto.repairedBy || null,
      repairCompany: dto.repairCompany || null,
      cost: dto.cost || null,
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
    return newRecord;
  }

  /**
   * 수리 이력 수정
   */
  async update(uuid: string, dto: UpdateRepairHistoryDto): Promise<RepairHistoryRecord> {
    const index = repairHistoryStore.findIndex((r) => r.uuid === uuid && !r.isDeleted);
    if (index === -1) {
      throw new NotFoundException(`수리 이력을 찾을 수 없습니다: ${uuid}`);
    }

    const now = new Date();
    const updatedRecord: RepairHistoryRecord = {
      ...repairHistoryStore[index],
      ...(dto.repairDate && { repairDate: new Date(dto.repairDate) }),
      ...(dto.repairDescription && { repairDescription: dto.repairDescription }),
      ...(dto.repairedBy !== undefined && { repairedBy: dto.repairedBy || null }),
      ...(dto.repairCompany !== undefined && { repairCompany: dto.repairCompany || null }),
      ...(dto.cost !== undefined && { cost: dto.cost || null }),
      ...(dto.repairResult !== undefined && { repairResult: dto.repairResult || null }),
      ...(dto.notes !== undefined && { notes: dto.notes || null }),
      ...(dto.attachmentPath !== undefined && { attachmentPath: dto.attachmentPath || null }),
      updatedAt: now,
    };

    repairHistoryStore[index] = updatedRecord;
    return updatedRecord;
  }

  /**
   * 수리 이력 삭제 (소프트 삭제)
   */
  async remove(uuid: string, deletedBy: string): Promise<{ deleted: boolean; uuid: string }> {
    const index = repairHistoryStore.findIndex((r) => r.uuid === uuid && !r.isDeleted);
    if (index === -1) {
      throw new NotFoundException(`수리 이력을 찾을 수 없습니다: ${uuid}`);
    }

    const now = new Date();
    repairHistoryStore[index] = {
      ...repairHistoryStore[index],
      isDeleted: true,
      deletedAt: now,
      deletedBy,
      updatedAt: now,
    };

    return { deleted: true, uuid };
  }

  /**
   * 장비의 총 수리 비용 계산
   */
  async getTotalCost(equipmentUuid: string): Promise<{ totalCost: number; count: number }> {
    const records = repairHistoryStore.filter((r) => !r.isDeleted);
    const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    return {
      totalCost,
      count: records.length,
    };
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
