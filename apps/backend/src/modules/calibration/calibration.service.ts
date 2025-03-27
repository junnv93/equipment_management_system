import { Injectable, NotFoundException } from '@nestjs/common';
// import { v4 as uuidv4 } from 'uuid';
import { CreateCalibrationDto } from './dto/create-calibration.dto';
import { UpdateCalibrationDto } from './dto/update-calibration.dto';
import { CalibrationQueryDto } from './dto/calibration-query.dto';
import { CalibrationStatusEnum } from '../../types';

// 임시 교정 데이터
const temporaryCalibrations = [
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
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
  },
  {
    id: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    equipmentId: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    calibrationManagerId: '550e8400-e29b-41d4-a716-446655440001',
    calibrationDate: new Date('2023-04-05'),
    nextCalibrationDate: new Date('2024-04-05'),
    calibrationMethod: 'internal_calibration',
    status: 'completed',
    calibrationAgency: '내부 교정실',
    certificationNumber: 'INT-2023-0001',
    cost: 0,
    isPassed: true,
    resultNotes: '내부 표준에 따라 교정 완료.',
    reportFilePath: '/reports/calibration/PS-001-2023.pdf',
    additionalInfo: null,
    createdAt: new Date('2023-03-25'),
    updatedAt: new Date('2023-04-10'),
  },
  {
    id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
    equipmentId: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
    calibrationManagerId: '770a0600-a40c-63f6-c938-668877660222',
    calibrationDate: new Date('2023-05-20'),
    nextCalibrationDate: new Date('2024-05-20'),
    calibrationMethod: 'external_calibration',
    status: 'completed',
    calibrationAgency: 'Fluke 공인센터',
    certificationNumber: 'CERT-2023-0003',
    cost: 250000,
    isPassed: true,
    resultNotes: '온도 측정 정확도 검증 완료. 모든 성능 지표 충족.',
    reportFilePath: '/reports/calibration/TC-001-2023.pdf',
    additionalInfo: null,
    createdAt: new Date('2023-04-10'),
    updatedAt: new Date('2023-05-25'),
  }
];

// 검색 가능한 교정 목록
let calibrations = [...temporaryCalibrations];

@Injectable()
export class CalibrationService {
  create(createCalibrationDto: CreateCalibrationDto) {
    const newCalibration = {
      id: `calibration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // id: uuidv4(),
      
      ...createCalibrationDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    (calibrations as any).push(newCalibration);
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
      pageSize = 20 
    } = query;
    
    // 필터링
    let filteredCalibrations = [...calibrations];
    
    if (equipmentId) {
      filteredCalibrations = filteredCalibrations.filter(cal => cal.equipmentId === equipmentId);
    }
    
    if (calibrationManagerId) {
      filteredCalibrations = filteredCalibrations.filter(cal => cal.calibrationManagerId === calibrationManagerId);
    }
    
    if (statuses) {
      const statusArray = statuses.split(',').map(s => s.trim());
      filteredCalibrations = filteredCalibrations.filter(cal => statusArray.includes(cal.status));
    }
    
    if (methods) {
      const methodArray = methods.split(',').map(m => m.trim());
      filteredCalibrations = filteredCalibrations.filter(cal => methodArray.includes(cal.calibrationMethod));
    }
    
    if (calibrationAgency) {
      filteredCalibrations = filteredCalibrations.filter(cal => 
        cal.calibrationAgency && cal.calibrationAgency.toLowerCase().includes(calibrationAgency.toLowerCase())
      );
    }
    
    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      filteredCalibrations = filteredCalibrations.filter(cal => 
        cal.calibrationDate && new Date(cal.calibrationDate) >= fromDateObj
      );
    }
    
    if (toDate) {
      const toDateObj = new Date(toDate);
      filteredCalibrations = filteredCalibrations.filter(cal => 
        cal.calibrationDate && new Date(cal.calibrationDate) <= toDateObj
      );
    }
    
    if (nextFromDate) {
      const nextFromDateObj = new Date(nextFromDate);
      filteredCalibrations = filteredCalibrations.filter(cal => 
        cal.nextCalibrationDate && new Date(cal.nextCalibrationDate) >= nextFromDateObj
      );
    }
    
    if (nextToDate) {
      const nextToDateObj = new Date(nextToDate);
      filteredCalibrations = filteredCalibrations.filter(cal => 
        cal.nextCalibrationDate && new Date(cal.nextCalibrationDate) <= nextToDateObj
      );
    }
    
    if (isPassed !== undefined) {
      const isParsedPassed = isPassed === 'true';
      filteredCalibrations = filteredCalibrations.filter(cal => cal.isPassed === isParsedPassed);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCalibrations = filteredCalibrations.filter(cal => 
        (cal.certificationNumber && cal.certificationNumber.toLowerCase().includes(searchLower)) ||
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
        if (a[field] === null) return isAsc ? 1 : -1;
        if (b[field] === null) return isAsc ? -1 : 1;
        if (a[field] < b[field]) return isAsc ? -1 : 1;
        if (a[field] > b[field]) return isAsc ? 1 : -1;
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
    const calibration = calibrations.find(cal => cal.id === id);
    
    if (!calibration) {
      throw new NotFoundException(`교정 ID ${id}를 찾을 수 없습니다.`);
    }
    
    return calibration;
  }

  async update(id: string, updateCalibrationDto: UpdateCalibrationDto) {
    const index = calibrations.findIndex(cal => cal.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`교정 ID ${id}를 찾을 수 없습니다.`);
    }
    
    const now = new Date();
    calibrations[index] = {
      ...calibrations[index],
      ...updateCalibrationDto,
      updatedAt: now,
    };
    
    return calibrations[index];
  }

  async remove(id: string) {
    const index = calibrations.findIndex(cal => cal.id === id);
    
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
      statuses: 'scheduled' 
    });
  }
  
  // 교정 상태 변경
  async updateStatus(id: string, status: CalibrationStatusEnum) {
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
      status: 'completed'
    });
  }
  
  // 특정 담당자가 담당하는 교정 목록 조회
  async findByManager(calibrationManagerId: string) {
    return this.findAll({ calibrationManagerId });
  }
  
  // 다음 교정 예정일이 다가오는 장비 교정 기록 조회
  async findDueCalibrations(days: number) {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + days);
    
    return this.findAll({ 
      nextFromDate: today,
      nextToDate: dueDate
    });
  }
} 