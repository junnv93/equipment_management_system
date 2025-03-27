import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Grid, Paper, MenuItem,
  FormControl, InputLabel, Select, Snackbar, CircularProgress, FormControlLabel, Checkbox, Card, 
  // eslint-disable-next-line no-unused-vars
  CardHeader, 
  // eslint-disable-next-line no-unused-vars
  CardContent
} from '@mui/material';
import { Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import apiService from '../services/api';

function EquipmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    management_number: '',
    asset_number: '',
    model_name: '',
    manufacturer: '',
    serial_number: '',
    purchase_year: '',
    location: '',
    specifications: '',
    management_method: 'not_applicable',
    calibration_cycle: 12,
    intermediate_check: false,
    calibration_institution: '',
    status: 'available',
    last_calibration_date: '',
    next_calibration_date: '',
    team: 'RF',
    supplier: '',
    supplier_contact: '',
    manufacturer_contact: '',
    specification_compliance: false,
    needs_calibration: false,
    software_version: '',
    firmware_version: '',
    manual_location: '',
    accessories: '',
    key_features: '',
    installation_date: '',
    primary_technical_manager: '',
    secondary_technical_manager: '',
    image: ''
  });

  const [imagePreview, setImagePreview] = useState('');

  // 장비 정보 가져오기 (수정 모드인 경우)
  useEffect(() => {
    if (isEditMode) {
      const fetchEquipment = async () => {
        try {
          setLoading(true);
          const response = await apiService.equipment.getById(id);
          // null 값을 빈 문자열로 변환
          const processedData = { ...response.data };
          Object.keys(processedData).forEach(key => {
            if (processedData[key] === null && typeof processedData[key] !== 'boolean') {
              processedData[key] = '';
            }
          });
          setFormData(processedData);
        } catch (error) {
          setSnackbar({
            open: true,
            message: '장비 정보를 불러오는데 실패했습니다.',
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchEquipment();
    }
  }, [id, isEditMode]);

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    // 파일 업로드 처리
    if (type === 'file' && files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      
      // 이미지 미리보기 설정
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
      return;
    }
    
    // 팀 필드의 경우 관리번호 접두사 자동 설정
    if (name === 'team') {
      const newTeam = value;
      let newManagementNumber = formData.management_number;
      
      // 각 팀별 관리번호 접두사 매핑
      const prefixMap = {
        'RF': 'SUW-E',
        'SAR': 'SUW-S',
        'EMC': 'SUW-R',
        'AUTO': 'SUW-A'
      };
      
      // 새 장비를 생성하는 경우나 관리번호가 비어있는 경우
      if (!isEditMode || !newManagementNumber) {
        newManagementNumber = `${prefixMap[newTeam]}0000`;
      } 
      // 기존 장비인 경우 접두사만 변경
      else {
        // 기존 관리번호가 SUW- 형식이면 해당 번호 유지하고 접두사만 변경
        if (newManagementNumber.startsWith('SUW-')) {
          // 번호 부분 추출 (SUW-X 이후의 부분)
          const numberPart = newManagementNumber.substring(5);
          newManagementNumber = `${prefixMap[newTeam]}${numberPart}`;
        } else {
          // 형식이 맞지 않으면 기본 형식으로 설정
          newManagementNumber = `${prefixMap[newTeam]}0000`;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        team: newTeam,
        management_number: newManagementNumber
      }));
    }
    // 관리방법 필드의 경우 특별 처리
    else if (name === 'management_method') {
      const newMethod = value;
      // 관리방법이 변경될 때 관련 필드 처리
      if (newMethod === 'not_applicable') {
        // 비대상인 경우 교정 관련 필드 초기화
        setFormData(prev => ({
          ...prev,
          management_method: newMethod,
          calibration_cycle: 0,
          calibration_institution: '',
          last_calibration_date: '',
          next_calibration_date: ''
        }));
      } else {
        // 다른 관리방법으로 변경 시 기본값 설정
        setFormData(prev => ({
          ...prev,
          management_method: newMethod,
          calibration_cycle: formData.calibration_cycle <= 0 ? 12 : formData.calibration_cycle
        }));
      }
    } else {
      // 다른 필드들은 원래 처리 방식대로
      const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
        [name]: newValue
      }));
    }
    
    // 에러 상태 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // 필수 필드 검증
      const requiredFields = ['name', 'management_number', 'manufacturer', 'model_name', 'location', 'calibration_cycle'];
      let isValid = true;
      let newErrors = {};
      
      requiredFields.forEach(field => {
        if (!formData[field] && field !== 'calibration_cycle') {
          newErrors[field] = `${field} 필드는 필수입니다.`;
          isValid = false;
        } else if (field === 'calibration_cycle' && formData.management_method !== 'not_applicable' && !formData[field]) {
          newErrors[field] = `교정주기는 필수입니다.`;
          isValid = false;
        }
      });
      
      // 관리번호 형식 검증 - 팀에 따른 접두사 확인
      if (formData.management_number) {
        const prefixMap = {
          'RF': 'SUW-E',
          'SAR': 'SUW-S',
          'EMC': 'SUW-R',
          'AUTO': 'SUW-A'
        };
        
        const expectedPrefix = prefixMap[formData.team];
        if (!formData.management_number.startsWith(expectedPrefix)) {
          newErrors.management_number = `${formData.team}팀 장비의 관리번호는 ${expectedPrefix}로 시작해야 합니다.`;
          isValid = false;
        }
      }
      
      // 날짜 형식 검증 - installation_date
      if (formData.installation_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.installation_date)) {
          newErrors.installation_date = '날짜 형식은 YYYY-MM-DD이어야 합니다.';
          isValid = false;
        } else {
          // 유효한 날짜인지 추가 검증
          const dateObj = new Date(formData.installation_date);
          if (isNaN(dateObj.getTime())) {
            newErrors.installation_date = '유효한 날짜를 입력해주세요.';
            isValid = false;
          }
        }
      }
      
      // 날짜 형식 검증 - last_calibration_date (교정 관련 필드가 활성화된 경우만)
      if (formData.management_method !== 'not_applicable' && formData.last_calibration_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.last_calibration_date)) {
          newErrors.last_calibration_date = '날짜 형식은 YYYY-MM-DD이어야 합니다.';
          isValid = false;
        } else {
          // 유효한 날짜인지 추가 검증
          const dateObj = new Date(formData.last_calibration_date);
          if (isNaN(dateObj.getTime())) {
            newErrors.last_calibration_date = '유효한 날짜를 입력해주세요.';
            isValid = false;
          }
        }
      }
      
      if (!isValid) {
        setErrors(newErrors);
        setSnackbar({
          open: true,
          message: '입력된 정보를 확인해주세요.',
          severity: 'error'
        });
        setSaving(false);
        return;
      }
      
      // 이미지 파일 여부 확인
      const hasFileImage = formData.image && typeof formData.image !== 'string';
      
      console.log('폼 데이터 처리 시작:', { hasFileImage, imageType: typeof formData.image });
      
      // 관리방법이 '비대상'인 경우 교정 관련 필드 처리
      let dataToSubmit = { ...formData };
      
      if (dataToSubmit.management_method === 'not_applicable') {
        dataToSubmit.calibration_cycle = 0;
        dataToSubmit.last_calibration_date = null;
        dataToSubmit.next_calibration_date = null;
        dataToSubmit.calibration_institution = null;
      }
      
      // 빈 날짜 필드 null로 처리
      if (!dataToSubmit.installation_date || dataToSubmit.installation_date.trim() === '') {
        dataToSubmit.installation_date = null;
      }
      
      if (!dataToSubmit.last_calibration_date || dataToSubmit.last_calibration_date.trim() === '') {
        dataToSubmit.last_calibration_date = null;
      }
      
      if (hasFileImage) {
        try {
          console.log('이미지 파일이 있는 FormData를 구성합니다.');
          // 이미지 파일이 있는 경우 FormData 사용
          const formDataObj = new FormData();
          
          // 이미지 파일 추가 (파일 객체 그대로 추가)
          if (dataToSubmit.image instanceof File) {
            formDataObj.append('image', dataToSubmit.image);
            console.log(`이미지 파일 추가: ${dataToSubmit.image.name} (${dataToSubmit.image.size} bytes)`);
          }
          
          // 필수 필드 먼저 추가
          const requiredFields = ['name', 'management_number', 'model_name', 'manufacturer', 'location', 'calibration_cycle'];
          console.log('필수 필드 추가:');
          requiredFields.forEach(field => {
            // undefined, null이 아닌 경우 값 추가
            if (dataToSubmit[field] !== undefined && dataToSubmit[field] !== null) {
              formDataObj.append(field, dataToSubmit[field].toString());
              console.log(`- ${field}: ${dataToSubmit[field]}`);
            } else {
              // 필수 필드는 빈 문자열이라도 추가해야 함
              formDataObj.append(field, '');
              console.log(`- ${field}: (빈 문자열)`);
            }
          });
          
          // 나머지 필드 추가 (null/undefined가 아닌 필드만)
          console.log('추가 필드 추가:');
          Object.entries(dataToSubmit).forEach(([key, value]) => {
            // 이미 처리한 필드는 스킵
            if (key === 'image' || requiredFields.includes(key)) {
              return;
            }
            
            // null이나 undefined면 스킵
            if (value === null || value === undefined) {
        return;
            }
            
            // 불리언 값 특별 처리
            if (typeof value === 'boolean') {
              formDataObj.append(key, value ? 'true' : 'false');
              console.log(`- ${key}: ${value ? 'true' : 'false'}`);
            }
            // 숫자값 처리
            else if (typeof value === 'number') {
              formDataObj.append(key, value.toString());
              console.log(`- ${key}: ${value}`);
            }
            // 객체나 배열은 JSON 문자열로 변환
            else if (typeof value === 'object' && value !== null) {
              formDataObj.append(key, JSON.stringify(value));
              console.log(`- ${key}: (객체/배열)`);
            }
            // 문자열 및 기타 값
            else {
              formDataObj.append(key, value);
              console.log(`- ${key}: ${value}`);
            }
          });
          
          // FormData 내용 디버깅 출력
          console.log('FormData 구성 완료, 내용:');
          for (let [key, value] of formDataObj.entries()) {
            if (key === 'image') {
              console.log(`${key}: File(${value.name}, ${value.size} bytes)`);
            } else {
              console.log(`${key}: ${value}`);
            }
          }
          
          // API 호출 (FormData 방식)
          if (isEditMode) {
            await apiService.equipment.update(id, formDataObj);
          } else {
            await apiService.equipment.create(formDataObj);
          }
        } catch (error) {
          console.error('이미지 업로드 실패:', error);
          throw error;
        }
      } else {
        // 이미지 파일이 없는 경우 JSON 방식으로 요청
        // 이미지 필드 처리 (파일 객체가 아닌 경우)
        if (typeof dataToSubmit.image === 'string' && dataToSubmit.image.trim() === '') {
          delete dataToSubmit.image;
        }
        
        console.log('JSON 데이터로 전송합니다:', dataToSubmit);
        
        // API 호출 (JSON 방식)
        if (isEditMode) {
          await apiService.equipment.update(id, dataToSubmit);
        } else {
          await apiService.equipment.create(dataToSubmit);
        }
      }
      
      // 성공 처리
        setSnackbar({
          open: true,
        message: isEditMode ? '장비 정보가 성공적으로 수정되었습니다.' : '장비가 성공적으로 등록되었습니다.',
          severity: 'success'
        });
      
      // 저장 후 작업
      if (isEditMode) {
        // 수정 모드: 목록 페이지로 이동
        setTimeout(() => {
          navigate('/equipment');
        }, 1500);
      } else {
        // 등록 모드: 폼 초기화
          setFormData({
            name: '',
            management_number: '',
            asset_number: '',
            model_name: '',
            manufacturer: '',
            serial_number: '',
            purchase_year: '',
            location: '',
            specifications: '',
            management_method: 'not_applicable',
            calibration_cycle: 12,
            intermediate_check: false,
            calibration_institution: '',
            status: 'available',
            last_calibration_date: '',
          next_calibration_date: '',
          team: 'RF',
          supplier: '',
          supplier_contact: '',
          manufacturer_contact: '',
          specification_compliance: false,
          needs_calibration: false,
          software_version: '',
          firmware_version: '',
          manual_location: '',
          accessories: '',
          key_features: '',
          installation_date: '',
          primary_technical_manager: '',
          secondary_technical_manager: '',
          image: ''
        });
        setErrors({});
        setImagePreview('');
      
      // 저장 후 목록 페이지로 이동
      setTimeout(() => {
        navigate('/equipment');
      }, 1500);
      }
    } catch (error) {
      console.error('장비 저장 오류:', error);
      
      // 오류 정보 분석
      let errorMessage = isEditMode ? '장비 정보 수정에 실패했습니다.' : '장비 등록에 실패했습니다.';
      
      if (error.data) {
        // 날짜 필드 오류 확인
        const dateErrors = [];
        
        if (error.data.installation_date) {
          dateErrors.push(`설치 일시: ${Array.isArray(error.data.installation_date) 
            ? error.data.installation_date.join(', ') 
            : error.data.installation_date}`);
        }
        
        if (error.data.last_calibration_date) {
          dateErrors.push(`최종교정일: ${Array.isArray(error.data.last_calibration_date)
            ? error.data.last_calibration_date.join(', ')
            : error.data.last_calibration_date}`);
        }
        
        if (dateErrors.length > 0) {
          errorMessage = `날짜 형식 오류: ${dateErrors.join(', ')}`;
        }
        
        // 다른 필드 오류 확인
        const otherErrors = Object.entries(error.data)
          .filter(([key]) => key !== 'installation_date' && key !== 'last_calibration_date')
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
        
        if (otherErrors.length > 0) {
          errorMessage += '\n' + otherErrors.join(', ');
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* 폼 헤더 */}
      <Typography variant="h5" component="h1" gutterBottom>
        {isEditMode ? '장비 정보 수정' : '신규 장비 등록'}
          </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>기본 정보</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>장비 기본 정보</Typography>
          
              <Grid container spacing={2}>
                <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="장비명"
                name="name"
                value={formData.name}
                onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
              />
            </Grid>
            
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="team-label">소속팀</InputLabel>
                    <Select
                      labelId="team-label"
                      name="team"
                      value={formData.team}
                      onChange={handleChange}
                      label="소속팀"
                    >
                      <MenuItem value="RF">RF팀</MenuItem>
                      <MenuItem value="SAR">SAR팀</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
            
                <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="관리번호"
                name="management_number"
                value={formData.management_number}
                onChange={handleChange}
                    error={!!errors.management_number}
                    helperText={errors.management_number}
              />
            </Grid>
            
                <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="자산번호"
                name="asset_number"
                value={formData.asset_number}
                onChange={handleChange}
              />
            </Grid>
            
                <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="모델명"
                name="model_name"
                value={formData.model_name}
                onChange={handleChange}
                    error={!!errors.model_name}
                    helperText={errors.model_name}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="일련번호"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleChange}
              />
            </Grid>
            
                <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="제조사"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
              />
            </Grid>
            
                <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="구입년도"
                name="purchase_year"
                value={formData.purchase_year}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 1900, max: new Date().getFullYear() } }}
              />
            </Grid>
            
                <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="위치"
                name="location"
                value={formData.location}
                onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="설치 일시"
                    name="installation_date"
                    type="date"
                    value={formData.installation_date || ''}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.installation_date}
                    helperText={errors.installation_date || '형식: YYYY-MM-DD (비워두면 설정되지 않음)'}
              />
            </Grid>
            
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.intermediate_check}
                        onChange={(e) => setFormData({ ...formData, intermediate_check: e.target.checked })}
                  name="intermediate_check"
                      />
                    }
                  label="중간점검 대상"
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>추가 정보</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="제조사 연락처"
                    name="manufacturer_contact"
                    value={formData.manufacturer_contact}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="공급사"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="공급사 연락처"
                    name="supplier_contact"
                    value={formData.supplier_contact}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="기술책임자(정)"
                    name="primary_technical_manager"
                    value={formData.primary_technical_manager}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="기술책임자(부)"
                    name="secondary_technical_manager"
                    value={formData.secondary_technical_manager}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>장비 사양</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  label="장비 사양"
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleChange}
                  sx={{ mb: 2 }}
                />
              </Box>
              
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="subtitle2" gutterBottom>
                  장비 이미지
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="equipment-image"
                  type="file"
                  name="image"
                  onChange={handleChange}
                />
                <label htmlFor="equipment-image">
                  <Button
                    variant="contained"
                    component="span"
                    color="primary"
                    size="small"
                  >
                    이미지 업로드
                  </Button>
                </label>
                {(imagePreview || formData.image) && (
                  <Box mt={2} sx={{ textAlign: 'center' }}>
                    <img
                      src={imagePreview || (typeof formData.image === 'string' ? formData.image : '')}
                      alt="장비 이미지 미리보기"
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>기술 정보</Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>S/W 및 펌웨어 정보</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="S/W 버전"
                    name="software_version"
                    value={formData.software_version}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="펌웨어 버전"
                    name="firmware_version"
                    value={formData.firmware_version}
                    onChange={handleChange}
                  />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                    label="메뉴얼 보관 위치"
                    name="manual_location"
                    value={formData.manual_location}
                onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>부속품 및 주요 기능</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                multiline
                    rows={2}
                    label="부속품 목록"
                    name="accessories"
                    value={formData.accessories}
                    onChange={handleChange}
              />
            </Grid>
            
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="주요 기능"
                    name="key_features"
                    value={formData.key_features}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>품질 정보</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.specification_compliance}
                        onChange={(e) => setFormData({ ...formData, specification_compliance: e.target.checked })}
                        name="specification_compliance"
                      />
                    }
                    label="시방 일치"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.needs_calibration}
                        onChange={(e) => setFormData({ ...formData, needs_calibration: e.target.checked })}
                        name="needs_calibration"
                      />
                    }
                    label="교정 필요"
                  />
                </Grid>
              </Grid>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>교정/관리 정보</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="management-method-label">관리방법</InputLabel>
                    <Select
                      labelId="management-method-label"
                      name="management_method"
                      value={formData.management_method}
                      onChange={handleChange}
                  label="관리방법"
                >
                      <MenuItem value="external_calibration">교정</MenuItem>
                      <MenuItem value="self_check">검증/유지보수</MenuItem>
                  <MenuItem value="not_applicable">비대상</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
                <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="교정 주기 (개월)"
                name="calibration_cycle"
                    type="number"
                value={formData.calibration_cycle}
                    onChange={handleChange}
                disabled={formData.management_method === 'not_applicable'}
                    InputProps={{ inputProps: { min: 0 } }}
              />
                  {formData.management_method === 'not_applicable' && (
                    <Typography variant="caption" color="textSecondary">
                      비대상 장비는 교정주기가 적용되지 않습니다.
                    </Typography>
                  )}
            </Grid>
            
                <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="교정 기관"
                name="calibration_institution"
                value={formData.calibration_institution}
                onChange={handleChange}
                disabled={formData.management_method === 'not_applicable'}
              />
                  {formData.management_method === 'not_applicable' && (
                    <Typography variant="caption" color="textSecondary">
                      비대상 장비는 교정기관이 적용되지 않습니다.
                    </Typography>
                  )}
            </Grid>
            
                <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="최종교정일"
                name="last_calibration_date"
                type="date"
                    value={formData.last_calibration_date || ''}
                onChange={(e) => {
                  handleChange(e);
                  
                  // 최종교정일이 변경되고 교정 주기가 있으면 차기교정일 자동 계산
                      if (e.target.value && formData.calibration_cycle > 0) {
                    const lastDate = new Date(e.target.value);
                    const nextDate = new Date(lastDate);
                    nextDate.setMonth(nextDate.getMonth() + parseInt(formData.calibration_cycle));
                    
                    // 차기교정일 업데이트
                    setFormData(prev => ({
                      ...prev,
                      next_calibration_date: nextDate.toISOString().split('T')[0]
                    }));
                  }
                }}
                InputLabelProps={{ shrink: true }}
                disabled={formData.management_method === 'not_applicable'}
              />
                  {formData.management_method === 'not_applicable' && (
                    <Typography variant="caption" color="textSecondary">
                      비대상 장비는 교정일이 적용되지 않습니다.
                    </Typography>
                  )}
            </Grid>
            
                <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="차기교정일"
                name="next_calibration_date"
                    type="date"
                value={formData.next_calibration_date || ''}
                InputLabelProps={{ shrink: true }}
                    disabled={true}
                  />
                  <Typography variant="caption" color="textSecondary">
                    최종교정일과 교정 주기에 따라 자동으로 계산됩니다
              </Typography>
            </Grid>
            
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">상태</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={formData.status}
                label="상태"
                      disabled={true}
                    >
                      <MenuItem value="available">사용 가능</MenuItem>
                      <MenuItem value="borrowed">대여 중</MenuItem>
                      <MenuItem value="checked_out">반출 중</MenuItem>
                      <MenuItem value="calibration_soon">교정 예정</MenuItem>
                      <MenuItem value="calibration_overdue">교정 기한 초과</MenuItem>
                      <MenuItem value="spare">여분</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="textSecondary">
                    상태는 장비의 교정일, 대여 상태 등에 따라 자동으로 계산됩니다
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/equipment')}
                startIcon={<ArrowBackIcon />}
              >
                취소
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={saving}
                startIcon={<SaveIcon />}
              >
                {saving ? '저장 중...' : (isEditMode ? '저장' : '등록')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert onClose={() => setSnackbar({...snackbar, open: false})} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {saving && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255, 255, 255, 0.7)', zIndex: 9999 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}

export default EquipmentForm; 