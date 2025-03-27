import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchEquipment, deleteEquipment } from '../store/equipmentSlice';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, TextField, Button, CircularProgress, IconButton,
  TablePagination, Snackbar, Box, Chip, InputAdornment, Divider,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert,
  Stack, Tooltip, Pagination, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  List, ListItem, ListItemText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateFormatter';
import { debounce } from 'lodash';
import { addMonths } from 'date-fns';
import apiService from '../services/api';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// 검색 입력 필드를 메모이제이션하여 불필요한 리렌더링 방지
const SearchField = memo(({ 
  searchInput, 
  handleSearchChange, 
  handleClearSearch, 
  handleSearchSubmit, 
  toggleFilters 
}) => (
  <form onSubmit={handleSearchSubmit}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <TextField
        label="장비 검색"
        variant="outlined"
        size="small"
        fullWidth
        value={searchInput}
        onChange={handleSearchChange}
        autoComplete="off"
        inputProps={{
          autoComplete: 'off',
          'aria-autocomplete': 'none'
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchInput && (
            <InputAdornment position="end">
              <IconButton
                aria-label="검색어 지우기"
                onClick={handleClearSearch}
                edge="end"
                size="small"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        sx={{ ml: 1 }}
      >
        검색
      </Button>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<FilterListIcon />}
        onClick={toggleFilters}
        sx={{ ml: 1 }}
      >
        필터
      </Button>
    </Box>
  </form>
));

function EquipmentList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const equipment = useSelector(state => state.equipment.items);
  const status = useSelector(state => state.equipment.status);
  const error = useSelector(state => state.equipment.error);
  const totalCount = useSelector(state => state.equipment.totalCount);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadInput, setUploadInput] = useState(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // 사용자 팀 정보 처리
  const getUserTeam = useCallback(() => {
    // 실제 구현에서는 currentUser에서 팀 정보를 가져와야 합니다.
    // 예: currentUser.team 또는 다른 방식으로 사용자 팀 정보를 얻을 수 있습니다.
    // 여기서는 임시로 'RF'팀으로 가정합니다.
    return currentUser?.team || 'RF';
  }, [currentUser]);
  
  // 필터 상태 추가
  const [filters, setFilters] = useState(() => {
    // localStorage에서 사용자 필터 설정을 가져오거나, 없으면 사용자 팀을 기본 필터로 사용
    const savedFilters = localStorage.getItem('equipmentFilters');
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    
    // 사용자 팀 정보가 있으면 해당 팀을 기본 필터로 설정
    return {
      status: '',
      location: '',
      manufacturer: '',
      team: getUserTeam() || '' // 사용자 팀 설정
    };
  });
  
  // 필터 옵션 상태 추가
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    manufacturers: [],
    teams: [
      { value: 'RF', label: 'RF팀' },
      { value: 'SAR', label: 'SAR팀' },
      { value: 'EMC', label: 'EMC팀' },
      { value: 'AUTO', label: 'Automotive팀' }
    ]
  });
  
  // 필터 표시 여부 상태 추가
  const [showFilters, setShowFilters] = useState(false);

  // 추가된 부분: currentUser 로깅
  useEffect(() => {
    console.log('EquipmentList: Current User:', currentUser);
  }, [currentUser]);

  // URL에서 페이지 및 페이지 크기 파라미터 가져오기
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageParam = params.get('page');
    const pageSizeParam = params.get('pageSize');
    const statusParam = params.get('status');
    const locationParam = params.get('location');
    const manufacturerParam = params.get('manufacturer');
    const teamParam = params.get('team');
    
    if (pageParam) {
      setPage(parseInt(pageParam) - 1); // 백엔드는 1부터 시작, 프론트엔드는 0부터 시작
    }
    
    if (pageSizeParam) {
      setRowsPerPage(parseInt(pageSizeParam));
    }
    
    // URL에서 필터 파라미터 가져오기
    const newFilters = { ...filters };
    
    if (statusParam) {
      newFilters.status = statusParam;
      console.log(`상태 필터 적용: ${statusParam}`);
    }
    
    if (locationParam) {
      newFilters.location = locationParam;
    }
    
    if (manufacturerParam) {
      newFilters.manufacturer = manufacturerParam;
    }

    if (teamParam) {
      // 'all' 값은 빈 문자열로 처리하여 모든 팀 표시
      newFilters.team = teamParam === 'all' ? '' : teamParam;
    } else if (location.search === '') {
      // URL에 팀 파라미터가 없고 처음 페이지에 접근하는 경우
      // 사용자의 팀으로 필터링
      newFilters.team = getUserTeam();
      
      // 필터 상태를 로컬 스토리지에 저장
      localStorage.setItem('equipmentFilters', JSON.stringify(newFilters));
    }
    
    setFilters(newFilters);
    
    // 필터가 변경되면 즉시 데이터를 다시 가져옴
    if (statusParam || locationParam || manufacturerParam || teamParam || location.search === '') {
      dispatch(fetchEquipment({ 
        page: pageParam ? parseInt(pageParam) : page + 1,
        pageSize: pageSizeParam ? parseInt(pageSizeParam) : rowsPerPage,
        search,
        ...newFilters
      }));
    }
  }, [location.search, dispatch, getUserTeam]);

  const fetchEquipmentData = useCallback(() => {
    setIsSearching(true);
    dispatch(fetchEquipment({ 
      page: page + 1, // 백엔드는 1부터 시작하므로 +1
      pageSize: rowsPerPage, // 백엔드의 page_size_query_param과 일치하도록 수정
      search,
      ...filters // 필터 파라미터 추가
    }))
      .then(() => {
        setIsSearching(false);
        setLastUpdated(new Date().toLocaleString());
      })
      .catch(() => {
        setIsSearching(false);
      });
  }, [dispatch, page, rowsPerPage, search, filters]);

  useEffect(() => {
    fetchEquipmentData();
  }, [fetchEquipmentData]);
  
  // 필터 옵션 가져오기
  useEffect(() => {
    // 장비 데이터에서 고유한 위치와 제조사 목록 추출
    if (equipment && equipment.length > 0) {
      const locations = [...new Set(equipment.map(item => item.location).filter(Boolean))];
      const manufacturers = [...new Set(equipment.map(item => item.manufacturer).filter(Boolean))];
      
      setFilterOptions(prev => ({
        ...prev, // 기존 teams 배열을 유지하기 위해 이전 상태 전체를 복사
        locations,
        manufacturers
      }));
    }
  }, [equipment]);

  // URL 업데이트 함수
  const updateUrlWithFilters = useCallback((newPage, newPageSize, newFilters = filters) => {
    const params = new URLSearchParams();
    params.set('page', newPage.toString());
    params.set('pageSize', newPageSize.toString());
    
    if (newFilters.status) {
      params.set('status', newFilters.status);
    }
    
    if (newFilters.location) {
      params.set('location', newFilters.location);
    }
    
    if (newFilters.manufacturer) {
      params.set('manufacturer', newFilters.manufacturer);
    }
    
    if (newFilters.team) {
      params.set('team', newFilters.team);
    }
    
    navigate(`/equipment?${params.toString()}`);
  }, [navigate, filters]);

  // 디바운스 함수 참조 저장
  const searchDebounceRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // 즉시 UI 업데이트를 위해 로컬 상태 직접 설정
    setSearchInput(value);
    
    // 이전 디바운스 타이머 취소
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // 새 디바운스 타이머 설정 (3초로 증가)
    // 최소 2글자 이상 입력해야 검색 실행
    if (value.length >= 2 || value.length === 0) {
      searchDebounceRef.current = setTimeout(() => {
        setSearch(value);
        setPage(0);
        updateUrlWithFilters(1, rowsPerPage);
      }, 1000); // 1초 디바운스 타임
    }
  };

  // 컴포넌트 언마운트 시 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // 이미 디바운스된 함수에서 검색을 수행하므로 여기서는 중복 호출 방지
    if (searchInput !== search) {
      // 이전 디바운스 타이머 취소
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      
      // 최소 2글자 이상 입력해야 검색 실행 (검색 버튼 클릭 시에도 적용)
      if (searchInput.length >= 2 || searchInput.length === 0) {
        setSearch(searchInput);
        setPage(0);
        updateUrlWithFilters(1, rowsPerPage);
      } else {
        // 2글자 미만인 경우 알림 표시
        setSnackbar({ 
          open: true, 
          message: '검색어는 최소 2글자 이상 입력해주세요.', 
          severity: 'warning' 
        });
      }
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    // 이전 디바운스 타이머 취소
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    // 검색어를 지울 때는 즉시 검색 초기화
    setSearch('');
    setPage(0);
    updateUrlWithFilters(1, rowsPerPage);
  };
  
  // 필터 변경 핸들러
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    
    setFilters(newFilters);
    setPage(0);
    
    // 필터 설정을 로컬 스토리지에 저장
    localStorage.setItem('equipmentFilters', JSON.stringify(newFilters));
    
    // 필터 변경 시 URL 업데이트 및 데이터 다시 가져오기
    updateUrlWithFilters(1, rowsPerPage, newFilters);
  };
  
  // 필터 초기화 핸들러
  const handleClearFilters = () => {
    const newFilters = {
      status: '',
      location: '',
      manufacturer: '',
      team: ''
    };
    
    setFilters(newFilters);
    setPage(0);
    
    // 필터 설정을 로컬 스토리지에서 제거
    localStorage.removeItem('equipmentFilters');
    
    updateUrlWithFilters(1, rowsPerPage, newFilters);
  };
  
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
    
    // 페이지 변경 시 URL 업데이트 및 데이터 다시 가져오기
    updateUrlWithFilters(newPage + 1, rowsPerPage);
    // fetchEquipmentData는 useEffect를 통해 자동으로 호출됨
  }, [rowsPerPage, updateUrlWithFilters]);

  const handleChangeRowsPerPage = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    
    // 페이지 크기 변경 시 URL 업데이트 및 데이터 다시 가져오기
    updateUrlWithFilters(1, newRowsPerPage);
    // fetchEquipmentData는 useEffect를 통해 자동으로 호출됨
  }, [updateUrlWithFilters]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('정말로 이 장비를 삭제하시겠습니까?')) {
      try {
        await dispatch(deleteEquipment(id)).unwrap();
        setSnackbar({ open: true, message: '장비가 성공적으로 삭제되었습니다.', severity: 'success' });
        // 삭제 후 현재 페이지 데이터 다시 가져오기
        fetchEquipmentData();
      } catch (error) {
        console.error('Failed to delete equipment:', error);
        setSnackbar({ open: true, message: '장비 삭제에 실패했습니다.', severity: 'error' });
      }
    }
  }, [dispatch, fetchEquipmentData]);

  const calculateNextCalibrationDate = useCallback((lastCalibrationDate, calibrationCycle, managementMethod) => {
    if (managementMethod !== 'external_calibration' || !lastCalibrationDate || !calibrationCycle) return '-';
    const nextCalibrationDate = addMonths(new Date(lastCalibrationDate), parseInt(calibrationCycle));
    const today = new Date();
    const daysUntilCalibration = Math.ceil((nextCalibrationDate - today) / (1000 * 60 * 60 * 24));
    
    if (nextCalibrationDate < today) {
      return `${formatDate(nextCalibrationDate)} (교정 기한 초과)`;
    } else if (daysUntilCalibration <= 90) {
      return `${formatDate(nextCalibrationDate)} (${daysUntilCalibration}일 후 교정 만료)`;
    }
    return formatDate(nextCalibrationDate);
  }, []);

  // 상태에 따른 색상 및 스타일 지정
  const getStatusStyle = useCallback((status) => {
    switch(status) {
      case 'available':
        return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
      case 'borrowed':
        return { backgroundColor: '#fff8e1', color: '#f57f17' };
      case 'checked_out':
        return { backgroundColor: '#e3f2fd', color: '#1565c0' };
      case 'calibration_soon':
        return { backgroundColor: '#fff8e1', color: '#f57f17' };
      case 'calibration_overdue':
        return { backgroundColor: '#ffebee', color: '#c62828' };
      case 'spare':
        return { backgroundColor: '#eeeeee', color: '#757575' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#757575' };
    }
  }, []);

  // 차기교정일 상태에 따른 스타일
  const getCalibrationDateStyle = useCallback((lastCalibrationDate, calibrationCycle, managementMethod) => {
    if (managementMethod !== 'external_calibration' || !lastCalibrationDate || !calibrationCycle) return {};
    
    const nextCalibrationDate = addMonths(new Date(lastCalibrationDate), parseInt(calibrationCycle));
    const today = new Date();
    
    if (nextCalibrationDate < today) {
      return { color: '#c62828', fontWeight: 'bold' };
    } else if (nextCalibrationDate <= addMonths(today, 3)) {
      return { color: '#f57f17', fontWeight: 'bold' };
    }
    return {};
  }, []);

  const handleRefresh = () => {
    fetchEquipmentData();
  };

  // 메모이제이션된 테이블 행 렌더링
  const renderTableRows = useMemo(() => {
    if (equipment.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={18} align="center" sx={{ py: 3 }}>
            {search ? `"${search}" 검색 결과가 없습니다.` : '장비 목록이 없습니다.'}
          </TableCell>
        </TableRow>
      );
    }

    return equipment.map(item => (
      <TableRow 
        key={item.id} 
        hover
        sx={{ 
          '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
          '&:hover': { backgroundColor: '#f1f8e9' }
        }}
      >
        <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          {item.management_number}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.team === 'RF' ? 'RF팀' : item.team === 'SAR' ? 'SAR팀' : item.team}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.asset_number}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
          {item.name}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.management_method === 'external_calibration' ? formatDate(item.last_calibration_date) : '-'}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.management_method === 'external_calibration' ? item.calibration_institution : '-'}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.management_method === 'external_calibration' ? item.calibration_cycle : '-'}
        </TableCell>
        <TableCell 
          align="center" 
          sx={{ 
            fontSize: '0.8rem',
            ...getCalibrationDateStyle(item.last_calibration_date, item.calibration_cycle, item.management_method)
          }}
        >
          {item.management_method === 'external_calibration' ? calculateNextCalibrationDate(item.last_calibration_date, item.calibration_cycle, item.management_method) : '-'}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.manufacturer}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.purchase_year}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.model_name}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.serial_number}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.specifications}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.location}
        </TableCell>
        <TableCell align="center" sx={{ fontSize: '0.8rem' }}>
          {item.intermediate_check ? '예' : '아니오'}
        </TableCell>
        <TableCell align="center">
          <Chip 
            label={
              item.status === 'available' ? '사용 가능' : 
              item.status === 'borrowed' ? '대여 중' : 
              item.status === 'checked_out' ? '반출 중' :
              item.status === 'calibration_soon' ? '교정 예정' :
              item.status === 'calibration_overdue' ? '교정 기한 초과' :
              item.status === 'spare' ? '여분' : '오류: 잘못된 상태'
            }
            size="small"
            sx={{
              fontSize: '0.75rem',
              ...getStatusStyle(item.status)
            }}
          />
        </TableCell>
        <TableCell align="center">
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton 
              component={Link} 
              to={`/equipment/${item.id}`} 
              color="primary" 
              aria-label="상세 보기"
              size="small"
              sx={{ mx: 0.5 }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            {(currentUser.role === 'admin' || currentUser.role === 'approver') && (
              <>
                <IconButton 
                  component={Link} 
                  to={`/equipment/edit/${item.id}`} 
                  color="primary" 
                  aria-label="수정"
                  size="small"
                  sx={{ mx: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  onClick={() => handleDelete(item.id)} 
                  color="secondary" 
                  aria-label="삭제"
                  size="small"
                  sx={{ mx: 0.5 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </TableCell>
      </TableRow>
    ));
  }, [equipment, search, getStatusStyle, getCalibrationDateStyle, calculateNextCalibrationDate, currentUser.role, handleDelete]);

  // 필터 토글 핸들러
  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  // 엑셀 파일 다운로드 처리 함수
  const handleExcelDownload = async () => {
    try {
      const response = await apiService.equipment.exportExcel();
      
      // 다운로드 파일 생성
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `장비목록_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: '엑셀 파일 다운로드 완료',
        severity: 'success'
      });
    } catch (error) {
      console.error('엑셀 파일 다운로드 실패:', error);
      setSnackbar({
        open: true,
        message: `엑셀 파일 다운로드 실패: ${error.message}`,
        severity: 'error'
      });
    }
  };

  if (status === 'loading' && !isSearching) return <CircularProgress />;
  if (status === 'failed') return <Typography color="error">{typeof error === 'object' ? JSON.stringify(error) : error}</Typography>;

  return (
    <Paper sx={{ p: 2, width: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          장비 목록
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {(currentUser.role === 'admin' || currentUser.role === 'approver') && (
            <>
              <Button 
                component={Link} 
                to="/equipment/new" 
                variant="contained" 
                color="primary"
                sx={{ mr: 1 }}
              >
                장비 추가
              </Button>
              
              {/* 엑셀 파일 다운로드 버튼 */}
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={handleExcelDownload}
                sx={{ mr: 1 }}
              >
                엑셀 다운로드
              </Button>
            </>
          )}
          
          <IconButton onClick={handleRefresh} color="primary" aria-label="새로고침">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <SearchField 
          searchInput={searchInput}
          handleSearchChange={handleSearchChange}
          handleClearSearch={handleClearSearch}
          handleSearchSubmit={handleSearchSubmit}
          toggleFilters={toggleFilters}
        />
        
        {showFilters && (
          <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              필터 옵션
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">상태</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    name="status"
                    value={filters.status}
                    label="상태"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="available">사용 가능</MenuItem>
                    <MenuItem value="borrowed">대여 중</MenuItem>
                    <MenuItem value="checked_out">반출 중</MenuItem>
                    <MenuItem value="calibration_soon">교정 예정</MenuItem>
                    <MenuItem value="calibration_overdue">교정 기한 초과</MenuItem>
                    <MenuItem value="spare">여분</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="team-filter-label">소속팀</InputLabel>
                  <Select
                    labelId="team-filter-label"
                    id="team-filter"
                    name="team"
                    value={filters.team}
                    label="소속팀"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">전체</MenuItem>
                    {filterOptions.teams.map(team => (
                      <MenuItem key={team.value} value={team.value}>{team.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="location-filter-label">위치</InputLabel>
                  <Select
                    labelId="location-filter-label"
                    id="location-filter"
                    name="location"
                    value={filters.location}
                    label="위치"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">전체</MenuItem>
                    {filterOptions.locations.map(location => (
                      <MenuItem key={location} value={location}>{location}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="manufacturer-filter-label">제조사</InputLabel>
                  <Select
                    labelId="manufacturer-filter-label"
                    id="manufacturer-filter"
                    name="manufacturer"
                    value={filters.manufacturer}
                    label="제조사"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">전체</MenuItem>
                    {filterOptions.manufacturers.map(manufacturer => (
                      <MenuItem key={manufacturer} value={manufacturer}>{manufacturer}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleClearFilters}
              >
                필터 초기화
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {lastUpdated && (
        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
          마지막 업데이트: {lastUpdated}
        </Typography>
      )}

      {status === 'loading' && !isSearching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {status === 'failed' && (
        <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, mb: 2 }}>
          <Typography color="error">오류 발생: {error}</Typography>
        </Box>
      )}
      
      <Divider sx={{ mb: 2 }} />
      
      <Paper sx={{ width: '100%', overflow: 'hidden', mb: 2 }}>
        {isSearching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2">검색 중...</Typography>
          </Box>
        )}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  관리번호
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  소속팀
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  자산번호
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    minWidth: 120
                  }}
                >
                  장비명
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  최종교정일
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  교정기관
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  교정주기(개월)
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    minWidth: 120
                  }}
                >
                  차기교정일
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  제조사
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  구입년도
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  모델명
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  일련번호
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  장비사양
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  위치
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  중간점검 대상
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    minWidth: 100
                  }}
                >
                  상태
                </TableCell>
                <TableCell 
                  align="center" 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  작업
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderTableRows}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100, 200, 500]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 항목 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 총 ${count}개`}
        />
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity || 'info'}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default EquipmentList;