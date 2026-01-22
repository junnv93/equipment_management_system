import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { v4 as uuidv4 } from 'uuid';
import {
  CreateNotificationDto,
  NotificationTypeEnum,
  NotificationPriorityEnum,
} from './dto/create-notification.dto';
import {
  NotificationFrequencyEnum,
  NotificationSettingsDto,
} from './dto/notification-settings.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

// 알림 인터페이스 정의
export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationTypeEnum;
  priority: NotificationPriorityEnum;
  recipientId: string | null;
  isRead: boolean;
  isTeamNotification?: boolean;
  teamId?: string;
  equipmentId?: string;
  calibrationId?: string;
  rentalId?: string;
  linkUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

// 임시 알림 데이터
const temporaryNotifications = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    title: '장비 교정 일정 알림',
    content: 'RF-Analyzer(SUW-E0001) 장비의 교정 일정이 2주 후로 예정되어 있습니다.',
    type: NotificationTypeEnum.CALIBRATION_DUE,
    priority: NotificationPriorityEnum.MEDIUM,
    recipientId: '550e8400-e29b-41d4-a716-446655440001',
    isTeamNotification: false,
    equipmentId: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    calibrationId: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    rentalId: undefined,
    linkUrl: '/equipment/1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p/calibrations',
    isRead: false,
    createdAt: new Date('2023-05-01T09:00:00Z'),
    updatedAt: new Date('2023-05-01T09:00:00Z'),
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    title: '장비 대여 요청 승인',
    content: 'Oscilloscope(EQ-002) 장비 대여 요청이 승인되었습니다.',
    type: NotificationTypeEnum.RENTAL_APPROVED,
    priority: NotificationPriorityEnum.MEDIUM,
    recipientId: '660f9500-f30b-52e5-b827-557766550111',
    isTeamNotification: false,
    equipmentId: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    calibrationId: undefined,
    rentalId: '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v',
    linkUrl: '/rentals/7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v',
    isRead: true,
    createdAt: new Date('2023-05-10T14:30:00Z'),
    updatedAt: new Date('2023-05-10T15:45:00Z'),
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    title: '장비 교정 완료',
    content: 'Power Supply(EQ-003) 장비의 교정이 완료되었습니다.',
    type: NotificationTypeEnum.CALIBRATION_COMPLETED,
    priority: NotificationPriorityEnum.LOW,
    recipientId: '550e8400-e29b-41d4-a716-446655440001',
    isTeamNotification: true,
    equipmentId: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    calibrationId: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    rentalId: undefined,
    linkUrl:
      '/equipment/3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r/calibrations/4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    isRead: false,
    createdAt: new Date('2023-05-15T11:20:00Z'),
    updatedAt: new Date('2023-05-15T11:20:00Z'),
  },
  {
    id: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    title: '장비 대여 요청',
    content: 'Temperature Chamber(EQ-004) 장비 대여 요청이 접수되었습니다.',
    type: NotificationTypeEnum.RENTAL_REQUEST,
    priority: NotificationPriorityEnum.HIGH,
    recipientId: '770a0600-a40c-63f6-c938-668877660222',
    isTeamNotification: false,
    equipmentId: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    calibrationId: undefined,
    rentalId: '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w',
    linkUrl: '/rentals/8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w',
    isRead: false,
    createdAt: new Date('2023-05-20T08:45:00Z'),
    updatedAt: new Date('2023-05-20T08:45:00Z'),
  },
  {
    id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
    title: '시스템 점검 안내',
    content: '장비 관리 시스템이 2023년 6월 1일 00:00 ~ 04:00 (KST) 동안 점검 예정입니다.',
    type: NotificationTypeEnum.SYSTEM,
    priority: NotificationPriorityEnum.HIGH,
    recipientId: 'all',
    isTeamNotification: false,
    equipmentId: undefined,
    calibrationId: undefined,
    rentalId: undefined,
    linkUrl: undefined,
    isRead: false,
    createdAt: new Date('2023-05-25T10:00:00Z'),
    updatedAt: new Date('2023-05-25T10:00:00Z'),
  },
];

// 검색 가능한 알림 목록
const notifications: Notification[] = [...temporaryNotifications];

// 임시 알림 설정 데이터
const notificationSettings = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    emailEnabled: true,
    inAppEnabled: true,
    calibrationDueEnabled: true,
    calibrationCompletedEnabled: true,
    rentalRequestEnabled: true,
    rentalApprovedEnabled: true,
    rentalRejectedEnabled: true,
    checkoutEnabled: true,
    maintenanceEnabled: true,
    notificationTime: '09:00',
    frequency: NotificationFrequencyEnum.IMMEDIATE,
    systemNotificationsEnabled: true,
    createdAt: new Date('2023-05-01T09:00:00Z'),
    updatedAt: new Date('2023-05-01T09:00:00Z'),
  },
];

@Injectable()
export class NotificationsService {
  // 알림 설정을 위한 임시 데이터 저장소
  private notificationSettings: Record<string, NotificationSettingsDto> = {};

  create(createNotificationDto: CreateNotificationDto) {
    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // id: uuidv4(),

      // ... existing code ...
    };

    // ... existing code ...
  }

  async findAll(query: NotificationQueryDto) {
    const {
      recipientId,
      teamId,
      types,
      priorities,
      equipmentId,
      calibrationId,
      rentalId,
      isRead,
      search,
      fromDate,
      toDate,
      sort = 'createdAt.desc',
      page = 1,
      pageSize = 20,
    } = query;

    // 필터링
    let filteredNotifications = [...notifications];

    if (recipientId) {
      filteredNotifications = filteredNotifications.filter(
        (notification) =>
          notification.recipientId === recipientId || notification.recipientId === 'all'
      );
    }

    if (teamId) {
      filteredNotifications = filteredNotifications.filter(
        (notification) => notification.isTeamNotification && notification.recipientId === teamId
      );
    }

    if (types) {
      filteredNotifications = filteredNotifications.filter((notification) =>
        types.includes(notification.type)
      );
    }

    if (priorities) {
      filteredNotifications = filteredNotifications.filter((notification) =>
        priorities.includes(notification.priority)
      );
    }

    if (equipmentId) {
      filteredNotifications = filteredNotifications.filter(
        (notification) => notification.equipmentId === equipmentId
      );
    }

    if (calibrationId) {
      filteredNotifications = filteredNotifications.filter(
        (notification) => notification.calibrationId === calibrationId
      );
    }

    if (rentalId) {
      filteredNotifications = filteredNotifications.filter(
        (notification) => notification.rentalId === rentalId
      );
    }

    if (isRead !== undefined) {
      filteredNotifications = filteredNotifications.filter(
        (notification) => notification.isRead === isRead
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredNotifications = filteredNotifications.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchLower) ||
          notification.content.toLowerCase().includes(searchLower)
      );
    }

    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      filteredNotifications = filteredNotifications.filter(
        (notification) => new Date(notification.createdAt) >= fromDateObj
      );
    }

    if (toDate) {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999); // 해당 날짜의 마지막 시간으로 설정
      filteredNotifications = filteredNotifications.filter(
        (notification) => new Date(notification.createdAt) <= toDateObj
      );
    }

    // 정렬
    if (sort) {
      const [field, direction] = sort.split('.');
      const isAsc = direction === 'asc';

      filteredNotifications.sort((a, b) => {
        if (a[field] < b[field]) return isAsc ? -1 : 1;
        if (a[field] > b[field]) return isAsc ? 1 : -1;
        return 0;
      });
    }

    // 페이지네이션
    const totalItems = filteredNotifications.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedNotifications = filteredNotifications.slice(offset, offset + pageSize);

    return {
      items: paginatedNotifications,
      meta: {
        totalItems,
        itemCount: paginatedNotifications.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: string) {
    const notification = notifications.find((n) => n.id === id);

    if (!notification) {
      throw new NotFoundException(`알림 ID ${id}를 찾을 수 없습니다.`);
    }

    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    const index = notifications.findIndex((n) => n.id === id);

    if (index === -1) {
      throw new NotFoundException(`알림 ID ${id}를 찾을 수 없습니다.`);
    }

    const now = new Date();
    notifications[index] = {
      ...notifications[index],
      ...updateNotificationDto,
      updatedAt: now,
    };

    return notifications[index];
  }

  async remove(id: string) {
    const index = notifications.findIndex((n) => n.id === id);

    if (index === -1) {
      throw new NotFoundException(`알림 ID ${id}를 찾을 수 없습니다.`);
    }

    notifications.splice(index, 1);
    return { id, deleted: true };
  }

  // 읽음 표시
  async markAsRead(id: string) {
    return this.update(id, { isRead: true });
  }

  // 모든 알림 읽음 표시
  async markAllAsRead(recipientId: string) {
    const userNotifications = notifications.filter(
      (n) => n.recipientId === recipientId || n.recipientId === 'all'
    );

    const updatePromises = userNotifications.map((n) => this.markAsRead(n.id));
    await Promise.all(updatePromises);

    return { success: true, count: userNotifications.length };
  }

  // 교정 일정 알림 생성
  async createCalibrationDueNotification(
    equipmentId: string,
    recipientId: string,
    days: number,
    equipmentName: string
  ) {
    const title = `장비 교정 예정 알림: ${equipmentName}`;
    const content = `${equipmentName} 장비의 교정이 ${days}일 후로 예정되어 있습니다.`;

    return this.create({
      title,
      content,
      type: NotificationTypeEnum.CALIBRATION_DUE,
      priority: NotificationPriorityEnum.MEDIUM,
      recipientId,
      equipmentId,
      linkUrl: `/equipment/${equipmentId}/calibrations`,
    });
  }

  // 중간점검 알림 생성
  async createIntermediateCheckNotification(
    calibrationId: string,
    equipmentId: string,
    recipientId: string,
    days: number,
    equipmentName: string
  ) {
    const title = `중간점검 예정 알림: ${equipmentName}`;
    const content = `${equipmentName} 장비의 중간점검이 ${days}일 후로 예정되어 있습니다.`;

    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      type: NotificationTypeEnum.INTERMEDIATE_CHECK_DUE,
      priority: NotificationPriorityEnum.MEDIUM,
      recipientId,
      isTeamNotification: false,
      equipmentId,
      calibrationId,
      rentalId: undefined,
      linkUrl: `/calibration/${calibrationId}`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notifications.push(newNotification);
    return newNotification;
  }

  // 교정 승인 대기 알림 생성
  async createCalibrationApprovalPendingNotification(
    calibrationId: string,
    equipmentId: string,
    approverId: string,
    equipmentName: string,
    requesterName: string
  ) {
    const title = `교정 승인 요청: ${equipmentName}`;
    const content = `${requesterName}님이 ${equipmentName} 장비의 교정 기록을 등록했습니다. 검토 후 승인해주세요.`;

    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      type: NotificationTypeEnum.CALIBRATION_APPROVAL_PENDING,
      priority: NotificationPriorityEnum.HIGH,
      recipientId: approverId,
      isTeamNotification: false,
      equipmentId,
      calibrationId,
      rentalId: undefined,
      linkUrl: `/admin/calibration-approvals`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notifications.push(newNotification);
    return newNotification;
  }

  // 교정 승인 완료 알림 생성
  async createCalibrationApprovedNotification(
    calibrationId: string,
    equipmentId: string,
    userId: string,
    equipmentName: string
  ) {
    const title = `교정 승인 완료: ${equipmentName}`;
    const content = `${equipmentName} 장비의 교정 기록이 승인되었습니다.`;

    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      type: NotificationTypeEnum.CALIBRATION_APPROVED,
      priority: NotificationPriorityEnum.MEDIUM,
      recipientId: userId,
      isTeamNotification: false,
      equipmentId,
      calibrationId,
      rentalId: undefined,
      linkUrl: `/calibration/${calibrationId}`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notifications.push(newNotification);
    return newNotification;
  }

  // 교정 반려 알림 생성
  async createCalibrationRejectedNotification(
    calibrationId: string,
    equipmentId: string,
    userId: string,
    equipmentName: string,
    reason: string
  ) {
    const title = `교정 반려: ${equipmentName}`;
    const content = `${equipmentName} 장비의 교정 기록이 반려되었습니다. 사유: ${reason}`;

    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      type: NotificationTypeEnum.CALIBRATION_REJECTED,
      priority: NotificationPriorityEnum.HIGH,
      recipientId: userId,
      isTeamNotification: false,
      equipmentId,
      calibrationId,
      rentalId: undefined,
      linkUrl: `/calibration/${calibrationId}`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notifications.push(newNotification);
    return newNotification;
  }

  // 대여 요청 알림 생성
  async createRentalRequestNotification(
    rentalId: string,
    approverId: string,
    equipmentName: string,
    requesterName: string
  ) {
    const title = `장비 대여 요청: ${equipmentName}`;
    const content = `${requesterName}님이 ${equipmentName} 장비 대여를 요청했습니다.`;

    return this.create({
      title,
      content,
      type: NotificationTypeEnum.RENTAL_REQUEST,
      priority: NotificationPriorityEnum.HIGH,
      recipientId: approverId,
      rentalId,
      linkUrl: `/rentals/${rentalId}`,
    });
  }

  /**
   * 대여/반출 상태 변경 알림 생성
   */
  async createRentalStatusNotification(
    rentalId: string,
    userId: string,
    equipmentName: string,
    isApproved: boolean
  ) {
    const notificationType = isApproved
      ? NotificationTypeEnum.RENTAL_APPROVED
      : NotificationTypeEnum.RENTAL_REJECTED;

    const title = isApproved ? '장비 대여 요청 승인' : '장비 대여 요청 거절';

    const content = isApproved
      ? `${equipmentName} 장비 대여 요청이 승인되었습니다.`
      : `${equipmentName} 장비 대여 요청이 거절되었습니다.`;

    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      type: notificationType,
      priority: NotificationPriorityEnum.MEDIUM,
      recipientId: userId,
      isTeamNotification: false,
      equipmentId: undefined,
      calibrationId: undefined,
      rentalId,
      linkUrl: `/rentals/${rentalId}`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notifications.push(newNotification);

    return newNotification;
  }

  /**
   * 반납 요청 알림 생성
   */
  async createReturnRequestNotification(
    rentalId: string,
    approverId: string,
    userId: string,
    equipmentName: string
  ) {
    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '장비 반납 요청',
      content: `${equipmentName} 장비에 대한 반납 요청이 접수되었습니다.`,
      type: NotificationTypeEnum.RETURN_REQUESTED,
      priority: NotificationPriorityEnum.MEDIUM,
      recipientId: approverId, // 알림을 받을 승인자 ID
      isTeamNotification: false,
      equipmentId: undefined,
      calibrationId: undefined,
      rentalId,
      linkUrl: `/admin/return-approvals`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notifications.push(newNotification);

    return newNotification;
  }

  /**
   * 반납 승인/거절 알림 생성
   */
  async createReturnStatusNotification(
    rentalId: string,
    userId: string,
    equipmentName: string,
    isApproved: boolean,
    notes?: string
  ) {
    const notificationType = isApproved
      ? NotificationTypeEnum.RETURN_APPROVED
      : NotificationTypeEnum.RETURN_REJECTED;

    const title = isApproved ? '장비 반납 요청 승인' : '장비 반납 요청 거절';

    let content = isApproved
      ? `${equipmentName} 장비 반납 요청이 승인되었습니다.`
      : `${equipmentName} 장비 반납 요청이 거절되었습니다.`;

    // 메모가 있을 경우 내용에 추가
    if (notes) {
      content += ` 메모: ${notes}`;
    }

    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      type: notificationType,
      priority: NotificationPriorityEnum.MEDIUM,
      recipientId: userId,
      isTeamNotification: false,
      equipmentId: undefined,
      calibrationId: undefined,
      rentalId,
      linkUrl: `/rentals/${rentalId}`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notifications.push(newNotification);

    return newNotification;
  }

  // 미확인 알림 개수 조회
  async countUnread(recipientId: string) {
    const unreadCount = notifications.filter(
      (n) => (n.recipientId === recipientId || n.recipientId === 'all') && !n.isRead
    ).length;

    return { count: unreadCount };
  }

  // 시스템 알림 생성 (모든 사용자 대상)
  async createSystemNotification(
    title: string,
    content: string,
    priority: NotificationPriorityEnum = NotificationPriorityEnum.MEDIUM
  ): Promise<Notification> {
    // 시스템 알림 생성 로직
    const systemNotification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      type: NotificationTypeEnum.SYSTEM,
      priority: priority,
      isRead: false,
      recipientId: null, // 시스템 알림은 특정 사용자에게 전송되지 않을 수 있음
      isTeamNotification: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notifications.push(systemNotification);
    return systemNotification;
  }

  // 사용자 알림 설정 관련 메서드
  getUserNotificationSettings(userId: string): NotificationSettingsDto {
    // 사용자 알림 설정이 없으면 기본 설정 반환
    if (!this.notificationSettings[userId]) {
      const defaultSettings: NotificationSettingsDto = {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        calibrationDueEnabled: true,
        calibrationCompletedEnabled: true,
        rentalRequestEnabled: true,
        rentalApprovedEnabled: true,
        rentalRejectedEnabled: true,
        checkoutEnabled: true,
        maintenanceEnabled: true,
        systemNotificationsEnabled: true,
        notificationTime: '09:00',
        frequency: NotificationFrequencyEnum.IMMEDIATE,
      };
      return defaultSettings;
    }

    return this.notificationSettings[userId];
  }

  updateUserNotificationSettings(
    userId: string,
    settingsDto: NotificationSettingsDto
  ): NotificationSettingsDto {
    // userId 일치 확인
    if (userId !== settingsDto.userId) {
      throw new BadRequestException('userId가 일치하지 않습니다.');
    }

    // 기존 설정 가져오기
    const existingSettings = this.getUserNotificationSettings(userId);

    // 새 설정으로 업데이트
    this.notificationSettings[userId] = {
      ...existingSettings,
      ...settingsDto,
    };

    return this.notificationSettings[userId];
  }

  /**
   * 사용자의 특정 알림 유형이 활성화되어 있는지 확인
   */
  isNotificationEnabled(userId: string, notificationType: NotificationTypeEnum): boolean {
    const settings = this.getUserNotificationSettings(userId);

    if (!settings.inAppEnabled) {
      return false;
    }

    switch (notificationType) {
      case NotificationTypeEnum.CALIBRATION_DUE:
        return settings.calibrationDueEnabled ?? true;
      case NotificationTypeEnum.CALIBRATION_COMPLETED:
        return settings.calibrationCompletedEnabled ?? true;
      case NotificationTypeEnum.INTERMEDIATE_CHECK_DUE:
        return (settings as any).intermediateCheckEnabled ?? true;
      case NotificationTypeEnum.CALIBRATION_APPROVAL_PENDING:
      case NotificationTypeEnum.CALIBRATION_APPROVED:
      case NotificationTypeEnum.CALIBRATION_REJECTED:
        return (settings as any).calibrationApprovalEnabled ?? true;
      case NotificationTypeEnum.RENTAL_REQUEST:
        return settings.rentalRequestEnabled ?? true;
      case NotificationTypeEnum.RENTAL_APPROVED:
        return settings.rentalApprovedEnabled ?? true;
      case NotificationTypeEnum.RENTAL_REJECTED:
        return settings.rentalRejectedEnabled ?? true;
      case NotificationTypeEnum.RETURN_REQUESTED:
        return settings.returnRequestedEnabled ?? true;
      case NotificationTypeEnum.RETURN_APPROVED:
        return settings.returnApprovedEnabled ?? true;
      case NotificationTypeEnum.RETURN_REJECTED:
        return settings.returnRejectedEnabled ?? true;
      case NotificationTypeEnum.EQUIPMENT_MAINTENANCE:
      case NotificationTypeEnum.MAINTENANCE:
        return settings.maintenanceEnabled ?? true;
      case NotificationTypeEnum.CHECKOUT:
        return settings.checkoutEnabled ?? true;
      case NotificationTypeEnum.SYSTEM:
        return settings.systemNotificationsEnabled ?? true;
      default:
        return true;
    }
  }

  // 이메일 발송 여부 확인
  shouldSendEmail(userId: string, notificationType: NotificationTypeEnum): boolean {
    const settings = this.getUserNotificationSettings(userId);
    return settings.emailEnabled === true && this.isNotificationEnabled(userId, notificationType);
  }

  // 일간 알림 스케줄링
  scheduleDailyNotifications(): { success: boolean; message: string } {
    // 실제로는 스케줄러를 통해 일정 시간에 실행되어야 함
    // 여기서는 즉시 실행 구현

    // 빈 결과 배열 초기화
    const result: { userId: string; notificationCount: number }[] = [];

    // 모든 사용자의 알림 설정 확인
    Object.keys(this.notificationSettings).forEach((userId) => {
      const settings = this.notificationSettings[userId];

      // 일간 알림 설정인 경우에만 처리
      if (settings.frequency === NotificationFrequencyEnum.DAILY) {
        // 해당 사용자에 대한 알림 수 카운트
        let notificationCount = 0;

        // 1. 교정 예정 알림
        if (settings.calibrationDueEnabled === true) {
          this.createSystemNotification(
            '일간 교정 예정 알림',
            '다음 7일 이내에 교정이 예정된 장비가 있습니다.',
            NotificationPriorityEnum.HIGH
          ).then(() => notificationCount++);
        }

        // 2. 대여 상태 알림
        if (
          settings.rentalRequestEnabled === true ||
          settings.rentalApprovedEnabled === true ||
          settings.rentalRejectedEnabled === true
        ) {
          this.createSystemNotification(
            '일간 대여 상태 요약',
            '귀하의 대여 요청과 승인 상태를 확인하세요.',
            NotificationPriorityEnum.MEDIUM
          ).then(() => notificationCount++);
        }

        // 결과 추가
        result.push({
          userId,
          notificationCount,
        });
      }
    });

    return {
      success: true,
      message: `${result.length}명의 사용자에게 일간 알림을 발송했습니다.`,
    };
  }

  // 주간 알림 스케줄링
  scheduleWeeklyNotifications(): { success: boolean; message: string } {
    // 실제로는 스케줄러를 통해 일정 시간에 실행되어야 함
    // 여기서는 즉시 실행 구현

    // 빈 결과 배열 초기화
    const result: { userId: string; notificationCount: number }[] = [];

    // 모든 사용자의 알림 설정 확인
    Object.keys(this.notificationSettings).forEach((userId) => {
      const settings = this.notificationSettings[userId];

      // 주간 알림 설정인 경우에만 처리
      if (settings.frequency === NotificationFrequencyEnum.WEEKLY) {
        // 해당 사용자에 대한 알림 수 카운트
        let notificationCount = 0;

        // 1. 주간 장비 상태 요약
        this.createSystemNotification(
          '주간 장비 상태 요약',
          '이번 주에 관리가 필요한 장비 목록을 확인하세요.',
          NotificationPriorityEnum.MEDIUM
        ).then(() => notificationCount++);

        // 2. 주간 교정 요약
        if (settings.calibrationDueEnabled === true) {
          this.createSystemNotification(
            '주간 교정 요약',
            '이번 달에 교정이 예정된 장비 목록입니다.',
            NotificationPriorityEnum.MEDIUM
          ).then(() => notificationCount++);
        }

        // 결과 추가
        result.push({
          userId,
          notificationCount,
        });
      }
    });

    return {
      success: true,
      message: `${result.length}명의 사용자에게 주간 알림을 발송했습니다.`,
    };
  }
}
