import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Snackbar, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  InputAdornment, IconButton
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import apiService from '../services/api';
import { formatDate } from '../utils/formatters';

function CheckoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL 경로에서 현재 모드 확인 (수정 모드인지 확인)
  const isEditMode = location.pathname.includes('/edit/');
  const isNewMode = location.pathname.includes('/new');
  
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date());
  const [returnNotes, setReturnNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 폼 상태 관리
  const [formData, setFormData] = useState({
    checkout_location: '',
    person_in_charge: '',
    phone_number: '',
    address: '',
    reason: '',
    checkout_date: new Date(),
    expected_return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 기본값: 7일 후
    notes: '',
    equipment_ids: [] // 선택된 장비 ID 목록
  });

  // 장비 검색 및 선택 관련 상태
  const [equipmentList, setEquipmentList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // 수정 모드에서 기존 선택된 장비 로드
  useEffect(() => {
    if (isEditMode && checkout && checkout.checkout_equipment) {
      console.log('기존 장비 정보:', checkout.checkout_equipment);
      // 선택된 장비 목록 설정
      setSelectedEquipment(checkout.checkout_equipment.map(item => ({
        id: item.id,
        equipment_id: item.equipment,
        name: item.equipment_name,
        management_number: item.management_number,
        model_name: item.model_name
      })));
    }
  }, [isEditMode, checkout]);

  // fetchCheckoutDetail 함수를 useCallback으로 감싸서 정의
  const fetchCheckoutDetail = useCallback(async () => {
    if (isNewMode) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiService.checkouts.getById(id);
      console.log('Checkout detail data:', response.data);
      setCheckout(response.data);
      
      // 수정 모드인 경우 폼 데이터 설정
      if (isEditMode) {
        setFormData({
          checkout_location: response.data.checkout_location || '',
          person_in_charge: response.data.person_in_charge || '',
          phone_number: response.data.phone_number || '',
          address: response.data.address || '',
          reason: response.data.reason || '',
          checkout_date: response.data.checkout_date ? new Date(response.data.checkout_date) : new Date(),
          expected_return_date: response.data.expected_return_date ? new Date(response.data.expected_return_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          notes: response.data.notes || '',
          equipment_ids: response.data.checkout_equipment ? response.data.checkout_equipment.map(equipment => equipment.id) : []
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: '반출 정보를 불러오는데 실패했습니다.',
        severity: 'error'
      });
      console.error('Error fetching checkout details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode, isNewMode]);

  // 반출 정보 가져오기
  useEffect(() => {
    fetchCheckoutDetail();
  }, [fetchCheckoutDetail]);

  // 장비 검색 함수
  const searchEquipment = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      // 수정 모드에서는 status 필터를 적용하지 않음 (이미 반출 중인 장비도 검색 가능)
      const params = { search: searchTerm };
      if (!isEditMode) {
        params.status = 'available'; // 새 반출 등록 시에만 대여 가능한 장비만 검색
      }
      
      const response = await apiService.equipment.getAll(params);
      console.log('장비 검색 결과:', response.data.results || response.data);
      setSearchResults(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error searching equipment:', error);
      setSnackbar({
        open: true,
        message: '장비 검색 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, isEditMode]);

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        searchEquipment();
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm, searchEquipment]);

  // 장비 선택 함수
  const handleSelectEquipment = (equipment) => {
    console.log('선택한 장비:', equipment);
    
    // 이미 선택된 장비인지 확인
    if (selectedEquipment.some(item => item.id === equipment.id)) {
      return;
    }
    
    // 선택된 장비 목록에 추가 (equipment_id 필드 추가)
    const newEquipment = {
      ...equipment,
      equipment_id: equipment.id // equipment_id 필드 추가
    };
    
    setSelectedEquipment([...selectedEquipment, newEquipment]);
    
    // 폼 데이터 업데이트 (equipment_ids 필드는 더 이상 사용하지 않음)
    setFormData({
      ...formData
    });
    
    // 검색 결과 및 검색어 초기화
    setSearchResults([]);
    setSearchTerm('');
  };

  // 선택된 장비 제거 함수
  const handleRemoveEquipment = (equipmentId) => {
    console.log('제거할 장비 ID:', equipmentId);
    
    // 선택된 장비 목록에서 제거
    setSelectedEquipment(selectedEquipment.filter(item => item.id !== equipmentId));
    
    // 폼 데이터 업데이트 (equipment_ids 필드는 더 이상 사용하지 않음)
    setFormData({
      ...formData
    });
  };

  // 반입 처리
  const handleReturn = async () => {
    try {
      setProcessing(true);
      
      // 날짜를 YYYY-MM-DD 형식으로 변환
      const formattedDate = returnDate instanceof Date 
        ? returnDate.toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      await apiService.checkouts.returnEquipment(id, {
        return_date: formattedDate,
        return_notes: returnNotes.trim() || null // 비고가 없는 경우 null로 설정
      });
      
      setSnackbar({
        open: true,
        message: '장비 반입이 성공적으로 처리되었습니다.',
        severity: 'success'
      });
      
      setReturnDialogOpen(false);
      fetchCheckoutDetail(); // 정보 갱신
    } catch (error) {
      setSnackbar({
        open: true,
        message: '장비 반입 처리에 실패했습니다.',
        severity: 'error'
      });
      console.error('Error returning equipment:', error);
    } finally {
      setProcessing(false);
    }
  };

  // 반출 정보 삭제
  const handleDelete = async () => {
    try {
      setProcessing(true);
      
      await apiService.checkouts.delete(id);
      
      setSnackbar({
        open: true,
        message: '반출 정보가 성공적으로 삭제되었습니다.',
        severity: 'success'
      });
      
      // 삭제 후 목록 페이지로 이동
      setTimeout(() => {
        navigate('/checkout');
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: '반출 정보 삭제에 실패했습니다.',
        severity: 'error'
      });
      console.error('Error deleting checkout:', error);
      setDeleteDialogOpen(false);
    } finally {
      setProcessing(false);
    }
  };

  // 반출 상태에 따른 칩 표시
  const getStatusChip = () => {
    if (!checkout) return null;
    
    const now = new Date();
    const expectedReturnDate = new Date(checkout.expected_return_date);
    
    if (checkout.return_date) {
      return <Chip label="반입 완료" color="success" />;
    } else if (expectedReturnDate < now) {
      return <Chip label="반입 지연" color="error" />;
    } else {
      return <Chip label="반출 중" color="primary" />;
    }
  };

  // 폼 입력 필드 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 날짜 변경 핸들러
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setProcessing(true);
      
      // 날짜를 YYYY-MM-DD 형식으로 변환
      const formattedData = {
        ...formData,
        checkout_date: formData.checkout_date instanceof Date 
          ? formData.checkout_date.toISOString().split('T')[0] 
          : formData.checkout_date,
        expected_return_date: formData.expected_return_date instanceof Date 
          ? formData.expected_return_date.toISOString().split('T')[0] 
          : formData.expected_return_date
      };
      
      // 장비 정보 추가
      if (selectedEquipment.length > 0) {
        // 서버에서 요구하는 형식으로 데이터 변환
        delete formattedData.equipment_ids;
        
        // 서버에서 필수로 요구하는 checkout_equipment 필드 추가
        formattedData.checkout_equipment = selectedEquipment.map(item => ({
          equipment: item.equipment_id || item.id,
          equipment_name: item.name,
          management_number: item.management_number,
          model_name: item.model_name
        }));
      } else {
        // 장비가 선택되지 않은 경우 서버에서 필수 필드로 요구하므로 오류 표시
        setSnackbar({
          open: true,
          message: '최소 하나 이상의 장비를 선택해야 합니다.',
          severity: 'error'
        });
        setProcessing(false);
        return;
      }
      
      console.log('제출할 데이터:', JSON.stringify(formattedData, null, 2));
      
      let response;
      
      if (isNewMode) {
        // 새 반출 정보 생성
        console.log('새 반출 정보 생성 요청:', formattedData);
        response = await apiService.checkouts.create(formattedData);
        console.log('새 반출 정보 생성 응답:', response);
        setSnackbar({
          open: true,
          message: '반출 정보가 성공적으로 생성되었습니다.',
          severity: 'success'
        });
      } else if (isEditMode) {
        // 반출 정보 수정
        console.log('반출 정보 수정 요청:', id, formattedData);
        response = await apiService.checkouts.update(id, formattedData);
        console.log('반출 정보 수정 응답:', response);
        setSnackbar({
          open: true,
          message: '반출 정보가 성공적으로 수정되었습니다.',
          severity: 'success'
        });
      }
      
      // 성공 후 상세 페이지로 이동
      setTimeout(() => {
        if ((isNewMode || isEditMode) && response && response.data && response.data.id) {
          navigate(`/checkout/${response.data.id}`);
        } else if (isEditMode) {
          navigate(`/checkout/${id}`);
        } else {
          navigate('/checkout');
        }
      }, 1500);
    } catch (error) {
      console.error(`Error ${isNewMode ? 'creating' : 'updating'} checkout:`, error);
      
      // 오류 상세 정보 로깅
      if (error.data) {
        console.error('오류 상세 정보:', error.data);
      }
      
      let errorMessage = `반출 정보 ${isNewMode ? '생성' : '수정'}에 실패했습니다.`;
      
      // 서버에서 반환된 오류 메시지가 있으면 표시
      if (error.data) {
        if (error.data.non_field_errors) {
          // non_field_errors 오류 메시지 표시
          errorMessage = error.data.non_field_errors[0] || errorMessage;
          
          // 장비 상태 오류인 경우 추가 안내 메시지 제공
          if (errorMessage.includes('현재 대여 가능한 상태가 아닙니다')) {
            errorMessage += '\n다른 장비를 선택하거나, 해당 장비의 상태를 확인해주세요.';
          }
        } else if (error.data.checkout_equipment) {
          // checkout_equipment 관련 오류 메시지 표시
          errorMessage += ` (장비 정보 오류: ${error.data.checkout_equipment})`;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!checkout && !isNewMode) {
    return (
      <Box textAlign="center" py={5}>
        <Typography variant="h6" color="error">
          반출 정보를 찾을 수 없습니다.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/checkout')}
          sx={{ mt: 2 }}
        >
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  // 수정 모드 또는 새 반출 등록 모드일 때 폼 렌더링
  if (isEditMode || isNewMode) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            {isNewMode ? '새 반출 등록' : '반출 정보 수정'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => isNewMode ? navigate('/checkout') : navigate(`/checkout/${id}`)}
          >
            {isNewMode ? '목록으로 돌아가기' : '상세 정보로 돌아가기'}
          </Button>
        </Box>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  반출 정보
                </Typography>
                
                <TextField
                  label="반출처"
                  name="checkout_location"
                  value={formData.checkout_location}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                />
                
                <TextField
                  label="반출자"
                  name="person_in_charge"
                  value={formData.person_in_charge}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                />
                
                <TextField
                  label="연락처"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                />
                
                <TextField
                  label="주소"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                />
                
                <TextField
                  label="반출 목적"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  일정 정보
                </Typography>
                
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ mb: 2 }}>
                    <DatePicker
                      label="반출일"
                      value={formData.checkout_date}
                      onChange={(newValue) => handleDateChange('checkout_date', newValue)}
                      slotProps={{ textField: { fullWidth: true, margin: "normal", required: true } }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <DatePicker
                      label="예상 반입일"
                      value={formData.expected_return_date}
                      onChange={(newValue) => handleDateChange('expected_return_date', newValue)}
                      slotProps={{ textField: { fullWidth: true, margin: "normal", required: true } }}
                    />
                  </Box>
                </LocalizationProvider>
                
                <TextField
                  label="비고"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                  placeholder="추가 정보가 있으면 입력하세요"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  장비 선택
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    label="장비 검색 (장비명, 관리번호, 모델명)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                    margin="normal"
                    placeholder="검색어를 입력하세요"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {searchLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  {/* 검색 결과 목록 */}
                  {searchResults.length > 0 && (
                    <Paper elevation={2} sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                      <List dense>
                        {searchResults.map((equipment) => {
                          // 이미 선택된 장비인지 확인
                          const isSelected = selectedEquipment.some(item => item.id === equipment.id);
                          // 현재 대여 가능한 상태인지 확인
                          const isAvailable = equipment.status === 'available';
                          // 현재 반출 중인 장비인지 확인
                          const isCheckedOut = equipment.status === 'checked_out';
                          // 수정 모드에서 현재 반출 정보에 포함된 장비인지 확인
                          const isCurrentCheckout = isEditMode && checkout && 
                            checkout.checkout_equipment && 
                            checkout.checkout_equipment.some(item => item.equipment === equipment.id);
                          
                          // 선택 가능 여부 결정
                          // 1. 이미 선택된 장비는 선택 불가
                          // 2. 대여 가능한 상태의 장비는 선택 가능
                          // 3. 수정 모드에서 현재 반출 정보에 포함된 장비는 선택 가능
                          const isSelectable = !isSelected && (isAvailable || (isCheckedOut && isCurrentCheckout));
                          
                          return (
                            <ListItem
                              key={equipment.id}
                              button
                              onClick={() => isSelectable && handleSelectEquipment(equipment)}
                              disabled={!isSelectable}
                              sx={{
                                backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                                '&:hover': {
                                  backgroundColor: isSelectable ? 'rgba(0, 0, 0, 0.08)' : 'inherit'
                                }
                              }}
                            >
                              <ListItemText
                                primary={equipment.name}
                                secondary={
                                  <>
                                    {`${equipment.management_number} | ${equipment.model_name || '모델명 없음'}`}
                                    {!isAvailable && !isCurrentCheckout && (
                                      <Typography variant="caption" color="error" component="div">
                                        현재 대여 가능한 상태가 아닙니다. (상태: {equipment.status_display || equipment.status})
                                      </Typography>
                                    )}
                                    {isCurrentCheckout && (
                                      <Typography variant="caption" color="primary" component="div">
                                        현재 반출 정보에 포함된 장비입니다.
                                      </Typography>
                                    )}
                                  </>
                                }
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  onClick={() => isSelectable && handleSelectEquipment(equipment)}
                                  disabled={!isSelectable}
                                  color={isSelectable ? 'primary' : 'default'}
                                >
                                  <AddIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Paper>
                  )}
                </Box>
                
                {/* 선택된 장비 목록 */}
                <Typography variant="subtitle2" gutterBottom>
                  선택된 장비 ({selectedEquipment.length})
                </Typography>
                
                {selectedEquipment.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    선택된 장비가 없습니다. 위 검색창에서 장비를 검색하여 추가하세요.
                  </Typography>
                ) : (
                  <Paper variant="outlined" sx={{ mt: 1 }}>
                    <List dense>
                      {selectedEquipment.map((equipment) => (
                        <ListItem key={equipment.id}>
                          <ListItemText
                            primary={equipment.name}
                            secondary={`${equipment.management_number} | ${equipment.model_name || '모델명 없음'}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveEquipment(equipment.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={() => isNewMode ? navigate('/checkout') : navigate(`/checkout/${id}`)}
                    sx={{ mr: 2 }}
                    disabled={processing}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={processing}
                  >
                    {processing ? <CircularProgress size={24} /> : (isNewMode ? '등록' : '수정')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          반출 상세 정보
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/checkout')}
        >
          목록으로 돌아가기
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="h6" component="h2" sx={{ mr: 2 }}>
              {checkout.checkout_equipment && checkout.checkout_equipment.length > 0 
                ? (
                  <>
                    {checkout.checkout_equipment[0].equipment_name || '장비명 없음'}
                    {checkout.checkout_equipment.length > 1 && 
                      ` 외 ${checkout.checkout_equipment.length - 1}개`}
                  </>
                ) 
                : '장비명 없음'}
            </Typography>
            {getStatusChip()}
          </Box>
          
          <Box>
            {!checkout.return_date && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AssignmentReturnIcon />}
                onClick={() => setReturnDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                반입 처리
              </Button>
            )}
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/checkout/edit/${id}`)}
              sx={{ mr: 1 }}
            >
              수정
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              삭제
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              장비 정보
            </Typography>
            
            {checkout.checkout_equipment && checkout.checkout_equipment.length > 0 ? (
              checkout.checkout_equipment.map((equipment, index) => (
                <Box key={equipment.id} sx={{ mt: 2, mb: index < checkout.checkout_equipment.length - 1 ? 3 : 0 }}>
                  {index > 0 && <Divider sx={{ my: 2 }} />}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    장비 {index + 1}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4} key={`equipment-name-label-${equipment.id}`}>
                      <Typography variant="body2" color="text.secondary">
                        장비명
                      </Typography>
                    </Grid>
                    <Grid item xs={8} key={`equipment-name-value-${equipment.id}`}>
                      <Typography variant="body1">
                        {equipment.equipment_name || '정보 없음'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={4} key={`management-number-label-${equipment.id}`}>
                      <Typography variant="body2" color="text.secondary">
                        관리번호
                      </Typography>
                    </Grid>
                    <Grid item xs={8} key={`management-number-value-${equipment.id}`}>
                      <Typography variant="body1">
                        {equipment.management_number || '정보 없음'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={4} key={`model-name-label-${equipment.id}`}>
                      <Typography variant="body2" color="text.secondary">
                        모델명
                      </Typography>
                    </Grid>
                    <Grid item xs={8} key={`model-name-value-${equipment.id}`}>
                      <Typography variant="body1">
                        {equipment.model_name || '정보 없음'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  등록된 장비 정보가 없습니다.
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              반출 정보
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={4} key="checkout-location-label">
                  <Typography variant="body2" color="text.secondary">
                    반출처
                  </Typography>
                </Grid>
                <Grid item xs={8} key="checkout-location-value">
                  <Typography variant="body1">
                    {checkout.checkout_location || '정보 없음'}
                  </Typography>
                </Grid>
                
                <Grid item xs={4} key="checkout-reason-label">
                  <Typography variant="body2" color="text.secondary">
                    반출 목적
                  </Typography>
                </Grid>
                <Grid item xs={8} key="checkout-reason-value">
                  <Typography variant="body1">
                    {checkout.reason || '정보 없음'}
                  </Typography>
                </Grid>
                
                <Grid item xs={4} key="person-in-charge-label">
                  <Typography variant="body2" color="text.secondary">
                    반출자
                  </Typography>
                </Grid>
                <Grid item xs={8} key="person-in-charge-value">
                  <Typography variant="body1">
                    {checkout.person_in_charge || '정보 없음'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              일정 정보
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={4} key="checkout-date-label">
                  <Typography variant="body2" color="text.secondary">
                    반출일
                  </Typography>
                </Grid>
                <Grid item xs={8} key="checkout-date-value">
                  <Typography variant="body1">
                    {formatDate(checkout.checkout_date)}
                  </Typography>
                </Grid>
                
                <Grid item xs={4} key="expected-return-date-label">
                  <Typography variant="body2" color="text.secondary">
                    예상 반입일
                  </Typography>
                </Grid>
                <Grid item xs={8} key="expected-return-date-value">
                  <Typography variant="body1">
                    {formatDate(checkout.expected_return_date)}
                  </Typography>
                </Grid>
                
                <Grid item xs={4} key="return-date-label">
                  <Typography variant="body2" color="text.secondary">
                    반입일
                  </Typography>
                </Grid>
                <Grid item xs={8} key="return-date-value">
                  <Typography variant="body1">
                    {checkout.return_date ? formatDate(checkout.return_date) : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              비고
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                {checkout.notes || '비고 사항이 없습니다.'}
              </Typography>
            </Box>
            
            {checkout.return_date && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  반입 비고
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {checkout.return_notes || '반입 비고 사항이 없습니다.'}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* 반입 처리 다이얼로그 */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>장비 반입 처리</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="반입일"
                value={returnDate}
                onChange={(newValue) => setReturnDate(newValue)}
                slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
              />
            </LocalizationProvider>
            
            <TextField
              label="반입 비고"
              multiline
              rows={4}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="특이사항이 있는 경우에만 기록해주세요"
              helperText="장비 반입 시 특이사항이 있는 경우에만 기록하세요. 특이사항이 없으면 비워두셔도 됩니다."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)} disabled={processing}>
            취소
          </Button>
          <Button
            onClick={handleReturn}
            variant="contained"
            color="primary"
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : '반입 완료'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>반출 정보 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            이 반출 정보를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={processing}>
            취소
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CheckoutDetail; 