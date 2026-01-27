import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCalibrationDto } from './dto/create-calibration.dto';
import { UpdateCalibrationDto } from './dto/update-calibration.dto';
import { CalibrationQueryDto } from './dto/calibration-query.dto';
import { ApproveCalibrationDto, RejectCalibrationDto } from './dto/approve-calibration.dto';
import {
  CalibrationStatusEnum,
  CalibrationStatus,
  CalibrationApprovalStatusEnum,
  CalibrationRegisteredByRoleEnum,
} from '@equipment-management/schemas';
import { getUtcStartOfDay, addDaysUtc } from '../../common/utils';

// 교정 기록 인터페이스
export interface CalibrationRecord {
  id: string;
  equipmentId: string;
  calibrationManagerId: string;
  calibrationDate: Date;
  nextCalibrationDate: Date;
  calibrationMethod: string;
  status: string;
  calibrationAgency: string;
  certificationNumber: string | null;
  cost: number | null;
  isPassed: boolean | null;
  resultNotes: string | null;
  reportFilePath: string | null;
  additionalInfo: string | null;
  // 승인 프로세스 필드
  approvalStatus: string;
  registeredBy: string | null;
  approvedBy: string | null;
  registeredByRole: string | null;
  registrarComment: string | null;
  approverComment: string | null;
  rejectionReason: string | null;
  intermediateCheckDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 임시 교정 데이터
const temporaryCalibrations: CalibrationRecord[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    equipmentId: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    calibrationManagerId: '550e8400-e29b-41d4-a716-446655440001',
    calibrationDate: new Date('2023-01-15'),
    nextCalibrationDate: new Date('2024-01-15'),
    calibrationMethod: 'external_calibration',
    status: 'completed',
    calibrationAgency: '한국계측기술원',
    certificationNumber: 'CERT-2023-0001',
    cost: 500000,
    isPassed: true,
    resultNotes: '모든 파라미터가 허용 오차 범위 내에 있습니다.',
    reportFilePath: '/reports/calibration/EQ-RF-001-2023.pdf',
    additionalInfo: '온도 23±2°C, 습도 50±10%RH 환경에서 교정 수행',
    approvalStatus: 'approved',
    registeredBy: '550e8400-e29b-41d4-a716-446655440001',
    approvedBy: '550e8400-e29b-41d4-a716-446655440001',
    registeredByRole: 'technical_manager',
    registrarComment: '검토 완료',
    approverComment: null,
    rejectionReason: null,
    intermediateCheckDate: new Date('2023-07-15'),
    createdAt: new Date('2022-12-20'),
    updatedAt: new Date('2023-01-20'),
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    equipmentId: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    calibrationManagerId: '660f9500-f30b-52e5-b827-557766550111',
    calibrationDate: new Date('2023-02-20'),
    nextCalibrationDate: new Date('2024-02-20'),
    calibrationMethod: 'external_calibration',
    status: 'completed',
    calibrationAgency: '테크원 계측',
    certificationNumber: 'CERT-2023-0002',
    cost: 350000,
    isPassed: true,
    resultNotes: '모든 테스트 통과.',
    reportFilePath: '/reports/calibration/OSC-001-2023.pdf',
    additionalInfo: null,
    approvalStatus: 'pending_approval',
    registeredBy: '770a0600-a40c-63f6-c938-668877660222',
    approvedBy: null,
    registeredByRole: 'test_engineer',
    registrarComment: null,
    approverComment: null,
    rejectionReason: null,
    intermediateCheckDate: null,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-02-25'),
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    equipmentId: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    calibrationManagerId: '550e8400-e29b-41d4-a716-446655440001',
    calibrationDate: new Date('2024-06-15'),
    nextCalibrationDate: new Date('2026-06-15'),
    calibrationMethod: 'external_calibration',
    status: 'scheduled',
    calibrationAgency: '키사이트 코리아',
    certificationNumber: null,
    cost: null,
    isPassed: null,
    resultNotes: null,
    reportFilePath: null,
    additionalInfo: '730일 주기로 교정 필요',
    approvalStatus: 'approved',
    registeredBy: '550e8400-e29b-41d4-a716-446655440001',
    approvedBy: '550e8400-e29b-41d4-a716-446655440001',
    registeredByRole: 'technical_manager',
    registrarComment: '교정 예정 등록 확인',
    approverComment: null,
    rejectionReason: null,
    intermediateCheckDate: new Date('2025-06-15'),
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
  },
];

// 검색 가능한 교정 목록
const calibrations: CalibrationRecord[] = [...temporaryCalibrations];

@Injectable()
export class CalibrationService {
  create(createCalibrationDto: CreateCalibrationDto) {
    const { registeredBy, registeredByRole, registrarComment, ...rest } = createCalibrationDto;

    // 기술책임자는 등록자 코멘트 필수
    if (
      registeredByRole === CalibrationRegisteredByRoleEnum.enum.technical_manager &&
      !registrarComment
    ) {
      throw new BadRequestException('기술책임자는 등록자 코멘트를 반드시 입력해야 합니다.');
    }

    // 승인 상태 결정: 기술책임자가 등록하면 바로 approved, 시험실무자는 pending_approval
    const approvalStatus =
      registeredByRole === CalibrationRegisteredByRoleEnum.enum.technical_manager
        ? CalibrationApprovalStatusEnum.enum.approved
        : CalibrationApprovalStatusEnum.enum.pending_approval;

    const newCalibration: CalibrationRecord = {
      id: `calibration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      equipmentId: rest.equipmentId,
      calibrationManagerId: rest.calibrationManagerId,
      calibrationDate: rest.calibrationDate,
      nextCalibrationDate: rest.nextCalibrationDate,
      calibrationMethod: rest.calibrationMethod,
      status: rest.status || 'scheduled',
      calibrationAgency: rest.calibrationAgency,
      certificationNumber: rest.certificationNumber || null,
      cost: rest.cost || null,
      isPassed: rest.isPassed ?? null,
      resultNotes: rest.resultNotes || null,
      reportFilePath: rest.reportFilePath || null,
      additionalInfo: rest.additionalInfo || null,
      approvalStatus,
      registeredBy: registeredBy || null,
      approvedBy:
        registeredByRole === CalibrationRegisteredByRoleEnum.enum.technical_manager
          ? registeredBy || null
          : null,
      registeredByRole: registeredByRole || null,
      registrarComment: registrarComment || null,
      approverComment: null,
      rejectionReason: null,
      intermediateCheckDate: (rest as any).intermediateCheckDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    calibrations.push(newCalibration);
    return newCalibration;
  }

  async findAll(query: CalibrationQueryDto) {
    const {
      equipmentId,
      calibrationManagerId,
      statuses,
      methods,
      calibrationAgency,
      fromDate,
      toDate,
      nextFromDate,
      nextToDate,
      isPassed,
      search,
      sort = 'calibrationDate.desc',
      page = 1,
      pageSize = 20,
      approvalStatus,
    } = query;

    // 필터링
    let filteredCalibrations = [...calibrations];

    if (equipmentId) {
      filteredCalibrations = filteredCalibrations.filter((cal) => cal.equipmentId === equipmentId);
    }

    if (calibrationManagerId) {
      filteredCalibrations = filteredCalibrations.filter(
        (cal) => cal.calibrationManagerId === calibrationManagerId
      );
    }

    if (statuses) {
      const statusArray = statuses.split(',').map((s) => s.trim());
      filteredCalibrations = filteredCalibrations.filter((cal) => statusArray.includes(cal.status));
    }

    if (methods) {
      const methodArray = methods.split(',').map((m) => m.trim());
      filteredCalibrations = filteredCalibrations.filter((cal) =>
        methodArray.includes(cal.calibrationMethod)
      );
    }

    if (calibrationAgency) {
      filteredCalibrations = filteredCalibrations.filter(
        (cal) =>
          cal.calibrationAgency &&
          cal.calibrationAgency.toLowerCase().includes(calibrationAgency.toLowerCase())
      );
    }

    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      filteredCalibrations = filteredCalibrations.filter(
        (cal) => cal.calibrationDate && new Date(cal.calibrationDate) >= fromDateObj
      );
    }

    if (toDate) {
      const toDateObj = new Date(toDate);
      filteredCalibrations = filteredCalibrations.filter(
        (cal) => cal.calibrationDate && new Date(cal.calibrationDate) <= toDateObj
      );
    }

    if (nextFromDate) {
      const nextFromDateObj = new Date(nextFromDate);
      filteredCalibrations = filteredCalibrations.filter(
        (cal) => cal.nextCalibrationDate && new Date(cal.nextCalibrationDate) >= nextFromDateObj
      );
    }

    if (nextToDate) {
      const nextToDateObj = new Date(nextToDate);
      filteredCalibrations = filteredCalibrations.filter(
        (cal) => cal.nextCalibrationDate && new Date(cal.nextCalibrationDate) <= nextToDateObj
      );
    }

    if (isPassed !== undefined) {
      const isParsedPassed = isPassed === 'true';
      filteredCalibrations = filteredCalibrations.filter((cal) => cal.isPassed === isParsedPassed);
    }

    // 승인 상태 필터
    if (approvalStatus) {
      filteredCalibrations = filteredCalibrations.filter(
        (cal) => cal.approvalStatus === approvalStatus
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredCalibrations = filteredCalibrations.filter(
        (cal) =>
          (cal.certificationNumber &&
            cal.certificationNumber.toLowerCase().includes(searchLower)) ||
          (cal.resultNotes && cal.resultNotes.toLowerCase().includes(searchLower)) ||
          (cal.additionalInfo && cal.additionalInfo.toLowerCase().includes(searchLower)) ||
          (cal.calibrationAgency && cal.calibrationAgency.toLowerCase().includes(searchLower))
      );
    }

    // 정렬
    if (sort) {
      const [field, direction] = sort.split('.');
      const isAsc = direction === 'asc';

      filteredCalibrations.sort((a, b) => {
        const aVal = a[field as keyof CalibrationRecord];
        const bVal = b[field as keyof CalibrationRecord];
        if (aVal === null) return isAsc ? 1 : -1;
        if (bVal === null) return isAsc ? -1 : 1;
        if (aVal < bVal) return isAsc ? -1 : 1;
        if (aVal > bVal) return isAsc ? 1 : -1;
        return 0;
      });
    }

    // 페이지네이션
    const totalItems = filteredCalibrations.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedCalibrations = filteredCalibrations.slice(offset, offset + pageSize);

    return {
      items: paginatedCalibrations,
      meta: {
        totalItems,
        itemCount: paginatedCalibrations.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: string) {
    const calibration = calibrations.find((cal) => cal.id === id);

    if (!calibration) {
      throw new NotFoundException(`교정 ID ${id}를 찾을 수 없습니다.`);
    }

    return calibration;
  }

  async update(id: string, updateCalibrationDto: UpdateCalibrationDto) {
    const index = calibrations.findIndex((cal) => cal.id === id);

    if (index === -1) {
      throw new NotFoundException(`교정 ID ${id}를 찾을 수 없습니다.`);
    }

    const now = new Date();
    calibrations[index] = {
      ...calibrations[index],
      ...updateCalibrationDto,
      updatedAt: now,
    } as CalibrationRecord;

    return calibrations[index];
  }

  async remove(id: string) {
    const index = calibrations.findIndex((cal) => cal.id === id);

    if (index === -1) {
      throw new NotFoundException(`교정 ID ${id}를 찾을 수 없습니다.`);
    }

    calibrations.splice(index, 1);
    return { id, deleted: true };
  }

  // 특정 장비의 교정 기록 조회
  async findByEquipment(equipmentId: string) {
    return this.findAll({ equipmentId });
  }

  // 특정 날짜 범위의 교정 일정 조회
  async findScheduled(fromDate: Date, toDate: Date) {
    return this.findAll({
      fromDate,
      toDate,
      statuses: 'scheduled',
    });
  }

  // 교정 상태 변경
  async updateStatus(id: string, status: CalibrationStatus) {
    const calibration = await this.findOne(id);
    return this.update(id, { status });
  }

  // 예정된 교정 완료 처리
  async completeCalibration(id: string, updateDto: UpdateCalibrationDto) {
    const calibration = await this.findOne(id);

    if (calibration.status !== 'scheduled' && calibration.status !== 'in_progress') {
      throw new Error('예정되었거나 진행 중인 교정만 완료 처리할 수 있습니다.');
    }

    return this.update(id, {
      ...updateDto,
      status: 'completed',
    });
  }

  // 특정 담당자가 담당하는 교정 목록 조회
  async findByManager(calibrationManagerId: string) {
    return this.findAll({ calibrationManagerId });
  }

  // 다음 교정 예정일이 다가오는 장비 교정 기록 조회
  // ✅ UTC 기준 날짜 비교
  async findDueCalibrations(days: number) {
    const today = getUtcStartOfDay();
    const dueDate = addDaysUtc(today, days);

    return this.findAll({
      nextFromDate: today,
      nextToDate: dueDate,
    });
  }

  // 승인 대기 중인 교정 목록 조회
  async findPendingApprovals() {
    return this.findAll({
      approvalStatus: CalibrationApprovalStatusEnum.enum.pending_approval,
    });
  }

  // 교정 승인
  async approveCalibration(id: string, approveDto: ApproveCalibrationDto) {
    const calibration = await this.findOne(id);

    if (calibration.approvalStatus !== CalibrationApprovalStatusEnum.enum.pending_approval) {
      throw new BadRequestException('승인 대기 상태인 교정만 승인할 수 있습니다.');
    }

    if (!approveDto.approverComment) {
      throw new BadRequestException('승인 시 승인자 코멘트는 필수입니다.');
    }

    const index = calibrations.findIndex((cal) => cal.id === id);
    const now = new Date();

    calibrations[index] = {
      ...calibrations[index],
      approvalStatus: CalibrationApprovalStatusEnum.enum.approved,
      approvedBy: approveDto.approverId,
      approverComment: approveDto.approverComment,
      updatedAt: now,
    };

    return calibrations[index];
  }

  // 교정 반려
  async rejectCalibration(id: string, rejectDto: RejectCalibrationDto) {
    const calibration = await this.findOne(id);

    if (calibration.approvalStatus !== CalibrationApprovalStatusEnum.enum.pending_approval) {
      throw new BadRequestException('승인 대기 상태인 교정만 반려할 수 있습니다.');
    }

    if (!rejectDto.rejectionReason) {
      throw new BadRequestException('반려 사유는 필수입니다.');
    }

    const index = calibrations.findIndex((cal) => cal.id === id);
    const now = new Date();

    calibrations[index] = {
      ...calibrations[index],
      approvalStatus: CalibrationApprovalStatusEnum.enum.rejected,
      approvedBy: rejectDto.approverId,
      rejectionReason: rejectDto.rejectionReason,
      updatedAt: now,
    };

    return calibrations[index];
  }

  // 중간점검 일정이 다가오는 교정 조회
  async findUpcomingIntermediateChecks(days: number = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return calibrations.filter((cal) => {
      if (!cal.intermediateCheckDate) return false;
      const checkDate = new Date(cal.intermediateCheckDate);
      return checkDate >= today && checkDate <= futureDate;
    });
  }

  // 중간점검 완료 처리
  async completeIntermediateCheck(
    id: string,
    completedBy: string,
    notes?: string
  ): Promise<{ calibration: CalibrationRecord; message: string }> {
    const calibration = await this.findOne(id);

    if (!calibration.intermediateCheckDate) {
      throw new BadRequestException('이 교정에는 중간점검이 예정되어 있지 않습니다.');
    }

    const index = calibrations.findIndex((cal) => cal.id === id);
    const now = new Date();

    // 중간점검 완료 기록 (다음 중간점검일은 6개월 후로 설정)
    const nextIntermediateCheckDate = new Date(now);
    nextIntermediateCheckDate.setMonth(nextIntermediateCheckDate.getMonth() + 6);

    calibrations[index] = {
      ...calibrations[index],
      // 중간점검 완료 시 다음 중간점검일로 업데이트
      intermediateCheckDate: nextIntermediateCheckDate,
      resultNotes: notes
        ? `${calibrations[index].resultNotes || ''}\n[${now.toISOString()}] 중간점검 완료: ${notes} (담당자: ${completedBy})`
        : `${calibrations[index].resultNotes || ''}\n[${now.toISOString()}] 중간점검 완료 (담당자: ${completedBy})`,
      updatedAt: now,
    };

    return {
      calibration: calibrations[index],
      message: '중간점검이 완료되었습니다.',
    };
  }

  // 중간점검 필요 장비 목록 조회 (과거 및 예정)
  async findAllIntermediateChecks(query?: {
    status?: 'pending' | 'completed' | 'overdue';
    equipmentId?: string;
    managerId?: string;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let results = calibrations.filter((cal) => cal.intermediateCheckDate !== null);

    if (query?.equipmentId) {
      results = results.filter((cal) => cal.equipmentId === query.equipmentId);
    }

    if (query?.managerId) {
      results = results.filter((cal) => cal.calibrationManagerId === query.managerId);
    }

    if (query?.status) {
      results = results.filter((cal) => {
        const checkDate = new Date(cal.intermediateCheckDate!);
        checkDate.setHours(0, 0, 0, 0);

        if (query.status === 'overdue') {
          return checkDate < today;
        } else if (query.status === 'pending') {
          return checkDate >= today;
        }
        return true;
      });
    }

    // 날짜순 정렬 (가까운 날짜 우선)
    results.sort((a, b) => {
      const dateA = new Date(a.intermediateCheckDate!).getTime();
      const dateB = new Date(b.intermediateCheckDate!).getTime();
      return dateA - dateB;
    });

    return {
      items: results,
      meta: {
        totalItems: results.length,
        overdueCount: results.filter((cal) => {
          const checkDate = new Date(cal.intermediateCheckDate!);
          checkDate.setHours(0, 0, 0, 0);
          return checkDate < today;
        }).length,
        pendingCount: results.filter((cal) => {
          const checkDate = new Date(cal.intermediateCheckDate!);
          checkDate.setHours(0, 0, 0, 0);
          return checkDate >= today;
        }).length,
      },
    };
  }
}
