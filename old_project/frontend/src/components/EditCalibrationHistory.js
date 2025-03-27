import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateCalibrationHistory } from '../store/equipmentSlice';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

function EditCalibrationHistory({ open, onClose, calibrationHistory, equipmentId }) {
  const [result, setResult] = useState(calibrationHistory?.result || '적합');
  const dispatch = useDispatch();
  
  // 교정 결과 옵션
  const resultOptions = ['적합', '부적합', '수리필요', '교정불가', '기타'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateCalibrationHistory({
        equipmentId,
        calibrationId: calibrationHistory.id,
        data: {
          result,
          calibration_date: calibrationHistory.calibration_date,
          next_calibration_date: calibrationHistory.next_calibration_date,
          institution: calibrationHistory.institution
        }
      })).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to update calibration history:', error);
      alert('교정 이력 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>교정 이력 수정</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, minWidth: 300 }}>
          <TextField
            margin="normal"
            fullWidth
            label="교정일"
            value={calibrationHistory?.calibration_date || ''}
            disabled
          />
          <TextField
            margin="normal"
            fullWidth
            label="차기교정일"
            value={calibrationHistory?.next_calibration_date || ''}
            disabled
          />
          <TextField
            margin="normal"
            fullWidth
            label="교정기관"
            value={calibrationHistory?.institution || ''}
            disabled
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>결과</InputLabel>
            <Select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              label="결과"
            >
              {resultOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          수정
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditCalibrationHistory; 