import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Chip, 
  Divider, 
  Stack, 
  CircularProgress, 
  Alert,
  Container
} from '@mui/material';
import { 
  CalendarMonth, 
  LocationOn, 
  PersonOutline, 
  AccessTime, 
  Info, 
  AppRegistration
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import EventService, { Event } from '../../services/event';
import AuthService from '../../services/auth';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        setIsLoggedIn(!!user);
      } catch (err) {
        setIsLoggedIn(false);
      }
    };
    
    checkLoginStatus();
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    try {
      const eventData = await EventService.getEvent(parseInt(id));
      setEvent(eventData);
    } catch (err) {
      console.error('イベント詳細の取得中にエラーが発生しました', err);
      setError('イベント情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { redirectTo: `/events/${id}/register` } });
      return;
    }
    
    navigate(`/events/${id}/register`);
  };

  // イベントが定員に達しているかどうかを確認する
  const isEventFull = (): boolean => {
    if (!event) return false;
    return Boolean(
      event.capacity && 
      event.participant_count && 
      event.participant_count >= event.capacity
    );
  };

  // イベントの開催日時をフォーマットする
  const formatEventDate = () => {
    if (!event) return '';
    
    try {
      const startDate = new Date(event.start_date);
      
      // 無効な日付かチェック
      if (isNaN(startDate.getTime())) {
        return '日付情報なし';
      }
      
      const endDate = event.end_date ? new Date(event.end_date) : null;
      
      // 終了日も無効な日付かチェック
      if (endDate && isNaN(endDate.getTime())) {
        return format(startDate, 'yyyy年MM月dd日(E)', { locale: ja });
      }
      
      const formattedStart = format(startDate, 'yyyy年MM月dd日(E)', { locale: ja });
      
      if (!endDate) {
        return formattedStart;
      }
      
      // 同じ日の場合は日付を1回だけ表示
      if (startDate.toDateString() === endDate.toDateString()) {
        return formattedStart;
      }
      
      // 異なる日の場合は開始日と終了日を表示
      const formattedEnd = format(endDate, 'yyyy年MM月dd日(E)', { locale: ja });
      return `${formattedStart} 〜 ${formattedEnd}`;
    } catch (error) {
      console.error('日付のフォーマット中にエラーが発生しました:', error);
      return '日付情報なし';
    }
  };

  // イベントの開催時間をフォーマットする
  const formatEventTime = () => {
    if (!event) return '';
    
    try {
      const startDate = new Date(event.start_date);
      
      // 無効な日付かチェック
      if (isNaN(startDate.getTime())) {
        return '時間情報なし';
      }
      
      const endDate = event.end_date ? new Date(event.end_date) : null;
      
      // 終了日も無効な日付かチェック
      if (endDate && isNaN(endDate.getTime())) {
        return format(startDate, 'HH:mm', { locale: ja });
      }
      
      const formattedStart = format(startDate, 'HH:mm', { locale: ja });
      
      if (!endDate) {
        return formattedStart;
      }
      
      const formattedEnd = format(endDate, 'HH:mm', { locale: ja });
      return `${formattedStart} 〜 ${formattedEnd}`;
    } catch (error) {
      console.error('時間のフォーマット中にエラーが発生しました:', error);
      return '時間情報なし';
    }
  };

  return (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 3 }}>
          {error}
        </Alert>
      ) : event ? (
        <>
          {/* イベント画像 */}
          <Box 
            sx={{ 
              height: '250px', 
              width: '100%', 
              position: 'relative', 
              overflow: 'hidden',
              mb: 3,
              borderRadius: 1
            }}
          >
            <Box
              component="img"
              src={event.image_path ? `http://localhost:8000/storage/${event.image_path}` : '/event-placeholder.jpg'}
              alt={event.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
          
          {/* イベント名と状態 */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1" gutterBottom>
              {event.name}
            </Typography>
            
            <Box>
              {isEventFull() ? (
                <Chip 
                  label="定員満員" 
                  color="error" 
                  icon={<Info />} 
                />
              ) : (
                <Chip 
                  label="参加可能" 
                  color="success" 
                  icon={<PersonOutline />} 
                />
              )}
            </Box>
          </Box>
          
          {/* イベント概要 */}
          <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                {/* 日時、場所など基本情報 */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box display="flex" alignItems="center">
                    <CalendarMonth sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body1" fontWeight="500">日付</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatEventDate()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <AccessTime sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body1" fontWeight="500">時間</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatEventTime()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body1" fontWeight="500">場所</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {event.capacity && (
                    <Box display="flex" alignItems="center">
                      <PersonOutline sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body1" fontWeight="500">定員</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {event.participant_count || 0} / {event.capacity} 人
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
                
                <Divider sx={{ my: 3 }} />
                
                {/* イベント詳細 */}
                <Typography variant="h6" gutterBottom>
                  イベント詳細
                </Typography>
                
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {event.description || 'イベントの詳細はありません。'}
                </Typography>
              </Box>
              
              <Box sx={{ width: { xs: '100%', md: '300px' } }}>
                {/* イベント参加ボタン */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    イベントに参加する
                  </Typography>
                  
                  {isEventFull() ? (
                    <>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        このイベントは定員に達しています。
                      </Alert>
                      <Button 
                        variant="contained" 
                        color="primary"
                        fullWidth
                        disabled
                      >
                        満員です
                      </Button>
                    </>
                  ) : !isLoggedIn ? (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        参加するにはログインが必要です。
                      </Typography>
                      <Stack spacing={1}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          fullWidth
                          onClick={() => navigate('/login', { state: { redirectTo: `/events/${id}/register` } })}
                        >
                          ログインして参加する
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          fullWidth
                          onClick={() => navigate('/register', { state: { redirectTo: `/events/${id}/register` } })}
                        >
                          新規登録して参加する
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        このイベントに参加しませんか？
                        {event.capacity && (
                          <Box component="span" fontWeight="bold">
                            残り{event.capacity - (event.participant_count || 0)}席
                          </Box>
                        )}
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        fullWidth
                        onClick={handleRegisterClick}
                      >
                        参加登録する
                      </Button>
                    </>
                  )}
                </Paper>
                
                {/* イベント情報 */}
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    イベント情報
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    主催者: {event.creator ? event.creator.name : '不明'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    作成日: {(() => {
                      try {
                        const date = new Date(event.created_at);
                        if (isNaN(date.getTime())) {
                          return '日付情報なし';
                        }
                        return format(date, 'yyyy年MM月dd日', { locale: ja });
                      } catch (error) {
                        console.error('作成日のフォーマット中にエラーが発生しました:', error);
                        return '日付情報なし';
                      }
                    })()}
                  </Typography>
                  
                  {isLoggedIn && (
                    <Box mt={2}>
                      <Button 
                        variant="text" 
                        color="primary" 
                        size="small"
                        onClick={() => navigate('/my-registrations')}
                      >
                        マイ参加登録一覧へ
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          </Paper>
        </>
      ) : (
        <Box textAlign="center" my={5}>
          <Typography variant="h5" color="text.secondary">
            イベントが見つかりませんでした
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/events')}
          >
            イベント一覧に戻る
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default EventDetailPage; 