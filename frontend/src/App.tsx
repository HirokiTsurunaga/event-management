import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import EventListPage from './pages/events/EventListPage';
import EventDetailPage from './pages/events/EventDetailPage';
import EventRegisterPage from './pages/events/EventRegisterPage';
import MyRegistrationsPage from './pages/user/MyRegistrationsPage';
import QrCodePage from './pages/user/QrCodePage';
import CheckInManagementPage from './pages/admin/CheckInManagementPage';
import ApiTestTool from './components/ApiTestTool';
import AuthService from './services/auth';

// カスタムテーマの設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// 認証が必要なルートのラッパー
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = AuthService.isLoggedIn();
  
  if (!isLoggedIn) {
    // 未ログインの場合はログインページにリダイレクト
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// 管理者権限が必要なルートのラッパー
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = AuthService.isLoggedIn();
  const isAdmin = AuthService.isAdmin();
  
  if (!isLoggedIn) {
    // 未ログインの場合はログインページにリダイレクト
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    // 管理者でない場合はホームページにリダイレクト
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* 認証関連ページ */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* イベント関連ページ */}
          <Route 
            path="/" 
            element={
              <Layout>
                <EventListPage />
              </Layout>
            } 
          />
          
          <Route 
            path="/events" 
            element={
              <Layout>
                <EventListPage />
              </Layout>
            } 
          />
          
          <Route 
            path="/events/:id" 
            element={
              <Layout>
                <EventDetailPage />
              </Layout>
            } 
          />
          
          <Route 
            path="/events/:id/register" 
            element={
              <PrivateRoute>
                <Layout>
                  <EventRegisterPage />
                </Layout>
              </PrivateRoute>
            } 
          />
          
          {/* ユーザー関連ページ */}
          <Route 
            path="/my-registrations" 
            element={
              <PrivateRoute>
                <Layout>
                  <MyRegistrationsPage />
                </Layout>
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/registration/:id/qrcode" 
            element={
              <PrivateRoute>
                <Layout>
                  <QrCodePage />
                </Layout>
              </PrivateRoute>
            } 
          />
          
          {/* 管理者専用ページ */}
          <Route 
            path="/admin/check-ins" 
            element={
              <AdminRoute>
                <Layout>
                  <div>チェックイン管理（イベント選択）ページ（実装予定）</div>
                </Layout>
              </AdminRoute>
            } 
          />
          
          <Route 
            path="/admin/events/:eventId/check-ins" 
            element={
              <AdminRoute>
                <Layout>
                  <CheckInManagementPage />
                </Layout>
              </AdminRoute>
            } 
          />
          
          {/* API テストツール */}
          <Route 
            path="/api-test" 
            element={
              <Layout>
                <ApiTestTool />
              </Layout>
            } 
          />
          
          {/* 存在しないパスの場合はホームにリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
