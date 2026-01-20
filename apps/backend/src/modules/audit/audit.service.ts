import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, gte, lte, desc, sql, SQL } from 'drizzle-orm';
import { auditLogs, NewAuditLog, AuditLog, AuditLogDetails } from '@equipment-management/db/schema';

/**
 * 감사 로그 생성 DTO
 */
export interface CreateAuditLogDto {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: AuditLogDetails;
  ipAddress?: string;
}

/**
 * 감사 로그 조회 필터
 */
export interface AuditLogFilter {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 페이지네이션 옵션
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject('DRIZZLE_INSTANCE') private db: any) {}

  /**
   * 감사 로그 생성 (비동기)
   *
   * 성능 영향을 최소화하기 위해 비동기로 처리합니다.
   * 로그 저장 실패가 비즈니스 로직에 영향을 주지 않습니다.
   */
  async create(dto: CreateAuditLogDto): Promise<void> {
    try {
      // NewAuditLog 타입 호환성 문제 우회를 위해 객체를 직접 전달
      const newLog = {
        userId: dto.userId,
        userName: dto.userName,
        userRole: dto.userRole,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        entityName: dto.entityName,
        details: dto.details,
        ipAddress: dto.ipAddress,
        timestamp: new Date(),
        createdAt: new Date(),
      } as NewAuditLog;

      await this.db.insert(auditLogs).values(newLog);

      this.logger.debug(
        `Audit log created: ${dto.userName}(${dto.userRole}) - ${dto.action} ${dto.entityType}(${dto.entityId})`
      );
    } catch (error) {
      // 로그 저장 실패는 비즈니스 로직에 영향을 주지 않음
      this.logger.error(`Failed to create audit log: ${error}`, error);
    }
  }

  /**
   * 감사 로그 조회 (페이지네이션 지원)
   */
  async findAll(
    filter: AuditLogFilter,
    pagination: PaginationOptions
  ): Promise<{ items: AuditLog[]; meta: any }> {
    const conditions: SQL[] = [];

    if (filter.userId) {
      conditions.push(eq(auditLogs.userId, filter.userId));
    }

    if (filter.entityType) {
      conditions.push(eq(auditLogs.entityType, filter.entityType));
    }

    if (filter.entityId) {
      conditions.push(eq(auditLogs.entityId, filter.entityId));
    }

    if (filter.action) {
      conditions.push(eq(auditLogs.action, filter.action));
    }

    if (filter.startDate) {
      conditions.push(gte(auditLogs.timestamp, filter.startDate));
    }

    if (filter.endDate) {
      conditions.push(lte(auditLogs.timestamp, filter.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 총 개수 조회
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / pagination.limit);

    // 페이지네이션 적용하여 조회
    const items = await this.db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pagination.limit,
        totalPages,
        currentPage: pagination.page,
      },
    };
  }

  /**
   * 특정 엔티티의 감사 로그 조회
   */
  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.timestamp));
  }

  /**
   * 특정 사용자의 감사 로그 조회
   */
  async findByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    return this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  /**
   * 포맷된 로그 메시지 생성
   *
   * 예: "2025년 5월 09일 09:30, 홍석환(기술책임자)이 '네트워크 분석기(SUW-E0326)' 신규 등록 요청을 '승인'함."
   */
  formatLogMessage(log: AuditLog): string {
    const date = new Date(log.timestamp);
    const formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate().toString().padStart(2, '0')}일 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    const roleMap: Record<string, string> = {
      test_operator: '시험실무자',
      technical_manager: '기술책임자',
      site_admin: '시험소별 관리자',
    };

    const actionMap: Record<string, string> = {
      create: '등록',
      update: '수정',
      delete: '삭제',
      approve: '승인',
      reject: '반려',
      checkout: '반출',
      return: '반입',
      cancel: '취소',
      login: '로그인',
      logout: '로그아웃',
    };

    const entityTypeMap: Record<string, string> = {
      equipment: '장비',
      calibration: '교정',
      checkout: '반출',
      rental: '대여',
      user: '사용자',
      team: '팀',
      calibration_factor: '보정계수',
      non_conformance: '부적합',
      software: '소프트웨어',
      calibration_plan: '교정계획서',
      repair_history: '수리이력',
    };

    const roleName = roleMap[log.userRole] || log.userRole;
    const actionName = actionMap[log.action] || log.action;
    const entityTypeName = entityTypeMap[log.entityType] || log.entityType;

    if (log.entityName) {
      return `${formattedDate}, ${log.userName}(${roleName})이 '${log.entityName}' ${entityTypeName}을(를) '${actionName}'함.`;
    }

    return `${formattedDate}, ${log.userName}(${roleName})이 ${entityTypeName}(${log.entityId})을(를) '${actionName}'함.`;
  }
}
