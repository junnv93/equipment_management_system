import axios from 'axios';

export interface Checkout {
  id: string;
  equipmentIds: string[];
  equipment?: Array<{
    id: string;
    name: string;
    managementNumber: string;
    status: string;
  }>;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  location: string;
  contactNumber: string;
  address?: string;
  purpose: string;
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
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

export interface CheckoutHistory extends Checkout {
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

export interface CheckoutQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  equipmentId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  location?: string;
}

export interface CreateCheckoutDto {
  equipmentIds: string[];
  location: string;
  contactNumber: string;
  address?: string;
  purpose: string;
  startDate: string;
  expectedReturnDate: string;
  notes?: string;
}

export interface UpdateCheckoutDto {
  location?: string;
  contactNumber?: string;
  address?: string;
  purpose?: string;
  startDate?: string;
  expectedReturnDate?: string;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue';
}

export interface ReturnCheckoutDto {
  actualReturnDate: string;
  returnCondition?: string;
  returnNotes?: string;
}

export interface CheckoutSummary {
  total: number;
  pending: number;
  approved: number;
  overdue: number;
  returnedToday: number;
}

const checkoutApi = {
  /**
   * 반출 목록을 조회합니다.
   */
  async getCheckouts(query: CheckoutQuery = {}): Promise<PaginatedResponse<Checkout>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/checkouts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 특정 반출 정보를 조회합니다.
   */
  async getCheckout(id: string): Promise<Checkout> {
    const response = await axios.get(`/api/checkouts/${id}`);
    return response.data.data;
  },

  /**
   * 특정 사용자의 반출 이력을 조회합니다.
   */
  async getUserCheckouts(userId: string, query: CheckoutQuery = {}): Promise<PaginatedResponse<Checkout>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/users/${userId}/checkouts?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 특정 장비의 반출 이력을 조회합니다.
   */
  async getEquipmentCheckouts(equipmentId: string, query: CheckoutQuery = {}): Promise<PaginatedResponse<Checkout>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/equipment/${equipmentId}/checkouts?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 새 반출 요청을 생성합니다.
   */
  async createCheckout(data: CreateCheckoutDto): Promise<Checkout> {
    const response = await axios.post('/api/checkouts', data);
    return response.data.data;
  },

  /**
   * 반출 정보를 업데이트합니다.
   */
  async updateCheckout(id: string, data: UpdateCheckoutDto): Promise<Checkout> {
    const response = await axios.patch(`/api/checkouts/${id}`, data);
    return response.data.data;
  },

  /**
   * 반출 요청을 승인합니다.
   */
  async approveCheckout(id: string, notes?: string): Promise<Checkout> {
    const response = await axios.post(`/api/checkouts/${id}/approve`, { notes });
    return response.data.data;
  },

  /**
   * 반출 요청을 거부합니다.
   */
  async rejectCheckout(id: string, reason: string): Promise<Checkout> {
    const response = await axios.post(`/api/checkouts/${id}/reject`, { reason });
    return response.data.data;
  },

  /**
   * 장비 반입(반납)을 처리합니다.
   */
  async returnCheckout(id: string, data: ReturnCheckoutDto): Promise<Checkout> {
    const response = await axios.post(`/api/checkouts/${id}/return`, data);
    return response.data.data;
  },

  /**
   * 반출 요약 정보를 조회합니다.
   */
  async getCheckoutSummary(): Promise<CheckoutSummary> {
    const response = await axios.get('/api/checkouts/summary');
    return response.data.data;
  },

  /**
   * 기한이 지난 반출 목록을 조회합니다.
   */
  async getOverdueCheckouts(query: CheckoutQuery = {}): Promise<PaginatedResponse<Checkout>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/checkouts/overdue?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 오늘 반입 예정인 반출 목록을 조회합니다.
   */
  async getTodayReturns(query: CheckoutQuery = {}): Promise<PaginatedResponse<Checkout>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/checkouts/today-returns?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  }
};

export default checkoutApi; 