// src/store/checkoutSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { CHECKOUT_API, EQUIPMENT_API, getAuthHeader, handleApiError } from '../utils/api';
import { updateEquipmentStatus, fetchEquipmentById } from './equipmentSlice';

export const fetchCheckouts = createAsyncThunk(
  'checkout/fetchCheckouts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await axios.get(CHECKOUT_API, {
        headers: { Authorization: getAuthHeader() },
        params // 페이지네이션 파라미터 추가
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const createCheckout = createAsyncThunk(
  'checkout/createCheckout',
  async (checkoutData, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(CHECKOUT_API, checkoutData, {
        headers: { Authorization: getAuthHeader() }
      });
      dispatch(updateEquipmentStatus({ id: response.data.equipment, status: 'checked_out' }));
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteCheckout = createAsyncThunk(
  'checkout/deleteCheckout',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${CHECKOUT_API}${id}/`, {
        headers: { Authorization: getAuthHeader() }
      });
      return id;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const returnEquipment = createAsyncThunk(
  'checkout/returnEquipment',
  async ({ id, returnData }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${CHECKOUT_API}${id}/return_equipment/`, returnData, {
        headers: { Authorization: getAuthHeader() }
      });
      dispatch(updateEquipmentStatus({ id: response.data.equipment, status: 'available' }));
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteCalibrationHistory = createAsyncThunk(
  'equipment/deleteCalibrationHistory',
  async ({ equipmentId, calibrationId }, { dispatch, rejectWithValue }) => {
    try {
      await axios.delete(
        `${EQUIPMENT_API}${equipmentId}/calibration_history/${calibrationId}/`,
        {
          headers: { Authorization: getAuthHeader() }
        }
      );
      
      // 교정 이력 삭제 후 장비 상세 정보 다시 가져오기
      dispatch(fetchEquipmentById(equipmentId));
      
      return calibrationId;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const returnCheckout = createAsyncThunk(
  'checkout/returnCheckout',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(`${EQUIPMENT_API}${id}/return_checkout/`, {}, {
        headers: { Authorization: getAuthHeader() }
      });
      
      // 장비 상세 정보 다시 가져오기
      dispatch(fetchEquipmentById(id));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCheckouts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCheckouts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.results;
      })
      .addCase(fetchCheckouts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(createCheckout.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createCheckout.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(createCheckout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(returnEquipment.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(returnEquipment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(returnEquipment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteCheckout.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteCheckout.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteCheckout.rejected, (state, action) => {
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
      .addCase(returnCheckout.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.currentItem && state.currentItem.calibration_history) {
          state.currentItem.calibration_history = state.currentItem.calibration_history.filter(
            item => item.id !== action.payload
          );
        }
      });
  },
});

export default checkoutSlice.reducer;