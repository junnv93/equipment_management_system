import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EquipmentRepository } from './equipment.repository';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentStatus } from './enum/equipment-status.enum';

@Injectable()
export class EquipmentService {
  constructor(private readonly equipmentRepository: EquipmentRepository) {}

  async findAll(page = 1, limit = 10, filters?: any) {
    const offset = (page - 1) * limit;
    const [equipments, total] = await this.equipmentRepository.findAll(
      offset,
      limit,
      filters,
    );

    return {
      equipments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const equipment = await this.equipmentRepository.findById(id);
    if (!equipment) {
      throw new NotFoundException('장비를 찾을 수 없습니다.');
    }
    return equipment;
  }

  async create(createEquipmentDto: CreateEquipmentDto) {
    // 장비 시리얼 번호 중복 검사
    if (createEquipmentDto.serialNumber) {
      const existingEquipment = await this.equipmentRepository.findBySerialNumber(
        createEquipmentDto.serialNumber,
      );
      
      if (existingEquipment) {
        throw new BadRequestException('이미 등록된 시리얼 번호입니다.');
      }
    }

    // 기본 상태는 AVAILABLE로 설정
    const status = createEquipmentDto.status || EquipmentStatus.AVAILABLE;

    return this.equipmentRepository.create({
      ...createEquipmentDto,
      status,
    });
  }

  async update(id: number, updateEquipmentDto: UpdateEquipmentDto) {
    // 장비 존재 확인
    await this.findById(id);

    // 시리얼 번호 변경 시 중복 검사
    if (updateEquipmentDto.serialNumber) {
      const existingEquipment = await this.equipmentRepository.findBySerialNumber(
        updateEquipmentDto.serialNumber,
      );
      
      if (existingEquipment && existingEquipment.id !== id) {
        throw new BadRequestException('이미 등록된 시리얼 번호입니다.');
      }
    }

    return this.equipmentRepository.update(id, updateEquipmentDto);
  }

  async updateStatus(id: number, status: EquipmentStatus) {
    // 장비 존재 확인
    await this.findById(id);
    return this.equipmentRepository.update(id, { status });
  }

  async delete(id: number) {
    // 장비 존재 확인
    await this.findById(id);
    return this.equipmentRepository.delete(id);
  }
}
