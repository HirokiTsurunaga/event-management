import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EventService, { Event, EventSearchParams } from '../../services/event';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import AuthService from '../../services/auth';

const EventManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    // 管理者権限がない場合はホームページにリダイレクト
    if (!AuthService.isAdmin()) {
      navigate('/');
      return;
    }
    
    fetchEvents();
  }, [page, navigate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // 管理者は公開/非公開にかかわらず全てのイベントを取得
      const params: EventSearchParams = {
        page,
        per_page: 10
      };
      
      const response = await EventService.getEvents(params);
      setEvents(response.events.data);
      setTotalPages(Math.ceil(response.events.total / response.events.per_page));
    } catch (err) {
      console.error('イベント情報の取得中にエラーが発生しました', err);
      setError('イベント情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  const handleCreateEvent = () => {
    navigate('/admin/events/create');
  };
  
  const handleEditEvent = (eventId: number) => {
    navigate(`/admin/events/${eventId}/edit`);
  };
  
  const handleViewEvent = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };
  
  const handleDeleteClick = (eventId: number) => {
    setSelectedEventId(eventId);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedEventId(null);
  };
  
  const handleDeleteConfirm = async () => {
    if (selectedEventId === null) return;
    
    try {
      await EventService.deleteEvent(selectedEventId);
      // 削除後、イベント一覧を再取得
      fetchEvents();
      setDeleteDialogOpen(false);
      setSelectedEventId(null);
    } catch (err) {
      console.error('イベントの削除中にエラーが発生しました', err);
      setError('イベントの削除に失敗しました。');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '日付情報なし';
      }
      return format(date, 'yyyy/MM/dd HH:mm', { locale: ja });
    } catch (error) {
      console.error('日付のフォーマット中にエラーが発生しました:', error);
      return '日付情報なし';
    }
  };

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1">
          イベント管理
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={handleCreateEvent}
        >
          新規イベント作成
        </Button>
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
      ) : events.length > 0 ? (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
            <Table stickyHeader aria-label="イベント管理テーブル">
              <TableHead>
                <TableRow>
                  <TableCell width="30%">イベント名</TableCell>
                  <TableCell width="15%">開催日時</TableCell>
                  <TableCell width="15%">場所</TableCell>
                  <TableCell width="10%">定員</TableCell>
                  <TableCell width="10%">状態</TableCell>
                  <TableCell width="20%" align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{formatDate(event.start_date)}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>
                      {event.capacity ? `${event.participant_count || 0} / ${event.capacity}` : '制限なし'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={event.is_published ? '公開中' : '非公開'} 
                        color={event.is_published ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="info" 
                        onClick={() => handleViewEvent(event.id)}
                        title="詳細を表示"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleEditEvent(event.id)}
                        title="編集"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteClick(event.id)}
                        title="削除"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </Paper>
      ) : (
        <Box textAlign="center" my={5}>
          <Typography variant="h6" color="text.secondary">
            イベントが見つかりませんでした
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
            startIcon={<Add />}
            onClick={handleCreateEvent}
          >
            最初のイベントを作成
          </Button>
        </Box>
      )}
      
      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>イベントの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            このイベントを削除してもよろしいですか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>キャンセル</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventManagementPage; 