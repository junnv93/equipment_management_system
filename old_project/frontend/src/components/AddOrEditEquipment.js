//components/AddOrEditEquipment.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateEquipment } from '../store/equipmentSlice';
import axios from 'axios';
import { 
  TextField, Button, Container, Typography, MenuItem, Checkbox, 
  FormControlLabel, Grid, Divider, Paper, Box
} from '@mui/material';
import { addMonths } from 'date-fns';

const AddOrEditEquipment = ({ isEdit }) => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const [equipment, setEquipment] = useState({
    name: '',
    management_number: '',
    asset_number: '',
    model_name: '',
    manufacturer: '',
    location: '',
    management_method: '',
    calibration_cycle: '',
    last_calibration_date: '',
    next_calibration_date: '',
    calibration_institution: '',
    serial_number: '',
    specifications: '',
    notes: '',
    status: 'available',
    purchase_year: '',
    intermediate_check: false
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit) {
      const fetchEquipment = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/equipment/${id}/`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setEquipment(response.data);
        } catch (err) {
          console.error('Failed to fetch equipment data', err);
        }
      };
      fetchEquipment();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setEquipment(prevState => {
      const newState = { 
        ...prevState, 
        [name]: name === 'intermediate_check' ? checked : value 
      };
      
      if (name === 'management_method') {
        if (value === 'self_check' || value === 'not_applicable') {
          newState.last_calibration_date = '';
          newState.next_calibration_date = '';
        }
      }
      else if (name === 'last_calibration_date' || name === 'calibration_cycle') {
        if (!newState.last_calibration_date) {
          newState.next_calibration_date = '';
        }
        else if (newState.last_calibration_date && newState.calibration_cycle && 
                 newState.management_method === 'external_calibration') {
          const nextCalibrationDate = addMonths(
            new Date(newState.last_calibration_date), 
            parseInt(newState.calibration_cycle)
          );
          newState.next_calibration_date = nextCalibrationDate.toISOString().split('T')[0];
          
          const today = new Date();
          const daysUntilCalibration = Math.floor((nextCalibrationDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilCalibration <= 0) {
            newState.status = 'calibration_overdue';
          } else if (daysUntilCalibration <= 90) {
            newState.status = 'calibration_soon';
          } else if (newState.status === 'calibration_soon' || newState.status === 'calibration_overdue') {
            newState.status = 'available';
          }
        }
      }
      
      return newState;
    });
  };

  const validate = () => {
    let tempErrors = {};
    if (!equipment.management_number) tempErrors.management_number = "관리번호가 필요합니다.";
    if (!equipment.name) tempErrors.name = "장비명이 필요합니다.";
    if (!equipment.calibration_cycle) tempErrors.calibration_cycle = "교정 주기가 필요합니다.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const equipmentData = {
      ...equipment,
      calibration_institution: equipment.calibration_institution || '',
      serial_number: equipment.serial_number || '',
      specifications: equipment.specifications || '',
      asset_number: equipment.asset_number || '',
      purchase_year: equipment.purchase_year || null,
    };

    try {
      if (isEdit) {
        await dispatch(updateEquipment(equipmentData)).unwrap();
      } else {
        await axios.post('http://localhost:8000/api/equipment/', equipmentData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      navigate('/equipment');
    } catch (err) {
      console.error('Failed to save equipment', err);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          {isEdit ? '장비 수정' : '장비 추가'}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* 기본 정보 섹션 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>기본 정보</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="management_number"
                label="관리번호"
                fullWidth
                margin="normal"
                value={equipment.management_number || ''}
                onChange={handleChange}
                error={!!errors.management_number}
                helperText={errors.management_number}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="asset_number"
                label="자산번호"
                fullWidth
                margin="normal"
                value={equipment.asset_number || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="name"
                label="장비명"
                fullWidth
                margin="normal"
                value={equipment.name || ''}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="model_name"
                label="모델명"
                fullWidth
                margin="normal"
                value={equipment.model_name || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="manufacturer"
                label="제조사"
                fullWidth
                margin="normal"
                value={equipment.manufacturer || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="serial_number"
                label="일련번호"
                fullWidth
                margin="normal"
                value={equipment.serial_number || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="purchase_year"
                label="구입년도"
                type="number"
                fullWidth
                margin="normal"
                value={equipment.purchase_year || ''}
                onChange={handleChange}
                error={!!errors.purchase_year}
                helperText={errors.purchase_year}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="location"
                label="위치"
                fullWidth
                margin="normal"
                value={equipment.location || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={equipment.intermediate_check || false}
                    onChange={handleChange}
                    name="intermediate_check"
                  />
                }
                label="중간점검 대상"
                sx={{ mt: 2 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="specifications"
                label="장비 사양"
                fullWidth
                margin="normal"
                value={equipment.specifications || ''}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            
            {/* 교정 정보 섹션 */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Divider />
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>교정 정보</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                margin="normal"
                label="관리방법"
                name="management_method"
                value={equipment.management_method || 'external_calibration'}
                onChange={handleChange}
              >
                <MenuItem value="external_calibration">외부교정</MenuItem>
                <MenuItem value="self_check">자체점검</MenuItem>
                <MenuItem value="not_applicable">비대상</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="calibration_cycle"
                label="교정 주기 (개월)"
                type="number"
                fullWidth
                margin="normal"
                value={equipment.calibration_cycle || ''}
                onChange={handleChange}
                error={!!errors.calibration_cycle}
                helperText={errors.calibration_cycle}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="calibration_institution"
                label="교정 기관"
                fullWidth
                margin="normal"
                value={equipment.calibration_institution || ''}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="normal"
                label="최종교정일"
                type="date"
                name="last_calibration_date"
                value={equipment.last_calibration_date || ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                disabled={equipment.management_method === 'self_check' || equipment.management_method === 'not_applicable'}
                helperText={equipment.management_method === 'self_check' || equipment.management_method === 'not_applicable' ? 
                  '자체점검 또는 비대상 장비는 교정일이 적용되지 않습니다.' : ''}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                margin="normal"
                label="차기교정일"
                type="date"
                name="next_calibration_date"
                value={equipment.next_calibration_date || ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                disabled={true}
                helperText="최종교정일과 교정주기에 따라 자동 계산됩니다."
              />
            </Grid>
            
            {/* 상태 정보 섹션 */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Divider />
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>상태 정보</Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="status"
                select
                label="상태"
                fullWidth
                margin="normal"
                value={equipment.status || 'available'}
                onChange={handleChange}
              >
                {[
                  { value: 'available', label: '사용 가능' },
                  { value: 'borrowed', label: '대여 중' },
                  { value: 'checked_out', label: '반출 중' },
                  { value: 'calibration_soon', label: '교정 예정' },
                  { value: 'calibration_overdue', label: '교정 기한 초과' }
                ].map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="비고"
                fullWidth
                margin="normal"
                value={equipment.notes || ''}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                size="large"
                sx={{ minWidth: 150 }}
              >
                {isEdit ? '수정' : '추가'}
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                size="large"
                sx={{ ml: 2, minWidth: 150 }}
                onClick={() => navigate('/equipment')}
              >
                취소
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddOrEditEquipment;