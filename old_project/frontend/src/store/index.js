//src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import equipmentReducer from './equipmentSlice';
import checkoutReducer from './checkoutSlice';

export const store = configureStore({
  reducer: {
    equipment: equipmentReducer,
    checkout: checkoutReducer,
  },
});