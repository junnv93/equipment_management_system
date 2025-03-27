/**
 * API 요청을 처리하는 서비스 레이어
 * 모든 API 호출은 이 파일을 통해 이루어집니다.
 */

import axios from 'axios';
import { config } from '../config/config';

// CSRF 토큰 가져오기 함수
const getCsrfToken = () => {
  // 쿠키에서 csrftoken 가져오기
  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  const csrfCookie = cookies.find(cookie => cookie.startsWith('csrftoken='));
  return csrfCookie ? csrfCookie.split('=')[1] : '';
};

// 토큰 만료 시간 확인 함수
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // JWT 토큰 디코딩 (Base64)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // 만료 시간 확인
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return true;
  }
};

// 토큰 가져오기 함수
const getToken = () => {
  const token = localStorage.getItem('token');
  
  // 토큰이 만료되었는지 확인
  if (token && isTokenExpired(token)) {
    // 만료된 경우 토큰 제거
    localStorage.removeItem('token');
    window.location.href = '/login?expired=true';
    return null;
  }
  
  return token;
};

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // 쿠키를 요청에 포함시킵니다
});

// 요청 인터셉터 - 모든 요청에 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // CSRF 토큰 추가
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 오류 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 공통 에러 처리 로직
    const errorResponse = {
      status: error.response?.status || 500,
      message: error.response?.data?.detail || error.message || '알 수 없는 오류가 발생했습니다.',
      data: error.response?.data || {},
      originalError: error
    };
    
    // 401 오류 처리 (인증 실패)
    if (error.response && error.response.status === 401) {
      // 토큰 만료 등의 이유로 로그아웃 처리
      localStorage.removeItem('token');
      
      // 로그인 페이지가 아닌 경우에만 리다이렉트
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }
    
    // 에러 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV !== 'production') {
      console.error('API 오류:', {
        url: error.config?.url,
        method: error.config?.method,
        status: errorResponse.status,
        message: errorResponse.message,
        data: errorResponse.data
      });
      
      // 400 오류의 경우 필드별 오류 메시지 상세 로깅
      if (error.response?.status === 400 && typeof error.response.data === 'object') {
        const fieldErrors = Object.entries(error.response.data)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('; ');
        
        if (fieldErrors) {
          console.error('필드별 오류 정보:', fieldErrors);
        }
      }
    }
    
    return Promise.reject(errorResponse);
  }
);

// API 서비스 객체
const apiService = {
  // 사용자 관련 API
  auth: {
    login: (credentials) => apiClient.post(config.endpoints.users.login, credentials),
    getProfile: () => apiClient.get(config.endpoints.users.me),
    register: (userData) => apiClient.post(config.endpoints.users.register, userData),
  },
  
  // 장비 관련 API
  equipment: {
    getAll: (params) => apiClient.get(config.endpoints.equipment.base, { params }),
    getById: (id) => apiClient.get(config.endpoints.equipment.detail(id)),
    create: (data) => {
      console.log('장비 생성 데이터:', data);
      
      // FormData 객체인 경우 Content-Type 헤더를 설정하지 않음 (브라우저가 자동으로 설정)
      const headers = data instanceof FormData ? {} : { 'Content-Type': 'application/json' };
      
      return apiClient.post(config.endpoints.equipment.base, data, { headers });
    },
    update: (id, data) => {
      // FormData인지 JSON인지 확인
      const isFormData = data instanceof FormData;
      
      console.log('장비 업데이트 데이터 타입:', isFormData ? 'FormData' : 'JSON');
      
      if (isFormData) {
        // FormData 내용 디버깅 출력
        console.log('FormData 내용:');
        for (let pair of data.entries()) {
          if (pair[0] === 'image') {
            console.log(`${pair[0]}: ${pair[1] instanceof File ? 'File (' + pair[1].name + ')' : pair[1]}`);
          } else {
            console.log(`${pair[0]}: ${pair[1]}`);
          }
        }
        
        // FormData는 Content-Type을 설정하지 않음 (브라우저가 자동으로 설정)
        return apiClient.put(
          config.endpoints.equipment.detail(id), 
          data,
          { 
            headers: {}, 
            // 중요: axios가 FormData를 변환하지 않도록 설정
            transformRequest: [function(data) {
              return data;
            }]
          }
        );
      } else {
        // JSON 데이터 디버깅 출력
        console.log('JSON 데이터:', data);
        
        // 빈 문자열 날짜 필드는 null로 처리
        if (data.installation_date === '') {
          data.installation_date = null;
        }
        
        if (data.last_calibration_date === '') {
          data.last_calibration_date = null;
        }
        
        return apiClient.put(
          config.endpoints.equipment.detail(id), 
          data,
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    },
    // 엑셀 파일 업로드를 위한 메서드
    importExcel: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return apiClient.post(
        `${config.endpoints.equipment.base}import_excel/`, 
        formData,
        { 
          headers: {}, // Content-Type은 브라우저가 자동으로 설정
          transformRequest: [function(data) {
            return data;
          }]
        }
      );
    },
    // 엑셀 파일로 내보내기 메서드
    exportExcel: () => {
      return apiClient.get(
        `${config.endpoints.equipment.base}export_excel/`,
        { responseType: 'blob' }
      );
    },
    // JSON 데이터로 업데이트 (FormData 없이)
    updateWithJSON: (id, data) => {
      console.log('장비 업데이트 JSON 데이터:', data);
      
      // 설치 일시가 빈 문자열이면 null로 변환 (백엔드에서 더 잘 처리됨)
      if (data.installation_date === '') {
        data.installation_date = null;
      }
      
      return apiClient.put(
        config.endpoints.equipment.detail(id), 
        data, 
        { headers: { 'Content-Type': 'application/json' } }
      );
    },
    // FormData로 업데이트 (이미지 업로드 포함)
    updateWithFormData: (id, formData) => {
      console.log('장비 업데이트 FormData:');
      for (let pair of formData.entries()) {
        if (pair[0] === 'data') {
          console.log('data:', JSON.parse(pair[1]));
        } else {
          console.log(pair[0] + ':', pair[1]);
        }
      }
      
      return apiClient.put(
        config.endpoints.equipment.detail(id), 
        formData,
        { headers: {} } // Content-Type은 브라우저가 자동으로 설정
      );
    },
    delete: (id) => apiClient.delete(config.endpoints.equipment.detail(id)),
    
    // 장비 대여/반납/반출 관련 API
    borrow: (id, data) => apiClient.post(`${config.endpoints.equipment.detail(id)}borrow/`, data),
    return: (id) => apiClient.post(`${config.endpoints.equipment.detail(id)}return_equipment/`, {
      return_date: new Date().toISOString().split('T')[0],
      returned_to: 'system'
    }),
    checkout: (id, data) => apiClient.post(config.endpoints.checkouts.base, data),
    
    // 장비 관련 추가 API
    addCalibration: (id, data) => apiClient.post(config.endpoints.equipment.calibration(id), data),
    deleteCalibration: (id, calibrationId) => apiClient.delete(config.endpoints.equipment.calibrationHistory(id, calibrationId)),
    
    addMaintenance: (id, data) => apiClient.post(config.endpoints.equipment.maintenance(id), data),
    updateMaintenance: (id, maintenanceId, data) => apiClient.put(config.endpoints.equipment.maintenanceHistory(id, maintenanceId), data),
    deleteMaintenance: (id, maintenanceId) => apiClient.delete(config.endpoints.equipment.maintenanceHistory(id, maintenanceId)),
    
    addRepair: (id, data) => apiClient.post(config.endpoints.equipment.repair(id), data),
    updateRepair: (id, repairId, data) => apiClient.put(config.endpoints.equipment.repairHistory(id, repairId), data),
    deleteRepair: (id, repairId) => apiClient.delete(config.endpoints.equipment.repairHistory(id, repairId)),
    
    addLocation: (id, data) => apiClient.post(config.endpoints.equipment.location(id), data),
    updateLocation: (id, locationId, data) => apiClient.patch(config.endpoints.equipment.locationHistory(id, locationId), data),
    deleteLocation: (id, locationId) => apiClient.delete(config.endpoints.equipment.locationHistory(id, locationId)),
  },
  
  // 대여/반납 관련 API
  checkouts: {
    create: (data) => apiClient.post(config.endpoints.checkouts.base, data),
    getAll: (params) => apiClient.get(config.endpoints.checkouts.base, { params }),
    getById: (id) => apiClient.get(config.endpoints.checkouts.detail(id)),
    update: (id, data) => apiClient.patch(config.endpoints.checkouts.detail(id), data),
    // 반입 처리 엔드포인트 - 백엔드 API에 맞게 수정
    // 백엔드 EquipmentCheckoutViewSet의 return_equipment 액션에 맞춤
    returnEquipment: (id, data) => apiClient.post(`${config.endpoints.checkouts.detail(id)}return_equipment/`, data),
    delete: (id) => apiClient.delete(config.endpoints.checkouts.detail(id)),
  },
  
  // 대시보드 관련 API
  dashboard: {
    getSummary: () => apiClient.get(config.endpoints.dashboard.summary),
    sendCalibrationReminder: () => apiClient.post(config.endpoints.dashboard.calibrationReminder),
    getStats: () => apiClient.get(config.endpoints.dashboard.stats),
    getRecentActivities: () => apiClient.get(`${config.endpoints.dashboard.summary}activities/`),
    getUpcomingCalibrations: () => apiClient.get(`${config.endpoints.dashboard.summary}calibrations/`),
    getOverdueReturns: () => apiClient.get(`${config.endpoints.dashboard.summary}overdue/`)
  },
  
  // 공통 에러 메시지 변환 함수
  getErrorMessage: (error) => {
    if (!error) return '알 수 없는 오류가 발생했습니다.';
    
    // 이미 처리된 에러 객체인 경우
    if (error.message) return error.message;
    
    // API 응답 에러인 경우
    if (error.response) {
      const { status, data } = error.response;
      
      // 상태 코드별 메시지
      switch (status) {
        case 400: return data.detail || '잘못된 요청입니다.';
        case 401: return '인증에 실패했습니다. 다시 로그인해주세요.';
        case 403: return '접근 권한이 없습니다.';
        case 404: return '요청한 리소스를 찾을 수 없습니다.';
        case 500: return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        default: return data.detail || `오류가 발생했습니다. (${status})`;
      }
    }
    
    return error.message || '알 수 없는 오류가 발생했습니다.';
  }
};

export default apiService; 