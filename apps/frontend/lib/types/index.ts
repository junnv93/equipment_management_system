// 예약 상태 타입
export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'COMPLETED';

// 사용자 타입
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'MANAGER';
  teamId?: string;
}

// 장비 타입 (packages/schemas의 EquipmentStatus와 일치)
export interface Equipment {
  id: string;
  name: string;
  managementNumber: string;
  description?: string;
  status: 'available' | 'in_use' | 'checked_out' | 'calibration_scheduled' | 'calibration_overdue' | 'non_conforming' | 'spare' | 'retired';
}

// 예약 타입
export interface Reservation {
  id: string;
  equipmentId: string;
  userId: string;
  approvedById?: string;
  purpose: string;
  startDate: string | Date;
  endDate: string | Date;
  status: ReservationStatus;
  rejectionReason?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// 확장된 예약 타입 (user, equipment, approvedBy 정보 포함)
export interface ExpandedReservation extends Reservation {
  user?: User;
  equipment?: Equipment;
  approvedBy?: User;
}

// 예약 생성 DTO 타입
export interface CreateReservationDto {
  equipmentId: string;
  userId?: string;
  purpose: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

// 예약 업데이트 DTO 타입
export interface UpdateReservationDto {
  purpose?: string;
  startDate?: string;
  endDate?: string;
  status?: ReservationStatus;
  approvedById?: string;
  rejectionReason?: string;
  notes?: string;
}

// 예약 조회 쿼리 타입
export interface ReservationQuery {
  status?: string;
  equipmentId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// 기본 데이터 타입
export interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta: {
    timestamp: string;
  };
}

// 상태 관련 타입
export interface FilterState {
  search?: string;
  status?: string;
  category?: string;
  team?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 알림 관련 타입
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  userId: string;
}

// 이벤트 관련 타입
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resourceId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  color?: string;
}

// 보고서 관련 타입
export interface ReportData {
  id: string;
  name: string;
  type: 'excel' | 'csv' | 'pdf';
  generatedAt: string;
  url: string;
  parameters?: Record<string, any>;
}

// UI 컴포넌트 타입
export type { SeparatorProps } from "@/components/ui/separator";
export type { ToasterToast, ToastProps, ToastActionElement } from "@/components/ui/toast";
export type { InputProps } from "@/components/ui/input";
export type { BadgeProps } from "@/components/ui/badge"; 