import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { 
  QrCodeScanner, 
  Person, 
  Check, 
  Close, 
  Delete, 
  Refresh, 
  BarChart,
  Search
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import EventService, { Event } from '../../services/event';
import RegistrationService, { Registration } from '../../services/registration';
import CheckInService, { CheckIn, CheckInStatistics } from '../../services/checkIn';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`check-in-tabpanel-${index}`}
      aria-labelledby={`check-in-tab-${index}`}
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

const CheckInManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [tabValue, setTabValue] = useState(0);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [statistics, setStatistics] = useState<CheckInStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [registrationCode, setRegistrationCode] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // イベント情報の取得
  useEffect(() => {
    if (!eventId) return;
    
    const fetchEventData = async () => {
      setLoading(true);
      try {
        const response = await EventService.getEvent(Number(eventId));
        setEvent(response.event);
      } catch (error) {
        console.error('イベント情報の取得中にエラーが発生しました', error);
        setSnackbar({
          open: true,
          message: 'イベント情報の取得に失敗しました。',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);

  // 参加者一覧の取得
  const fetchParticipants = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const response = await RegistrationService.getEventParticipants(
        Number(eventId),
        page + 1,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setRegistrations(response.registrations.data);
    } catch (error) {
      console.error('参加者情報の取得中にエラーが発生しました', error);
      setSnackbar({
        open: true,
        message: '参加者情報の取得に失敗しました。',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // チェックイン一覧の取得
  const fetchCheckIns = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const response = await CheckInService.getEventCheckIns(Number(eventId), page + 1);
      setCheckIns(response.check_ins.data);
    } catch (error) {
      console.error('チェックイン情報の取得中にエラーが発生しました', error);
      setSnackbar({
        open: true,
        message: 'チェックイン情報の取得に失敗しました。',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 統計情報の取得
  const fetchStatistics = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const response = await CheckInService.getEventStatistics(Number(eventId));
      setStatistics(response.statistics);
    } catch (error) {
      console.error('統計情報の取得中にエラーが発生しました', error);
      setSnackbar({
        open: true,
        message: '統計情報の取得に失敗しました。',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // データの読み込み
  useEffect(() => {
    if (tabValue === 0) {
      fetchParticipants();
    } else if (tabValue === 1) {
      fetchCheckIns();
    } else if (tabValue === 2) {
      fetchStatistics();
    }
  }, [tabValue, page, rowsPerPage, statusFilter, eventId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // チェックイン処理
  const handleCheckIn = async (registrationId: number) => {
    setLoading(true);
    try {
      const response = await CheckInService.checkInParticipant(registrationId);
      setSnackbar({
        open: true,
        message: 'チェックインが完了しました。',
        severity: 'success'
      });
      
      // データを再読み込み
      if (tabValue === 0) {
        fetchParticipants();
      }
    } catch (error: any) {
      console.error('チェックイン処理中にエラーが発生しました', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'チェックイン処理に失敗しました。',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // QRコードでチェックイン
  const handleQRCheckIn = async () => {
    if (!eventId || !registrationCode) return;
    
    setLoading(true);
    try {
      const response = await CheckInService.checkInByCode(Number(eventId), registrationCode);
      setSnackbar({
        open: true,
        message: 'チェックインが完了しました。',
        severity: 'success'
      });
      setRegistrationCode('');
      
      // データを再読み込み
      if (tabValue === 0) {
        fetchParticipants();
      }
    } catch (error: any) {
      console.error('QRコードチェックイン処理中にエラーが発生しました', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'QRコードチェックイン処理に失敗しました。',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {event.name} - チェックイン管理
        </Typography>
        <Typography variant="body2" color="text.secondary">
          開催日: {format(new Date(event.start_date), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          会場: {event.location}
        </Typography>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="チェックイン管理タブ">
          <Tab label="参加者一覧" icon={<Person />} iconPosition="start" />
          <Tab label="チェックイン記録" icon={<Check />} iconPosition="start" />
          <Tab label="統計情報" icon={<BarChart />} iconPosition="start" />
          <Tab label="QRコードスキャン" icon={<QrCodeScanner />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* 参加者一覧タブ */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="参加者を検索"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">ステータス</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={statusFilter}
                  label="ステータス"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="confirmed">確認済み</MenuItem>
                  <MenuItem value="pending">保留中</MenuItem>
                  <MenuItem value="cancelled">キャンセル</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />}
                onClick={fetchParticipants}
                fullWidth
              >
                更新
              </Button>
            </Grid>
          </Grid>
        </Box>

        <TableContainer component={Paper}>
          <Table aria-label="参加者一覧">
            <TableHead>
              <TableRow>
                <TableCell>氏名</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>登録日</TableCell>
                <TableCell>チェックイン</TableCell>
                <TableCell>アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations.length > 0 ? (
                registrations
                  .filter(registration => 
                    registration.user.name.includes(searchQuery) || 
                    registration.user.email.includes(searchQuery)
                  )
                  .map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>{registration.user.name}</TableCell>
                      <TableCell>{registration.user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={
                            registration.status === 'confirmed' ? '確認済み' :
                            registration.status === 'pending' ? '保留中' :
                            'キャンセル'
                          }
                          color={
                            registration.status === 'confirmed' ? 'success' :
                            registration.status === 'pending' ? 'warning' :
                            'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(registration.created_at), 'yyyy/MM/dd HH:mm')}
                      </TableCell>
                      <TableCell>
                        {registration.isCheckedIn ? (
                          <Chip label="済" color="success" size="small" icon={<Check />} />
                        ) : (
                          <Chip label="未" color="default" size="small" icon={<Close />} />
                        )}
                      </TableCell>
                      <TableCell>
                        {!registration.isCheckedIn && registration.status === 'confirmed' && (
                          <Button 
                            variant="contained" 
                            color="primary" 
                            size="small"
                            onClick={() => handleCheckIn(registration.id)}
                            disabled={loading}
                          >
                            チェックイン
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {loading ? (
                      <CircularProgress size={24} sx={{ my: 2 }} />
                    ) : (
                      '参加者がいません'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={-1}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to }) => `${from}–${to} 件`}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </TableContainer>
      </TabPanel>

      {/* チェックイン記録タブ */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchCheckIns}
          >
            更新
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table aria-label="チェックイン記録">
            <TableHead>
              <TableRow>
                <TableCell>参加者</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>チェックイン日時</TableCell>
                <TableCell>チェックイン担当者</TableCell>
                <TableCell>メモ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checkIns.length > 0 ? (
                checkIns.map((checkIn) => (
                  <TableRow key={checkIn.id}>
                    <TableCell>{checkIn.registration.user.name}</TableCell>
                    <TableCell>{checkIn.registration.user.email}</TableCell>
                    <TableCell>
                      {format(new Date(checkIn.checked_in_at), 'yyyy/MM/dd HH:mm:ss')}
                    </TableCell>
                    <TableCell>{checkIn.checked_by_user.name}</TableCell>
                    <TableCell>{checkIn.notes || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    {loading ? (
                      <CircularProgress size={24} sx={{ my: 2 }} />
                    ) : (
                      'チェックイン記録がありません'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={-1}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to }) => `${from}–${to} 件`}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </TableContainer>
      </TabPanel>

      {/* 統計情報タブ */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchStatistics}
          >
            更新
          </Button>
        </Box>

        {statistics ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    参加登録数
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {statistics.registration_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    確認済みの参加登録数
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    チェックイン済み
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {statistics.checked_in_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    来場済みの参加者数
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    チェックイン率
                  </Typography>
                  <Typography variant="h3" color="info.main">
                    {statistics.check_in_rate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    参加登録者の来場率
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <Typography>統計情報を取得できませんでした。</Typography>
            )}
          </Box>
        )}
      </TabPanel>

      {/* QRコードスキャンタブ */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            QRコードによるチェックイン
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            参加者の登録QRコードをスキャンするか、登録コードを入力してチェックインを行います。
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="登録コード"
              variant="outlined"
              value={registrationCode}
              onChange={(e) => setRegistrationCode(e.target.value)}
              placeholder="登録コードを入力してください"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<QrCodeScanner />}
              onClick={handleQRCheckIn}
              disabled={!registrationCode || loading}
              fullWidth
            >
              {loading ? 'チェックイン処理中...' : 'コードでチェックイン'}
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary">
            注: QRコードスキャン機能は現在簡易実装版です。完全な機能は今後のアップデートで実装予定です。
          </Typography>
        </Paper>
      </TabPanel>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CheckInManagementPage; 