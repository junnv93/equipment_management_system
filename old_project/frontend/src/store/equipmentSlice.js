// src/store/equipmentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { EQUIPMENT_API, getToken, handleApiError } from '../utils/api';

export const fetchEquipments = createAsyncThunk(
  'equipment/fetchEquipments',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching all equipment');
      console.log('Token:', getToken());

      const token = getToken();
      // 여기서 명시적으로 Bearer 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      const apiUrl = EQUIPMENT_API;
      console.log('API URL:', apiUrl);
      
      const response = await axios.get(
        apiUrl, 
        {
          headers: { 'Authorization': authHeader }
        }
      );
      
      console.log('Fetch response length:', response.data.length);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching all equipment:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchEquipment = createAsyncThunk(
  'equipment/fetchEquipment',
  async (params, { rejectWithValue }) => {
    try {
      console.log('Fetching equipment with params:', params);
      console.log('Token:', getToken());

      const token = getToken();
      // 여기서 명시적으로 Bearer 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      const apiUrl = EQUIPMENT_API;
      console.log('API URL:', apiUrl);
      
      const response = await axios.get(
        apiUrl, 
        {
          headers: { 'Authorization': authHeader },
          params // 페이지네이션 파라미터 추가
        }
      );
      
      console.log('Fetch response length:', response.data.results?.length);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateEquipment = createAsyncThunk(
  'equipment/updateEquipment',
  async (equipmentData, { rejectWithValue }) => {
    try {
      console.log('Updating equipment with data:', equipmentData);
      console.log('Equipment ID:', equipmentData.id);
      console.log('Token:', getToken());

      const token = getToken();
      // 여기서 명시적으로 Bearer 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      const apiUrl = `${EQUIPMENT_API}${equipmentData.id}/`;
      console.log('API URL:', apiUrl);
      
      const response = await axios.put(
        apiUrl,
        equipmentData,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader 
          }
        }
      );
      
      console.log('Update response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error updating equipment:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteEquipment = createAsyncThunk(
  'equipment/deleteEquipment',
  async (id, { rejectWithValue }) => {
    try {
      console.log('Deleting equipment');
      console.log('Equipment ID:', id);
      console.log('Token:', getToken());

      const token = getToken();
      // 여기서 명시적으로 Bearer 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      const apiUrl = `${EQUIPMENT_API}${id}/`;
      console.log('API URL:', apiUrl);
      
      await axios.delete(
        apiUrl,
        {
          headers: { 'Authorization': authHeader }
        }
      );
      
      console.log('Delete successful');
      
      return id;
    } catch (error) {
      console.error('Error deleting equipment:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateCalibrationHistory = createAsyncThunk(
  'equipment/updateCalibrationHistory',
  async ({ equipmentId, calibrationId, data }, { dispatch, rejectWithValue }) => {
    try {
      console.group('Calibration History Update Debug Info');
      console.log('Request Details:');
      console.log('- Equipment ID:', equipmentId);
      console.log('- Calibration ID:', calibrationId);
      console.log('- Update Data:', JSON.stringify(data, null, 2));
      
      const token = getToken();
      // 명시적으로 Token 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      // 삭제 URL 정의
      const deleteUrl = `${EQUIPMENT_API}${equipmentId}/calibration_history/${calibrationId}/`;
      console.log('Delete URL:', deleteUrl);
      
      try {
        // 기존 교정 이력 삭제 시도
        await axios.delete(
          deleteUrl,
          {
            headers: { 'Authorization': authHeader }
          }
        );
        console.log('Successfully deleted old calibration history');
      } catch (error) {
        console.log('Calibration history not found or could not be deleted:', error.message);
        // 오류가 발생해도 계속 진행
      }
      
      // 새 교정 이력 추가 URL
      const addUrl = `${EQUIPMENT_API}${equipmentId}/add_calibration/`;
      console.log('Add URL:', addUrl);
      
      // 새 교정 이력 추가
      const response = await axios.post(
        addUrl,
        data,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader 
          }
        }
      );
      
      console.log('Response received:');
      console.log('- Status:', response.status);
      console.log('- Data:', JSON.stringify(response.data, null, 2));
      console.groupEnd();
      
      // 장비 정보 다시 가져오기
      dispatch(fetchEquipmentById(equipmentId));
      return response.data;
    } catch (error) {
      console.group('Calibration History Update Error');
      console.error('Error Details:');
      console.error('- Message:', error.message);
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('- Request Config:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }, null, 2));
      console.groupEnd();
      
      return rejectWithValue(error.response?.data || 'Failed to update calibration history');
    }
  }
);

export const addCalibrationHistory = createAsyncThunk(
  'equipment/addCalibrationHistory',
  async ({ equipmentId, calibrationData }, { dispatch, rejectWithValue }) => {
    try {
      console.log('Adding calibration history with data:', calibrationData);
      console.log('Equipment ID:', equipmentId);
      console.log('Token:', getToken());

      const token = getToken();
      // 여기서 명시적으로 Token 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      const apiUrl = `${EQUIPMENT_API}${equipmentId}/add_calibration/`;
      console.log('API URL:', apiUrl);
      
      const response = await axios.post(
        apiUrl,
        calibrationData,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader 
          }
        }
      );
      
      console.log('Add response:', response.data);
      
      // 교정 이력 추가 후 장비 상세 정보 다시 가져오기
      dispatch(fetchEquipmentById(equipmentId));
      
      return response.data;
    } catch (error) {
      console.error('Error adding calibration history:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchEquipmentById = createAsyncThunk(
  'equipment/fetchEquipmentById',
  async (id, { rejectWithValue }) => {
    try {
      console.log('Fetching equipment by ID:', id);
      console.log('Token:', getToken());

      // 'add'라는 문자열이 id로 전달된 경우 처리
      if (id === 'add') {
        console.log('장비 추가 모드입니다. 빈 객체를 반환합니다.');
        return {}; // 장비 추가 모드일 경우 빈 객체 반환
      }

      const token = getToken();
      // 여기서 명시적으로 Token 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      const apiUrl = `${EQUIPMENT_API}${id}/`;
      console.log('API URL:', apiUrl);
      
      const response = await axios.get(
        apiUrl, 
        {
          headers: { 'Authorization': authHeader }
        }
      );
      
      console.log('Fetch response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching equipment by ID:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteCalibrationHistory = createAsyncThunk(
  'equipment/deleteCalibrationHistory',
  async ({ equipmentId, calibrationId }, { dispatch, rejectWithValue }) => {
    try {
      console.log('Deleting calibration history');
      console.log('Calibration ID:', calibrationId);
      console.log('Equipment ID:', equipmentId);
      console.log('Token:', getToken());

      const token = getToken();
      // 여기서 명시적으로 Token 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      const apiUrl = `${EQUIPMENT_API}${equipmentId}/calibration_history/${calibrationId}/`;
      console.log('API URL:', apiUrl);
      
      await axios.delete(
        apiUrl,
        {
          headers: { 'Authorization': authHeader }
        }
      );
      
      console.log('Delete successful');
      
      // 교정 이력 삭제 후 장비 상세 정보 다시 가져오기
      dispatch(fetchEquipmentById(equipmentId));
      
      return calibrationId;
    } catch (error) {
      console.error('Error deleting calibration history:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateLocationHistory = createAsyncThunk(
  'equipment/updateLocationHistory',
  async ({ equipmentId, locationId, locationData }, { dispatch, rejectWithValue }) => {
    try {
      console.group('Location History Update Debug Info');
      console.log('Request Details:');
      console.log('- Equipment ID:', equipmentId);
      console.log('- Location ID:', locationId);
      console.log('- Update Data:', JSON.stringify(locationData, null, 2));
      
      const token = getToken();
      // 여기서 명시적으로 Token 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      // 데이터 업데이트를 위해 두 단계 접근 방식 사용:
      // 1. 먼저 기존 위치 이력 삭제
      const deleteUrl = `${EQUIPMENT_API}${equipmentId}/location_history/${locationId}/`;
      console.log('Delete URL:', deleteUrl);
      
      await axios.delete(
        deleteUrl,
        {
          headers: { 'Authorization': authHeader }
        }
      );
      console.log('Successfully deleted old location history');
      
      // 2. 새 위치 이력 추가
      const addUrl = `${EQUIPMENT_API}${equipmentId}/add_location_history/`;
      console.log('Add URL:', addUrl);
      
      const response = await axios.post(
        addUrl, 
        locationData, 
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader 
          }
        }
      );
      
      console.log('Response received:');
      console.log('- Status:', response.status);
      console.log('- Data:', JSON.stringify(response.data, null, 2));
      console.groupEnd();
      
      // 장비 정보 다시 가져오기
      dispatch(fetchEquipmentById(equipmentId));
      return response.data;
    } catch (error) {
      console.group('Location History Update Error');
      console.error('Error Details:');
      console.error('- Message:', error.message);
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('- Request Config:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }, null, 2));
      console.groupEnd();
      
      return rejectWithValue(error.response?.data || 'Failed to update location history');
    }
  }
);

export const deleteLocationHistory = createAsyncThunk(
  'equipment/deleteLocationHistory',
  async ({ equipmentId, locationId }, { rejectWithValue }) => {
    try {
      console.log('Deleting location history');
      console.log('Location ID:', locationId);
      console.log('Equipment ID:', equipmentId);
      console.log('Token:', getToken());

      const token = getToken();
      // 여기서 명시적으로 Token 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      const apiUrl = `${EQUIPMENT_API}${equipmentId}/location_history/${locationId}/`;
      console.log('API URL:', apiUrl);
      
      const response = await axios.delete(
        apiUrl,
        {
          headers: { 'Authorization': authHeader }
        }
      );
      
      console.log('Delete response:', response.data);
      
      return { equipmentId, locationId, updatedEquipment: response.data };
    } catch (error) {
      console.error('Error deleting location history:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      return rejectWithValue(error.response?.data || 'Failed to delete location history');
    }
  }
);

export const updateMaintenanceHistory = createAsyncThunk(
  'equipment/updateMaintenanceHistory',
  async ({ equipmentId, maintenanceId, data }, { dispatch, rejectWithValue }) => {
    try {
      console.group('Maintenance History Update Debug Info');
      console.log('Request Details:');
      console.log('- Equipment ID:', equipmentId);
      console.log('- Maintenance ID:', maintenanceId);
      console.log('- Update Data:', JSON.stringify(data, null, 2));
      
      const token = getToken();
      // 여기서 명시적으로 Token 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      // 데이터 업데이트를 위해 두 단계 접근 방식 사용:
      // 1. 먼저 기존 유지보수 이력 삭제
      const deleteUrl = `${EQUIPMENT_API}${equipmentId}/maintenance/${maintenanceId}/`;
      console.log('Delete URL:', deleteUrl);
      
      await axios.delete(
        deleteUrl,
        {
          headers: { 'Authorization': authHeader }
        }
      );
      console.log('Successfully deleted old maintenance history');
      
      // 2. 새 유지보수 이력 추가
      const addUrl = `${EQUIPMENT_API}${equipmentId}/add_maintenance/`;
      console.log('Add URL:', addUrl);
      
      const response = await axios.post(
        addUrl,
        data,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader 
          }
        }
      );
      
      console.log('Response received:');
      console.log('- Status:', response.status);
      console.log('- Data:', JSON.stringify(response.data, null, 2));
      console.groupEnd();
      
      dispatch(fetchEquipmentById(equipmentId));
      return response.data;
    } catch (error) {
      console.group('Maintenance History Update Error');
      console.error('Error Details:');
      console.error('- Message:', error.message);
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('- Request Config:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }, null, 2));
      console.groupEnd();
      
      return rejectWithValue(error.response?.data || 'Failed to update maintenance history');
    }
  }
);

export const updateRepairHistory = createAsyncThunk(
  'equipment/updateRepairHistory',
  async ({ equipmentId, repairId, data }, { dispatch, rejectWithValue }) => {
    try {
      console.group('Repair History Update Debug Info');
      console.log('Request Details:');
      console.log('- Equipment ID:', equipmentId);
      console.log('- Repair ID:', repairId);
      console.log('- Update Data:', JSON.stringify(data, null, 2));
      
      const token = getToken();
      // 여기서 명시적으로 Token 형식 사용
      const authHeader = `Bearer ${token}`;
      console.log('Auth Header:', authHeader);
      
      // 데이터 업데이트를 위해 두 단계 접근 방식 사용:
      // 1. 먼저 기존 수리 이력 삭제
      const deleteUrl = `${EQUIPMENT_API}${equipmentId}/repair_history/${repairId}/`;
      console.log('Delete URL:', deleteUrl);
      
      await axios.delete(
        deleteUrl,
        {
          headers: { 'Authorization': authHeader }
        }
      );
      console.log('Successfully deleted old repair history');
      
      // 2. 새 수리 이력 추가
      const addUrl = `${EQUIPMENT_API}${equipmentId}/add_repair/`;
      console.log('Add URL:', addUrl);
      
      const response = await axios.post(
        addUrl,
        data,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': authHeader 
          }
        }
      );
      
      console.log('Response received:');
      console.log('- Status:', response.status);
      console.log('- Data:', JSON.stringify(response.data, null, 2));
      console.groupEnd();
      
      dispatch(fetchEquipmentById(equipmentId));
      return response.data;
    } catch (error) {
      console.group('Repair History Update Error');
      console.error('Error Details:');
      console.error('- Message:', error.message);
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('- Request Config:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }, null, 2));
      console.groupEnd();
      
      return rejectWithValue(error.response?.data || 'Failed to update repair history');
    }
  }
);

const equipmentSlice = createSlice({
  name: 'equipment',
  initialState: {
    items: [],
    currentItem: null,
    status: 'idle',
    error: null,
    totalCount: 0
  },
  reducers: {
    updateEquipmentStatus(state, action) {
      const { id, status } = action.payload;
      
      // 현재 항목 업데이트
      if (state.currentItem && state.currentItem.id === parseInt(id)) {
        state.currentItem.status = status;
      }
      
      // 목록 항목 업데이트
      const equipment = state.items.find(item => item.id === parseInt(id));
      if (equipment) {
        equipment.status = status;
      }
    },
    setCurrentEquipment(state, action) {
      state.status = 'succeeded';
      state.currentItem = action.payload;
      state.error = null;
    },
    updateEquipmentCheckoutInfo(state, action) {
      const { id, checkoutInfo } = action.payload;
      
      // 현재 항목 업데이트
      if (state.currentItem && state.currentItem.id === parseInt(id)) {
        state.currentItem.checkout_info = checkoutInfo;
      }
      
      // 목록 항목 업데이트
      const equipment = state.items.find(item => item.id === parseInt(id));
      if (equipment) {
        equipment.checkout_info = checkoutInfo;
      }
    },
    updateEquipmentBorrowInfo(state, action) {
      const { id, borrowInfo } = action.payload;
      
      // 현재 항목 업데이트
      if (state.currentItem && state.currentItem.id === parseInt(id)) {
        state.currentItem = {
          ...state.currentItem,
          borrower: borrowInfo.borrower,
          borrower_name: borrowInfo.borrower_name,
          borrower_department: borrowInfo.borrower_department,
          borrowed_date: borrowInfo.borrowed_date,
          expected_return_date: borrowInfo.expected_return_date
        };
      }
      
      // 목록 항목 업데이트
      const equipment = state.items.find(item => item.id === parseInt(id));
      if (equipment) {
        equipment.borrower = borrowInfo.borrower;
        equipment.borrower_name = borrowInfo.borrower_name;
        equipment.borrower_department = borrowInfo.borrower_department;
        equipment.borrowed_date = borrowInfo.borrowed_date;
        equipment.expected_return_date = borrowInfo.expected_return_date;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEquipments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEquipments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        console.log('Server response:', action.payload);
        if (action.payload && action.payload.results) {
          state.items = action.payload.results;
        } else if (Array.isArray(action.payload)) {
          state.items = action.payload;
        } else {
          console.error('API 응답이 예상과 다릅니다:', action.payload);
          state.items = [];
        }
        state.totalCount = action.payload.count || 0;
      })
      .addCase(fetchEquipments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = typeof action.payload === 'object' ? 
          (action.payload.detail || JSON.stringify(action.payload)) : 
          action.payload || 'Unknown error';
      })
      .addCase(fetchEquipment.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEquipment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        console.log('Server response:', action.payload);
        if (action.payload && action.payload.results) {
          state.items = action.payload.results;
        } else if (Array.isArray(action.payload)) {
          state.items = action.payload;
        } else {
          console.error('API 응답이 예상과 다릅니다:', action.payload);
          state.items = [];
        }
        state.totalCount = action.payload.count || 0;
      })
      .addCase(fetchEquipment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = typeof action.payload === 'object' ? 
          (action.payload.detail || JSON.stringify(action.payload)) : 
          action.payload || 'Unknown error';
      })
      .addCase(updateEquipment.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateEquipment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateEquipment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteEquipment.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteEquipment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteEquipment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(updateCalibrationHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.currentItem && state.currentItem.calibration_history) {
          const index = state.currentItem.calibration_history.findIndex(
            item => item.id === action.payload.id
          );
          if (index !== -1) {
            state.currentItem.calibration_history[index] = action.payload;
          }
        }
      })
      .addCase(fetchEquipmentById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEquipmentById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentItem = action.payload;
      })
      .addCase(fetchEquipmentById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteCalibrationHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.currentItem && state.currentItem.calibration_history) {
          state.currentItem.calibration_history = state.currentItem.calibration_history.filter(
            item => item.id !== action.payload
          );
        }
      })
      .addCase(updateLocationHistory.fulfilled, (state, action) => {
        if (state.currentItem && state.currentItem.id === action.payload.id) {
          state.currentItem = action.payload;
        }
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteLocationHistory.fulfilled, (state, action) => {
        if (state.currentItem && state.currentItem.id === action.payload.equipmentId) {
          state.currentItem = action.payload.updatedEquipment;
        }
        const index = state.items.findIndex(item => item.id === action.payload.equipmentId);
        if (index !== -1) {
          state.items[index] = action.payload.updatedEquipment;
        }
      })
      .addCase(updateMaintenanceHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.currentItem && state.currentItem.maintenance_history) {
          const index = state.currentItem.maintenance_history.findIndex(
            item => item.id === action.payload.id
          );
          if (index !== -1) {
            state.currentItem.maintenance_history[index] = action.payload;
          }
        }
      })
      .addCase(updateRepairHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.currentItem && state.currentItem.repair_history) {
          const index = state.currentItem.repair_history.findIndex(
            item => item.id === action.payload.id
          );
          if (index !== -1) {
            state.currentItem.repair_history[index] = action.payload;
          }
        }
      });
  },
});

export const { 
  updateEquipmentStatus, 
  updateEquipmentCheckoutInfo, 
  updateEquipmentBorrowInfo,
  setCurrentEquipment
} = equipmentSlice.actions;

export default equipmentSlice.reducer;