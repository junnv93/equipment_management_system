import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addCalibrationHistory } from '../store/equipmentSlice';
import { 
  TextField, 
  Button, 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, addMonths } from 'date-fns';

function AddCalibrationHistory({ open, onClose, equipmentId, equipment }) {
  const [calibrationDate, setCalibrationDate] = useState(null);
  const [institution, setInstitution] = useState('');
  const [result, setResult] = useState('적합');
  const [calculatedNextDate, setCalculatedNextDate] = useState(null);
  const dispatch = useDispatch();

  // 교정 결과 옵션
  const resultOptions = ['적합', '부적합', '수리필요', '교정불가', '기타'];

  // 교정일이 변경될 때마다 차기교정일 자동 계산 (표시용)
  useEffect(() => {
    if (calibrationDate && equipment?.calibration_cycle) {
      const nextDate = addMonths(new Date(calibrationDate), parseInt(equipment.calibration_cycle));
      setCalculatedNextDate(nextDate);
    } else {
      setCalculatedNextDate(null);
    }
  }, [calibrationDate, equipment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!calibrationDate) {
      alert('교정일을 선택해주세요.');
      return;
    }
    
    if (!institution) {
      alert('교정기관을 입력해주세요.');
      return;
    }

    try {
      // 날짜를 'YYYY-MM-DD' 형식의 문자열로 변환
      const formatDate = (date) => {
        if (!date) return null;
        return format(date, 'yyyy-MM-dd');
      };

      const calibrationData = {
        calibration_date: formatDate(calibrationDate),
        // 차기교정일은 백엔드에서 자동 계산되므로 전송하지 않음
        institution: institution,
        result: result,
        // 과거 교정 이력 추가임을 표시하는 플래그 추가
        is_historical: true
      };

      await dispatch(addCalibrationHistory({
        equipmentId,
        calibrationData
      })).unwrap();
      
      // 성공 후 폼 초기화 및 닫기
      setCalibrationDate(null);
      setInstitution('');
      setResult('적합');
      onClose();
      
      // 교정 이력이 추가되었음을 알림
      alert('교정 이력이 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('Failed to add calibration history:', error);
      alert('교정 이력 추가에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>교정 이력 추가</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, minWidth: 300 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="교정일"
              value={calibrationDate}
              onChange={(newValue) => setCalibrationDate(newValue)}
              renderInput={(params) => (
                <TextField {...params} fullWidth margin="normal" required />
              )}
            />
          </LocalizationProvider>
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="교정기관"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
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
          
          {/* 차기교정일 정보 표시 (입력 필드 아님) */}
          {calculatedNextDate && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>차기교정일 (자동계산):</strong> {format(calculatedNextDate, 'yyyy-MM-dd')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                교정주기 {equipment?.calibration_cycle}개월 기준으로 자동 계산됩니다.
              </Typography>
            </Box>
          )}
          
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
            * 이 기능은 과거의 교정 이력을 추가하기 위한 것으로, 현재 장비의 최종 교정일에는 영향을 주지 않습니다.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          추가
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddCalibrationHistory; 