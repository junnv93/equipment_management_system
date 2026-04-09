import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformSingleResponse } from './utils/response-transformers';

/**
 * 알림 API 응답 타입
 */
export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  priority: string;
  recipientId: string | null;
  teamId: string | null;
  isSystemWide: boolean;
  equipmentId: string | null;
  entityType: string | null;
  entityId: string | null;
  linkUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  actorId: string | null;
  actorName: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  checkoutEnabled: boolean;
  calibrationEnabled: boolean;
  calibrationPlanEnabled: boolean;
  nonConformanceEnabled: boolean;
  disposalEnabled: boolean;
  equipmentImportEnabled: boolean;
  equipmentEnabled: boolean;
  systemEnabled: boolean;
  frequency?: string;
  digestTime: string;
}

export interface NotificationQueryParams {
  category?: string;
  isRead?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  site?: string;
  teamId?: string;
}

/**
 * 알림 API 클라이언트
 *
 * SSOT: API_ENDPOINTS.NOTIFICATIONS 사용
 */
const notificationsApi = {
  /**
   * 내 알림 목록 조회
   */
  async list(params?: NotificationQueryParams): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set('category', params.category);
    if (params?.isRead !== undefined) queryParams.set('isRead', String(params.isRead));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.pageSize) queryParams.set('pageSize', String(params.pageSize));
    if (params?.site) queryParams.set('site', params.site);
    if (params?.teamId) queryParams.set('teamId', params.teamId);

    const qs = queryParams.toString();
    const url = `${API_ENDPOINTS.NOTIFICATIONS.LIST}${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get(url);
    return transformSingleResponse<NotificationListResponse>(response);
  },

  /**
   * 미읽음 알림 개수 조회
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    return transformSingleResponse<UnreadCountResponse>(response);
  },

  /**
   * 알림 읽음 표시
   */
  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  /**
   * 모든 알림 읽음 표시
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },

  /**
   * 알림 삭제
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
  },

  /**
   * 알림 설정 조회
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS);
    return transformSingleResponse<NotificationPreferences>(response);
  },

  /**
   * 알림 설정 업데이트
   */
  async updatePreferences(
    prefs: Partial<Omit<NotificationPreferences, 'id' | 'userId'>>
  ): Promise<NotificationPreferences> {
    const response = await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.SETTINGS, prefs);
    return transformSingleResponse<NotificationPreferences>(response);
  },
};

export default notificationsApi;
