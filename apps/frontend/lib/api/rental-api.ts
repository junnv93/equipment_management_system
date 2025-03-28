import axios from 'axios';

export interface Rental {
  id: string;
  equipmentId: string;
  equipment?: {
    id: string;
    name: string;
    managementNumber: string;
    status: string;
  };
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  requestDate: string;
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue' | 'return_requested';
  purpose: string;
  approvedById?: string;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalHistory extends Rental {
  returnCondition?: string;
  returnNotes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      pageSize: number;
      currentPage: number;
      totalPages: number;
    };
  };
}

export interface RentalQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  equipmentId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateRentalDto {
  equipmentId: string;
  startDate: string;
  expectedReturnDate: string;
  purpose: string;
  notes?: string;
}

export interface UpdateRentalDto {
  startDate?: string;
  expectedReturnDate?: string;
  purpose?: string;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
}

export interface ReturnRentalDto {
  actualReturnDate: string;
  returnCondition?: string;
  returnNotes?: string;
}

export interface RentalSummary {
  total: number;
  pending: number;
  approved: number;
  overdue: number;
  returnedToday: number;
}

export interface ReturnRequestDto {
  returnCondition: string;
  returnNotes?: string;
}

export interface ApproveReturnDto {
  status: 'approved' | 'rejected';
  approverId: string;
  notes?: string;
}

// 상태 타입 정의
export type RentalStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue' | 'return_requested';

const rentalApi = {
  /**
   * 대여 목록을 조회합니다.
   */
  async getRentals(query: RentalQuery = {}): Promise<PaginatedResponse<Rental>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/rentals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 특정 대여 정보를 조회합니다.
   */
  async getRental(id: string): Promise<Rental> {
    const response = await axios.get(`/api/rentals/${id}`);
    return response.data.data;
  },

  /**
   * 특정 사용자의 대여 이력을 조회합니다.
   */
  async getUserRentals(userId: string, query: RentalQuery = {}): Promise<PaginatedResponse<Rental>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/users/${userId}/rentals?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 특정 장비의 대여 이력을 조회합니다.
   */
  async getEquipmentRentals(equipmentId: string, query: RentalQuery = {}): Promise<PaginatedResponse<Rental>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/equipment/${equipmentId}/rentals?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 새 대여 요청을 생성합니다.
   */
  async createRental(data: CreateRentalDto): Promise<Rental> {
    const response = await axios.post('/api/rentals', data);
    return response.data.data;
  },

  /**
   * 대여 정보를
   */
  async updateRental(id: string, data: UpdateRentalDto): Promise<Rental> {
    const response = await axios.patch(`/api/rentals/${id}`, data);
    return response.data.data;
  },

  /**
   * 대여 요청을 승인합니다.
   */
  async approveRental(id: string, notes?: string): Promise<Rental> {
    const response = await axios.post(`/api/rentals/${id}/approve`, { notes });
    return response.data.data;
  },

  /**
   * 대여 요청을 거부합니다.
   */
  async rejectRental(id: string, reason: string): Promise<Rental> {
    const response = await axios.post(`/api/rentals/${id}/reject`, { reason });
    return response.data.data;
  },

  /**
   * 장비 반납을 처리합니다.
   */
  async returnRental(id: string, data: ReturnRentalDto): Promise<Rental> {
    const response = await axios.post(`/api/rentals/${id}/return`, data);
    return response.data.data;
  },

  /**
   * 대여 요약 정보를 조회합니다.
   */
  async getRentalSummary(): Promise<RentalSummary> {
    const response = await axios.get('/api/rentals/summary');
    return response.data.data;
  },

  /**
   * 기한이 지난 대여 목록을 조회합니다.
   */
  async getOverdueRentals(query: RentalQuery = {}): Promise<PaginatedResponse<Rental>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/rentals/overdue?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 오늘 반납 예정인 대여 목록을 조회합니다.
   */
  async getTodayReturns(query: RentalQuery = {}): Promise<PaginatedResponse<Rental>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/rentals/today-returns?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 사용자가 장비 반납을 요청합니다.
   */
  async requestReturn(id: string, data: ReturnRequestDto): Promise<Rental> {
    const response = await axios.post(`/api/rentals/${id}/request-return`, data);
    return response.data.data;
  },

  /**
   * 반납 요청을 승인하거나 거절합니다.
   */
  async approveReturn(id: string, data: ApproveReturnDto): Promise<Rental> {
    const response = await axios.patch(`/api/rentals/${id}/approve-return`, data);
    return response.data.data;
  }
};

export default rentalApi; 