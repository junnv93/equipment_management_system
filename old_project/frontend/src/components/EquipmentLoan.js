// components/EquipmentLoan.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Typography, Button, TextField, Paper, Grid, CircularProgress, Snackbar, FormControl, InputLabel } from '@mui/material';
import Alert from '@mui/material/Alert';
import { formatDate } from '../utils/dateFormatter';

function EquipmentLoan() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [borrower, setBorrower] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const API_URL = `http://localhost:8000/api/equipment/${id}/`;

  const fetchEquipment = useCallback(async () => {
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEquipment(response.data);
    } catch (err) {
      setError('장비 정보를 가져오는데 실패했습니다.');
      console.error('Equipment fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);
  
  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);
  
  const handleBorrow = async () => {
    try {
      if (!['available', 'calibration_soon'].includes(equipment.status)) {
        throw new Error('이 장비는 현재 대여 가능한 상태가 아닙니다.');
      }
      await axios.post(`${API_URL}borrow/`, 
        { borrower, expected_return_date: returnDate },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchEquipment();
      setSnackbar({ open: true, message: '장비가 성공적으로 대여되었습니다.', severity: 'success' });
    } catch (err) {
      setError('장비 대여에 실패했습니다.');
      setSnackbar({ open: true, message: `장비 대여 실패: ${err.response?.data?.message || err.message}`, severity: 'error' });
    }
  };

  const handleCheckout = async () => {
    try {
      if (!['available', 'calibration_soon'].includes(equipment.status)) {
        throw new Error('이 장비는 현재 반출 가능한 상태가 아닙니다.');
      }
      await axios.post(`${API_URL}checkout/`, 
        { borrower, expected_return_date: returnDate },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchEquipment();
      setSnackbar({ open: true, message: '장비가 성공적으로 반출되었습니다.', severity: 'success' });
    } catch (err) {
      setError('장비 반출에 실패했습니다.');
      setSnackbar({ open: true, message: `장비 반출 실패: ${err.response?.data?.message || err.message}`, severity: 'error' });
    }
  };

  const handleReturn = async () => {
    try {
      const endpoint = equipment.status === 'borrowed' ? 'return/' : 'checkin/';
      await axios.post(`${API_URL}${endpoint}`, 
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchEquipment();
      setSnackbar({ open: true, message: '장비가 성공적으로 반납되었습니다.', severity: 'success' });
    } catch (err) {
      setError('장비 반납에 실패했습니다.');
      setSnackbar({ open: true, message: `장비 반납 실패: ${err.response?.data?.message || err.message}`, severity: 'error' });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!equipment) return null;

  return (
    <Paper style={{ padding: 16 }}>
      <Typography variant="h5" gutterBottom>장비 반출입 관리</Typography>
      <Typography><strong>장비명:</strong> {equipment.name}</Typography>
      <Typography><strong>관리번호:</strong> {equipment.management_number}</Typography>
      <Typography><strong>현재 상태:</strong> {
        equipment.status === 'available' ? '사용 가능' :
        equipment.status === 'borrowed' ? '대여 중' : 
        equipment.status === 'checked_out' ? '반출 중' :
        equipment.status === 'calibration_soon' ? '교정 예정' :
        equipment.status === 'calibration_overdue' ? '교정 기한 초과' :
        equipment.status === 'spare' ? '여분' : '오류: 잘못된 상태'
      }</Typography>
      
      {(['available', 'calibration_soon'].includes(equipment.status)) && (
        <Grid container spacing={2} style={{ marginTop: 16 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel htmlFor="borrower">대여자/반출자</InputLabel>
              <TextField
                id="borrower"
                value={borrower}
                onChange={(e) => setBorrower(e.target.value)}
                fullWidth
              />
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel htmlFor="returnDate">예상 반납일</InputLabel>
              <TextField
                id="returnDate"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" color="primary" onClick={handleBorrow} fullWidth>
              대여
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" color="secondary" onClick={handleCheckout} fullWidth>
              반출
            </Button>
          </Grid>
        </Grid>
      )}
      {(equipment.status === 'borrowed' || equipment.status === 'checked_out') && (
        <Button variant="contained" color="primary" onClick={handleReturn} style={{ marginTop: 16 }}>
          반납
        </Button>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default EquipmentLoan;