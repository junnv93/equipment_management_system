import { Injectable } from '@nestjs/common';
import { eq, and, desc, asc, sql, like, or, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { equipment } from '../../database/schema/equipment';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentStatus } from './enum/equipment-status.enum';

@Injectable()
export class EquipmentRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(offset = 0, limit = 10, filters?: any) {
    const db = this.drizzle.getDb();
    
    // 필터 조건 구성
    const whereClauses = [];
    
    if (filters?.name) {
      whereClauses.push(like(equipment.name, `%${filters.name}%`));
    }
    
    if (filters?.type) {
      whereClauses.push(eq(equipment.type, filters.type));
    }
    
    if (filters?.category) {
      whereClauses.push(eq(equipment.category, filters.category));
    }
    
    if (filters?.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      whereClauses.push(inArray(equipment.status, statuses));
    }
    
    if (filters?.serialNumber) {
      whereClauses.push(like(equipment.serialNumber, `%${filters.serialNumber}%`));
    }

    // 총 장비 수 카운트 쿼리
    const totalCountQuery = whereClauses.length
      ? db.select({ count: sql`count(*)` }).from(equipment).where(and(...whereClauses))
      : db.select({ count: sql`count(*)` }).from(equipment);

    // 장비 가져오기 쿼리
    const equipmentQuery = whereClauses.length
      ? db
          .select()
          .from(equipment)
          .where(and(...whereClauses))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(equipment.createdAt))
      : db
          .select()
          .from(equipment)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(equipment.createdAt));

    // 두 쿼리 동시 실행
    const [equipmentResult, totalCountResult] = await Promise.all([
      equipmentQuery,
      totalCountQuery,
    ]);

    return [equipmentResult, Number(totalCountResult[0].count) || 0];
  }

  async findById(id: number) {
    const db = this.drizzle.getDb();
    const result = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, id))
      .limit(1);

    return result[0];
  }

  async findBySerialNumber(serialNumber: string) {
    const db = this.drizzle.getDb();
    const result = await db
      .select()
      .from(equipment)
      .where(eq(equipment.serialNumber, serialNumber))
      .limit(1);

    return result[0];
  }

  async create(data: CreateEquipmentDto & { status: EquipmentStatus }) {
    const db = this.drizzle.getDb();
    const result = await db
      .insert(equipment)
      .values({
        name: data.name,
        type: data.type,
        category: data.category,
        status: data.status,
        location: data.location,
        serialNumber: data.serialNumber,
        description: data.description,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyExpirationDate: data.warrantyExpirationDate
          ? new Date(data.warrantyExpirationDate)
          : null,
        calibrationDueDate: data.calibrationDueDate
          ? new Date(data.calibrationDueDate)
          : null,
        maintenanceInfo: data.maintenanceInfo,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async update(id: number, data: Partial<UpdateEquipmentDto>) {
    const db = this.drizzle.getDb();
    const updateData: any = { updatedAt: new Date() };
    
    // 널이 아닌 필드만 업데이트
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.modelNumber !== undefined) updateData.modelNumber = data.modelNumber;
    if (data.purchaseDate !== undefined) {
      updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    }
    if (data.warrantyExpirationDate !== undefined) {
      updateData.warrantyExpirationDate = data.warrantyExpirationDate
        ? new Date(data.warrantyExpirationDate)
        : null;
    }
    if (data.calibrationDueDate !== undefined) {
      updateData.calibrationDueDate = data.calibrationDueDate
        ? new Date(data.calibrationDueDate)
        : null;
    }
    if (data.maintenanceInfo !== undefined) updateData.maintenanceInfo = data.maintenanceInfo;

    const result = await db
      .update(equipment)
      .set(updateData)
      .where(eq(equipment.id, id))
      .returning();

    return result[0];
  }

  async delete(id: number) {
    const db = this.drizzle.getDb();
    const result = await db
      .delete(equipment)
      .where(eq(equipment.id, id))
      .returning();

    return result[0];
  }
}
