import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import {
  inspectionFormTemplates,
  equipment,
  users,
  type InspectionFormTemplate,
  type NewInspectionFormTemplate,
} from '@equipment-management/db/schema';
import {
  ErrorCode,
  ExtractedInspectionStructureSchema,
  UserRoleEnum,
  type ExtractedInspectionStructure,
  type InspectionType,
  type AuditLogUserRole,
} from '@equipment-management/schemas';
import { CACHE_EVENTS, type InspectionTemplateCachePayload } from '../../common/cache/cache-events';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { AuditService } from '../audit/audit.service';
import type { UpsertInspectionTemplateInput } from './dto/upsert-template.dto';
import type { GalleryQueryInput } from './dto/gallery-query.dto';

/**
 * Inspection Form Templates Service — Phase 1B-B
 *
 * UL-QP-18-03 (중간점검) / UL-QP-18-05 (자체점검) Build-Once Workflow.
 *
 * 책임:
 * - 현재 template 조회 (latest, supersededBy IS NULL)
 * - 첫 승인 시 template auto-create (시스템 권한, 호출자: intermediate/self approve hook)
 * - SoftFork apply_forward 시 version+1 + supersededBy 체이닝 (admin or 시스템)
 * - Gallery 매칭 (modelName / equipmentTypeId / classification 우선순위)
 *
 * SSOT:
 * - structure 검증: ExtractedInspectionStructureSchema (zod) — DB jsonb 무결성
 * - cache events: CACHE_EVENTS.INSPECTION_TEMPLATE_* (registry에 사전 등록됨)
 * - audit: entityType='inspection_form_template'
 *
 * CAS:
 * - (equipmentId, inspectionType, version) unique constraint → 동시 수정 시 409
 */
@Injectable()
export class InspectionFormTemplatesService {
  private readonly logger = new Logger(InspectionFormTemplatesService.name);
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.INSPECTION_FORM_TEMPLATES;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService
  ) {}

  // ==========================================================================
  // 조회
  // ==========================================================================

  /**
   * 현재 template 조회 (supersededBy IS NULL AND deletedAt IS NULL).
   * 부재 시 null — 호출자가 "first inspection" 처리 (gallery 노출 등).
   */
  async findCurrent(
    equipmentId: string,
    inspectionType: InspectionType
  ): Promise<InspectionFormTemplate | null> {
    const [row] = await this.db
      .select()
      .from(inspectionFormTemplates)
      .where(
        and(
          eq(inspectionFormTemplates.equipmentId, equipmentId),
          eq(inspectionFormTemplates.inspectionType, inspectionType),
          isNull(inspectionFormTemplates.supersededBy),
          isNull(inspectionFormTemplates.deletedAt)
        )
      )
      .limit(1);

    return row ?? null;
  }

  /**
   * 현재 template 조회 — 부재 시 NotFoundException.
   * Controller LATEST endpoint용 — frontend useLatestTemplate hook 동작 일관성.
   */
  async getCurrentOrThrow(
    equipmentId: string,
    inspectionType: InspectionType
  ): Promise<InspectionFormTemplate> {
    const found = await this.findCurrent(equipmentId, inspectionType);
    if (!found) {
      throw new NotFoundException({
        code: ErrorCode.InspectionTemplateNotFound,
        message: `No current template for equipment ${equipmentId} type ${inspectionType}`,
      });
    }
    return found;
  }

  /**
   * 현재 template + 작성자 이름 — DialogHeader version badge용 (Phase 1B-D).
   *
   * SR text "v3, 2026-05-01 작성, 김철수" 표시를 위해 createdByName join.
   * 시스템 auto-create는 createdBy=null → createdByName=null (UI에서 i18n "system" 라벨 표시).
   *
   * 비정규화는 후속(S-3) — 현재는 leftJoin (1+1 query, 사용자 이름 변경 시 즉시 반영).
   */
  async getCurrentWithCreatorOrThrow(
    equipmentId: string,
    inspectionType: InspectionType
  ): Promise<InspectionFormTemplate & { createdByName: string | null }> {
    const [row] = await this.db
      .select({
        template: inspectionFormTemplates,
        creatorName: users.name,
      })
      .from(inspectionFormTemplates)
      .leftJoin(users, eq(inspectionFormTemplates.createdBy, users.id))
      .where(
        and(
          eq(inspectionFormTemplates.equipmentId, equipmentId),
          eq(inspectionFormTemplates.inspectionType, inspectionType),
          isNull(inspectionFormTemplates.supersededBy),
          isNull(inspectionFormTemplates.deletedAt)
        )
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException({
        code: ErrorCode.InspectionTemplateNotFound,
        message: `No current template for equipment ${equipmentId} type ${inspectionType}`,
      });
    }

    return { ...row.template, createdByName: row.creatorName };
  }

  // ==========================================================================
  // 생성 / 버전 업
  // ==========================================================================

  /**
   * Auto-create — 첫 inspection 승인 시 시스템이 자동 호출.
   *
   * 호출자: IntermediateInspectionsService.approve / SelfInspectionsService.approve.
   * 권한 우회: createdBy=null (시스템 행위), audit log에는 actorUserId=null + 명시적 details.
   * 이미 template이 존재하면 silent skip (idempotent).
   */
  async autoCreateIfAbsent(input: {
    equipmentId: string;
    inspectionType: InspectionType;
    structure: ExtractedInspectionStructure;
    sourceInspectionId: string;
    triggerActorUserId: string | null;
  }): Promise<InspectionFormTemplate | null> {
    const existing = await this.findCurrent(input.equipmentId, input.inspectionType);
    if (existing) {
      this.logger.debug(
        `Template already exists for equipment ${input.equipmentId} (${input.inspectionType}), skipping auto-create`
      );
      return null;
    }

    // jsonb 무결성 — frontend가 올바른 shape를 보냈는지 zod 재검증 (defense-in-depth)
    const structure = ExtractedInspectionStructureSchema.parse(input.structure);

    const newRow: NewInspectionFormTemplate = {
      equipmentId: input.equipmentId,
      inspectionType: input.inspectionType,
      version: 1,
      structure,
      sourceInspectionId: input.sourceInspectionId,
      createdBy: null, // 시스템 auto-create
    };

    let created: InspectionFormTemplate;
    try {
      [created] = await this.db.insert(inspectionFormTemplates).values(newRow).returning();
    } catch (err) {
      // unique constraint 충돌 — 다른 동시 호출이 먼저 생성. silent skip.
      if (this.isUniqueViolation(err)) {
        this.logger.debug(
          `Race condition on auto-create for equipment ${input.equipmentId}, returning latest`
        );
        return await this.findCurrent(input.equipmentId, input.inspectionType);
      }
      throw err;
    }

    await this.invalidateAndEmit(CACHE_EVENTS.INSPECTION_TEMPLATE_CREATED, {
      templateId: created.id,
      equipmentId: created.equipmentId,
      inspectionType: created.inspectionType,
      version: created.version,
      sourceInspectionId: created.sourceInspectionId ?? null,
      actorId: input.triggerActorUserId,
    });

    await this.auditService.create({
      userId: input.triggerActorUserId ?? null,
      userName: 'system',
      userRole: 'system',
      action: 'create',
      entityType: 'inspection_form_template',
      entityId: created.id,
      entityName: `${created.inspectionType} template v1`,
      details: {
        additionalInfo: {
          triggeredBy: 'inspection_first_approve',
          sourceInspectionId: created.sourceInspectionId,
          equipmentId: created.equipmentId,
          inspectionType: created.inspectionType,
        },
      },
    });

    return created;
  }

  /**
   * Version+1 — SoftFork apply_forward 시 또는 admin 명시 수정 시.
   *
   * 호출자:
   * - SoftFork apply_forward: inspection 제출 직전, frontend가 본 endpoint 호출 후 inspection submit
   * - Admin 명시 수정: 양식 통제 화면 (1D 이후)
   *
   * CAS:
   * - 입력 version은 *새* version (현재 latest + 1)
   * - DB unique(equipmentId, inspectionType, version) 충돌 시 409
   *
   * 권한 검증은 controller 레이어 (PermissionsGuard)에서 처리.
   * 시스템 호출(triggerActorUserId=null)도 허용 — auto-create-on-fork 시나리오용.
   */
  async upsertNewVersion(
    equipmentId: string,
    input: UpsertInspectionTemplateInput,
    actorUserId: string | null,
    actorName: string | null,
    actorRole: string | null
  ): Promise<InspectionFormTemplate> {
    // 0. 장비 존재 확인 (FK는 보장하지만 명시적 NotFound가 UX 명확)
    const [eq0] = await this.db
      .select({ id: equipment.id })
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);
    if (!eq0) {
      throw new NotFoundException({
        code: ErrorCode.EquipmentNotFound,
        message: `Equipment ${equipmentId} not found`,
      });
    }

    // 1. 현재 latest 조회 — supersededBy 체이닝 검증
    const current = await this.findCurrent(equipmentId, input.inspectionType);

    // SoftFork apply_forward는 current를 supersededBy로 가리킴
    if (current && input.supersededBy !== current.id) {
      throw new BadRequestException({
        code: ErrorCode.InspectionTemplateStaleBase,
        message:
          'supersededBy must reference the current template. Refresh and retry (CAS protection).',
      });
    }

    // 2. version 검증 — current.version + 1 또는 부재 시 1
    const expectedVersion = current ? current.version + 1 : 1;
    if (input.version !== expectedVersion) {
      throw new BadRequestException({
        code: ErrorCode.InspectionTemplateInvalidVersion,
        message: `Expected version ${expectedVersion}, got ${input.version}`,
      });
    }

    // 3. structure 무결성 (defense-in-depth — controller Zod 외 추가 검증)
    const structure = ExtractedInspectionStructureSchema.parse(input.structure);

    // 4. 트랜잭션: insert new + update old.supersededBy
    const result = await this.db.transaction(async (tx) => {
      let inserted: InspectionFormTemplate;
      try {
        [inserted] = await tx
          .insert(inspectionFormTemplates)
          .values({
            equipmentId,
            inspectionType: input.inspectionType,
            version: input.version,
            structure,
            sourceInspectionId: input.sourceInspectionId ?? null,
            createdBy: actorUserId,
          })
          .returning();
      } catch (err) {
        if (this.isUniqueViolation(err)) {
          throw new ConflictException({
            code: ErrorCode.InspectionTemplateVersionConflict,
            message: 'Another user updated the template. Please refresh and retry (CAS conflict).',
          });
        }
        throw err;
      }

      // current.supersededBy ← new.id
      if (current) {
        await tx
          .update(inspectionFormTemplates)
          .set({ supersededBy: inserted.id })
          .where(eq(inspectionFormTemplates.id, current.id));
      }

      return inserted;
    });

    // 5. cache invalidate + event emit (registry에 사전 등록됨)
    const eventName = current
      ? CACHE_EVENTS.INSPECTION_TEMPLATE_VERSION_UP
      : CACHE_EVENTS.INSPECTION_TEMPLATE_CREATED;
    await this.invalidateAndEmit(eventName, {
      templateId: result.id,
      equipmentId,
      inspectionType: input.inspectionType,
      version: result.version,
      sourceInspectionId: result.sourceInspectionId ?? null,
      actorId: actorUserId,
    });

    // 6. audit log — forkChoice + supersededBy 추적
    //    UL-QP-18 §7.5 양식 통제: actor 정확히 식별 (이름 + 역할).
    //    userName: controller에서 req.user.name 주입 — 부재 시 'unknown' (DB 식별성 보존).
    //    userRole: UserRoleEnum.safeParse — type cast 우회, 부적합 시 'unknown'.
    const action = current ? 'update' : 'create';
    await this.auditService.create({
      userId: actorUserId,
      userName: actorName ?? (actorUserId ? 'unknown' : 'system'),
      userRole: this.resolveAuditUserRole(actorUserId, actorRole),
      action,
      entityType: 'inspection_form_template',
      entityId: result.id,
      entityName: `${input.inspectionType} template v${result.version}`,
      details: {
        previousValue: current
          ? {
              version: current.version,
              templateId: current.id,
            }
          : undefined,
        newValue: {
          version: result.version,
          templateId: result.id,
        },
        additionalInfo: {
          forkChoice: input.forkChoice ?? null,
          sourceInspectionId: result.sourceInspectionId,
          equipmentId,
          inspectionType: input.inspectionType,
        },
      },
    });

    return result;
  }

  // ==========================================================================
  // Gallery
  // ==========================================================================

  /**
   * Gallery 매칭 — 비슷한 장비의 검증된 template 목록.
   *
   * 우선순위:
   * 1. modelName 정확 일치 (가장 강한 신호)
   * 2. equipmentTypeId 일치
   * 3. classification 일치
   *
   * 결과 정렬: priorityScore desc, createdAt desc.
   * 각 entry에 매칭 이유(matchReason) 포함 — UI에서 "왜 이 카드가 보이나" chip 표시.
   */
  async findGallery(query: GalleryQueryInput): Promise<
    Array<{
      template: InspectionFormTemplate;
      matchReason: 'modelName' | 'classificationCode';
      modelName: string | null;
      equipmentName: string;
    }>
  > {
    const limit = query.limit ?? 8;
    const matchConditions = [
      query.modelName ? eq(equipment.modelName, query.modelName) : undefined,
      query.classificationCode
        ? eq(equipment.classificationCode, query.classificationCode)
        : undefined,
    ].filter((condition): condition is Exclude<typeof condition, undefined> => !!condition);

    if (matchConditions.length === 0) {
      return [];
    }

    const priorityOrder = sql<number>`CASE
      WHEN ${query.modelName ?? null} IS NOT NULL AND ${equipment.modelName} = ${query.modelName ?? ''} THEN 2
      WHEN ${query.classificationCode ?? null} IS NOT NULL AND ${equipment.classificationCode} = ${query.classificationCode ?? ''} THEN 1
      ELSE 0
    END`;

    // current templates (supersededBy IS NULL) + equipment join
    const rows = await this.db
      .select({
        template: inspectionFormTemplates,
        equipModelName: equipment.modelName,
        equipClassificationCode: equipment.classificationCode,
        equipName: equipment.name,
      })
      .from(inspectionFormTemplates)
      .innerJoin(equipment, eq(inspectionFormTemplates.equipmentId, equipment.id))
      .where(
        and(
          eq(inspectionFormTemplates.inspectionType, query.inspectionType),
          isNull(inspectionFormTemplates.supersededBy),
          isNull(inspectionFormTemplates.deletedAt),
          or(...matchConditions)
        )
      )
      .orderBy(desc(priorityOrder), desc(inspectionFormTemplates.createdAt))
      .limit(limit);

    // 우선순위 점수 매핑 (weight: modelName=2, classificationCode=1)
    const matched = rows
      .map((r) => {
        let priority = 0;
        let matchReason: 'modelName' | 'classificationCode' | null = null;
        if (query.modelName && r.equipModelName === query.modelName) {
          priority = 2;
          matchReason = 'modelName';
        } else if (
          query.classificationCode &&
          r.equipClassificationCode === query.classificationCode
        ) {
          priority = 1;
          matchReason = 'classificationCode';
        }
        return { row: r, priority, matchReason };
      })
      .filter(
        (
          m
        ): m is {
          row: (typeof rows)[number];
          priority: number;
          matchReason: 'modelName' | 'classificationCode';
        } => m.matchReason !== null
      )
      .sort((a, b) => b.priority - a.priority);

    return matched.map((m) => ({
      template: m.row.template,
      matchReason: m.matchReason,
      modelName: m.row.equipModelName,
      equipmentName: m.row.equipName,
    }));
  }

  // ==========================================================================
  // Internal helpers
  // ==========================================================================

  private async invalidateAndEmit(
    eventName: (typeof CACHE_EVENTS)[keyof typeof CACHE_EVENTS],
    payload: InspectionTemplateCachePayload
  ): Promise<void> {
    // 1. 로컬 캐시 prefix 삭제 (read-after-write 일관성)
    this.cacheService.deleteByPrefix(this.CACHE_PREFIX);

    // 2. cache event emit (registry listener가 cross-domain invalidate)
    //    emitAsync로 listener Promise를 await — verify-cache-events 패턴
    await this.eventEmitter.emitAsync(eventName, payload);
  }

  /**
   * PG unique violation 감지 — drizzle/node-postgres 에러 형식.
   * code '23505' = unique_violation.
   */
  private isUniqueViolation(err: unknown): boolean {
    if (typeof err !== 'object' || err === null) return false;
    const e = err as { code?: string };
    return e.code === '23505';
  }

  /**
   * Audit log의 userRole 변환 — UserRoleEnum SSOT 경유.
   * - actorUserId 부재: 'system' (시스템 호출, controller 우회)
   * - actorRole이 UserRoleEnum.options에 포함되면 그대로 캐스트
   * - 부적합 / null: 'unknown' (방어적 fallback)
   *
   * type cast `as 'system_admin'`을 사용했던 이전 구현은 다른 admin 역할
   * (quality_manager, lab_manager) 케이스에서 부정확한 audit trail 생성.
   * safeParse로 정확한 UserRole 보장.
   */
  private resolveAuditUserRole(
    actorUserId: string | null,
    actorRole: string | null
  ): AuditLogUserRole {
    if (!actorUserId) return 'system';
    if (!actorRole) return 'unknown';
    const parsed = UserRoleEnum.safeParse(actorRole);
    return parsed.success ? parsed.data : 'unknown';
  }
}
