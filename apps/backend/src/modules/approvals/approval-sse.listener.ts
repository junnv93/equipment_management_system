import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationSseService } from '../notifications/sse/notification-sse.service';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification-events';

/**
 * 승인 변경 SSE 브로드캐스트 리스너
 *
 * 승인 카운트에 영향을 주는 도메인 이벤트를 감지하여
 * 연결된 모든 SSE 클라이언트에 `approval-changed` 이벤트를 전송한다.
 *
 * 프론트엔드에서 이 이벤트를 수신하면 approval counts 쿼리를 무효화하여
 * 2분 폴링 대신 실시간 갱신을 달성한다.
 */

/** 승인 카운트에 영향을 주는 이벤트 목록 */
const APPROVAL_AFFECTING_EVENTS = [
  // 반출
  NOTIFICATION_EVENTS.CHECKOUT_CREATED,
  NOTIFICATION_EVENTS.CHECKOUT_APPROVED,
  NOTIFICATION_EVENTS.CHECKOUT_REJECTED,
  NOTIFICATION_EVENTS.CHECKOUT_RETURNED,
  NOTIFICATION_EVENTS.CHECKOUT_RETURN_APPROVED,
  NOTIFICATION_EVENTS.CHECKOUT_RETURN_REJECTED,
  // 교정
  NOTIFICATION_EVENTS.CALIBRATION_CREATED,
  NOTIFICATION_EVENTS.CALIBRATION_APPROVED,
  NOTIFICATION_EVENTS.CALIBRATION_REJECTED,
  // 교정계획
  NOTIFICATION_EVENTS.CALIBRATION_PLAN_SUBMITTED,
  NOTIFICATION_EVENTS.CALIBRATION_PLAN_REVIEWED,
  NOTIFICATION_EVENTS.CALIBRATION_PLAN_APPROVED,
  NOTIFICATION_EVENTS.CALIBRATION_PLAN_REJECTED,
  // 부적합
  NOTIFICATION_EVENTS.NC_CREATED,
  NOTIFICATION_EVENTS.NC_CORRECTED,
  NOTIFICATION_EVENTS.NC_CLOSED,
  NOTIFICATION_EVENTS.NC_CORRECTION_REJECTED,
  // 장비 요청
  NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_CREATED,
  NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_APPROVED,
  NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_REJECTED,
  // 폐기
  NOTIFICATION_EVENTS.DISPOSAL_REQUESTED,
  NOTIFICATION_EVENTS.DISPOSAL_REVIEWED,
  NOTIFICATION_EVENTS.DISPOSAL_APPROVED,
  NOTIFICATION_EVENTS.DISPOSAL_REJECTED,
  // 장비 반입
  NOTIFICATION_EVENTS.IMPORT_CREATED,
  NOTIFICATION_EVENTS.IMPORT_APPROVED,
  NOTIFICATION_EVENTS.IMPORT_REJECTED,
  // 소프트웨어
  NOTIFICATION_EVENTS.SOFTWARE_APPROVED,
  NOTIFICATION_EVENTS.SOFTWARE_REJECTED,
  // 중간점검
  NOTIFICATION_EVENTS.INTERMEDIATE_CHECK_COMPLETED,
  // 보정계수
  NOTIFICATION_EVENTS.CALIBRATION_FACTOR_APPROVED,
  NOTIFICATION_EVENTS.CALIBRATION_FACTOR_REJECTED,
] as const;

@Injectable()
export class ApprovalSseListener implements OnModuleInit {
  private readonly logger = new Logger(ApprovalSseListener.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly sseService: NotificationSseService
  ) {}

  onModuleInit(): void {
    for (const eventName of APPROVAL_AFFECTING_EVENTS) {
      this.eventEmitter.on(eventName, () => {
        this.broadcastApprovalChanged(eventName);
      });
    }

    this.logger.log(`승인 변경 SSE 리스너 등록 완료: ${APPROVAL_AFFECTING_EVENTS.length}개 이벤트`);
  }

  /**
   * 모든 연결된 SSE 클라이언트에 approval-changed 이벤트 브로드캐스트
   *
   * 승인 카운트는 역할 기반이므로 특정 사용자를 타겟팅하지 않고
   * 전체 브로드캐스트한다. 프론트엔드에서 queryClient.invalidateQueries로
   * 자기 역할의 counts만 refetch한다.
   */
  private broadcastApprovalChanged(triggerEvent: string): void {
    this.sseService.broadcastApprovalChanged(triggerEvent);
  }
}
