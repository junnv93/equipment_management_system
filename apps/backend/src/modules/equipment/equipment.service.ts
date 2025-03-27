import { Injectable, NotFoundException } from '@nestjs/common';
// import { v4 as uuidv4 } from 'uuid';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentQueryDto } from './dto/equipment-query.dto';
import { EquipmentStatusEnum } from '../../types/enums';
import { Equipment } from './entities/equipment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// 임시 장비 데이터
const temporaryEquipments = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    name: 'RF 분석기',
    managementNumber: 'EQ-RF-001',
    assetNumber: 'A12345',
    modelName: 'FSQ26',
    manufacturer: 'Rohde & Schwarz',
    serialNumber: 'SN12345',
    description: 'RF 및 마이크로웨이브 신호 분석용 장비',
    location: 'RF 시험실',
    calibrationCycle: 365,
    teamId: '550e8400-e29b-41d4-a716-446655440000',
    lastCalibrationDate: new Date('2023-01-15'),
    nextCalibrationDate: new Date('2024-01-15'),
    purchaseDate: new Date('2020-03-10'),
    price: 85000000,
    status: 'available',
    isActive: true,
    createdAt: new Date('2020-03-12'),
    updatedAt: new Date('2023-01-20'),
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    name: '오실로스코프',
    managementNumber: 'EQ-OSC-001',
    assetNumber: 'A12346',
    modelName: 'MSO64B',
    manufacturer: 'Tektronix',
    serialNumber: 'SN12346',
    description: '고대역폭 신호 분석용 오실로스코프',
    location: '일반 계측실',
    calibrationCycle: 365,
    teamId: '550e8400-e29b-41d4-a716-446655440000',
    lastCalibrationDate: new Date('2023-02-20'),
    nextCalibrationDate: new Date('2024-02-20'),
    purchaseDate: new Date('2021-05-15'),
    price: 45000000,
    status: 'in_use',
    isActive: true,
    createdAt: new Date('2021-05-20'),
    updatedAt: new Date('2023-02-25'),
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    name: '네트워크 분석기',
    managementNumber: 'EQ-NA-001',
    assetNumber: 'A12347',
    modelName: 'E5080B',
    manufacturer: 'Keysight',
    serialNumber: 'SN12347',
    description: 'RF 네트워크 측정용 분석기',
    location: 'RF 시험실',
    calibrationCycle: 730,
    teamId: '660f9500-f30b-52e5-b827-557766550111',
    lastCalibrationDate: new Date('2022-11-10'),
    nextCalibrationDate: new Date('2024-11-10'),
    purchaseDate: new Date('2022-06-05'),
    price: 75000000,
    status: 'available',
    isActive: true,
    createdAt: new Date('2022-06-10'),
    updatedAt: new Date('2022-11-15'),
  },
  {
    id: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    name: '파워 서플라이',
    managementNumber: 'EQ-PS-001',
    assetNumber: 'A12348',
    modelName: 'E36313A',
    manufacturer: 'Keysight',
    serialNumber: 'SN12348',
    description: '3채널 DC 파워 서플라이',
    location: '전원장치실',
    calibrationCycle: 365,
    teamId: '660f9500-f30b-52e5-b827-557766550111',
    lastCalibrationDate: new Date('2023-04-05'),
    nextCalibrationDate: new Date('2024-04-05'),
    purchaseDate: new Date('2022-01-15'),
    price: 2500000,
    status: 'in_maintenance',
    isActive: true,
    createdAt: new Date('2022-01-20'),
    updatedAt: new Date('2023-04-10'),
  },
  {
    id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
    name: '열화상 카메라',
    managementNumber: 'EQ-TC-001',
    assetNumber: 'A12349',
    modelName: 'Ti480 PRO',
    manufacturer: 'Fluke',
    serialNumber: 'SN12349',
    description: '고해상도 열화상 측정 카메라',
    location: '일반 계측실',
    calibrationCycle: 365,
    teamId: '770a0600-a40c-63f6-c938-668877660222',
    lastCalibrationDate: new Date('2023-05-20'),
    nextCalibrationDate: new Date('2024-05-20'),
    purchaseDate: new Date('2021-10-10'),
    price: 15000000,
    status: 'available',
    isActive: true,
    createdAt: new Date('2021-10-15'),
    updatedAt: new Date('2023-05-25'),
  }
];

// 검색 가능한 장비 목록
let equipments = [...temporaryEquipments];

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>
  ) {}

  create(createEquipmentDto: CreateEquipmentDto) {
    const newEquipment = {
      id: `equipment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // id: uuidv4(),
      
      ...createEquipmentDto,
      status: createEquipmentDto.status || 'available',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    (equipments as any).push(newEquipment);
    return newEquipment;
  }

  async findAll(query: EquipmentQueryDto) {
    const { 
      search, 
      status, 
      location, 
      manufacturer, 
      teamId, 
      calibrationDue, 
      sort,
      page = 1, 
      pageSize = 20 
    } = query;
    
    // 필터링
    let filteredEquipments = [...equipments];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEquipments = filteredEquipments.filter(eq => 
        eq.name?.toLowerCase().includes(searchLower) ||
        eq.managementNumber?.toLowerCase().includes(searchLower) ||
        eq.serialNumber?.toLowerCase().includes(searchLower) ||
        eq.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (status) {
      filteredEquipments = filteredEquipments.filter(eq => eq.status === status);
    }
    
    if (location) {
      filteredEquipments = filteredEquipments.filter(eq => eq.location === location);
    }
    
    if (manufacturer) {
      filteredEquipments = filteredEquipments.filter(eq => eq.manufacturer === manufacturer);
    }
    
    if (teamId) {
      filteredEquipments = filteredEquipments.filter(eq => eq.teamId === teamId);
    }
    
    if (calibrationDue) {
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + calibrationDue);
      
      filteredEquipments = filteredEquipments.filter(eq => 
        eq.nextCalibrationDate && new Date(eq.nextCalibrationDate) <= dueDate
      );
    }
    
    // 정렬
    if (sort) {
      const [field, direction] = sort.split('.');
      const isAsc = direction === 'asc';
      
      filteredEquipments.sort((a, b) => {
        if (a[field] < b[field]) return isAsc ? -1 : 1;
        if (a[field] > b[field]) return isAsc ? 1 : -1;
        return 0;
      });
    } else {
      // 기본 정렬: 이름 오름차순
      filteredEquipments.sort((a, b) => (a.name > b.name) ? 1 : -1);
    }
    
    // 페이지네이션
    const totalItems = filteredEquipments.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedEquipments = filteredEquipments.slice(offset, offset + pageSize);
    
    return {
      items: paginatedEquipments,
      meta: {
        totalItems,
        itemCount: paginatedEquipments.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: string): Promise<Equipment> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`ID ${id}의 장비를 찾을 수 없습니다.`);
    }
    return equipment;
  }

  async update(id: string, updateEquipmentDto: UpdateEquipmentDto) {
    const index = equipments.findIndex(eq => eq.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`장비 ID ${id}를 찾을 수 없습니다.`);
    }
    
    const now = new Date();
    equipments[index] = {
      ...equipments[index],
      ...updateEquipmentDto,
      updatedAt: now,
    };
    
    return equipments[index];
  }

  async remove(id: string) {
    const index = equipments.findIndex(eq => eq.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`장비 ID ${id}를 찾을 수 없습니다.`);
    }
    
    const deletedEquipment = equipments[index];
    equipments.splice(index, 1);
    
    return { id, deleted: true };
  }
  
  // 특정 장비 상태 변경
  async updateStatus(id: string, status: EquipmentStatusEnum) {
    const equipment = await this.findOne(id);
    return this.update(id, { status });
  }
  
  // 특정 팀의 모든 장비 조회
  async findByTeam(teamId: string) {
    return this.findAll({ teamId });
  }
  
  // 교정 예정일이 다가오는 장비 조회
  async findCalibrationDue(days: number) {
    return this.findAll({ calibrationDue: days });
  }

  // 모든 장비 ID 가져오기 (예약 서비스에서 사용)
  async findAllEquipmentIds(): Promise<string[]> {
    const equipment = await this.equipmentRepository
      .createQueryBuilder('equipment')
      .select('equipment.id')
      .getMany();
    
    return equipment.map(item => item.id);
  }
} 