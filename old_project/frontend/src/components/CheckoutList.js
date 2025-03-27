import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, IconButton, TextField, InputAdornment,
  TablePagination, CircularProgress, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import apiService from '../services/api';
import { formatDate } from '../utils/formatters';

function CheckoutList() {
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 반출 목록 가져오기
  useEffect(() => {
    fetchCheckouts();
  }, []);

  const fetchCheckouts = async () => {
    try {
      setLoading(true);
      const response = await apiService.checkouts.getAll();
      // API 응답 구조 확인 및 처리
      if (response && response.data) {
        // 응답이 배열인지 확인하고, 배열이 아니면 빈 배열로 설정
        const checkoutData = Array.isArray(response.data) ? response.data : 
                            (response.data.results ? response.data.results : []);
        setCheckouts(checkoutData);
        console.log('Checkout data:', checkoutData);
      } else {
        setCheckouts([]);
        console.warn('API 응답에 데이터가 없습니다:', response);
      }
    } catch (error) {
      console.error('Error fetching checkouts:', error);
      setCheckouts([]);
      setSnackbar({
        open: true,
        message: '반출 목록을 불러오는데 실패했습니다: ' + (error.message || '알 수 없는 오류'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // 검색 시 첫 페이지로 이동
  };

  // 페이지네이션 핸들러
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색 필터링 - 안전하게 처리
  const filteredCheckouts = Array.isArray(checkouts) ? checkouts.filter(checkout => {
    if (!checkout) return false;
    
    const searchFields = [
      checkout.checkout_location,
      checkout.person_in_charge,
      ...(checkout.checkout_equipment || []).map(item => 
        item.equipment_name || item.management_number || ''
      )
    ].filter(Boolean); // null/undefined 값 제거
    
    return searchTerm === '' || searchFields.some(field => 
      field && field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  // 페이지네이션 적용
  const paginatedCheckouts = filteredCheckouts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 반출 상태에 따른 칩 색상 결정 함수 수정
  const getStatusChip = (checkout) => {
    if (!checkout) return <Chip label="정보 없음" color="default" size="small" />;
    
    const now = new Date();
    const expectedReturnDate = checkout.expected_return_date ? new Date(checkout.expected_return_date) : null;
    
    if (checkout.return_date) {
      return <Chip label="반입 완료" color="success" size="small" />;
    } else if (expectedReturnDate && expectedReturnDate < now) {
      return <Chip label="반입 지연" color="error" size="small" />;
    } else {
      return <Chip label="반출 중" color="primary" size="small" />;
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          장비 반출 관리
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/checkout/new"
        >
          새 반출 등록
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="장비명, 관리번호, 반출처, 목적, 반출자로 검색"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>장비명</TableCell>
                <TableCell>관리번호</TableCell>
                <TableCell>반출처</TableCell>
                <TableCell>반출일</TableCell>
                <TableCell>예상 반입일</TableCell>
                <TableCell>반입일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell align="center">상세</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCheckouts.length > 0 ? (
                paginatedCheckouts.map((checkout, index) => {
                  // 첫 번째 장비 정보 가져오기 (여러 장비가 있을 수 있음)
                  const firstEquipment = checkout.checkout_equipment && 
                                        checkout.checkout_equipment.length > 0 ? 
                                        checkout.checkout_equipment[0] : null;
                  
                  return (
                    <TableRow key={checkout.id || index} hover>
                      <TableCell>
                        {firstEquipment ? firstEquipment.equipment_name : '정보 없음'}
                        {checkout.checkout_equipment && checkout.checkout_equipment.length > 1 && 
                          ` 외 ${checkout.checkout_equipment.length - 1}개`}
                      </TableCell>
                      <TableCell>
                        {firstEquipment ? firstEquipment.management_number : '정보 없음'}
                      </TableCell>
                      <TableCell>{checkout.checkout_location || '정보 없음'}</TableCell>
                      <TableCell>{formatDate(checkout.checkout_date)}</TableCell>
                      <TableCell>{formatDate(checkout.expected_return_date)}</TableCell>
                      <TableCell>
                        {checkout.return_date ? formatDate(checkout.return_date) : '-'}
                      </TableCell>
                      <TableCell>{getStatusChip(checkout)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          component={Link}
                          to={`/checkout/${checkout.id}`}
                          color="primary"
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 반출 정보가 없습니다.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCheckouts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>

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

export default CheckoutList; 