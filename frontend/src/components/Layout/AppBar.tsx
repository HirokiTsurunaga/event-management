import React, { useState } from 'react';
import { 
  AppBar as MuiAppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem, 
  Avatar 
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  EventNote, 
  AccountCircle, 
  Login, 
  Logout 
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth';

interface AppBarProps {
  onMenuToggle: () => void;
}

const AppBar: React.FC<AppBarProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isLoggedIn = AuthService.isLoggedIn();
  const user = AuthService.getUser();
  const isAdmin = AuthService.isAdmin();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate('/login');
    } catch (error) {
      console.error('ログアウト中にエラーが発生しました', error);
    }
    handleClose();
  };

  return (
    <MuiAppBar position="fixed">
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="メニューを開く"
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <EventNote sx={{ mr: 1 }} />
          イベント管理システム
        </Typography>
        
        <Box>
          {isLoggedIn ? (
            <>
              <IconButton
                size="large"
                aria-label="アカウントメニュー"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user?.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {user?.name} ({isAdmin ? '管理者' : '参加者'})
                  </Typography>
                </MenuItem>
                <MenuItem
                  component={RouterLink}
                  to="/profile"
                  onClick={handleClose}
                >
                  プロフィール
                </MenuItem>
                <MenuItem
                  component={RouterLink}
                  to="/my-registrations"
                  onClick={handleClose}
                >
                  参加登録一覧
                </MenuItem>
                {isAdmin && (
                  <MenuItem
                    component={RouterLink}
                    to="/admin/events"
                    onClick={handleClose}
                  >
                    管理者ページ
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <Logout fontSize="small" sx={{ mr: 1 }} />
                  ログアウト
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button 
                color="inherit"
                component={RouterLink}
                to="/login"
                startIcon={<Login />}
              >
                ログイン
              </Button>
              <Button 
                color="inherit"
                component={RouterLink}
                to="/register"
                startIcon={<AccountCircle />}
              >
                新規登録
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar; 