import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSoftwareChangeDto } from './dto/create-software-change.dto';
import { SoftwareHistoryQueryDto } from './dto/software-query.dto';
import { ApproveSoftwareChangeDto, RejectSoftwareChangeDto } from './dto/approve-software.dto';
import {
  SoftwareApprovalStatusValues,
  type SoftwareApprovalStatus as SoftwareApprovalStatusType,
} from '@equipment-management/schemas';

// Backward compatibility alias
const SoftwareApprovalStatus = SoftwareApprovalStatusValues;

// 소프트웨어 변경 이력 인터페이스
export interface SoftwareHistoryRecord {
  id: string;
  equipmentId: string;
  softwareName: string;
  previousVersion: string | null;
  newVersion: string;
  changedAt: Date;
  changedBy: string;
  verificationRecord: string;
  approvalStatus: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  approverComment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 장비 소프트웨어 정보 인터페이스
export interface EquipmentSoftwareInfo {
  equipmentId: string;
  equipmentName: string;
  softwareName: string | null;
  softwareVersion: string | null;
  softwareType: string | null;
  lastUpdated: Date | null;
}

// 임시 소프트웨어 변경 이력 데이터
const softwareHistory: SoftwareHistoryRecord[] = [
  {
    id: 'sw-001-uuid',
    equipmentId: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    softwareName: 'EMC32',
    previousVersion: '10.2.0',
    newVersion: '10.3.0',
    changedAt: new Date('2024-01-15'),
    changedBy: '550e8400-e29b-41d4-a716-446655440001',
    verificationRecord: '변경 후 테스트 완료. 기존 측정 결과와 비교하여 0.1dB 이내 차이 확인.',
    approvalStatus: 'approved',
    approvedBy: '550e8400-e29b-41d4-a716-446655440001',
    approvedAt: new Date('2024-01-16'),
    approverComment: '검증 기록 확인 완료',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'sw-002-uuid',
    equipmentId: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    softwareName: 'DASY6 SAR',
    previousVersion: '6.0.1',
    newVersion: '6.1.0',
    changedAt: new Date('2024-02-01'),
    changedBy: '770a0600-a40c-63f6-c938-668877660222',
    verificationRecord: 'SAR 측정 검증 완료. 기준 팬텀으로 측정하여 기존 결과와 비교 확인.',
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    approverComment: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

// 임시 장비 소프트웨어 정보 데이터
const equipmentSoftwareInfo: EquipmentSoftwareInfo[] = [
  {
    equipmentId: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    equipmentName: 'EMI 수신기 R&S ESR',
    softwareName: 'EMC32',
    softwareVersion: '10.3.0',
    softwareType: 'measurement',
    lastUpdated: new Date('2024-01-16'),
  },
  {
    equipmentId: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    equipmentName: 'SAR 측정 시스템 DASY6',
    softwareName: 'DASY6 SAR',
    softwareVersion: '6.0.1', // 아직 승인 대기 중이므로 이전 버전 표시
    softwareType: 'measurement',
    lastUpdated: new Date('2023-06-15'),
  },
  {
    equipmentId: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    equipmentName: '스펙트럼 분석기 R&S FSW',
    softwareName: 'FSW Application',
    softwareVersion: '5.0.0',
    softwareType: 'analysis',
    lastUpdated: new Date('2023-12-01'),
  },
  {
    equipmentId: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    equipmentName: '전계 강도 측정 장비',
    softwareName: null,
    softwareVersion: null,
    softwareType: null,
    lastUpdated: null,
  },
];

@Injectable()
export class SoftwareService {
  // 소프트웨어 변경 요청 (상태: pending)
  create(createDto: CreateSoftwareChangeDto): SoftwareHistoryRecord {
    // 검증 기록 필수 확인
    if (!createDto.verificationRecord || createDto.verificationRecord.trim() === '') {
      throw new BadRequestException('검증 기록은 필수입니다.');
    }

    const newRecord: SoftwareHistoryRecord = {
      id: `sw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipmentId: createDto.equipmentId,
      softwareName: createDto.softwareName,
      previousVersion: createDto.previousVersion || null,
      newVersion: createDto.newVersion,
      changedAt: new Date(),
      changedBy: createDto.changedBy,
      verificationRecord: createDto.verificationRecord,
      approvalStatus: SoftwareApprovalStatus.PENDING,
      approvedBy: null,
      approvedAt: null,
      approverComment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    softwareHistory.push(newRecord);
    return newRecord;
  }

  // 소프트웨어 변경 이력 조회 (필터: equipmentId, softwareName)
  async findHistory(query: SoftwareHistoryQueryDto) {
    const {
      equipmentId,
      softwareName,
      approvalStatus,
      search,
      sort = 'changedAt.desc',
      page = 1,
      pageSize = 20,
    } = query;

    let filtered = [...softwareHistory];

    if (equipmentId) {
      filtered = filtered.filter((sh) => sh.equipmentId === equipmentId);
    }

    if (softwareName) {
      filtered = filtered.filter((sh) => sh.softwareName === softwareName);
    }

    if (approvalStatus) {
      filtered = filtered.filter((sh) => sh.approvalStatus === approvalStatus);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((sh) => sh.softwareName.toLowerCase().includes(searchLower));
    }

    // 정렬
    if (sort) {
      const [field, direction] = sort.split('.');
      const isAsc = direction === 'asc';

      filtered.sort((a, b) => {
        const aVal = a[field as keyof SoftwareHistoryRecord];
        const bVal = b[field as keyof SoftwareHistoryRecord];
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

  // 단일 소프트웨어 변경 이력 조회
  async findOne(id: string): Promise<SoftwareHistoryRecord> {
    const record = softwareHistory.find((sh) => sh.id === id);

    if (!record) {
      throw new NotFoundException(`소프트웨어 변경 이력 ID ${id}를 찾을 수 없습니다.`);
    }

    return record;
  }

  // 소프트웨어 통합 관리대장 (전체 장비 소프트웨어 현황)
  async getRegistry() {
    // 소프트웨어가 있는 장비만 필터
    const equipmentWithSoftware = equipmentSoftwareInfo.filter(
      (eq) => eq.softwareName !== null && eq.softwareVersion !== null
    );

    // 소프트웨어명별로 그룹화
    const groupedBySoftware = equipmentWithSoftware.reduce(
      (acc, equipment) => {
        const swName = equipment.softwareName as string;
        if (!acc[swName]) {
          acc[swName] = [];
        }
        acc[swName].push(equipment);
        return acc;
      },
      {} as Record<string, EquipmentSoftwareInfo[]>
    );

    return {
      registry: equipmentWithSoftware.map((eq) => ({
        equipmentId: eq.equipmentId,
        equipmentName: eq.equipmentName,
        softwareName: eq.softwareName,
        softwareVersion: eq.softwareVersion,
        softwareType: eq.softwareType,
        lastUpdated: eq.lastUpdated,
      })),
      summary: Object.entries(groupedBySoftware).map(([softwareName, equipments]) => ({
        softwareName,
        equipmentCount: equipments.length,
        versions: [...new Set(equipments.map((eq) => eq.softwareVersion))],
      })),
      totalEquipments: equipmentWithSoftware.length,
      totalSoftwareTypes: Object.keys(groupedBySoftware).length,
      generatedAt: new Date(),
    };
  }

  // 특정 소프트웨어 사용 장비 목록
  async findEquipmentBySoftware(softwareName: string) {
    const searchName = softwareName.toLowerCase();
    const equipments = equipmentSoftwareInfo.filter((eq) =>
      eq.softwareName?.toLowerCase().includes(searchName)
    );

    if (equipments.length === 0) {
      throw new NotFoundException(
        `소프트웨어 "${softwareName}"을(를) 사용하는 장비를 찾을 수 없습니다.`
      );
    }

    return {
      softwareName,
      equipments: equipments.map((eq) => ({
        equipmentId: eq.equipmentId,
        equipmentName: eq.equipmentName,
        softwareVersion: eq.softwareVersion,
        softwareType: eq.softwareType,
        lastUpdated: eq.lastUpdated,
      })),
      count: equipments.length,
    };
  }

  // 승인 대기 목록 조회
  async findPendingApprovals() {
    return this.findHistory({
      approvalStatus: SoftwareApprovalStatus.PENDING,
    });
  }

  // 소프트웨어 변경 승인 (기술책임자)
  async approve(id: string, approveDto: ApproveSoftwareChangeDto) {
    const record = await this.findOne(id);

    if (record.approvalStatus !== SoftwareApprovalStatus.PENDING) {
      throw new BadRequestException('승인 대기 상태인 변경 요청만 승인할 수 있습니다.');
    }

    const index = softwareHistory.findIndex((sh) => sh.id === id);
    const now = new Date();

    softwareHistory[index] = {
      ...softwareHistory[index],
      approvalStatus: SoftwareApprovalStatus.APPROVED,
      approvedBy: approveDto.approverId,
      approvedAt: now,
      approverComment: approveDto.approverComment,
      updatedAt: now,
    };

    // 승인 시 장비의 소프트웨어 버전도 업데이트 (실제 구현에서는 DB 업데이트)
    const equipmentIndex = equipmentSoftwareInfo.findIndex(
      (eq) => eq.equipmentId === record.equipmentId
    );
    if (equipmentIndex >= 0) {
      equipmentSoftwareInfo[equipmentIndex] = {
        ...equipmentSoftwareInfo[equipmentIndex],
        softwareVersion: record.newVersion,
        lastUpdated: now,
      };
    }

    return softwareHistory[index];
  }

  // 소프트웨어 변경 반려 (기술책임자)
  async reject(id: string, rejectDto: RejectSoftwareChangeDto) {
    const record = await this.findOne(id);

    if (record.approvalStatus !== SoftwareApprovalStatus.PENDING) {
      throw new BadRequestException('승인 대기 상태인 변경 요청만 반려할 수 있습니다.');
    }

    const index = softwareHistory.findIndex((sh) => sh.id === id);
    const now = new Date();

    softwareHistory[index] = {
      ...softwareHistory[index],
      approvalStatus: SoftwareApprovalStatus.REJECTED,
      approvedBy: rejectDto.approverId,
      approvedAt: now,
      approverComment: rejectDto.rejectionReason,
      updatedAt: now,
    };

    return softwareHistory[index];
  }
}
