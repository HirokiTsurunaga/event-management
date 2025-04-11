import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Chip, 
  Button, 
  Stack, 
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination
} from '@mui/material';
import { 
  Event, 
  CalendarMonth, 
  LocationOn, 
  Cancel, 
  QrCode,
  Error,
  CheckCircle,
  AccessTime
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import RegistrationService, { Registration } from '../../services/registration';
import AuthService from '../../services/auth';

const MyRegistrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  useEffect(() => {
    checkLoginStatus();
    fetchMyRegistrations();
  }, [page]);
  
  const checkLoginStatus = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        navigate('/login', { state: { redirectTo: '/my-registrations' } });
      }
    } catch (err) {
      navigate('/login', { state: { redirectTo: '/my-registrations' } });
    }
  };
  
  const fetchMyRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await RegistrationService.getMyRegistrations(page);
      setRegistrations(response.data);
      setTotalPages(Math.ceil(response.total / response.per_page));
    } catch (err) {
      console.error('参加登録情報の取得中にエラーが発生しました', err);
      setError('参加登録情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  const handleCancelClick = (registration: Registration) => {
    setSelectedRegistration(registration);
    setCancelDialogOpen(true);
  };
  
  const handleCancelConfirm = async () => {
    if (!selectedRegistration) return;
    
    setCancelLoading(true);
    try {
      await RegistrationService.cancelRegistration(selectedRegistration.id);
      setCancelDialogOpen(false);
      setSelectedRegistration(null);
      
      // 登録リストを更新
      fetchMyRegistrations();
    } catch (err) {
      console.error('参加登録のキャンセル中にエラーが発生しました', err);
      setError('キャンセルに失敗しました。もう一度お試しください。');
    } finally {
      setCancelLoading(false);
    }
  };
  
  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
    setSelectedRegistration(null);
  };
  
  // 登録状態に応じたチップを返す
  const getStatusChip = (registration: Registration) => {
    if (registration.status === 'cancelled') {
      return <Chip label="キャンセル済み" color="error" size="small" icon={<Cancel />} />;
    }
    
    if (registration.status === 'pending') {
      return <Chip label="確認待ち" color="warning" size="small" icon={<AccessTime />} />;
    }
    
    if (registration.isCheckedIn) {
      return <Chip label="チェックイン済み" color="info" size="small" icon={<CheckCircle />} />;
    }
    
    if (registration.status === 'confirmed') {
      return <Chip label="参加確定" color="success" size="small" icon={<Event />} />;
    }
    
    return <Chip label="不明" color="default" size="small" icon={<Error />} />;
  };
  
  // イベント日時をフォーマットする
  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy年MM月dd日(E) HH:mm', { locale: ja });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          マイ参加登録
        </Typography>
        <Typography variant="body1" color="text.secondary">
          参加登録済みのイベント一覧です
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : registrations.length > 0 ? (
        <>
          <Stack spacing={3} sx={{ mb: 4 }}>
            {registrations.map((registration) => (
              <Paper key={registration.id} elevation={1} sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">
                    {registration.event?.name || 'イベント名不明'}
                  </Typography>
                  
                  {getStatusChip(registration)}
                </Stack>
                
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {registration.event?.start_date && (
                    <Box display="flex" alignItems="center">
                      <CalendarMonth sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatEventDate(registration.event.start_date)}
                          {registration.event.end_date && ` 〜 ${formatEventDate(registration.event.end_date)}`}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {registration.event?.location && (
                    <Box display="flex" alignItems="center">
                      <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        {registration.event.location}
                      </Typography>
                    </Box>
                  )}
                </Stack>
                
                {registration.comments && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        あなたのコメント:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {registration.comments}
                      </Typography>
                    </Box>
                  </>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Box 
                  display="flex" 
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      登録コード: <strong>{registration.registration_code}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      登録日: {formatEventDate(registration.created_at).split(' ')[0]}
                    </Typography>
                  </Box>
                  
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={1}
                  >
                    {registration.status !== 'cancelled' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleCancelClick(registration)}
                        disabled={registration.isCheckedIn}
                      >
                        キャンセル
                      </Button>
                    )}
                    
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/events/${registration.event_id}`)}
                    >
                      詳細を見る
                    </Button>
                    
                    {registration.status === 'confirmed' && !registration.isCheckedIn && (
                      <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        startIcon={<QrCode />}
                        onClick={() => navigate(`/registration/${registration.id}/qrcode`)}
                      >
                        QRコード表示
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
          
          <Box display="flex" justifyContent="center" mt={4} mb={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      ) : (
        <Box textAlign="center" my={5}>
          <Typography variant="h6" color="text.secondary">
            参加登録がありません
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1} mb={3}>
            興味のあるイベントを探して参加登録してみましょう
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/events')}
            startIcon={<Event />}
          >
            イベントを探す
          </Button>
        </Box>
      )}
      
      {/* キャンセル確認ダイアログ */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCancelDialogClose}
      >
        <DialogTitle>
          イベント参加をキャンセルしますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedRegistration?.event?.name} への参加登録をキャンセルします。
            一度キャンセルすると、元に戻すことはできません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose} disabled={cancelLoading}>
            戻る
          </Button>
          <Button 
            onClick={handleCancelConfirm} 
            color="error" 
            disabled={cancelLoading}
            autoFocus
          >
            {cancelLoading ? 'キャンセル中...' : 'キャンセルする'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyRegistrationsPage; 