import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Typography, Paper, Grid, Button, CircularProgress, TextField, Dialog, 
  DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Snackbar, IconButton, DialogContentText,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox,
  Card, CardContent, CardHeader, 
  // eslint-disable-next-line no-unused-vars
  Divider, 
  Box, Tabs, Tab, Chip, Container
} from '@mui/material';
import { Alert } from '@mui/material';
import { fetchEquipment, fetchEquipmentById } from '../store/equipmentSlice';
import { formatDate } from '../utils/dateFormatter';
import { useAuth } from '../contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import EditCalibrationHistory from './EditCalibrationHistory';
import AddCalibrationHistory from './AddCalibrationHistory';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
// eslint-disable-next-line no-unused-vars
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// eslint-disable-next-line no-unused-vars
import BuildIcon from '@mui/icons-material/Build';
// eslint-disable-next-line no-unused-vars
import WarningIcon from '@mui/icons-material/Warning';
import apiService from '../services/api';

const BorrowDialog = ({ open, onClose, onSubmit, borrowData, setBorrowData }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>장비 대여</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="대여자"
        fullWidth
        value={borrowData.borrower_name}
        onChange={(e) => setBorrowData({ ...borrowData, borrower_name: e.target.value })}
      />
      <TextField
        margin="dense"
        label="부서"
        fullWidth
        value={borrowData.borrower_department}
        onChange={(e) => setBorrowData({ ...borrowData, borrower_department: e.target.value })}
      />
      <TextField
        margin="dense"
        label="대여일"
        type="date"
        fullWidth
        InputLabelProps={{
          shrink: true,
        }}
        value={borrowData.borrowed_date}
        onChange={(e) => setBorrowData({ ...borrowData, borrowed_date: e.target.value })}
      />
      <TextField
        margin="dense"
        label="예상 반납일"
        type="date"
        fullWidth
        InputLabelProps={{
          shrink: true,
        }}
        value={borrowData.expected_return_date}
        onChange={(e) => setBorrowData({ ...borrowData, expected_return_date: e.target.value })}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        취소
      </Button>
      <Button onClick={onSubmit} color="primary">
        대여
      </Button>
    </DialogActions>
  </Dialog>
);

const CheckoutDialog = ({ open, onClose, onSubmit, checkoutData, setCheckoutData, equipment }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>장비 반출: {equipment.name}</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="반출지"
        fullWidth
        value={checkoutData.checkout_location}
        onChange={(e) => setCheckoutData({ ...checkoutData, checkout_location: e.target.value })}
      />
      <TextField
        margin="dense"
        label="전화번호"
        fullWidth
        value={checkoutData.phone_number}
        onChange={(e) => setCheckoutData({ ...checkoutData, phone_number: e.target.value })}
      />
      <TextField
        margin="dense"
        label="주소"
        fullWidth
        value={checkoutData.address}
        onChange={(e) => setCheckoutData({ ...checkoutData, address: e.target.value })}
      />
      <TextField
        margin="dense"
        label="반출 사유"
        fullWidth
        multiline
        rows={4}
        value={checkoutData.reason}
        onChange={(e) => setCheckoutData({ ...checkoutData, reason: e.target.value })}
      />
      <TextField
        margin="dense"
        label="반출일"
        type="date"
        fullWidth
        InputLabelProps={{
          shrink: true,
        }}
        value={checkoutData.checkout_date}
        onChange={(e) => setCheckoutData({ ...checkoutData, checkout_date: e.target.value })}
      />
      <TextField
        margin="dense"
        label="예상 반납일"
        type="date"
        fullWidth
        InputLabelProps={{
          shrink: true,
        }}
        value={checkoutData.expected_return_date}
        onChange={(e) => setCheckoutData({ ...checkoutData, expected_return_date: e.target.value })}
      />
      <TextField
        margin="dense"
        label="반출자"
        fullWidth
        value={checkoutData.person_in_charge}
        onChange={(e) => setCheckoutData({ ...checkoutData, person_in_charge: e.target.value })}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        취소
      </Button>
      <Button onClick={onSubmit} color="primary">
        반출
      </Button>
    </DialogActions>
  </Dialog>
);

const LocationDialog = ({ open, onClose, onSubmit, locationData, setLocationData, isEdit = false }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{isEdit ? '위치 변동 수정' : '위치 변동 추가'}</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="새 위치"
        fullWidth
        value={locationData.location}
        onChange={(e) => setLocationData({ ...locationData, location: e.target.value })}
      />
      <TextField
        margin="dense"
        label="변동일시"
        type="date"
        fullWidth
        InputLabelProps={{
          shrink: true,
        }}
        value={locationData.change_date}
        onChange={(e) => setLocationData({ ...locationData, change_date: e.target.value })}
      />
      <TextField
        margin="dense"
        label="비고"
        fullWidth
        multiline
        rows={4}
        value={locationData.notes}
        onChange={(e) => setLocationData({ ...locationData, notes: e.target.value })}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        취소
      </Button>
      <Button onClick={onSubmit} color="primary">
        {isEdit ? '수정' : '추가'}
      </Button>
    </DialogActions>
  </Dialog>
);

const MaintenanceDialog = ({ open, onClose, onSubmit, maintenanceData, setMaintenanceData, isEdit = false }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>{isEdit ? '유지보수 이력 수정' : '유지보수 이력 추가'}</DialogTitle>
    <DialogContent>
      <FormControl fullWidth margin="dense">
        <InputLabel>유지보수 유형</InputLabel>
        <Select
          value={maintenanceData.maintenance_type || 'regular'}
          onChange={(e) => setMaintenanceData({ ...maintenanceData, maintenance_type: e.target.value })}
          label="유지보수 유형"
        >
          <MenuItem value="regular">정기 유지보수</MenuItem>
          <MenuItem value="emergency">긴급 유지보수</MenuItem>
          <MenuItem value="preventive">예방 유지보수</MenuItem>
          <MenuItem value="other">기타</MenuItem>
        </Select>
      </FormControl>
      <TextField
        margin="dense"
        label="유지보수 일시"
        type="date"
        fullWidth
        value={maintenanceData.maintenance_date || ''}
        onChange={(e) => setMaintenanceData({ ...maintenanceData, maintenance_date: e.target.value })}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        margin="dense"
        label="주요 내용"
        type="text"
        fullWidth
        multiline
        rows={4}
        value={maintenanceData.description || ''}
        onChange={(e) => setMaintenanceData({ ...maintenanceData, description: e.target.value })}
      />
      <TextField
        margin="dense"
        label="수행자"
        type="text"
        fullWidth
        value={maintenanceData.performed_by || ''}
        onChange={(e) => setMaintenanceData({ ...maintenanceData, performed_by: e.target.value })}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        취소
      </Button>
      <Button onClick={onSubmit} color="primary">
        {isEdit ? '수정' : '추가'}
      </Button>
    </DialogActions>
  </Dialog>
);

const RepairDialog = ({ open, onClose, onSubmit, repairData, setRepairData, isEdit = false }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? '손상/수리 이력 수정' : '손상/수리 이력 추가'}</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="발생 일시"
          type="date"
          fullWidth
          value={repairData.issue_date || ''}
          onChange={(e) => setRepairData({ ...repairData, issue_date: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel id="issue-type-label">유형</InputLabel>
          <Select
            labelId="issue-type-label"
            value={repairData.issue_type || 'repair'}
            onChange={(e) => setRepairData({ ...repairData, issue_type: e.target.value })}
            label="유형"
          >
            <MenuItem value="damage">손상</MenuItem>
            <MenuItem value="malfunction">오작동</MenuItem>
            <MenuItem value="modification">변경</MenuItem>
            <MenuItem value="repair">수리</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          label="주요 내용"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={repairData.description || ''}
          onChange={(e) => setRepairData({ ...repairData, description: e.target.value })}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={repairData.resolved || false}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setRepairData({ 
                  ...repairData, 
                  resolved: isChecked,
                  resolved_date: isChecked ? (repairData.resolved_date || new Date().toISOString().split('T')[0]) : null
                });
              }}
            />
          }
          label="해결 여부"
        />
        {repairData.resolved && (
          <TextField
            margin="dense"
            label="해결 일시"
            type="date"
            fullWidth
            required
            value={repairData.resolved_date || ''}
            onChange={(e) => setRepairData({ ...repairData, resolved_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            helperText="해결 여부가 체크된 경우 해결 일시는 필수 입력 항목입니다."
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          취소
        </Button>
        <Button onClick={onSubmit} color="primary">
          {isEdit ? '수정' : '추가'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// TabPanel 컴포넌트 추가
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`equipment-tabpanel-${index}`}
      aria-labelledby={`equipment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function a11yProps(index) {
  return {
    id: `equipment-tab-${index}`,
    'aria-controls': `equipment-tabpanel-${index}`,
  };
}

function EquipmentDetail() {
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();
  const equipment = useSelector(state => state.equipment.currentItem);
  const error = useSelector(state => state.equipment.error);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [openBorrowDialog, setOpenBorrowDialog] = useState(false);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [openRepairDialog, setOpenRepairDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [borrowData, setBorrowData] = useState({
    borrower_name: '',
    borrower_department: '',
    borrowed_date: new Date().toISOString().split('T')[0],
    expected_return_date: ''
  });
  const [checkoutData, setCheckoutData] = useState({
    checkout_location: '',
    phone_number: '',
    address: '',
    reason: '',
    checkout_date: '',
    person_in_charge: '',
    expected_return_date: '',
    notes: '',
    checkout_equipment: []
  });
  const [locationData, setLocationData] = useState({
    location: '',
    change_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedCalibration, setSelectedCalibration] = useState(null);
  const [editCalibrationOpen, setEditCalibrationOpen] = useState(false);
  const [addCalibrationOpen, setAddCalibrationOpen] = useState(false);
  const [deleteCalibrationDialogOpen, setDeleteCalibrationDialogOpen] = useState(false);
  const [calibrationToDelete, setCalibrationToDelete] = useState(null);
  const [editLocationOpen, setEditLocationOpen] = useState(false);
  const [selectedLocationHistory, setSelectedLocationHistory] = useState(null);
  const [deleteLocationDialogOpen, setDeleteLocationDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [maintenanceData, setMaintenanceData] = useState({
    maintenance_date: new Date().toISOString().split('T')[0],
    description: '',
    performed_by: '',
    maintenance_type: 'regular'
  });
  const [repairData, setRepairData] = useState({
    issue_date: new Date().toISOString().split('T')[0],
    issue_type: 'repair',
    description: '',
    resolved: false,
    resolved_date: ''
  });
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [editMaintenanceOpen, setEditMaintenanceOpen] = useState(false);
  const [editRepairOpen, setEditRepairOpen] = useState(false);
  const [deleteMaintenanceDialogOpen, setDeleteMaintenanceDialogOpen] = useState(false);
  const [deleteRepairDialogOpen, setDeleteRepairDialogOpen] = useState(false);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState(null);
  const [repairToDelete, setRepairToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // API를 통해 장비 데이터를 가져옴
        const equipmentResponse = await apiService.equipment.getById(id);
        const equipmentData = equipmentResponse.data;
        
        // 콘솔에 로깅
        console.log('API에서 가져온 장비 데이터:', equipmentData);
        console.log('장비의 대여 정보:', {
          borrowed_date: equipmentData.borrowed_date,
          borrower: equipmentData.borrower,
          borrower_name: equipmentData.borrower_name,
          borrower_department: equipmentData.borrower_department,
          expected_return_date: equipmentData.expected_return_date
        });
        
        // Redux 상태 업데이트
        dispatch({
          type: 'equipment/setCurrentEquipment',
          payload: equipmentData
        });
        
        // 반출 중인 경우 반출 정보 확인
        if (equipmentData.status === 'checked_out') {
          try {
            const checkoutsResponse = await apiService.checkouts.getAll({
              equipment: id,
              status: 'ongoing'
            });
            
            if (checkoutsResponse?.data?.results?.length > 0) {
              const checkoutInfo = checkoutsResponse.data.results[0];
              console.log('반출 정보:', checkoutInfo);
              
              // 반출 정보를 Redux 스토어에 업데이트
              dispatch({
                type: 'equipment/updateEquipmentCheckoutInfo',
                payload: { id, checkoutInfo }
              });
            }
          } catch (checkoutErr) {
            console.error('반출 정보 로딩 실패:', checkoutErr);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('장비 상세 정보 로딩 중 오류 발생:', err);
        setSnackbar({
          open: true,
          message: '장비 상세 정보를 로드하는 중 오류가 발생했습니다.',
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch, id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (equipment) {
      setLoading(false);
      setCheckoutData(prevState => ({
        ...prevState,
        checkout_equipment: [{
          equipment: parseInt(id),
          quantity: 1
        }]
      }));
    }
  }, [equipment, id]);

  useEffect(() => {
    if (equipment) {
      setLocationData({
        location: '',
        change_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [equipment]);

  // 추가: 디버그용 장비 정보 출력
  useEffect(() => {
    if (equipment) {
      console.log('현재 표시되는 장비 정보:', equipment);
      if (equipment.status === 'borrowed') {
        console.log('장비의 대여 정보:', {
          borrower: equipment.borrower,
          borrower_name: equipment.borrower_name,
          borrower_department: equipment.borrower_department,
          borrowed_date: equipment.borrowed_date,
          expected_return_date: equipment.expected_return_date
        });
      }
    }
  }, [equipment]); // equipment를 의존성 배열에 명시적으로 포함

  // 공통 유효성 검사 함수
  const validateRequiredField = (value, fieldName) => {
    if (!value) {
      setSnackbar({ open: true, message: `${fieldName}은(는) 필수 입력 항목입니다.`, severity: 'error' });
      return false;
    }
    return true;
  };

  // 공통 에러 처리 함수
  const handleApiError = (err, operation) => {
    console.error(`${operation} error:`, err);
    if (err.response?.data) {
      console.error('Error response:', err.response.data);
    }
    
    setSnackbar({ 
      open: true, 
      message: `${operation}에 실패했습니다: ${err.message}`, 
      severity: 'error' 
    });
  };

  const handleBorrow = async () => {
    try {
      if (!['available', 'calibration_soon'].includes(equipment.status)) {
        throw new Error('이 장비는 현재 대여 가능한 상태가 아닙니다.');
      }
  
      const borrowRequestData  = {
        borrower: currentUser.id,
        borrower_name: borrowData.borrower_name,
        borrower_department: borrowData.borrower_department,
        borrowed_date: borrowData.borrowed_date,
        expected_return_date: borrowData.expected_return_date,
        equipment: id
      };
      
      // 대여 API 호출
      const borrowResponse = await apiService.equipment.borrow(id, borrowRequestData);
      console.log('대여 응답:', borrowResponse.data);
      
      setOpenBorrowDialog(false);
      
      // 장비 목록 새로고침
      dispatch(fetchEquipment());
      
      // 수정된 장비 데이터 직접 Redux 스토어에 저장
      dispatch({
        type: 'equipment/setCurrentEquipment',
        payload: borrowResponse.data
      });
      
      setSnackbar({ open: true, message: '장비가 성공적으로 대여되었습니다.', severity: 'success' });
    } catch (err) {
      console.error('장비 대여 중 오류 발생:', err);
      handleApiError(err, '장비 대여');
    }
  };

  const handleReturn = async () => {
    try {
      if (equipment.status !== 'borrowed') {
        throw new Error('대여 중인 장비만 반납할 수 있습니다.');
      }

      // 반납 API 호출
      const returnResponse = await apiService.equipment.return(id);
      console.log('반납 응답:', returnResponse.data);
      
      // 장비 목록 새로고침
      dispatch(fetchEquipment());
      
      // 수정된 장비 데이터로 Redux 스토어 업데이트
      dispatch({
        type: 'equipment/setCurrentEquipment',
        payload: returnResponse.data
      });
      
      setSnackbar({ open: true, message: '장비가 성공적으로 반납되었습니다.', severity: 'success' });
    } catch (err) {
      console.error('장비 반납 중 오류 발생:', err);
      handleApiError(err, '장비 반납');
    }
  };

  const handleCheckout = async () => {
    try {
      // 필수 필드 검증
      const requiredFields = {
        checkout_location: '반출지',
        phone_number: '전화번호',
        address: '주소',
        reason: '반출 사유',
        checkout_date: '반출일',
        person_in_charge: '반출자',
        expected_return_date: '예상 반납일'
      };

      for (const [field, label] of Object.entries(requiredFields)) {
        if (!checkoutData[field]) {
          setSnackbar({
            open: true,
            message: `${label}은(는) 필수 입력 항목입니다.`,
            severity: 'error'
          });
          return;
        }
      }

      // 백엔드로 전송할 데이터 구조화 - checkout_equipment 형식으로 변경
      const checkoutRequestData = {
        checkout_location: checkoutData.checkout_location,
        phone_number: checkoutData.phone_number,
        address: checkoutData.address,
        reason: checkoutData.reason,
        checkout_date: checkoutData.checkout_date,
        person_in_charge: checkoutData.person_in_charge,
        expected_return_date: checkoutData.expected_return_date,
        notes: checkoutData.notes || '',
        // checkout_equipment 형식으로 변경 - 서버 요구사항에 맞춤
        checkout_equipment: [{
          equipment: parseInt(id),
          quantity: 1
        }]
      };

      console.log('Sending checkout request:', checkoutRequestData);

      const response = await apiService.checkouts.create(checkoutRequestData);
      
      if (response && response.data) {
        setOpenCheckoutDialog(false);
        
        // 장비 목록과 현재 장비 상세 정보 모두 새로고침
        dispatch(fetchEquipment());
        dispatch(fetchEquipmentById(id));
        
        setSnackbar({ 
          open: true, 
          message: '장비가 성공적으로 반출되었습니다.', 
          severity: 'success' 
        });

        // 초기화
        setCheckoutData({
          checkout_location: '',
          phone_number: '',
          address: '',
          reason: '',
          checkout_date: '',
          person_in_charge: '',
          expected_return_date: '',
          notes: '',
          checkout_equipment: []
        });
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      if (err.response?.data) {
        console.error('Error response:', err.response.data);
      }
      handleApiError(err, '장비 반출');
    }
  };
  
  const handleAddLocationHistory = async () => {
    try {
      // 필수 필드 검증
      if (!validateRequiredField(locationData.location, '위치') || 
          !validateRequiredField(locationData.change_date, '변동일시')) {
        return;
      }
      
      await apiService.equipment.addLocation(id, {
        ...locationData,
        equipment: parseInt(id)
      });
      
      setOpenLocationDialog(false);
      
      await dispatch(fetchEquipmentById(id));
      
      setSnackbar({ open: true, message: '위치 변동 이력이 추가되었습니다.', severity: 'success' });
      
      setLocationData({
        location: '',
        change_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (err) {
      handleApiError(err, '위치 변동 이력 추가');
    }
  };

  const handleCloseCalibrationDialog = () => {
    setAddCalibrationOpen(false);
    dispatch(fetchEquipmentById(id));
  };

  // eslint-disable-next-line no-unused-vars
  const handleDeleteCalibration = (calibrationId) => {
    setCalibrationToDelete(calibrationId);
    setDeleteCalibrationDialogOpen(true);
  };

  const confirmDeleteCalibration = async () => {
    try {
      await apiService.equipment.deleteCalibration(id, calibrationToDelete);
      
      setDeleteCalibrationDialogOpen(false);
      setCalibrationToDelete(null);
      
      await dispatch(fetchEquipmentById(id));
      
      setSnackbar({ open: true, message: '교정 이력이 삭제되었습니다.', severity: 'success' });
    } catch (error) {
      handleApiError(error, '교정 이력 삭제');
    }
  };

  const handleEditLocationHistory = (history) => {
    const formattedDate = history.change_date.split('T')[0];
    
    setSelectedLocationHistory(history);
    setLocationData({
      location: history.location,
      change_date: formattedDate,
      notes: history.notes || ''
    });
    setEditLocationOpen(true);
  };

  const handleUpdateLocationHistory = async () => {
    try {
      // 필수 필드 검증
      if (!validateRequiredField(locationData.location, '위치') || 
          !validateRequiredField(locationData.change_date, '변동일시')) {
        return;
      }
      
      // 기존 위치 이력 삭제 후 새로 생성
      await apiService.equipment.deleteLocation(id, selectedLocationHistory.id);
      
      await apiService.equipment.addLocation(id, {
        ...locationData,
        equipment: parseInt(id)
      });
      
      setEditLocationOpen(false);
      
      await dispatch(fetchEquipmentById(id));
      
      setSnackbar({ open: true, message: '위치 변동 이력이 수정되었습니다.', severity: 'success' });
      
      setLocationData({
        location: '',
        change_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (err) {
      handleApiError(err, '위치 변동 이력 수정');
    }
  };

  const handleDeleteLocationHistory = (locationId) => {
    setLocationToDelete(locationId);
    setDeleteLocationDialogOpen(true);
  };

  const confirmDeleteLocationHistory = async () => {
    try {
      await apiService.equipment.deleteLocation(id, locationToDelete);
      
      setDeleteLocationDialogOpen(false);
      await dispatch(fetchEquipmentById(id));
      dispatch(fetchEquipment());
      
      setSnackbar({ open: true, message: '위치 변동 이력이 삭제되었습니다.', severity: 'success' });
    } catch (err) {
      handleApiError(err, '위치 변동 이력 삭제');
    }
  };

  const handleAddMaintenanceHistory = async () => {
    try {
      // 필수 필드 검증
      if (!validateRequiredField(maintenanceData.maintenance_type, '유지보수 유형') || 
          !validateRequiredField(maintenanceData.maintenance_date, '유지보수 일자')) {
        return;
      }
      
      await apiService.equipment.addMaintenance(id, {
        ...maintenanceData,
        equipment: parseInt(id)
      });
      
      setOpenMaintenanceDialog(false);
      
      await dispatch(fetchEquipmentById(id));
      
      setSnackbar({ open: true, message: '유지보수 이력이 추가되었습니다.', severity: 'success' });
      
      setMaintenanceData({
        maintenance_type: 'regular',
        maintenance_date: new Date().toISOString().substring(0, 10),
        details: '',
        performed_by: ''
      });
    } catch (err) {
      handleApiError(err, '유지보수 이력 추가');
    }
  };
  
  const handleEditMaintenanceHistory = (history) => {
    setSelectedMaintenance(history);
    setMaintenanceData({
      maintenance_date: history.maintenance_date,
      description: history.description,
      performed_by: history.performed_by || '',
      maintenance_type: history.maintenance_type || 'regular'
    });
    setEditMaintenanceOpen(true);
  };
  
  const handleUpdateMaintenanceHistory = async () => {
    try {
      // 필수 필드 검증
      if (!validateRequiredField(maintenanceData.maintenance_type, '유지보수 유형') || 
          !validateRequiredField(maintenanceData.maintenance_date, '유지보수 일자')) {
        return;
      }
      
      // 기존 유지보수 이력 삭제 후 새로 생성
      await apiService.equipment.deleteMaintenance(id, selectedMaintenance.id);
      
      await apiService.equipment.addMaintenance(id, {
        ...maintenanceData,
        equipment: parseInt(id)
      });
      
      setEditMaintenanceOpen(false);
      
      await dispatch(fetchEquipmentById(id));
      
      setSnackbar({ open: true, message: '유지보수 이력이 수정되었습니다.', severity: 'success' });
      
      setMaintenanceData({
        maintenance_type: 'regular',
        maintenance_date: new Date().toISOString().substring(0, 10),
        details: '',
        performed_by: ''
      });
    } catch (err) {
      handleApiError(err, '유지보수 이력 수정');
    }
  };
  
  const handleDeleteMaintenanceHistory = (maintenanceId) => {
    setMaintenanceToDelete(maintenanceId);
    setDeleteMaintenanceDialogOpen(true);
  };
  
  const confirmDeleteMaintenanceHistory = async () => {
    try {
      await apiService.equipment.deleteMaintenance(id, maintenanceToDelete);
      
      setDeleteMaintenanceDialogOpen(false);
      
      await dispatch(fetchEquipmentById(id));
      
      setSnackbar({ open: true, message: '유지보수 이력이 삭제되었습니다.', severity: 'success' });
    } catch (err) {
      handleApiError(err, '유지보수 이력 삭제');
    }
  };
  
  const handleAddRepairHistory = async () => {
    try {
      // 필수 필드 검증
      if (!validateRequiredField(repairData.description, '손상 내용') || 
          !validateRequiredField(repairData.issue_date, '발생일')) {
        return;
      }
      
      // 해결 여부가 true인데 해결 일시가 없는 경우 현재 날짜로 설정
      let updatedRepairData = { ...repairData };
      
      // 해결 여부가 true인 경우 해결 일시 필수
      if (updatedRepairData.resolved) {
        if (!updatedRepairData.resolved_date || updatedRepairData.resolved_date === '') {
          updatedRepairData.resolved_date = new Date().toISOString().substring(0, 10);
        }
      } else {
        // 해결 여부가 false인 경우 해결 일시를 null로 설정
        updatedRepairData.resolved_date = null;
      }
      
      console.log('손상/수리 이력 추가 데이터:', updatedRepairData);
      
      const response = await apiService.equipment.addRepair(id, {
        ...updatedRepairData,
        equipment: parseInt(id)
      });
      
      console.log('손상/수리 이력 추가 응답:', response);
      
      setOpenRepairDialog(false);
      
      await dispatch(fetchEquipmentById(id));
      
      setSnackbar({ open: true, message: '손상/수리 이력이 추가되었습니다.', severity: 'success' });
      
      setRepairData({
        description: '',
        issue_date: new Date().toISOString().substring(0, 10),
        issue_type: 'repair',
        resolved: false,
        resolved_date: null
      });
    } catch (err) {
      console.error('손상/수리 이력 추가 error:', err);
      if (err.data) {
        console.error('에러 응답 데이터:', err.data);
      }
      handleApiError(err, '손상/수리 이력 추가');
    }
  };
  
  const handleEditRepairHistory = (history) => {
    const resolvedDate = history.resolved && !history.resolved_date 
      ? new Date().toISOString().split('T')[0] 
      : history.resolved_date || '';
    
    setSelectedRepair(history);
    setRepairData({
      issue_date: history.issue_date,
      issue_type: history.issue_type,
      description: history.description,
      resolved: history.resolved,
      resolved_date: resolvedDate
    });
    setEditRepairOpen(true);
  };
  
  const handleUpdateRepairHistory = async () => {
    try {
      // 필수 필드 검증
      if (!validateRequiredField(repairData.description, '손상 내용') || 
          !validateRequiredField(repairData.issue_date, '발생일')) {
        return;
      }
      
      // 해결 여부가 true인데 해결 일시가 없는 경우 현재 날짜로 설정
      let updatedRepairData = { ...repairData };
      
      // 해결 여부가 true인 경우 해결 일시 필수
      if (updatedRepairData.resolved) {
        if (!updatedRepairData.resolved_date || updatedRepairData.resolved_date === '') {
          updatedRepairData.resolved_date = new Date().toISOString().substring(0, 10);
        }
      } else {
        // 해결 여부가 false인 경우 해결 일시를 null로 설정
        updatedRepairData.resolved_date = null;
      }
      
      console.log('손상/수리 이력 수정 데이터:', updatedRepairData);
      
      await apiService.equipment.deleteRepair(id, selectedRepair.id);
      const response = await apiService.equipment.addRepair(id, {
        ...updatedRepairData,
        equipment: parseInt(id)
      });
      
      console.log('손상/수리 이력 수정 응답:', response);
      
      setEditRepairOpen(false);
      
      await dispatch(fetchEquipmentById(id));
      
      setSnackbar({ open: true, message: '손상/수리 이력이 수정되었습니다.', severity: 'success' });
      
      setRepairData({
        description: '',
        issue_date: new Date().toISOString().substring(0, 10),
        issue_type: 'repair',
        resolved: false,
        resolved_date: null
      });
    } catch (err) {
      console.error('손상/수리 이력 수정 error:', err);
      if (err.data) {
        console.error('에러 응답 데이터:', err.data);
      }
      handleApiError(err, '손상/수리 이력 수정');
    }
  };
  
  const handleDeleteRepairHistory = (repairId) => {
    setRepairToDelete(repairId);
    setDeleteRepairDialogOpen(true);
  };
  
  const confirmDeleteRepairHistory = async () => {
    try {
      await apiService.equipment.deleteRepair(id, repairToDelete);
      
      setDeleteRepairDialogOpen(false);
      
      await dispatch(fetchEquipmentById(id));
      
      setSnackbar({ open: true, message: '손상/수리 이력이 삭제되었습니다.', severity: 'success' });
    } catch (err) {
      handleApiError(err, '손상/수리 이력 삭제');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available':
        return '#4caf50';
      case 'borrowed':
        return '#ff9800';
      case 'checked_out':
        return '#2196f3';
      case 'calibration_soon':
        return '#ffeb3b';
      case 'calibration_overdue':
        return '#f44336';
      case 'spare':
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  if (loading) return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
      <CircularProgress />
    </Box>
    </Container>
  );
  if (error) return <Typography color="error">{typeof error === 'object' ? JSON.stringify(error) : error}</Typography>;
  if (!equipment) return <Typography>장비 정보를 찾을 수 없습니다.</Typography>;

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: '1200px', margin: '0 auto', mt: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1">{equipment.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip 
                label={
                  equipment.status === 'available' ? '사용 가능' :
                  equipment.status === 'borrowed' ? '대여 중' :
                  equipment.status === 'checked_out' ? '반출 중' :
                  equipment.status === 'calibration_soon' ? '교정 예정' :
                  equipment.status === 'calibration_overdue' ? '교정 기한 초과' :
                  equipment.status === 'spare' ? '여분' : '오류'
                }
                sx={{ 
                  color: 'white',
                  bgcolor: getStatusColor(equipment.status),
                  fontWeight: 'bold',
                mr: 2
                }}
              />
            <Typography variant="body1" color="text.secondary">관리번호: {equipment.management_number}</Typography>
            </Box>
        </Box>
        
        <Box>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/equipment')}
            sx={{ mr: 1 }}
          >
            목록으로
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />} 
            onClick={() => navigate(`/equipment/edit/${id}`)}
            sx={{ mr: 1 }}
          >
            수정
          </Button>
          {equipment.status === 'available' && (
            <>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => setOpenBorrowDialog(true)}
                sx={{ mr: 1 }}
              >
                대여
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={() => setOpenCheckoutDialog(true)}
              >
                반출
              </Button>
            </>
          )}
          {['borrowed', 'checked_out'].includes(equipment.status) && (
            <Button 
              variant="contained"
              color="success"
              onClick={handleReturn}
            >
              반납
            </Button>
          )}
        </Box>
      </Box>

      {/* 탭 네비게이션 추가 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="장비 상세 정보 탭">
          <Tab label="기본 정보" />
          <Tab label="기술 정보" />
          <Tab label="교정/관리 정보" />
          <Tab label="장비 사진" />
          <Tab label="이력 관리" />
        </Tabs>
      </Box>

      {/* 기본 정보 탭 */}
      <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card variant="outlined">
                <CardHeader title="기본 정보" />
                <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box mb={2}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>장비 기본 정보</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">자산번호</Typography>
                      <Typography variant="body1">{equipment.asset_number || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">모델명</Typography>
                      <Typography variant="body1">{equipment.model_name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">제조사</Typography>
                      <Typography variant="body1">{equipment.manufacturer}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">일련번호</Typography>
                      <Typography variant="body1">{equipment.serial_number}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">구입년도</Typography>
                      <Typography variant="body1">{equipment.purchase_year || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">위치</Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'primary.main' }} />
                        {equipment.location}
                      </Typography>
                    </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">설치 일시</Typography>
                          <Typography variant="body1">{equipment.installation_date || 'N/A'}</Typography>
                        </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">중간점검 대상</Typography>
                      <Typography variant="body1">{equipment.intermediate_check ? '예' : '아니오'}</Typography>
                    </Grid>
                    </Grid>
                    </Box>
                  </Grid>
            <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>추가 정보</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">공급사</Typography>
                          <Typography variant="body1">{equipment.supplier || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">공급사 연락처</Typography>
                          <Typography variant="body1">{equipment.supplier_contact || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">제조사 연락처</Typography>
                          <Typography variant="body1">{equipment.manufacturer_contact || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">기술책임자(정)</Typography>
                          <Typography variant="body1">{equipment.primary_technical_manager || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">기술책임자(부)</Typography>
                          <Typography variant="body1">{equipment.secondary_technical_manager || 'N/A'}</Typography>
                    </Grid>
            </Grid>
            
                      <Box mt={3}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>장비 사양</Typography>
                        <Typography variant="body1">{equipment.specifications || '-'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardHeader title="상태 정보" />
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>현재 상태:</Typography>
                    <Chip 
                      label={
                        equipment.status === 'available' ? '사용 가능' :
                        equipment.status === 'borrowed' ? '대여 중' :
                        equipment.status === 'checked_out' ? '반출 중' :
                        equipment.status === 'calibration_soon' ? '교정 예정' :
                        equipment.status === 'calibration_overdue' ? '교정 기한 초과' :
                        equipment.status === 'spare' ? '여분' : '오류'
                      }
                      sx={{ 
                        color: 'white',
                        bgcolor: getStatusColor(equipment.status),
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {equipment.status === 'available' ? '이 장비는 현재 사용 가능한 상태입니다. 대여 또는 반출이 가능합니다.' :
                     equipment.status === 'borrowed' ? '이 장비는 현재 대여 중입니다. 반납 후 사용 가능합니다.' :
                     equipment.status === 'checked_out' ? '이 장비는 현재 반출 중입니다. 반납 후 사용 가능합니다.' :
                     equipment.status === 'calibration_soon' ? '이 장비는 곧 교정이 필요합니다. 교정 일정을 확인해주세요.' :
                     equipment.status === 'calibration_overdue' ? '이 장비는 교정 기한이 지났습니다. 즉시 교정이 필요합니다.' :
                     equipment.status === 'spare' ? '이 장비는 여분 장비입니다.' : '상태 정보를 확인할 수 없습니다.'}
                  </Typography>
                  
                  {equipment.status === 'borrowed' && (
                  <Box sx={{ mt: 2, border: '1px solid #e0e0e0', borderRadius: 1, p: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>대여 정보</Typography>
                    {/* 디버깅용 정보 출력 */}
                    {(() => {
                      console.log('렌더링 시 대여 정보:', {
                        borrower: equipment.borrower,
                        borrower_name: equipment.borrower_name,
                        borrower_department: equipment.borrower_department,
                        borrowed_date: equipment.borrowed_date,
                        expected_return_date: equipment.expected_return_date
                      });
                      
                      // 대여 정보가 전혀 없는 경우 표시할 메시지
                      const hasBorrowInfo = equipment.borrower_name || 
                        equipment.borrower_department || 
                        equipment.borrowed_date || 
                        equipment.expected_return_date;
                        
                      if (!hasBorrowInfo) {
                          return (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            대여 정보가 정확하게 기록되지 않았습니다. 관리자에게 문의하세요.
                          </Alert>
                        );
                      }
                      
                      return null;
                    })()}
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">대여자</Typography>
                        <Typography variant="body1" fontWeight="medium">{equipment.borrower_name || '정보 없음'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">부서</Typography>
                        <Typography variant="body1">{equipment.borrower_department || '정보 없음'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">대여일</Typography>
                        <Typography variant="body1">
                          {(() => {
                            // borrowed_date가 있으면 그것을 사용하고, 없으면 loan_date에서 날짜 부분만 추출해서 사용
                            if (equipment.borrowed_date) {
                              return formatDate(equipment.borrowed_date);
                            } else if (equipment.loan_date) {
                              // loan_date는 ISO 형식 문자열이거나 Date 객체일 수 있음
                              return formatDate(
                                typeof equipment.loan_date === 'string' 
                                  ? equipment.loan_date.split('T')[0] 
                                  : equipment.loan_date
                              );
                            } else if (equipment.loans && equipment.loans.length > 0) {
                              // 장비의 대여 기록에서 가장 최근 대여 정보의 날짜 사용
                              const loansArray = [...equipment.loans];
                              loansArray.sort((a, b) => new Date(b.loan_date) - new Date(a.loan_date));
                              const latestLoan = loansArray[0];
                              
                              if (latestLoan.borrowed_date) {
                                return formatDate(latestLoan.borrowed_date);
                              } else if (latestLoan.loan_date) {
                                return formatDate(
                                  typeof latestLoan.loan_date === 'string'
                                    ? latestLoan.loan_date.split('T')[0]
                                    : latestLoan.loan_date
                                );
                              }
                            }
                            return '정보 없음';
                          })()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">예상 반납일</Typography>
                        <Typography variant="body1">{formatDate(equipment.expected_return_date) || '정보 없음'}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">대여 기간</Typography>
                        <Typography variant="body1">
                          {(() => {
                            // 대여일과 예상 반납일 중 하나라도 없으면 계산 불가
                            const startDateStr = equipment.borrowed_date || (equipment.loan_date ? (typeof equipment.loan_date === 'string' ? equipment.loan_date.split('T')[0] : equipment.loan_date) : null);
                            const endDateStr = equipment.expected_return_date;
                            
                            if (!startDateStr || !endDateStr) {
                              return '정보 없음';
                            }
                            
                            try {
                              const startDate = new Date(startDateStr);
                              const endDate = new Date(endDateStr);
                              
                              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                                return '정보 없음';
                              }
                              
                              // 날짜 차이 계산 (밀리초)
                              const diffTime = Math.abs(endDate - startDate);
                              // 일 수 계산
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              return `${diffDays}일`;
                            } catch (error) {
                              console.error('대여 기간 계산 오류:', error);
                              return '정보 없음';
                            }
                          })()}
                        </Typography>
                      </Grid>
                    </Grid>
                    </Box>
                  )}
                  
                  {equipment.status === 'checked_out' && (
                  <Box sx={{ mt: 2, border: '1px solid #e0e0e0', borderRadius: 1, p: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>반출 정보</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                      <Typography variant="body2">
                          반출 중인 장비입니다. 상세 정보는 
                        <Button 
                          color="primary" 
                            variant="outlined"
                          size="small" 
                            sx={{ mx: 1, textTransform: 'none' }}
                            onClick={() => navigate('/checkout')}
                        >
                          반출관리 페이지
                        </Button>
                        에서 확인할 수 있습니다.
                      </Typography>
                      </Grid>
                      
                      {equipment.checkout_info && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">반출지</Typography>
                            <Typography variant="body1">{equipment.checkout_info.checkout_location || '정보 없음'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">반출자</Typography>
                            <Typography variant="body1">{equipment.checkout_info.person_in_charge || '정보 없음'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">반출일</Typography>
                            <Typography variant="body1">{formatDate(equipment.checkout_info.checkout_date) || '정보 없음'}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">예상 반납일</Typography>
                            <Typography variant="body1">{formatDate(equipment.checkout_info.expected_return_date) || '정보 없음'}</Typography>
                          </Grid>
                        </>
                      )}
                    </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
      </TabPanel>

      {/* 기술 정보 탭 */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="S/W 및 펌웨어 정보" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">관련 S/W 버전</Typography>
                    <Typography variant="body1">{equipment.software_version || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">펌웨어 버전</Typography>
                    <Typography variant="body1">{equipment.firmware_version || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">메뉴얼 보관 위치</Typography>
                    <Typography variant="body1">{equipment.manual_location || 'N/A'}</Typography>
                  </Grid>
                </Grid>
        </CardContent>
      </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="부속품 및 주요 기능" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">부속품 목록</Typography>
                    <Typography variant="body1">{equipment.accessories || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">주요 기능</Typography>
                    <Typography variant="body1">{equipment.key_features || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader title="품질 정보" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">시방일치 여부</Typography>
                    <Typography variant="body1">{equipment.specification_compliance ? '일치' : '불일치'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">교정 필요 여부</Typography>
                    <Typography variant="body1">{equipment.needs_calibration ? '필요' : '불필요'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 교정/관리 정보 탭 */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader title="교정 정보" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">교정 관리방법</Typography>
                    <Typography variant="body1">
                      {equipment.management_method === 'external_calibration' ? '교정' :
                       equipment.management_method === 'calibration' ? '교정' :  
                       equipment.management_method === 'self_check' ? '검증/유지보수' :
                       equipment.management_method === 'verification' ? '검증' :
                       equipment.management_method === 'maintenance' ? '유지보수' :
                       equipment.management_method === 'not_applicable' ? '비대상' : 
                       equipment.management_method ? equipment.management_method : '정보 없음'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">교정 주기</Typography>
                    <Typography variant="body1">
                      {equipment.management_method === 'not_applicable' ? 
                        '비대상' : 
                        equipment.calibration_cycle ? `${equipment.calibration_cycle}개월` : '정보 없음'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">최종교정일</Typography>
                    <Typography variant="body1">
                      {equipment.management_method === 'not_applicable' ? 
                        '비대상' : 
                        (equipment.last_calibration_date ? formatDate(equipment.last_calibration_date) : 'N/A')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">차기교정일</Typography>
                    <Typography variant="body1">
                      {equipment.management_method === 'not_applicable' ? 
                        '비대상' : 
                        (equipment.next_calibration_date ? formatDate(equipment.next_calibration_date) : '-')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">교정 기관</Typography>
                    <Typography variant="body1">{equipment.calibration_institution || '-'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader 
                title="교정 이력" 
                action={
            <Button 
              size="small"
                    onClick={() => setAddCalibrationOpen(true)}
                    disabled={equipment.management_method === 'not_applicable'}
            >
                    교정 이력 추가
            </Button>
                }
              />
              <CardContent>
                {equipment.calibration_history && equipment.calibration_history.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                <TableRow>
                          <TableCell>교정일</TableCell>
                          <TableCell>교정기관</TableCell>
                          <TableCell>결과</TableCell>
                          <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                        {equipment.calibration_history.map((history) => (
                          <TableRow key={history.id}>
                            <TableCell>{formatDate(history.calibration_date)}</TableCell>
                            <TableCell>{history.institution}</TableCell>
                            <TableCell>{history.result}</TableCell>
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setSelectedCalibration(history);
                                  setEditCalibrationOpen(true);
                                }}
                              >
                          <EditIcon fontSize="small" />
                        </IconButton>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => {
                                  setCalibrationToDelete(history.id);
                                  setDeleteCalibrationDialogOpen(true);
                                }}
                              >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                        ))}
              </TableBody>
            </Table>
          </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                    {equipment.management_method === 'not_applicable' ? 
                      '비대상 장비입니다.' : 
                      '교정 이력이 없습니다.'}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        </TabPanel>

      {/* 사진 및 문서 탭 */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardHeader title="장비 사진" />
              <CardContent sx={{ textAlign: 'center' }}>
                {equipment.image ? (
                  <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
                    <img 
                      src={equipment.image} 
                      alt={equipment.name} 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }} 
                    />
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 400, 
                      bgcolor: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography color="text.secondary">등록된 사진이 없습니다</Typography>
          </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 이력 관리 탭 */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          {/* 위치 변동 이력 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader 
                title="위치 변동 이력" 
                action={
                  <Button size="small" onClick={() => setOpenLocationDialog(true)}>위치 변동 추가</Button>
                }
              />
              <CardContent>
                {equipment.location_history && equipment.location_history.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>변동일</TableCell>
                          <TableCell>위치</TableCell>
                          <TableCell>비고</TableCell>
                          <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                        {equipment.location_history.map((history) => (
                          <TableRow key={history.id}>
                            <TableCell>{formatDate(history.change_date)}</TableCell>
                            <TableCell>{history.location}</TableCell>
                            <TableCell>{history.notes}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => handleEditLocationHistory(history)}>
                                <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                                color="error" 
                                onClick={() => handleDeleteLocationHistory(history.id)}
                          >
                                <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                    </TableRow>
                        ))}
              </TableBody>
            </Table>
          </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                    위치 변동 이력이 없습니다.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 유지보수 이력 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader 
                title="유지보수 이력" 
                action={
                  <Button size="small" onClick={() => setOpenMaintenanceDialog(true)}>유지보수 이력 추가</Button>
                }
              />
              <CardContent>
                {equipment.maintenance_history && equipment.maintenance_history.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                <TableRow>
                          <TableCell>날짜</TableCell>
                          <TableCell>유형</TableCell>
                  <TableCell>수행자</TableCell>
                          <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                        {equipment.maintenance_history.map((history) => (
                          <TableRow key={history.id}>
                      <TableCell>{formatDate(history.maintenance_date)}</TableCell>
                      <TableCell>
                              {history.maintenance_type === 'regular' ? '정기' : 
                               history.maintenance_type === 'emergency' ? '긴급' : 
                               history.maintenance_type === 'preventive' ? '예방' : '기타'}
                            </TableCell>
                            <TableCell>{history.performed_by}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => handleEditMaintenanceHistory(history)}>
                                <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                                color="error" 
                          onClick={() => handleDeleteMaintenanceHistory(history.id)}
                        >
                                <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                        ))}
              </TableBody>
            </Table>
          </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                    유지보수 이력이 없습니다.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 손상/수리 이력 */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader 
                title="손상/수리 이력" 
                action={
                  <Button size="small" onClick={() => setOpenRepairDialog(true)}>손상/수리 이력 추가</Button>
                }
              />
              <CardContent>
                {equipment.repair_history && equipment.repair_history.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                <TableRow>
                          <TableCell>발생일</TableCell>
                  <TableCell>유형</TableCell>
                          <TableCell>내용</TableCell>
                  <TableCell>해결 여부</TableCell>
                          <TableCell>해결일</TableCell>
                          <TableCell align="right">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                        {equipment.repair_history.map((history) => (
                          <TableRow key={history.id}>
                      <TableCell>{formatDate(history.issue_date)}</TableCell>
                            <TableCell>
                              {history.issue_type === 'damage' ? '손상' : 
                               history.issue_type === 'malfunction' ? '오작동' : 
                               history.issue_type === 'modification' ? '변경' : '수리'}
                            </TableCell>
                            <TableCell>{history.description}</TableCell>
                      <TableCell>
                        <Chip 
                          label={history.resolved ? '해결됨' : '미해결'} 
                          color={history.resolved ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                            <TableCell>{history.resolved ? formatDate(history.resolved_date) : '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => handleEditRepairHistory(history)}>
                                <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                                color="error" 
                          onClick={() => handleDeleteRepairHistory(history.id)}
                        >
                                <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                        ))}
              </TableBody>
            </Table>
          </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                    손상/수리 이력이 없습니다.
                  </Typography>
                )}
              </CardContent>
      </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* 다이얼로그들 */}
      <BorrowDialog
        open={openBorrowDialog}
        onClose={() => setOpenBorrowDialog(false)}
        onSubmit={handleBorrow}
        borrowData={borrowData}
        setBorrowData={setBorrowData}
      />

      <CheckoutDialog
        open={openCheckoutDialog}
        onClose={() => setOpenCheckoutDialog(false)}
        onSubmit={handleCheckout}
        checkoutData={checkoutData}
        setCheckoutData={setCheckoutData}
        equipment={equipment}
      />

      <LocationDialog
        open={openLocationDialog}
        onClose={() => setOpenLocationDialog(false)}
        onSubmit={handleAddLocationHistory}
        locationData={locationData}
        setLocationData={setLocationData}
      />

      <LocationDialog
        open={editLocationOpen}
        onClose={() => setEditLocationOpen(false)}
        onSubmit={handleUpdateLocationHistory}
        locationData={locationData}
        setLocationData={setLocationData}
        isEdit={true}
      />

      <MaintenanceDialog
        open={openMaintenanceDialog}
        onClose={() => setOpenMaintenanceDialog(false)}
        onSubmit={handleAddMaintenanceHistory}
        maintenanceData={maintenanceData}
        setMaintenanceData={setMaintenanceData}
      />

      <MaintenanceDialog
        open={editMaintenanceOpen}
        onClose={() => setEditMaintenanceOpen(false)}
        onSubmit={handleUpdateMaintenanceHistory}
        maintenanceData={maintenanceData}
        setMaintenanceData={setMaintenanceData}
        isEdit={true}
      />

      <RepairDialog
        open={openRepairDialog}
        onClose={() => setOpenRepairDialog(false)}
        onSubmit={handleAddRepairHistory}
        repairData={repairData}
        setRepairData={setRepairData}
      />

      <RepairDialog
        open={editRepairOpen}
        onClose={() => setEditRepairOpen(false)}
        onSubmit={handleUpdateRepairHistory}
        repairData={repairData}
        setRepairData={setRepairData}
        isEdit={true}
      />
      
      <AddCalibrationHistory
        open={addCalibrationOpen}
        onClose={handleCloseCalibrationDialog}
        equipmentId={id}
      />
      
      <EditCalibrationHistory
        open={editCalibrationOpen}
        onClose={() => {
          setEditCalibrationOpen(false);
          dispatch(fetchEquipmentById(id));
        }}
        calibration={selectedCalibration}
        equipmentId={id}
      />
      
      <Dialog
        open={deleteCalibrationDialogOpen}
        onClose={() => setDeleteCalibrationDialogOpen(false)}
      >
        <DialogTitle>교정 이력 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 교정 이력을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCalibrationDialogOpen(false)}>취소</Button>
          <Button onClick={confirmDeleteCalibration} color="error">삭제</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog
        open={deleteLocationDialogOpen}
        onClose={() => setDeleteLocationDialogOpen(false)}
      >
        <DialogTitle>위치 변동 이력 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 위치 변동 이력을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteLocationDialogOpen(false)}>취소</Button>
          <Button onClick={confirmDeleteLocationHistory} color="error">삭제</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteMaintenanceDialogOpen}
        onClose={() => setDeleteMaintenanceDialogOpen(false)}
      >
        <DialogTitle>유지보수 이력 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 유지보수 이력을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteMaintenanceDialogOpen(false)}>취소</Button>
          <Button onClick={confirmDeleteMaintenanceHistory} color="error">삭제</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteRepairDialogOpen}
        onClose={() => setDeleteRepairDialogOpen(false)}
      >
        <DialogTitle>손상/수리 이력 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 손상/수리 이력을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRepairDialogOpen(false)}>취소</Button>
          <Button onClick={confirmDeleteRepairHistory} color="error">삭제</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert onClose={() => setSnackbar({...snackbar, open: false})} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default EquipmentDetail;