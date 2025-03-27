import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, TextField, Button, Grid,
  InputAdornment, IconButton
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Inventory as InventoryIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import apiService from '../services/api';
import { formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';

function RecentActivity() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [page, rowsPerPage, filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // 백엔드에서 모든 장비 목록 가져오기
      const equipmentResponse = await apiService.equipment.getAll({ pageSize: 1000 });
      const allEquipment = equipmentResponse.data.results || [];
      
      // 백엔드에서 대여/반납 정보 가져오기
      const checkoutsResponse = await apiService.checkouts.getAll();
      const checkouts = checkoutsResponse.data.results || [];
      
      // 대시보드 요약 데이터 가져오기
      const summaryResponse = await apiService.dashboard.getSummary();
      const upcomingCalibrations = summaryResponse.data.upcoming_calibrations || [];
      const overdueCalibrations = summaryResponse.data.overdue_calibrations || [];
      
      // 활동 데이터 구성
      let allActivities = [];
      
      // 반출 활동 추가
      checkouts.forEach(checkout => {
        if (checkout.checkout_equipment && checkout.checkout_equipment.length > 0) {
          checkout.checkout_equipment.forEach((item, index) => {
            const equipmentName = item.equipment_name || (item.equipment ? item.equipment.name : '장비 정보 없음');
            const equipmentId = item.equipment ? item.equipment.id : null;
            
            allActivities.push({
              id: `checkout-${checkout.id}-${item.id || `unknown-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`}`,
              type: 'checkout',
              description: `${equipmentName} 반출됨`,
              equipment_name: equipmentName,
              equipment_id: equipmentId,
              location: checkout.checkout_location || '정보 없음',
              date: checkout.checkout_date,
              user: checkout.person_in_charge || '정보 없음'
            });
          });
        } else {
          // 장비 정보가 없는 경우
          allActivities.push({
            id: `checkout-${checkout.id}-unknown-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'checkout',
            description: `장비 반출됨`,
            equipment_name: '장비 정보 없음',
            equipment_id: null,
            location: checkout.checkout_location || '정보 없음',
            date: checkout.checkout_date,
            user: checkout.person_in_charge || '정보 없음'
          });
        }
      });
      
      // 반입 활동 추가
      checkouts.filter(c => c.return_date).forEach(checkout => {
        if (checkout.checkout_equipment && checkout.checkout_equipment.length > 0) {
          checkout.checkout_equipment.forEach((item, index) => {
            const equipmentName = item.equipment_name || (item.equipment ? item.equipment.name : '장비 정보 없음');
            const equipmentId = item.equipment ? item.equipment.id : null;
            
            allActivities.push({
              id: `return-${checkout.id}-${item.id || `unknown-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`}`,
              type: 'return',
              description: `${equipmentName} 반입됨`,
              equipment_name: equipmentName,
              equipment_id: equipmentId,
              location: checkout.returned_to || '정보 없음',
              date: checkout.return_date,
              user: checkout.returned_by || '정보 없음'
            });
          });
        } else {
          // 장비 정보가 없는 경우
          allActivities.push({
            id: `return-${checkout.id}-unknown-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'return',
            description: `장비 반입됨`,
            equipment_name: '장비 정보 없음',
            equipment_id: null,
            location: checkout.returned_to || '정보 없음',
            date: checkout.return_date,
            user: checkout.returned_by || '정보 없음'
          });
        }
      });
      
      // 교정 예정 활동 추가
      upcomingCalibrations.forEach(equipment => {
        allActivities.push({
          id: `calibration-upcoming-${equipment.id}`,
          type: 'calibration',
          description: `교정 예정`,
          equipment_name: equipment.name,
          equipment_id: equipment.id,
          location: equipment.location,
          date: equipment.next_calibration_date
        });
      });
      
      // 교정 기한 초과 활동 추가
      overdueCalibrations.forEach(equipment => {
        allActivities.push({
          id: `calibration-overdue-${equipment.id}`,
          type: 'calibration',
          description: `교정 기한 초과`,
          equipment_name: equipment.name,
          equipment_id: equipment.id,
          location: equipment.location,
          date: equipment.next_calibration_date
        });
      });
      
      // 대여 중인 장비 활동 추가
      const borrowedEquipment = allEquipment.filter(eq => eq.status === 'borrowed');
      borrowedEquipment.forEach(equipment => {
        allActivities.push({
          id: `borrow-${equipment.id}`,
          type: 'borrow',
          description: `장비 대여됨`,
          equipment_name: equipment.name,
          equipment_id: equipment.id,
          location: equipment.current_location || '정보 없음',
          date: equipment.borrowed_date || new Date().toISOString(),
          user: equipment.borrower_name || '정보 없음'
        });
      });
      
      // 유지보수 활동 추가 (장비에서 유지보수 이력 추출)
      allEquipment.forEach(equipment => {
        if (equipment.maintenance_history && equipment.maintenance_history.length > 0) {
          equipment.maintenance_history.forEach(maintenance => {
            allActivities.push({
              id: `maintenance-${equipment.id}-${maintenance.id}`,
              type: 'maintenance',
              description: `${equipment.name} 유지보수: ${maintenance.maintenance_type}`,
              equipment_name: equipment.name,
              equipment_id: equipment.id,
              location: equipment.location,
              date: maintenance.maintenance_date,
              details: maintenance.description
            });
          });
        }
      });
      
      // 날짜 기준 내림차순 정렬
      allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // 필터 적용
      let filteredActivities = allActivities;
      
      if (filters.type) {
        filteredActivities = filteredActivities.filter(activity => activity.type === filters.type);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredActivities = filteredActivities.filter(activity => new Date(activity.date) >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // 해당 날짜의 끝으로 설정
        filteredActivities = filteredActivities.filter(activity => new Date(activity.date) <= endDate);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredActivities = filteredActivities.filter(activity => 
          activity.equipment_name.toLowerCase().includes(searchLower) ||
          activity.description.toLowerCase().includes(searchLower) ||
          (activity.location && activity.location.toLowerCase().includes(searchLower)) ||
          (activity.user && activity.user.toLowerCase().includes(searchLower)) ||
          (activity.details && activity.details.toLowerCase().includes(searchLower))
        );
      }
      
      // 페이지네이션 적용
      setTotalCount(filteredActivities.length);
      const paginatedActivities = filteredActivities.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      );
      
      setActivities(paginatedActivities);
      setLoading(false);
    } catch (error) {
      console.error('활동 로그 데이터 로딩 중 오류 발생:', error);
      setError('활동 로그 데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(prev => ({
      ...prev,
      search: searchInput
    }));
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters(prev => ({
      ...prev,
      search: ''
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setSearchInput('');
    setPage(0);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'checkout':
        return <ArrowUpIcon color="primary" />;
      case 'return':
        return <ArrowDownIcon color="success" />;
      case 'calibration':
        return <CalendarIcon color="warning" />;
      case 'maintenance':
        return <InventoryIcon color="info" />;
      case 'borrow':
        return <PersonIcon color="secondary" />;
      default:
        return null;
    }
  };

  const getActivityChip = (type) => {
    return (
      <Chip
        label={
          type === 'checkout' ? '반출' :
          type === 'return' ? '반입' :
          type === 'calibration' ? '교정' : 
          type === 'borrow' ? '대여' : '유지보수'
        }
        size="small"
        color={
          type === 'checkout' ? 'primary' :
          type === 'return' ? 'success' :
          type === 'calibration' ? 'warning' : 
          type === 'borrow' ? 'secondary' : 'info'
        }
      />
    );
  };

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          최근 활동
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={toggleFilters}
        >
          {showFilters ? '필터 숨기기' : '필터 표시'}
        </Button>
      </Box>
      
      {/* 검색 및 필터 */}
      <Box sx={{ mb: 3 }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              label="검색"
              variant="outlined"
              size="small"
              fullWidth
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="장비명, 설명, 위치 등으로 검색"
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
          
          {showFilters && (
            <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                필터 옵션
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="type-filter-label">활동 유형</InputLabel>
                    <Select
                      labelId="type-filter-label"
                      id="type-filter"
                      name="type"
                      value={filters.type}
                      label="활동 유형"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">전체</MenuItem>
                      <MenuItem value="checkout">반출</MenuItem>
                      <MenuItem value="return">반입</MenuItem>
                      <MenuItem value="calibration">교정</MenuItem>
                      <MenuItem value="maintenance">유지보수</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="시작일"
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="종료일"
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={handleClearFilters}
                    fullWidth
                  >
                    필터 초기화
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </form>
      </Box>
      
      {/* 활동 로그 테이블 */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>유형</TableCell>
                  <TableCell>날짜</TableCell>
                  <TableCell>장비</TableCell>
                  <TableCell>설명</TableCell>
                  <TableCell>위치</TableCell>
                  <TableCell>담당자</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getActivityIcon(activity.type)}
                          <Box sx={{ ml: 1 }}>
                            {getActivityChip(activity.type)}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(activity.date)}</TableCell>
                      <TableCell>
                        <Link to={`/equipment/${activity.equipment_id}`} style={{ textDecoration: 'none', color: '#1976d2' }}>
                          {activity.equipment_name}
                        </Link>
                      </TableCell>
                      <TableCell>{activity.description}</TableCell>
                      <TableCell>{activity.location || '-'}</TableCell>
                      <TableCell>{activity.user || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      활동 기록이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="페이지당 항목 수:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 총 ${count}개`}
          />
        </>
      )}
    </Paper>
  );
}

export default RecentActivity; 