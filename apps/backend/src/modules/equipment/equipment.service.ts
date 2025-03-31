import { Injectable, NotFoundException, Inject, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentQueryDto } from './dto/equipment-query.dto';
import { EquipmentStatusEnum } from '../../types/enums';
import { eq, and, like, gte, lte, or, desc, asc, sql, SQL, inArray } from 'drizzle-orm';
import { equipment } from '../../database/drizzle/schema/equipment';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../database/drizzle/schema';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import type { Equipment } from '../../database/drizzle/schema/equipment';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);
  private readonly CACHE_TTL = 1000 * 60 * 5; // 5분
  private readonly CACHE_PREFIX = 'equipment:';

  constructor(
    @Inject('DRIZZLE_DB')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly cacheService: SimpleCacheService
  ) {}

  async create(createEquipmentDto: CreateEquipmentDto): Promise<Equipment> {
    try {
      // 관리번호 중복 확인
      const existingEquipment = await this.db.query.equipment.findFirst({
        where: eq(equipment.managementNumber, createEquipmentDto.managementNumber),
      });

      if (existingEquipment) {
        throw new BadRequestException(`관리번호 ${createEquipmentDto.managementNumber}은(는) 이미 사용 중입니다.`);
      }

      // 다음 교정일은 자동 계산
      let nextCalibrationDate: Date | undefined = undefined;
      if (createEquipmentDto.lastCalibrationDate && createEquipmentDto.calibrationCycle) {
        nextCalibrationDate = new Date(createEquipmentDto.lastCalibrationDate);
        nextCalibrationDate.setMonth(nextCalibrationDate.getMonth() + createEquipmentDto.calibrationCycle);
      }

      // TeamId가 문자열로 전달되면 숫자로 변환
      const teamId = createEquipmentDto.teamId 
        ? parseInt(createEquipmentDto.teamId.toString())
        : undefined;

      const newEquipment = await this.db.insert(equipment).values({
        uuid: uuidv4(),
        name: createEquipmentDto.name,
        managementNumber: createEquipmentDto.managementNumber,
        assetNumber: createEquipmentDto.assetNumber,
        modelName: createEquipmentDto.modelName,
        manufacturer: createEquipmentDto.manufacturer,
        serialNumber: createEquipmentDto.serialNumber,
        description: undefined,
        location: createEquipmentDto.location,
        calibrationCycle: createEquipmentDto.calibrationCycle,
        teamId: teamId,
        lastCalibrationDate: createEquipmentDto.lastCalibrationDate,
        nextCalibrationDate: nextCalibrationDate,
        calibrationAgency: createEquipmentDto.calibrationAgency,
        needsIntermediateCheck: createEquipmentDto.needsIntermediateCheck || false,
        calibrationMethod: createEquipmentDto.calibrationMethod,
        managerId: createEquipmentDto.managerId,
        supplier: createEquipmentDto.supplier,
        contactInfo: createEquipmentDto.contactInfo,
        softwareVersion: createEquipmentDto.softwareVersion,
        firmwareVersion: createEquipmentDto.firmwareVersion,
        manualLocation: createEquipmentDto.manualLocation,
        accessories: createEquipmentDto.accessories,
        mainFeatures: createEquipmentDto.mainFeatures,
        technicalManager: createEquipmentDto.technicalManager,
        status: createEquipmentDto.status || 'available',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Equipment).returning();

      return newEquipment[0];
    } catch (error) {
      this.logger.error(`장비 생성 중 오류 발생: ${error.message}`);
      throw error;
    }
  }

  async findAll(query: EquipmentQueryDto) {
    const cacheKey = this.CACHE_PREFIX + 'list:' + JSON.stringify(query);
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
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
          
          // 기본 where 조건은 active 장비만 조회
          let whereConditions: SQL<unknown>[] = [eq(equipment.isActive, true)];
          
          // 인덱스를 활용할 수 있는 조건을 먼저 추가
          if (status) {
            whereConditions.push(eq(equipment.status, status));
          }
          
          if (teamId) {
            whereConditions.push(eq(equipment.teamId, parseInt(teamId)));
          }
          
          if (location) {
            whereConditions.push(eq(equipment.location, location));
          }
          
          if (manufacturer) {
            whereConditions.push(eq(equipment.manufacturer, manufacturer));
          }
          
          // 교정 예정일 필터 추가 (복합 인덱스 활용)
          if (calibrationDue) {
            const today = new Date();
            const dueDate = new Date();
            dueDate.setDate(today.getDate() + Number(calibrationDue));
            
            whereConditions.push(
              and(
                sql`${equipment.nextCalibrationDate} IS NOT NULL`,
                lte(equipment.nextCalibrationDate, dueDate)
              )
            );
          }
          
          // 검색어 조건은 마지막에 추가 (인덱스 활용도가 낮음)
          if (search) {
            whereConditions.push(
              or(
                like(equipment.name, `%${search}%`),
                like(equipment.managementNumber, `%${search}%`),
                like(equipment.serialNumber, `%${search}%`),
                sql`${equipment.description} IS NOT NULL AND ${equipment.description} LIKE ${`%${search}%`}`
              )
            );
          }
          
          // 정렬 설정 (인덱스가 있는 필드 우선)
          let orderBy: SQL<unknown>[] = [];
          if (sort) {
            const [field, direction] = sort.split('.');
            if (field && equipment[field]) {
              // 인덱스가 있는 필드인지 확인
              const hasIndex = [
                'status', 'location', 'manufacturer', 'teamId', 
                'managerId', 'nextCalibrationDate', 'modelName', 
                'isActive', 'name'
              ].includes(field);
              
              if (hasIndex) {
                orderBy.push(direction === 'asc' ? asc(equipment[field]) : desc(equipment[field]));
              } else {
                // 인덱스가 없는 필드는 기본 정렬 사용
                orderBy.push(asc(equipment.name));
              }
            }
          } else {
            // 기본 정렬: 이름 오름차순 (인덱스 있음)
            orderBy.push(asc(equipment.name));
          }
          
          // 총 아이템 수 계산 (캐싱된 결과가 없을 때만 실행)
          const countCacheKey = this.CACHE_PREFIX + 'count:' + JSON.stringify(whereConditions);
          const totalItems = await this.cacheService.getOrSet(
            countCacheKey,
            async () => {
              const countResult = await this.db
                .select({ count: sql<number>`COUNT(*)` })
                .from(equipment)
                .where(and(...whereConditions));
              return countResult[0]?.count || 0;
            },
            this.CACHE_TTL
          );
          
          const totalPages = Math.ceil(totalItems / pageSize);
          const offset = (page - 1) * pageSize;
          
          // 페이지네이션 적용한 결과 조회
          const items = await this.db.query.equipment.findMany({
            where: and(...whereConditions),
            orderBy: orderBy,
            offset: offset,
            limit: pageSize,
          });
          
          return {
            items,
            meta: {
              totalItems,
              itemCount: items.length,
              itemsPerPage: pageSize,
              totalPages,
              currentPage: page,
            }
          };
        } catch (error) {
          this.logger.error(`장비 목록 조회 중 오류 발생: ${error.message}`);
          throw error;
        }
      },
      this.CACHE_TTL
    );
  }

  async findOne(id: string) {
    const cacheKey = this.CACHE_PREFIX + 'detail:' + id;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const equipmentData = await this.db.query.equipment.findFirst({
            where: eq(equipment.uuid, id),
          });
          
          if (!equipmentData) {
            throw new NotFoundException(`ID ${id}의 장비를 찾을 수 없습니다.`);
          }
          
          return equipmentData;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          
          this.logger.error(`장비 조회 중 오류 발생: ${error.message}`);
          throw error;
        }
      },
      this.CACHE_TTL
    );
  }

  async update(id: string, updateEquipmentDto: UpdateEquipmentDto): Promise<Equipment> {
    try {
      // 장비 존재 여부 확인
      const existingEquipment = await this.findOne(id);
      
      // 관리번호 수정 시 중복 확인
      if (updateEquipmentDto.managementNumber && updateEquipmentDto.managementNumber !== existingEquipment.managementNumber) {
        const duplicateCheck = await this.db.query.equipment.findFirst({
          where: eq(equipment.managementNumber, updateEquipmentDto.managementNumber),
        });
        
        if (duplicateCheck) {
          throw new BadRequestException(`관리번호 ${updateEquipmentDto.managementNumber}은(는) 이미 사용 중입니다.`);
        }
      }
      
      // 다음 교정일 자동 계산
      let nextCalibrationDate = existingEquipment.nextCalibrationDate;
      
      // 교정 주기 변경 또는 최근 교정일 변경 시 다음 교정일 재계산
      const lastCalibrationDate = updateEquipmentDto.lastCalibrationDate || existingEquipment.lastCalibrationDate;
      const calibrationCycle = updateEquipmentDto.calibrationCycle || existingEquipment.calibrationCycle;
      
      if (lastCalibrationDate && calibrationCycle && 
          (updateEquipmentDto.lastCalibrationDate || updateEquipmentDto.calibrationCycle)) {
        nextCalibrationDate = new Date(lastCalibrationDate);
        nextCalibrationDate.setMonth(nextCalibrationDate.getMonth() + calibrationCycle);
      }
      
      // TeamId가 문자열로 전달되면 숫자로 변환
      let teamIdValue = undefined;
      if (updateEquipmentDto.teamId !== undefined) {
        teamIdValue = parseInt(updateEquipmentDto.teamId.toString());
      }
      
      // 업데이트할 데이터 준비
      const updateData = {
        ...(updateEquipmentDto.name !== undefined && { name: updateEquipmentDto.name }),
        ...(updateEquipmentDto.managementNumber !== undefined && { managementNumber: updateEquipmentDto.managementNumber }),
        ...(updateEquipmentDto.assetNumber !== undefined && { assetNumber: updateEquipmentDto.assetNumber }),
        ...(updateEquipmentDto.modelName !== undefined && { modelName: updateEquipmentDto.modelName }),
        ...(updateEquipmentDto.manufacturer !== undefined && { manufacturer: updateEquipmentDto.manufacturer }),
        ...(updateEquipmentDto.serialNumber !== undefined && { serialNumber: updateEquipmentDto.serialNumber }),
        ...(updateEquipmentDto.location !== undefined && { location: updateEquipmentDto.location }),
        ...(updateEquipmentDto.calibrationCycle !== undefined && { calibrationCycle: updateEquipmentDto.calibrationCycle }),
        ...(updateEquipmentDto.teamId !== undefined && { teamId: teamIdValue }),
        ...(updateEquipmentDto.lastCalibrationDate !== undefined && { lastCalibrationDate: updateEquipmentDto.lastCalibrationDate }),
        ...(nextCalibrationDate !== existingEquipment.nextCalibrationDate && { nextCalibrationDate }),
        ...(updateEquipmentDto.calibrationAgency !== undefined && { calibrationAgency: updateEquipmentDto.calibrationAgency }),
        ...(updateEquipmentDto.needsIntermediateCheck !== undefined && { needsIntermediateCheck: updateEquipmentDto.needsIntermediateCheck }),
        ...(updateEquipmentDto.calibrationMethod !== undefined && { calibrationMethod: updateEquipmentDto.calibrationMethod }),
        ...(updateEquipmentDto.managerId !== undefined && { managerId: updateEquipmentDto.managerId }),
        ...(updateEquipmentDto.supplier !== undefined && { supplier: updateEquipmentDto.supplier }),
        ...(updateEquipmentDto.contactInfo !== undefined && { contactInfo: updateEquipmentDto.contactInfo }),
        ...(updateEquipmentDto.softwareVersion !== undefined && { softwareVersion: updateEquipmentDto.softwareVersion }),
        ...(updateEquipmentDto.firmwareVersion !== undefined && { firmwareVersion: updateEquipmentDto.firmwareVersion }),
        ...(updateEquipmentDto.manualLocation !== undefined && { manualLocation: updateEquipmentDto.manualLocation }),
        ...(updateEquipmentDto.accessories !== undefined && { accessories: updateEquipmentDto.accessories }),
        ...(updateEquipmentDto.mainFeatures !== undefined && { mainFeatures: updateEquipmentDto.mainFeatures }),
        ...(updateEquipmentDto.technicalManager !== undefined && { technicalManager: updateEquipmentDto.technicalManager }),
        ...(updateEquipmentDto.status !== undefined && { status: updateEquipmentDto.status }),
        updatedAt: new Date()
      } as Partial<Equipment>;
      
      // 업데이트 수행
      const updated = await this.db.update(equipment)
        .set(updateData)
        .where(eq(equipment.uuid, id))
        .returning();
      
      if (!updated.length) {
        throw new NotFoundException(`장비 ID ${id}를 찾을 수 없습니다.`);
      }
      
      // 캐시 삭제
      await this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*');
      
      return updated[0];
    } catch (error) {
      this.logger.error(`장비 업데이트 중 오류 발생: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<Equipment> {
    try {
      // 소프트 삭제 (isActive = false)
      const updated = await this.db.update(equipment)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        } as Partial<Equipment>)
        .where(eq(equipment.uuid, id))
        .returning();
      
      if (!updated.length) {
        throw new NotFoundException(`장비 ID ${id}를 찾을 수 없습니다.`);
      }
      
      // 캐시 삭제
      await this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*');
      
      return updated[0];
    } catch (error) {
      this.logger.error(`장비 삭제 중 오류 발생: ${error.message}`);
      throw error;
    }
  }

  async updateStatus(id: string, status: string): Promise<Equipment> {
    try {
      const updated = await this.db.update(equipment)
        .set({ 
          status,
          updatedAt: new Date()
        } as Partial<Equipment>)
        .where(eq(equipment.uuid, id))
        .returning();
      
      if (!updated.length) {
        throw new NotFoundException(`장비 ID ${id}를 찾을 수 없습니다.`);
      }
      
      // 캐시 삭제
      await this.cacheService.deleteByPattern(this.CACHE_PREFIX + '*');
      
      return updated[0];
    } catch (error) {
      this.logger.error(`장비 상태 업데이트 중 오류 발생: ${error.message}`);
      throw error;
    }
  }

  async findByTeam(teamId: string) {
    const cacheKey = this.CACHE_PREFIX + 'team:' + teamId;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          return await this.db.query.equipment.findMany({
            where: and(
              eq(equipment.teamId, parseInt(teamId)),
              eq(equipment.isActive, true)
            ),
          });
        } catch (error) {
          this.logger.error(`팀 장비 조회 중 오류 발생: ${error.message}`);
          throw error;
        }
      },
      this.CACHE_TTL
    );
  }

  async findCalibrationDue(days: number) {
    const cacheKey = this.CACHE_PREFIX + 'calibration:' + days;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const today = new Date();
          const dueDate = new Date();
          dueDate.setDate(today.getDate() + days);
          
          return await this.db.query.equipment.findMany({
            where: and(
              eq(equipment.isActive, true),
              sql`${equipment.nextCalibrationDate} IS NOT NULL`,
              lte(equipment.nextCalibrationDate, dueDate)
            ),
            orderBy: asc(equipment.nextCalibrationDate),
          });
        } catch (error) {
          this.logger.error(`교정 예정 장비 조회 중 오류 발생: ${error.message}`);
          throw error;
        }
      },
      this.CACHE_TTL
    );
  }

  async findAllEquipmentIds(): Promise<string[]> {
    const cacheKey = this.CACHE_PREFIX + 'all-ids';
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const result = await this.db
            .select({ id: equipment.uuid })
            .from(equipment)
            .where(eq(equipment.isActive, true));
          
          return result.map(item => item.id);
        } catch (error) {
          this.logger.error(`장비 ID 조회 중 오류 발생: ${error.message}`);
          throw error;
        }
      },
      this.CACHE_TTL
    );
  }
}