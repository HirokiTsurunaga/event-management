import React from 'react';
import {
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Home,
  EventNote,
  EventAvailable,
  People,
  Dashboard,
  QrCodeScanner,
  BarChart,
  Code
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AuthService from '../../services/auth';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  drawerWidth: number;
}

interface NavItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const Drawer: React.FC<DrawerProps> = ({ open, onClose, drawerWidth }) => {
  const location = useLocation();
  const isAdmin = AuthService.isAdmin();
  const isLoggedIn = AuthService.isLoggedIn();

  const navItems: NavItem[] = [
    { text: 'ホーム', path: '/', icon: <Home /> },
    { text: 'イベント一覧', path: '/events', icon: <EventNote /> },
  ];

  const loggedInItems: NavItem[] = [
    { text: '参加登録一覧', path: '/my-registrations', icon: <EventAvailable /> },
  ];

  const adminItems: NavItem[] = [
    { text: '管理者ダッシュボード', path: '/admin/dashboard', icon: <Dashboard />, adminOnly: true },
    { text: 'イベント管理', path: '/admin/events', icon: <EventNote />, adminOnly: true },
    { text: '参加者管理', path: '/admin/participants', icon: <People />, adminOnly: true },
    { text: 'チェックイン管理', path: '/admin/check-ins', icon: <QrCodeScanner />, adminOnly: true },
    { text: '統計情報', path: '/admin/statistics', icon: <BarChart />, adminOnly: true },
  ];

  const devItems: NavItem[] = [
    { text: 'API テストツール', path: '/api-test', icon: <Code /> },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <MuiDrawer
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{
        keepMounted: true, // モバイル表示でのパフォーマンス向上
      }}
      sx={{
        '& .MuiDrawer-paper': { 
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <EventNote sx={{ mr: 1 }} />
          イベント管理
        </Typography>
      </Box>
      <Divider />
      
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={isActive(item.path)}
              onClick={onClose}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {isLoggedIn && (
        <>
          <Divider />
          <List>
            {loggedInItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={isActive(item.path)}
                  onClick={onClose}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
      
      {isAdmin && (
        <>
          <Divider />
          <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant="subtitle2" color="text.secondary">
              管理者メニュー
            </Typography>
          </Box>
          <List>
            {adminItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.path}
                  selected={isActive(item.path)}
                  onClick={onClose}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Divider />
      <Box sx={{ p: 2, pb: 0 }}>
        <Typography variant="subtitle2" color="text.secondary">
          開発ツール
        </Typography>
      </Box>
      <List>
        {devItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={isActive(item.path)}
              onClick={onClose}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </MuiDrawer>
  );
};

export default Drawer; 