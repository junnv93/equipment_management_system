import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  softwareValidations,
  testSoftware,
  type SoftwareValidation,
} from '@equipment-management/db/schema';
import { ValidationStatusValues } from '@equipment-management/schemas';
import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { CACHE_TTL, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';
import type { CreateValidationInput } from './dto/create-validation.dto';
import type { UpdateValidationInput } from './dto/update-validation.dto';
import type { ValidationQueryInput } from './dto/validation-query.dto';

@Injectable()
export class SoftwareValidationsService extends VersionedBaseService {
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    super();
  }

  private buildCacheKey(type: string, id: string): string {
    return `${this.CACHE_PREFIX}${type}:${id}`;
  }

  private invalidateCache(id?: string): void {
    if (id) {
      this.cacheService.delete(this.buildCacheKey('detail', id));
    }
    this.cacheService.deleteByPrefix(this.CACHE_PREFIX + 'list:');
    this.cacheService.deleteByPrefix(this.CACHE_PREFIX + 'pending:');
    this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.APPROVALS);
    this.cacheService.deleteByPrefix(CACHE_KEY_PREFIXES.TEST_SOFTWARE);
  }

  private async getSoftwareName(testSoftwareId: string): Promise<string> {
    const [sw] = await this.db
      .select({ name: testSoftware.name })
      .from(testSoftware)
      .where(eq(testSoftware.id, testSoftwareId))
      .limit(1);
    return sw?.name ?? `[unknown: ${testSoftwareId.slice(0, 8)}]`;
  }

  /**
   * 유효성 확인 생성 (draft 상태)
   */
  async create(
    testSoftwareId: string,
    dto: CreateValidationInput,
    createdBy: string
  ): Promise<SoftwareValidation> {
    // testSoftwareId 존재 확인
    const [sw] = await this.db
      .select({ id: testSoftware.id })
      .from(testSoftware)
      .where(eq(testSoftware.id, testSoftwareId))
      .limit(1);

    if (!sw) {
      throw new NotFoundException({
        code: 'TEST_SOFTWARE_NOT_FOUND',
        message: `Test software with UUID ${testSoftwareId} not found.`,
      });
    }

    const [created] = await this.db
      .insert(softwareValidations)
      .values({
        testSoftwareId,
        validationType: dto.validationType,
        status: ValidationStatusValues.DRAFT,
        createdBy,
        softwareVersion: dto.softwareVersion ?? null,
        testDate: dto.testDate ? new Date(dto.testDate) : null,
        // Vendor fields
        vendorName: dto.vendorName ?? null,
        vendorSummary: dto.vendorSummary ?? null,
        receivedBy: dto.receivedBy ?? null,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : null,
        attachmentNote: dto.attachmentNote ?? null,
        // Self fields
        referenceDocuments: dto.referenceDocuments ?? null,
        operatingUnitDescription: dto.operatingUnitDescription ?? null,
        softwareComponents: dto.softwareComponents ?? null,
        hardwareComponents: dto.hardwareComponents ?? null,
        acquisitionFunctions: dto.acquisitionFunctions ?? null,
        processingFunctions: dto.processingFunctions ?? null,
        controlFunctions: dto.controlFunctions ?? null,
        performedBy: dto.performedBy ?? null,
      })
      .returning();

    this.invalidateCache();

    return created;
  }

  /**
   * 특정 소프트웨어의 유효성 확인 목록 조회
   */
  async findByTestSoftware(
    testSoftwareId: string,
    query: ValidationQueryInput
  ): Promise<{
    items: SoftwareValidation[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const {
      status,
      validationType,
      sort = 'createdAt.desc',
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    const cacheKey = this.buildCacheKey(
      'list',
      `${testSoftwareId}_${status ?? ''}_${validationType ?? ''}_${sort}_${page}_${pageSize}`
    );

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions = [eq(softwareValidations.testSoftwareId, testSoftwareId)];
        if (status) conditions.push(eq(softwareValidations.status, status));
        if (validationType) {
          conditions.push(eq(softwareValidations.validationType, validationType));
        }

        const whereClause = and(...conditions);

        const [sortField, sortOrder] = sort.split('.');
        const sortColumn =
          sortField === 'testDate'
            ? softwareValidations.testDate
            : sortField === 'status'
              ? softwareValidations.status
              : softwareValidations.createdAt;
        const orderBy = sortOrder === 'asc' ? sql`${sortColumn} ASC` : desc(sortColumn);

        const [rows, [{ count }]] = await Promise.all([
          this.db
            .select()
            .from(softwareValidations)
            .where(whereClause)
            .orderBy(orderBy)
            .limit(pageSize)
            .offset((page - 1) * pageSize),
          this.db
            .select({ count: sql<number>`count(*)` })
            .from(softwareValidations)
            .where(whereClause),
        ]);

        const totalItems = Number(count);
        return {
          items: rows,
          meta: {
            totalItems,
            itemCount: rows.length,
            itemsPerPage: pageSize,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page,
          },
        };
      },
      CACHE_TTL.LONG
    );
  }

  /**
   * 유효성 확인 상세 조회
   */
  async findOne(id: string): Promise<SoftwareValidation> {
    const cacheKey = this.buildCacheKey('detail', id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [record] = await this.db
          .select()
          .from(softwareValidations)
          .where(eq(softwareValidations.id, id))
          .limit(1);

        if (!record) {
          throw new NotFoundException({
            code: 'SOFTWARE_VALIDATION_NOT_FOUND',
            message: `Software validation with UUID ${id} not found.`,
          });
        }

        return record;
      },
      CACHE_TTL.MEDIUM
    );
  }

  /**
   * 유효성 확인 수정 (draft 상태에서만 가능)
   */
  async update(id: string, dto: UpdateValidationInput): Promise<SoftwareValidation> {
    const existing = await this.findOne(id);

    if (existing.status !== ValidationStatusValues.DRAFT) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only draft validations can be updated.',
      });
    }

    const { version, ...updateFields } = dto;

    const updateData: Record<string, unknown> = {};
    if (updateFields.validationType !== undefined)
      updateData.validationType = updateFields.validationType;
    if (updateFields.softwareVersion !== undefined)
      updateData.softwareVersion = updateFields.softwareVersion;
    if (updateFields.testDate !== undefined)
      updateData.testDate = updateFields.testDate ? new Date(updateFields.testDate) : null;
    if (updateFields.vendorName !== undefined) updateData.vendorName = updateFields.vendorName;
    if (updateFields.vendorSummary !== undefined)
      updateData.vendorSummary = updateFields.vendorSummary;
    if (updateFields.receivedBy !== undefined) updateData.receivedBy = updateFields.receivedBy;
    if (updateFields.receivedDate !== undefined)
      updateData.receivedDate = updateFields.receivedDate
        ? new Date(updateFields.receivedDate)
        : null;
    if (updateFields.attachmentNote !== undefined)
      updateData.attachmentNote = updateFields.attachmentNote;
    if (updateFields.referenceDocuments !== undefined)
      updateData.referenceDocuments = updateFields.referenceDocuments;
    if (updateFields.operatingUnitDescription !== undefined)
      updateData.operatingUnitDescription = updateFields.operatingUnitDescription;
    if (updateFields.softwareComponents !== undefined)
      updateData.softwareComponents = updateFields.softwareComponents;
    if (updateFields.hardwareComponents !== undefined)
      updateData.hardwareComponents = updateFields.hardwareComponents;
    if (updateFields.acquisitionFunctions !== undefined)
      updateData.acquisitionFunctions = updateFields.acquisitionFunctions;
    if (updateFields.processingFunctions !== undefined)
      updateData.processingFunctions = updateFields.processingFunctions;
    if (updateFields.controlFunctions !== undefined)
      updateData.controlFunctions = updateFields.controlFunctions;
    if (updateFields.performedBy !== undefined) updateData.performedBy = updateFields.performedBy;

    let updated: SoftwareValidation;
    try {
      updated = await this.updateWithVersion<SoftwareValidation>(
        softwareValidations,
        id,
        version,
        updateData,
        '소프트웨어 유효성 확인',
        undefined,
        'SOFTWARE_VALIDATION_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    return updated;
  }

  /**
   * 유효성 확인 제출 (draft → submitted)
   */
  async submit(id: string, version: number, submitterId: string): Promise<SoftwareValidation> {
    const existing = await this.findOne(id);

    if (existing.status !== ValidationStatusValues.DRAFT) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only draft validations can be submitted.',
      });
    }

    let updated: SoftwareValidation;
    try {
      updated = await this.updateWithVersion<SoftwareValidation>(
        softwareValidations,
        id,
        version,
        {
          status: ValidationStatusValues.SUBMITTED,
          submittedAt: new Date(),
          submittedBy: submitterId,
        },
        '소프트웨어 유효성 확인',
        undefined,
        'SOFTWARE_VALIDATION_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    const swName = await this.getSoftwareName(existing.testSoftwareId);
    this.eventEmitter.emit(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_SUBMITTED, {
      validationId: id,
      testSoftwareId: existing.testSoftwareId,
      softwareName: swName,
      submittedBy: submitterId,
      actorId: submitterId,
      actorName: '',
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * 기술책임자 승인 (submitted → approved)
   */
  async approve(
    id: string,
    version: number,
    approverId: string,
    _comment?: string
  ): Promise<SoftwareValidation> {
    const existing = await this.findOne(id);

    if (existing.status !== ValidationStatusValues.SUBMITTED) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only submitted validations can be approved.',
      });
    }

    let updated: SoftwareValidation;
    try {
      updated = await this.updateWithVersion<SoftwareValidation>(
        softwareValidations,
        id,
        version,
        {
          status: ValidationStatusValues.APPROVED,
          technicalApproverId: approverId,
          technicalApprovedAt: new Date(),
        },
        '소프트웨어 유효성 확인',
        undefined,
        'SOFTWARE_VALIDATION_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    const swNameApprove = await this.getSoftwareName(existing.testSoftwareId);
    this.eventEmitter.emit(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_APPROVED, {
      validationId: id,
      testSoftwareId: existing.testSoftwareId,
      softwareName: swNameApprove,
      submittedBy: existing.submittedBy,
      actorId: approverId,
      actorName: '',
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * 품질책임자 승인 (approved 상태에서 추가 서명)
   */
  async qualityApprove(
    id: string,
    version: number,
    approverId: string,
    _comment?: string
  ): Promise<SoftwareValidation> {
    const existing = await this.findOne(id);

    if (existing.status !== ValidationStatusValues.APPROVED) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only technically approved validations can receive quality approval.',
      });
    }

    let updated: SoftwareValidation;
    try {
      updated = await this.updateWithVersion<SoftwareValidation>(
        softwareValidations,
        id,
        version,
        {
          status: ValidationStatusValues.QUALITY_APPROVED,
          qualityApproverId: approverId,
          qualityApprovedAt: new Date(),
        },
        '소프트웨어 유효성 확인',
        undefined,
        'SOFTWARE_VALIDATION_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    return updated;
  }

  /**
   * 반려 (submitted/approved → rejected)
   */
  async reject(
    id: string,
    version: number,
    rejectedById: string,
    reason: string
  ): Promise<SoftwareValidation> {
    const existing = await this.findOne(id);

    if (
      existing.status !== ValidationStatusValues.SUBMITTED &&
      existing.status !== ValidationStatusValues.APPROVED
    ) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: 'Only submitted or approved validations can be rejected.',
      });
    }

    let updated: SoftwareValidation;
    try {
      updated = await this.updateWithVersion<SoftwareValidation>(
        softwareValidations,
        id,
        version,
        {
          status: ValidationStatusValues.REJECTED,
          rejectedBy: rejectedById,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
        '소프트웨어 유효성 확인',
        undefined,
        'SOFTWARE_VALIDATION_NOT_FOUND'
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        this.cacheService.delete(this.buildCacheKey('detail', id));
      }
      throw error;
    }

    this.invalidateCache(id);

    const swNameReject = await this.getSoftwareName(existing.testSoftwareId);
    this.eventEmitter.emit(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_REJECTED, {
      validationId: id,
      testSoftwareId: existing.testSoftwareId,
      softwareName: swNameReject,
      submittedBy: existing.submittedBy,
      actorId: rejectedById,
      actorName: '',
      timestamp: new Date(),
      reason,
    });

    return updated;
  }

  /**
   * 승인 대기 중인 유효성 확인 목록 조회
   */
  async findPending(): Promise<SoftwareValidation[]> {
    const cacheKey = this.buildCacheKey('pending', 'all');

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.db
          .select()
          .from(softwareValidations)
          .where(eq(softwareValidations.status, ValidationStatusValues.SUBMITTED))
          .orderBy(desc(softwareValidations.submittedAt));
      },
      CACHE_TTL.SHORT
    );
  }
}
