import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCalibrationFactorDto } from './dto/create-calibration-factor.dto';
import {
  CalibrationFactorQueryDto,
  CalibrationFactorApprovalStatus,
} from './dto/calibration-factor-query.dto';
import {
  ApproveCalibrationFactorDto,
  RejectCalibrationFactorDto,
} from './dto/approve-calibration-factor.dto';

// 보정계수 기록 인터페이스
export interface CalibrationFactorRecord {
  id: string;
  equipmentId: string;
  calibrationId: string | null;
  factorType: string;
  factorName: string;
  factorValue: number;
  unit: string;
  parameters: Record<string, unknown> | null;
  effectiveDate: string;
  expiryDate: string | null;
  approvalStatus: string;
  requestedBy: string;
  approvedBy: string | null;
  requestedAt: Date;
  approvedAt: Date | null;
  approverComment: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// 임시 보정계수 데이터
const calibrationFactors: CalibrationFactorRecord[] = [
  {
    id: 'cf-001-uuid',
    equipmentId: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    calibrationId: null,
    factorType: 'antenna_gain',
    factorName: '3GHz 안테나 이득',
    factorValue: 12.5,
    unit: 'dBi',
    parameters: { frequency: '3GHz', temperature: '25C' },
    effectiveDate: '2024-01-15',
    expiryDate: '2025-01-15',
    approvalStatus: 'approved',
    requestedBy: '550e8400-e29b-41d4-a716-446655440001',
    approvedBy: '550e8400-e29b-41d4-a716-446655440001',
    requestedAt: new Date('2024-01-10'),
    approvedAt: new Date('2024-01-12'),
    approverComment: '검토 완료',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
    deletedAt: null,
  },
  {
    id: 'cf-002-uuid',
    equipmentId: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    calibrationId: null,
    factorType: 'cable_loss',
    factorName: '10m 케이블 손실',
    factorValue: 2.3,
    unit: 'dB',
    parameters: { length: '10m', frequency: '1GHz' },
    effectiveDate: '2024-02-01',
    expiryDate: null,
    approvalStatus: 'pending',
    requestedBy: '770a0600-a40c-63f6-c938-668877660222',
    approvedBy: null,
    requestedAt: new Date('2024-02-01'),
    approvedAt: null,
    approverComment: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    deletedAt: null,
  },
];

@Injectable()
export class CalibrationFactorsService {
  // 보정계수 변경 요청 (상태: pending)
  create(createDto: CreateCalibrationFactorDto): CalibrationFactorRecord {
    const newFactor: CalibrationFactorRecord = {
      id: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipmentId: createDto.equipmentId,
      calibrationId: createDto.calibrationId || null,
      factorType: createDto.factorType,
      factorName: createDto.factorName,
      factorValue: createDto.factorValue,
      unit: createDto.unit,
      parameters: createDto.parameters || null,
      effectiveDate: createDto.effectiveDate,
      expiryDate: createDto.expiryDate || null,
      approvalStatus: CalibrationFactorApprovalStatus.PENDING,
      requestedBy: createDto.requestedBy,
      approvedBy: null,
      requestedAt: new Date(),
      approvedAt: null,
      approverComment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    calibrationFactors.push(newFactor);
    return newFactor;
  }

  // 보정계수 목록 조회 (필터: equipmentId, approvalStatus)
  async findAll(query: CalibrationFactorQueryDto) {
    const {
      equipmentId,
      approvalStatus,
      factorType,
      search,
      sort = 'effectiveDate.desc',
      page = 1,
      pageSize = 20,
    } = query;

    // 삭제되지 않은 항목만 필터
    let filtered = calibrationFactors.filter((cf) => cf.deletedAt === null);

    if (equipmentId) {
      filtered = filtered.filter((cf) => cf.equipmentId === equipmentId);
    }

    if (approvalStatus) {
      filtered = filtered.filter((cf) => cf.approvalStatus === approvalStatus);
    }

    if (factorType) {
      filtered = filtered.filter((cf) => cf.factorType === factorType);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((cf) => cf.factorName.toLowerCase().includes(searchLower));
    }

    // 정렬
    if (sort) {
      const [field, direction] = sort.split('.');
      const isAsc = direction === 'asc';

      filtered.sort((a, b) => {
        const aVal = a[field as keyof CalibrationFactorRecord];
        const bVal = b[field as keyof CalibrationFactorRecord];
        if (aVal === null) return isAsc ? 1 : -1;
        if (bVal === null) return isAsc ? -1 : 1;
        if (aVal < bVal) return isAsc ? -1 : 1;
        if (aVal > bVal) return isAsc ? 1 : -1;
        return 0;
      });
    }

    // 페이지네이션
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(offset, offset + pageSize);

    return {
      items: paginatedItems,
      meta: {
        totalItems,
        itemCount: paginatedItems.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };
  }

  // 단일 보정계수 조회
  async findOne(id: string): Promise<CalibrationFactorRecord> {
    const factor = calibrationFactors.find((cf) => cf.id === id && cf.deletedAt === null);

    if (!factor) {
      throw new NotFoundException(`보정계수 ID ${id}를 찾을 수 없습니다.`);
    }

    return factor;
  }

  // 장비별 현재 적용 중인 보정계수 조회
  async findByEquipment(equipmentUuid: string) {
    const today = new Date().toISOString().split('T')[0];

    const factors = calibrationFactors.filter(
      (cf) =>
        cf.equipmentId === equipmentUuid &&
        cf.approvalStatus === CalibrationFactorApprovalStatus.APPROVED &&
        cf.deletedAt === null &&
        cf.effectiveDate <= today &&
        (cf.expiryDate === null || cf.expiryDate >= today)
    );

    return {
      equipmentId: equipmentUuid,
      factors,
      count: factors.length,
    };
  }

  // 보정계수 대장 조회 (전체 장비의 현재 보정계수)
  async getRegistry() {
    const today = new Date().toISOString().split('T')[0];

    // 승인된, 현재 유효한 보정계수만 조회
    const validFactors = calibrationFactors.filter(
      (cf) =>
        cf.approvalStatus === CalibrationFactorApprovalStatus.APPROVED &&
        cf.deletedAt === null &&
        cf.effectiveDate <= today &&
        (cf.expiryDate === null || cf.expiryDate >= today)
    );

    // 장비별로 그룹화
    const groupedByEquipment = validFactors.reduce(
      (acc, factor) => {
        if (!acc[factor.equipmentId]) {
          acc[factor.equipmentId] = [];
        }
        acc[factor.equipmentId].push(factor);
        return acc;
      },
      {} as Record<string, CalibrationFactorRecord[]>
    );

    return {
      registry: Object.entries(groupedByEquipment).map(([equipmentId, factors]) => ({
        equipmentId,
        factors,
        factorCount: factors.length,
      })),
      totalEquipments: Object.keys(groupedByEquipment).length,
      totalFactors: validFactors.length,
      generatedAt: new Date(),
    };
  }

  // 승인 대기 목록 조회
  async findPendingApprovals() {
    return this.findAll({
      approvalStatus: CalibrationFactorApprovalStatus.PENDING,
    });
  }

  // 보정계수 승인 (기술책임자)
  async approve(id: string, approveDto: ApproveCalibrationFactorDto) {
    const factor = await this.findOne(id);

    if (factor.approvalStatus !== CalibrationFactorApprovalStatus.PENDING) {
      throw new BadRequestException('승인 대기 상태인 보정계수만 승인할 수 있습니다.');
    }

    const index = calibrationFactors.findIndex((cf) => cf.id === id);
    const now = new Date();

    calibrationFactors[index] = {
      ...calibrationFactors[index],
      approvalStatus: CalibrationFactorApprovalStatus.APPROVED,
      approvedBy: approveDto.approverId,
      approvedAt: now,
      approverComment: approveDto.approverComment,
      updatedAt: now,
    };

    return calibrationFactors[index];
  }

  // 보정계수 반려 (기술책임자)
  async reject(id: string, rejectDto: RejectCalibrationFactorDto) {
    const factor = await this.findOne(id);

    if (factor.approvalStatus !== CalibrationFactorApprovalStatus.PENDING) {
      throw new BadRequestException('승인 대기 상태인 보정계수만 반려할 수 있습니다.');
    }

    const index = calibrationFactors.findIndex((cf) => cf.id === id);
    const now = new Date();

    calibrationFactors[index] = {
      ...calibrationFactors[index],
      approvalStatus: CalibrationFactorApprovalStatus.REJECTED,
      approvedBy: rejectDto.approverId,
      approvedAt: now,
      approverComment: rejectDto.rejectionReason,
      updatedAt: now,
    };

    return calibrationFactors[index];
  }

  // 소프트 삭제
  async remove(id: string) {
    const factor = await this.findOne(id);
    const index = calibrationFactors.findIndex((cf) => cf.id === id);

    calibrationFactors[index] = {
      ...calibrationFactors[index],
      deletedAt: new Date(),
      updatedAt: new Date(),
    };

    return { id, deleted: true };
  }
}
