//components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Grid, Paper, Typography, 
  // eslint-disable-next-line no-unused-vars
  Card, 
  // eslint-disable-next-line no-unused-vars
  CardContent, 
  // eslint-disable-next-line no-unused-vars
  CardActions,
  Button, Divider, List, ListItem, ListItemText, ListItemIcon,
  CircularProgress, Chip, Alert
} from '@mui/material';
import {
  WarningAmber as WarningIcon,
  CalendarToday as CalendarIcon,
  Inventory as InventoryIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  MoreHoriz as MoreIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Person as PersonIcon,
  Timelapse as TimelapseIcon,
  Error as ErrorIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { 
  // eslint-disable-next-line no-unused-vars
  PieChart, 
  // eslint-disable-next-line no-unused-vars
  Pie, 
  // eslint-disable-next-line no-unused-vars
  Cell, 
  // eslint-disable-next-line no-unused-vars
  ResponsiveContainer, 
  // eslint-disable-next-line no-unused-vars
  Tooltip, 
  // eslint-disable-next-line no-unused-vars
  Legend 
} from 'recharts';
import apiService from '../services/api';
import { formatDate } from '../utils/formatters';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    checkedOutEquipment: 0,
    borrowedEquipment: 0,
    calibrationDueEquipment: 0,
    calibrationOverdueEquipment: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [upcomingCalibrations, setUpcomingCalibrations] = useState([]);
  const [overdueReturns, setOverdueReturns] = useState([]);

  // 팀별 장비 현황 데이터
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [teamStats, setTeamStats] = useState({
    RF: {
      total: 0,
      available: 0,
      checkedOut: 0,
      borrowed: 0,
      calibrationDue: 0,
      calibrationOverdue: 0
    },
    SAR: {
      total: 0,
      available: 0,
      checkedOut: 0,
      borrowed: 0,
      calibrationDue: 0,
      calibrationOverdue: 0
    },
    EMC: {
      total: 0,
      available: 0,
      checkedOut: 0,
      borrowed: 0,
      calibrationDue: 0,
      calibrationOverdue: 0
    },
    AUTO: {
      total: 0,
      available: 0,
      checkedOut: 0,
      borrowed: 0,
      calibrationDue: 0,
      calibrationOverdue: 0
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 백엔드 API 호출 - summary 엔드포인트만 사용
        const summaryResponse = await apiService.dashboard.getSummary();
        console.log('대시보드 summary 원본 데이터:', JSON.stringify(summaryResponse.data));
        
        // 필요한 통계 데이터 가져오기
        // 백엔드 stats 엔드포인트가 아직 구현되지 않은 경우 summary 데이터 활용
        const statsResponse = await apiService.dashboard.getStats()
          .catch((err) => {
            console.error('stats 엔드포인트 오류:', err);
            return summaryResponse;
          });
        
        console.log('대시보드 stats 원본 데이터:', JSON.stringify(statsResponse.data));
        
        // 백엔드에서 가져온 데이터 사용
        const upcomingCalibrations = summaryResponse.data.upcoming_calibrations || [];
        const overdueCalibrations = summaryResponse.data.overdue_calibrations || [];
        const borrowedEquipment = summaryResponse.data.borrowed_equipment || [];
        const checkedOutEquipment = summaryResponse.data.checked_out_equipment || [];
        
        console.log('API 받은 데이터 확인:');
        console.log('- 교정 예정 장비:', upcomingCalibrations);
        console.log('- 교정 기한 초과 장비:', overdueCalibrations);
        console.log('- 대여 중인 장비 (원본):', borrowedEquipment);
        console.log('- 대여 중인 장비 JSON 문자열:', JSON.stringify(borrowedEquipment));
        console.log('- 체크아웃 장비:', checkedOutEquipment);
        
        // 통계 데이터 설정
        setStats({
          totalEquipment: statsResponse.data.total_equipment || 0,
          availableEquipment: statsResponse.data.available_equipment || 0,
          checkedOutEquipment: statsResponse.data.checked_out || 0,
          borrowedEquipment: statsResponse.data.borrowed || 0,
          calibrationDueEquipment: statsResponse.data.due_for_calibration || 0,
          calibrationOverdueEquipment: statsResponse.data.overdue_calibration || 0
        });
        
        // 팀별 통계 데이터 설정
        const teamsData = statsResponse.data.teams || {};
        const updatedTeamStats = {
          RF: {
            total: teamsData.RF?.total || 0,
            available: teamsData.RF?.available || 0,
            checkedOut: teamsData.RF?.checked_out || 0,
            borrowed: teamsData.RF?.borrowed || 0,
            calibrationDue: teamsData.RF?.calibration_due || 0,
            calibrationOverdue: teamsData.RF?.calibration_overdue || 0
          },
          SAR: {
            total: teamsData.SAR?.total || 0,
            available: teamsData.SAR?.available || 0,
            checkedOut: teamsData.SAR?.checked_out || 0,
            borrowed: teamsData.SAR?.borrowed || 0,
            calibrationDue: teamsData.SAR?.calibration_due || 0,
            calibrationOverdue: teamsData.SAR?.calibration_overdue || 0
          },
          EMC: {
            total: teamsData.EMC?.total || 0,
            available: teamsData.EMC?.available || 0,
            checkedOut: teamsData.EMC?.checked_out || 0,
            borrowed: teamsData.EMC?.borrowed || 0,
            calibrationDue: teamsData.EMC?.calibration_due || 0,
            calibrationOverdue: teamsData.EMC?.calibration_overdue || 0
          },
          AUTO: {
            total: teamsData.AUTO?.total || 0,
            available: teamsData.AUTO?.available || 0,
            checkedOut: teamsData.AUTO?.checked_out || 0,
            borrowed: teamsData.AUTO?.borrowed || 0,
            calibrationDue: teamsData.AUTO?.calibration_due || 0,
            calibrationOverdue: teamsData.AUTO?.calibration_overdue || 0
          }
        };
        setTeamStats(updatedTeamStats);
        
        // 활동 데이터 구성
        const activities = [];
        
        // 대여 중인 장비를 활동으로 추가
        console.log('borrowed_equipment 유형:', typeof borrowedEquipment, Array.isArray(borrowedEquipment));
        
        // borrowed_equipment 처리 시작 - 대여 장비 확인
        let borrowedItems = [];
        
        // borrowed_equipment가 숫자인 경우 (장비 수만 반환)
        if (typeof borrowedEquipment === 'number' && borrowedEquipment > 0) {
          console.log(`대여 중인 장비 수치 확인: ${borrowedEquipment}개, API에서 상세 정보 가져오기 시도`);
          try {
            const response = await apiService.equipment.getAll({ status: 'borrowed', pageSize: 100 });
            borrowedItems = response.data.results || [];
            console.log(`API에서 가져온 대여 중인 장비: ${borrowedItems.length}개`);
          } catch (error) {
            console.error('반납 지연 확인을 위한 대여 장비 목록 조회 오류:', error);
          }
        } else if (Array.isArray(borrowedEquipment)) {
          console.log('대여 장비가 배열 형태로 제공됨');
          borrowedItems = borrowedEquipment;
        } else if (typeof borrowedEquipment === 'object' && borrowedEquipment !== null) {
          console.log('대여 장비가 객체 형태로 제공됨, 배열로 변환');
          borrowedItems = Object.values(borrowedEquipment);
        }
        
        console.log(`처리할 대여 장비 항목: ${borrowedItems.length}개`);
        
        if (borrowedItems.length > 0) {
          // 각 장비별로 처리 - 비동기 처리를 위해 for...of 사용
          for (const item of borrowedItems) {
            console.log(`대여 장비 #${item.id} 처리:`, item);
            
            // 기본 활동 객체 생성
            const activity = {
              id: `borrow-${item.id}`,
              type: 'borrow',
              description: '장비 대여됨',
              equipment_name: item.name || '알 수 없는 장비',
              date: item.borrowed_date || new Date().toISOString(),
              person: item.borrower_name || '정보 없음'
            };
            
            console.log('추가되는 활동 객체:', activity);
            activities.push(activity);
          }
          
          console.log(`${borrowedItems.length}개의 대여 장비 활동 추가됨`);
        } else {
          console.log('API 응답에 대여 중인 장비가 없습니다.');
        }
        
        console.log('== 대여 장비 처리 완료 ==');
        
        // 교정 기한 초과 장비를 활동으로 추가
        if (overdueCalibrations && overdueCalibrations.length > 0) {
          overdueCalibrations.forEach((equipment, index) => {
            activities.push({
              id: `overdue-${equipment.id}`,
              type: 'calibration',
              description: `교정 기한 초과`,
              equipment_name: equipment.name,
              date: equipment.next_calibration_date
            });
          });
        }
        // 교정 기한 초과 장비가 빈 배열이거나 숫자로 제공된 경우
        else if ((Array.isArray(overdueCalibrations) && overdueCalibrations.length === 0) || 
                 (typeof overdueCalibrations === 'number' && overdueCalibrations > 0)) {
          console.log(`교정 기한 초과 장비 확인 - API에서 직접 가져오기`);
          
          try {
            // 교정 기한 초과 장비 조회
            const response = await apiService.equipment.getAll({ 
              calibration_status: 'overdue', 
              pageSize: 10,
              ordering: 'next_calibration_date' 
            });
            const overdueEquipments = response.data.results || [];
            
            console.log(`API에서 가져온 교정 기한 초과 장비 ${overdueEquipments.length}개:`, overdueEquipments);
            
            overdueEquipments.forEach((equipment, index) => {
              console.log(`교정 기한 초과 장비 #${index} 처리:`, equipment);
              
              activities.push({
                id: `overdue-${equipment.id}`,
                type: 'calibration',
                description: `교정 기한 초과`,
                equipment_name: equipment.name,
                date: equipment.next_calibration_date || new Date().toISOString()
              });
            });
            
            console.log(`${overdueEquipments.length}개의 교정 기한 초과 장비 활동 추가됨`);
          } catch (error) {
            console.error('교정 기한 초과 장비 조회 오류:', error);
          }
        }
        
        // 교정 예정 장비 추가 (일관성을 위해 동일한 방식으로 처리)
        if (upcomingCalibrations && upcomingCalibrations.length > 0) {
          const today = new Date();
          const calibrations = upcomingCalibrations.map(equipment => ({
            id: equipment.id,
            name: equipment.name,
            next_calibration_date: equipment.next_calibration_date,
            days_remaining: Math.ceil((new Date(equipment.next_calibration_date) - today) / (1000 * 60 * 60 * 24))
          }));
          setUpcomingCalibrations(calibrations);
        }
        // 교정 예정 장비가 없거나 별도로 가져와야 하는 경우
        else if (stats.calibrationDueEquipment > 0 || statsResponse.data.due_for_calibration > 0) {
          console.log(`교정 예정 장비 확인 - API에서 직접 가져오기`);
          
          try {
            // 교정 예정 장비 조회 (30일 이내)
            const today = new Date();
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(today.getDate() + 30);
            
            const response = await apiService.equipment.getAll({ 
              calibration_status: 'due', 
              pageSize: 10,
              ordering: 'next_calibration_date' 
            });
            const dueEquipments = response.data.results || [];
            
            console.log(`API에서 가져온 교정 예정 장비 ${dueEquipments.length}개:`, dueEquipments);
            
            dueEquipments.forEach((equipment, index) => {
              console.log(`교정 예정 장비 #${index} 처리:`, equipment);
              
              activities.push({
                id: `calibration-due-${equipment.id}`,
                type: 'calibration',
                description: `교정 예정`,
                equipment_name: equipment.name,
                date: equipment.next_calibration_date || new Date().toISOString()
              });
            });
            
            console.log(`${dueEquipments.length}개의 교정 예정 장비 활동 추가됨`);
          } catch (error) {
            console.error('교정 예정 장비 조회 오류:', error);
          }
        }
        
        // 체크아웃 장비 중 반입 지연된 항목 추가
        const today = new Date();
        console.log('========= 반입 지연 장비 처리 시작 =========');
        console.log('현재 날짜:', today.toISOString());
        const overdueItems = [];
        
        if (checkedOutEquipment && checkedOutEquipment.length > 0) {
          console.log('체크아웃 장비 정보:', checkedOutEquipment.length, '건');
          
          const checkoutOverdue = checkedOutEquipment
            .filter(checkout => {
              const isOverdue = checkout.expected_return_date && 
                new Date(checkout.expected_return_date) < today && 
                !checkout.return_date;
              
              if (isOverdue) {
                console.log('반입 지연된 체크아웃 정보:', checkout);
                console.log('- 예상 반납일:', checkout.expected_return_date);
                console.log('- 지연 일수:', Math.ceil((today - new Date(checkout.expected_return_date)) / (1000 * 60 * 60 * 24)));
              }
              
              return isOverdue;
            })
            .map(checkout => {
              let equipmentName = '장비 정보 없음';
              let equipmentId = null;
              
              if (checkout.checkout_equipment && checkout.checkout_equipment.length > 0) {
                const item = checkout.checkout_equipment[0];
                equipmentName = item.equipment_name || (item.equipment ? item.equipment.name : '장비 정보 없음');
                equipmentId = item.equipment ? item.equipment.id : null;
              }
              
              const daysOverdue = Math.ceil((today - new Date(checkout.expected_return_date)) / (1000 * 60 * 60 * 24));
              console.log(`체크아웃 반입 지연 장비 추가: ${equipmentName}, ${daysOverdue}일 지연`);
              
              return {
                id: checkout.id,
                type: 'checkout',
                equipment_name: equipmentName,
                equipment_id: equipmentId,
                destination: checkout.checkout_location || '정보 없음',
                expected_return_date: checkout.expected_return_date,
                days_overdue: daysOverdue
              };
            });
          
          console.log(`반입 지연된 체크아웃 장비: ${checkoutOverdue.length}개`);
          overdueItems.push(...checkoutOverdue);
        } else {
          console.log('체크아웃 장비 정보가 없거나 빈 배열입니다.');
        }
        
        // 대여 장비 중 반납 지연된 항목 추가
        console.log('대여 장비 반납 지연 처리 시작');
        
        // borrowed_equipment가 숫자인 경우 (장비 수만 반환)
        if (typeof borrowedEquipment === 'number' && borrowedEquipment > 0) {
          console.log(`대여 장비 수치 확인: ${borrowedEquipment}개, API에서 상세 정보 가져오기 시도`);
          try {
            const response = await apiService.equipment.getAll({ status: 'borrowed', pageSize: 100 });
            borrowedItems = response.data.results || [];
            console.log(`API에서 가져온 대여 중인 장비: ${borrowedItems.length}개`);
          } catch (error) {
            console.error('반납 지연 확인을 위한 대여 장비 목록 조회 오류:', error);
          }
        } else if (Array.isArray(borrowedEquipment)) {
          console.log('대여 장비가 배열 형태로 제공됨');
          borrowedItems = borrowedEquipment;
        } else if (typeof borrowedEquipment === 'object' && borrowedEquipment !== null) {
          console.log('대여 장비가 객체 형태로 제공됨, 배열로 변환');
          borrowedItems = Object.values(borrowedEquipment);
        }
        
        console.log(`처리할 대여 장비 항목: ${borrowedItems.length}개`);
        
        // 대여 장비 중 반납 지연된 항목 필터링 및 추가
        if (borrowedItems.length > 0) {
          // 각 장비별로 처리 - 비동기 처리를 위해 for...of 사용
          for (const item of borrowedItems) {
            // 예상 반납일 확인
            const expectedReturnDate = item.expected_return_date || 
                                    item.expected_return || 
                                    (item.borrowing_data && item.borrowing_data.expected_return);
            
            if (!expectedReturnDate) {
              console.log(`대여 장비 ID ${item.id || '불명'}: 예상 반납일 정보 없음, 세부 정보 조회 시도`);
              
              // 장비 세부 정보 조회 시도
              try {
                const equipmentDetailResponse = await apiService.equipment.getById(item.id);
                const detailData = equipmentDetailResponse.data;
                console.log(`장비 세부 정보 조회 결과:`, detailData);
                
                // 세부 정보에서 예상 반납일 추출
                const detailExpectedReturn = detailData.expected_return_date || 
                                            detailData.expected_return || 
                                            (detailData.borrowing_data && detailData.borrowing_data.expected_return);
                
                if (detailExpectedReturn) {
                  console.log(`- 세부 정보에서 예상 반납일 확인됨:`, detailExpectedReturn);
                  
                  // 반납 지연 여부 확인
                  const isOverdue = new Date(detailExpectedReturn) < today;
                  console.log('- 반납 지연 여부:', isOverdue);
                  
                  if (isOverdue) {
                    const daysOverdue = Math.ceil((today - new Date(detailExpectedReturn)) / (1000 * 60 * 60 * 24));
                    console.log('- 지연 일수:', daysOverdue);
                    
                    // 지연 장비 객체 생성
                    const overdueItem = {
                      id: `borrow-${item.id}`,
                      type: 'borrow',
                      equipment_name: item.name || item.equipment_name || detailData.name || '알 수 없는 장비',
                      equipment_id: item.id,
                      destination: item.borrower_name || item.borrower || detailData.borrower_name || detailData.borrower || '정보 없음',
                      expected_return_date: detailExpectedReturn,
                      days_overdue: daysOverdue
                    };
                    
                    console.log('- 반납 지연 장비로 추가됨:', overdueItem.equipment_name);
                    overdueItems.push(overdueItem);
                    continue; // 다음 아이템으로
                  }
                } else {
                  console.log(`- 세부 정보에서도 예상 반납일 정보 없음`);
                }
              } catch (detailError) {
                console.error(`장비 ID ${item.id} 세부 정보 조회 실패:`, detailError);
              }
              
              continue; // 다음 항목으로
            }
            
            console.log(`대여 장비 분석: ${item.name || item.equipment_name || 'ID: ' + item.id}`);
            console.log('- 예상 반납일:', expectedReturnDate);
            
            // 반납 지연 여부 확인
            const isOverdue = new Date(expectedReturnDate) < today;
            console.log('- 반납 지연 여부:', isOverdue);
            
            if (isOverdue) {
              const daysOverdue = Math.ceil((today - new Date(expectedReturnDate)) / (1000 * 60 * 60 * 24));
              console.log('- 지연 일수:', daysOverdue);
              
              // 지연 장비 객체 생성
              const overdueItem = {
                id: `borrow-${item.id}`,
                type: 'borrow',
                equipment_name: item.name || item.equipment_name || '알 수 없는 장비',
                equipment_id: item.id,
                destination: item.borrower_name || item.borrower || '정보 없음',
                expected_return_date: expectedReturnDate,
                days_overdue: daysOverdue
              };
              
              console.log('- 반납 지연 장비로 추가됨:', overdueItem.equipment_name);
              overdueItems.push(overdueItem);
            }
          }
          
          const borrowedOverdue = overdueItems.filter(item => item.type === 'borrow');
          console.log(`대여 중 반납 지연 장비: ${borrowedOverdue.length}개`);
        } else {
          console.log('대여 중인 장비가 없습니다.');
        }
        
        // 날짜순으로 정렬
        overdueItems.sort((a, b) => b.days_overdue - a.days_overdue);
        console.log(`총 반입 지연 장비: ${overdueItems.length}개`);
        console.log('========= 반입 지연 장비 처리 완료 =========');
        
        // 최근 활동 데이터 처리 및 상태 업데이트
        console.log(`처리된 활동 데이터 수: ${activities.length}개`);
        // 날짜 기준으로 정렬 (최신순)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        // 최근 10개만 선택
        const recentActivitiesData = activities.slice(0, 10);
        console.log('최종 설정된 최근 활동:', recentActivitiesData);
        setRecentActivities(recentActivitiesData);
        
        setOverdueReturns(overdueItems);
        
        setLoading(false);
      } catch (error) {
        console.error('대시보드 데이터 로딩 중 오류 발생:', error);
        setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // 30초마다 데이터 새로고침
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(intervalId);
  }, []);

  // 장비 상태 차트 데이터
  const equipmentStatusData = [
    { name: '사용 가능', value: stats.availableEquipment, color: '#4caf50' },
    { name: '반출 중', value: stats.checkedOutEquipment, color: '#2196f3' },
    { name: '대여 중', value: stats.borrowedEquipment, color: '#9c27b0' },
    { name: '교정 예정', value: stats.calibrationDueEquipment, color: '#ff9800' },
    { name: '교정 기한 초과', value: stats.calibrationOverdueEquipment, color: '#f44336' }
  ];

  // 선택된 팀에 따른 장비 상태 차트 데이터 계산
  const getTeamEquipmentStatusData = () => {
    if (selectedTeam === 'all') {
      return equipmentStatusData;
    }
    
    const team = teamStats[selectedTeam];
    return [
      { name: '사용 가능', value: team.available, color: '#4caf50' },
      { name: '반출 중', value: team.checkedOut, color: '#2196f3' },
      { name: '대여 중', value: team.borrowed, color: '#9c27b0' },
      { name: '교정 예정', value: team.calibrationDue, color: '#ff9800' },
      { name: '교정 기한 초과', value: team.calibrationOverdue, color: '#f44336' }
    ];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        대시보드
      </Typography>

      {/* 메인 대시보드 그리드 */}
      <Grid container spacing={3}>
        {/* 장비 상태 정보 (통합된 카드) */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: '12px', 
              boxShadow: '0 6px 16px rgba(0,0,0,0.05)'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="600">
                장비 현황
              </Typography>
              
              {/* 팀 선택 탭 */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="전체"
                  onClick={() => setSelectedTeam('all')}
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: selectedTeam === 'all' ? '#f0f7ff' : 'transparent',
                    color: selectedTeam === 'all' ? '#1565c0' : 'text.primary',
                    border: '1px solid #e0e0e0',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                />
                <Chip
                  label="RF팀"
                  onClick={() => setSelectedTeam('RF')}
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: selectedTeam === 'RF' ? '#e3f2fd' : 'transparent',
                    color: selectedTeam === 'RF' ? '#1565c0' : 'text.primary',
                    border: '1px solid #e0e0e0',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                />
                <Chip
                  label="SAR팀"
                  onClick={() => setSelectedTeam('SAR')}
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: selectedTeam === 'SAR' ? '#e8f5e9' : 'transparent',
                    color: selectedTeam === 'SAR' ? '#2e7d32' : 'text.primary',
                    border: '1px solid #e0e0e0',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                />
                <Chip
                  label="EMC팀"
                  onClick={() => setSelectedTeam('EMC')}
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: selectedTeam === 'EMC' ? '#fff3e0' : 'transparent',
                    color: selectedTeam === 'EMC' ? '#e65100' : 'text.primary',
                    border: '1px solid #e0e0e0',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                />
                <Chip
                  label="AUTO팀"
                  onClick={() => setSelectedTeam('AUTO')}
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: selectedTeam === 'AUTO' ? '#fce4ec' : 'transparent',
                    color: selectedTeam === 'AUTO' ? '#c2185b' : 'text.primary',
                    border: '1px solid #e0e0e0',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                />
              </Box>
              
              <Chip
                label={`총 ${selectedTeam === 'all' ? stats.totalEquipment : teamStats[selectedTeam].total}대`}
                sx={{ 
                  fontWeight: 'bold', 
                  bgcolor: '#f0f7ff', 
                  color: '#1565c0',
                  '& .MuiChip-label': { px: 2 }
                }}
              />
            </Box>

            {/* 상태 통계 그리드 */}
            <Grid container spacing={2} mb={3}>
              {/* 사용 가능 장비 */}
              <Grid item xs={6} lg={4}>
                <Box
                  component={Link}
                  to={selectedTeam === 'all' ? '/equipment?status=available&team=all' : `/equipment?status=available&team=${selectedTeam}`}
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transform: 'translateY(-3px)'
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: 0, 
                    width: '8px', 
                    height: '100%', 
                    bgcolor: '#4caf50' 
                  }} />
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {selectedTeam === 'all' ? stats.availableEquipment : teamStats[selectedTeam].available}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">사용 가능</Typography>
                  <Typography variant="caption" sx={{ mt: 1, color: '#4caf50' }}>
                    {Math.round(((selectedTeam === 'all' ? stats.availableEquipment : teamStats[selectedTeam].available) / 
                               Math.max(1, selectedTeam === 'all' ? stats.totalEquipment : teamStats[selectedTeam].total)) * 100)}%
                  </Typography>
                </Box>
              </Grid>

              {/* 반출 중인 장비 */}
              <Grid item xs={6} lg={4}>
                <Box
                  component={Link}
                  to={selectedTeam === 'all' ? '/equipment?status=checked_out&team=all' : `/equipment?status=checked_out&team=${selectedTeam}`}
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transform: 'translateY(-3px)'
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: 0, 
                    width: '8px', 
                    height: '100%', 
                    bgcolor: '#2196f3' 
                  }} />
                  <LocalShippingIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {selectedTeam === 'all' ? stats.checkedOutEquipment : teamStats[selectedTeam].checkedOut}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">반출 중</Typography>
                  <Typography variant="caption" sx={{ mt: 1, color: '#2196f3' }}>
                    {Math.round(((selectedTeam === 'all' ? stats.checkedOutEquipment : teamStats[selectedTeam].checkedOut) / 
                               Math.max(1, selectedTeam === 'all' ? stats.totalEquipment : teamStats[selectedTeam].total)) * 100)}%
                  </Typography>
                </Box>
              </Grid>

              {/* 대여 중인 장비 */}
              <Grid item xs={6} lg={4}>
                <Box
                  component={Link}
                  to={selectedTeam === 'all' ? '/equipment?status=borrowed&team=all' : `/equipment?status=borrowed&team=${selectedTeam}`}
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transform: 'translateY(-3px)'
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: 0, 
                    width: '8px', 
                    height: '100%', 
                    bgcolor: '#9c27b0' 
                  }} />
                  <PersonIcon sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {selectedTeam === 'all' ? stats.borrowedEquipment : teamStats[selectedTeam].borrowed}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">대여 중</Typography>
                  <Typography variant="caption" sx={{ mt: 1, color: '#9c27b0' }}>
                    {Math.round(((selectedTeam === 'all' ? stats.borrowedEquipment : teamStats[selectedTeam].borrowed) / 
                               Math.max(1, selectedTeam === 'all' ? stats.totalEquipment : teamStats[selectedTeam].total)) * 100)}%
                  </Typography>
                </Box>
              </Grid>

              {/* 교정 예정 장비 */}
              <Grid item xs={6} lg={6}>
                <Box
                  component={Link}
                  to={selectedTeam === 'all' ? '/equipment?status=calibration_soon&team=all' : `/equipment?status=calibration_soon&team=${selectedTeam}`}
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transform: 'translateY(-3px)'
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: 0, 
                    width: '8px', 
                    height: '100%', 
                    bgcolor: '#ff9800' 
                  }} />
                  <TimelapseIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {selectedTeam === 'all' ? stats.calibrationDueEquipment : teamStats[selectedTeam].calibrationDue}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">교정 예정</Typography>
                  <Typography variant="caption" sx={{ mt: 1, color: '#ff9800' }}>
                    {Math.round(((selectedTeam === 'all' ? stats.calibrationDueEquipment : teamStats[selectedTeam].calibrationDue) / 
                               Math.max(1, selectedTeam === 'all' ? stats.totalEquipment : teamStats[selectedTeam].total)) * 100)}%
                  </Typography>
                </Box>
              </Grid>

              {/* 교정 기한 초과 장비 */}
              <Grid item xs={6} lg={6}>
                <Box
                  component={Link}
                  to={selectedTeam === 'all' ? '/equipment?status=calibration_overdue&team=all' : `/equipment?status=calibration_overdue&team=${selectedTeam}`}
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transform: 'translateY(-3px)'
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ 
                    position: 'absolute', 
                    right: 0, 
                    top: 0, 
                    width: '8px', 
                    height: '100%', 
                    bgcolor: '#f44336' 
                  }} />
                  <ErrorIcon sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
                    {selectedTeam === 'all' ? stats.calibrationOverdueEquipment : teamStats[selectedTeam].calibrationOverdue}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">교정 기한 초과</Typography>
                  <Typography variant="caption" sx={{ mt: 1, color: '#f44336' }}>
                    {Math.round(((selectedTeam === 'all' ? stats.calibrationOverdueEquipment : teamStats[selectedTeam].calibrationOverdue) / 
                               Math.max(1, selectedTeam === 'all' ? stats.totalEquipment : teamStats[selectedTeam].total)) * 100)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* 전체 상태 진행 바 */}
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                장비 상태 분포
              </Typography>
              <Box sx={{ position: 'relative', height: '12px', borderRadius: '6px', overflow: 'hidden', bgcolor: '#f5f5f5' }}>
                {getTeamEquipmentStatusData()
                  .filter(item => item.value > 0)
                  .map((entry, index) => {
                    const previousWidth = getTeamEquipmentStatusData()
                      .filter(item => item.value > 0)
                      .slice(0, index)
                      .reduce((sum, item) => sum + (item.value / Math.max(1, selectedTeam === 'all' ? stats.totalEquipment : teamStats[selectedTeam].total) * 100), 0);
                    
                    const width = (entry.value / Math.max(1, selectedTeam === 'all' ? stats.totalEquipment : teamStats[selectedTeam].total) * 100);
                    
                    return width > 0 ? (
                      <Box
                        key={`progress-${index}`}
                        sx={{
                          position: 'absolute',
                          left: `${previousWidth}%`,
                          width: `${width}%`,
                          height: '100%',
                          bgcolor: entry.color,
                          transition: 'all 0.3s',
                        }}
                      />
                    ) : null;
                  })}
              </Box>
            </Box>

            {/* 장비 관리 버튼 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button 
                variant="contained" 
                component={Link} 
                to={selectedTeam === 'all' ? '/equipment?team=all' : `/equipment?team=${selectedTeam}`} 
                startIcon={<InventoryIcon />}
                sx={{ 
                  boxShadow: 'none', 
                  borderRadius: '8px',
                  px: 3,
                  py: 1
                }}
              >
                {selectedTeam === 'all' ? '전체 장비 관리' : `${selectedTeam === 'RF' ? 'RF팀' : selectedTeam === 'SAR' ? 'SAR팀' : selectedTeam === 'EMC' ? 'EMC팀' : 'AUTO팀'} 장비 관리`}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* 팀별 장비 현황 */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: '12px', 
              boxShadow: '0 6px 16px rgba(0,0,0,0.05)'
            }}
          >
            <Typography variant="h5" fontWeight="600" gutterBottom>
              팀별 장비 현황
            </Typography>
            
            <Grid container spacing={2}>
              {/* RF팀 카드 */}
              <Grid item xs={12} sm={6}>
                <Box
                  component={Link}
                  to="/equipment?team=RF"
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transform: 'translateY(-3px)'
                    },
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" color="#1565c0">
                      RF팀
                    </Typography>
                    <Chip 
                      label={`${teamStats.RF.total}대`} 
                      size="small"
                      sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">사용 가능:</Typography>
                    <Typography variant="body2" fontWeight="500">{teamStats.RF.available}대</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">대여/반출:</Typography>
                    <Typography variant="body2" fontWeight="500">{teamStats.RF.borrowed + teamStats.RF.checkedOut}대</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">교정 필요:</Typography>
                    <Typography variant="body2" fontWeight="500" color={teamStats.RF.calibrationOverdue > 0 ? '#f44336' : 'inherit'}>
                      {teamStats.RF.calibrationDue + teamStats.RF.calibrationOverdue}대
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* SAR팀 카드 */}
              <Grid item xs={12} sm={6}>
                <Box
                  component={Link}
                  to="/equipment?team=SAR"
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transform: 'translateY(-3px)'
                    },
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" color="#2e7d32">
                      SAR팀
                    </Typography>
                    <Chip 
                      label={`${teamStats.SAR.total}대`} 
                      size="small"
                      sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">사용 가능:</Typography>
                    <Typography variant="body2" fontWeight="500">{teamStats.SAR.available}대</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">대여/반출:</Typography>
                    <Typography variant="body2" fontWeight="500">{teamStats.SAR.borrowed + teamStats.SAR.checkedOut}대</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">교정 필요:</Typography>
                    <Typography variant="body2" fontWeight="500" color={teamStats.SAR.calibrationOverdue > 0 ? '#f44336' : 'inherit'}>
                      {teamStats.SAR.calibrationDue + teamStats.SAR.calibrationOverdue}대
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* EMC팀 카드 */}
              <Grid item xs={12} sm={6}>
                <Box
                  component={Link}
                  to="/equipment?team=EMC"
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transform: 'translateY(-3px)'
                    },
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" color="#e65100">
                      EMC팀
                    </Typography>
                    <Chip 
                      label={`${teamStats.EMC.total}대`} 
                      size="small"
                      sx={{ bgcolor: '#fff3e0', color: '#e65100' }}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">사용 가능:</Typography>
                    <Typography variant="body2" fontWeight="500">{teamStats.EMC.available}대</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">대여/반출:</Typography>
                    <Typography variant="body2" fontWeight="500">{teamStats.EMC.borrowed + teamStats.EMC.checkedOut}대</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">교정 필요:</Typography>
                    <Typography variant="body2" fontWeight="500" color={teamStats.EMC.calibrationOverdue > 0 ? '#f44336' : 'inherit'}>
                      {teamStats.EMC.calibrationDue + teamStats.EMC.calibrationOverdue}대
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* AUTO팀 카드 */}
              <Grid item xs={12} sm={6}>
                <Box
                  component={Link}
                  to="/equipment?team=AUTO"
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transform: 'translateY(-3px)'
                    },
                    bgcolor: '#f9f9f9'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" color="#c2185b">
                      AUTO팀
                    </Typography>
                    <Chip 
                      label={`${teamStats.AUTO.total}대`} 
                      size="small"
                      sx={{ bgcolor: '#fce4ec', color: '#c2185b' }}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">사용 가능:</Typography>
                    <Typography variant="body2" fontWeight="500">{teamStats.AUTO.available}대</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">대여/반출:</Typography>
                    <Typography variant="body2" fontWeight="500">{teamStats.AUTO.borrowed + teamStats.AUTO.checkedOut}대</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
                    <Typography variant="body2" color="textSecondary">교정 필요:</Typography>
                    <Typography variant="body2" fontWeight="500" color={teamStats.AUTO.calibrationOverdue > 0 ? '#f44336' : 'inherit'}>
                      {teamStats.AUTO.calibrationDue + teamStats.AUTO.calibrationOverdue}대
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 최근 활동 */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: '12px', 
              boxShadow: '0 6px 16px rgba(0,0,0,0.05)'
            }}
          >
            <Typography variant="h5" fontWeight="600" gutterBottom>
              최근 활동
            </Typography>
            {recentActivities && recentActivities.length > 0 ? (
              <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {recentActivities.map((activity, index) => {
                  return (
                    <React.Fragment key={activity.id}>
                      <ListItem 
                        alignItems="flex-start" 
                        sx={{ 
                          px: 2, 
                          borderRadius: '8px', 
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' } 
                        }}
                      >
                        <ListItemIcon>
                          {activity.type === 'checkout' && (
                            <Box sx={{ 
                              bgcolor: 'rgba(33, 150, 243, 0.1)', 
                              borderRadius: '50%', 
                              p: 1, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              <ArrowUpIcon sx={{ color: '#2196f3' }} />
                            </Box>
                          )}
                          {activity.type === 'return' && (
                            <Box sx={{ 
                              bgcolor: 'rgba(76, 175, 80, 0.1)', 
                              borderRadius: '50%', 
                              p: 1, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              <ArrowDownIcon sx={{ color: '#4caf50' }} />
                            </Box>
                          )}
                          {activity.type === 'calibration' && (
                            <Box sx={{ 
                              bgcolor: 'rgba(255, 152, 0, 0.1)', 
                              borderRadius: '50%', 
                              p: 1, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              <CalendarIcon sx={{ color: '#ff9800' }} />
                            </Box>
                          )}
                          {activity.type === 'maintenance' && (
                            <Box sx={{ 
                              bgcolor: 'rgba(0, 188, 212, 0.1)', 
                              borderRadius: '50%', 
                              p: 1, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              <InventoryIcon sx={{ color: '#00bcd4' }} />
                            </Box>
                          )}
                          {activity.type === 'borrow' && (
                            <Box sx={{ 
                              bgcolor: 'rgba(156, 39, 176, 0.1)', 
                              borderRadius: '50%', 
                              p: 1, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}>
                              <PersonIcon sx={{ color: '#9c27b0' }} />
                            </Box>
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="500">
                              {activity.description}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                fontWeight="medium"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {activity.equipment_name}
                              </Typography>
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {formatDate(activity.date, true)}
                              </Typography>
                            </>
                          }
                        />
                        <Chip
                          label={
                            activity.type === 'checkout' ? '반출' :
                            activity.type === 'return' ? '반입' :
                            activity.type === 'calibration' ? '교정' : 
                            activity.type === 'borrow' ? '대여' : '유지보수'
                          }
                          size="small"
                          sx={{ 
                            bgcolor: activity.type === 'checkout' ? 'rgba(33, 150, 243, 0.1)' :
                                    activity.type === 'return' ? 'rgba(76, 175, 80, 0.1)' :
                                    activity.type === 'calibration' ? 'rgba(255, 152, 0, 0.1)' : 
                                    activity.type === 'borrow' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(0, 188, 212, 0.1)',
                            color: activity.type === 'checkout' ? '#1976d2' :
                                   activity.type === 'return' ? '#4caf50' :
                                   activity.type === 'calibration' ? '#ff9800' : 
                                   activity.type === 'borrow' ? '#9c27b0' : '#00bcd4'
                          }}
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 6,
                  opacity: 0.7
                }}
              >
                <MoreIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  최근 활동이 없습니다.
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, textAlign: 'center' }}>
                  데이터가 표시되지 않는 경우, 콘솔 로그를 확인하거나<br />
                  페이지를 새로고침 해보세요.
                </Typography>
              </Box>
            )}
            {recentActivities.length > 0 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Button
                  variant="outlined"
                  endIcon={<MoreIcon />}
                  component={Link}
                  to="/activities"
                  sx={{ 
                    borderRadius: '8px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    border: '1px solid #e0e0e0',
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.03)',
                      borderColor: '#bdbdbd'
                    }
                  }}
                >
                  모든 활동 보기
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 반입 지연 장비 */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: '12px', 
              boxShadow: '0 6px 16px rgba(0,0,0,0.05)'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="600">
                반입 지연 장비
              </Typography>
              <Chip
                label={`${overdueReturns.length}개 항목`}
                sx={{ 
                  bgcolor: 'rgba(244, 67, 54, 0.1)', 
                  color: '#f44336',
                  '& .MuiChip-label': { px: 2 }
                }}
              />
            </Box>
            
            {overdueReturns.length > 0 ? (
              <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {overdueReturns.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      component={Link}
                      to={item.equipment_id ? `/equipment/${item.equipment_id}` : `/checkout/${item.id}`}
                      sx={{ 
                        p: 2, 
                        borderRadius: '8px', 
                        textDecoration: 'none', 
                        color: 'inherit',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.03)',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <Box sx={{ 
                        mr: 2, 
                        bgcolor: 'rgba(244, 67, 54, 0.1)', 
                        borderRadius: '50%', 
                        p: 1, 
                        display: 'flex' 
                      }}>
                        {item.type === 'borrow' ? (
                          <PersonIcon sx={{ color: '#f44336' }} />
                        ) : (
                          <LocalShippingIcon sx={{ color: '#f44336' }} />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight="500">
                          {item.equipment_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {item.type === 'borrow' ? `대여자: ${item.destination}` : `반출처: ${item.destination}`} | 예상 반입일: {formatDate(item.expected_return_date)}
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          px: 1.5, 
                          py: 0.5, 
                          borderRadius: '12px',
                          bgcolor: 'rgba(244, 67, 54, 0.1)', 
                          fontSize: '0.75rem',
                          color: '#f44336',
                          display: 'inline-block',
                          fontWeight: 500
                        }}>
                        {item.days_overdue}일 지연
                      </Box>
                    </ListItem>
                    {index < overdueReturns.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 6,
                  opacity: 0.7
                }}
              >
                <WarningIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="textSecondary">
                  반입 지연 장비가 없습니다.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* 추가 기능 개발 예정 */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: '12px', 
              boxShadow: '0 6px 16px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Box 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                maxWidth: '400px',
                border: '2px dashed #e0e0e0',
                borderRadius: '12px',
                py: 6
              }}
            >
              <Typography variant="h5" fontWeight="600" color="text.secondary" gutterBottom>
                추가 기능 개발 예정
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={2}>
                이 섹션에는 자주 사용되는 장비 목록 또는 다른 유용한 기능이 추가될 예정입니다.
              </Typography>
              <Box
                sx={{
                  maxWidth: '200px',
                  m: 'auto',
                  mt: 3,
                  mb: 3,
                  p: 2,
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }}
              >
                <BuildIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              </Box>
              <Typography variant="caption" color="text.disabled">
                개발 중인 기능입니다. 나중에 다시 확인해주세요.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;