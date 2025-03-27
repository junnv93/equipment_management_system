import React, { useState } from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, 
  Toolbar, Container, Typography, AppBar, IconButton, useMediaQuery,
  useTheme, Tabs, Tab, Menu, MenuItem, Avatar
} from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HistoryIcon from '@mui/icons-material/History';

const drawerWidth = 240;

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // 사이드바 열림/닫힘 상태
  const [open, setOpen] = useState(false);
  
  // 사용자 메뉴 상태
  const [anchorEl, setAnchorEl] = useState(null);
  const userMenuOpen = Boolean(anchorEl);
  
  // 현재 선택된 탭
  const getCurrentTabValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path.startsWith('/equipment')) return 1;
    if (path.startsWith('/checkout')) return 2;
    if (path.startsWith('/activities')) return 3;
    return 0;
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login?logout=success');
  };
  
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/equipment');
        break;
      case 2:
        navigate('/checkout');
        break;
      case 3:
        navigate('/activities');
        break;
      default:
        navigate('/');
    }
  };

  const menuItems = [
    { text: '대시보드', icon: <DashboardIcon />, path: '/' },
    { text: '장비 관리', icon: <InventoryIcon />, path: '/equipment' },
    { text: '반출 관리', icon: <LocalShippingIcon />, path: '/checkout' },
    { text: '최근 활동', icon: <HistoryIcon />, path: '/activities' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 상단 앱바 */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 2,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 0, display: { xs: 'none', sm: 'block' }, mr: 4 }}>
            장비관리시스템
          </Typography>
          
          {/* 상단 탭 메뉴 */}
          <Tabs 
            value={getCurrentTabValue()} 
            onChange={handleTabChange}
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', md: 'flex' },
              '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .Mui-selected': { color: '#ffffff' }
            }}
            indicatorColor="secondary"
            textColor="inherit"
          >
            <Tab label="대시보드" />
            <Tab label="장비 관리" />
            <Tab label="반출 관리" />
            <Tab label="최근 활동" />
          </Tabs>
          
          {/* 사용자 정보 및 메뉴 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleUserMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={userMenuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={userMenuOpen ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
                {currentUser?.username?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={userMenuOpen}
            onClose={handleUserMenuClose}
            onClick={handleUserMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem>
              <Avatar /> {currentUser?.username || '사용자'}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              로그아웃
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* 사이드바 */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={open}
        onClose={handleDrawerClose}
        sx={{
          width: open ? drawerWidth : theme.spacing(9),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            ...(!open && {
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              width: theme.spacing(7),
              [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9),
              },
            }),
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ opacity: open ? 1 : 0 }} 
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* 메인 콘텐츠 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          width: { 
            xs: '100%',
            sm: `calc(100% - ${open ? drawerWidth : theme.spacing(9)}px)`
          },
          ml: { 
            xs: 0,
            sm: 0
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ width: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout; 