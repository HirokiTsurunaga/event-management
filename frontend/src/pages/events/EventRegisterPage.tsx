import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  TextField, 
  Alert, 
  CircularProgress, 
  Divider, 
  Chip,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import { 
  CalendarMonth, 
  LocationOn, 
  PersonOutline, 
  EventNote,
  Check,
  Add,
  Delete,
  PersonAdd
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import EventService, { Event } from '../../services/event';
import RegistrationService from '../../services/registration';
import AuthService from '../../services/auth';

const MAX_GUESTS = 45; // 最大招待者数

const EventRegisterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [comments, setComments] = useState('');
  const [guestEmails, setGuestEmails] = useState<string[]>([]);
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  useEffect(() => {
    checkLoginStatus();
    fetchEventDetails();
  }, [id]);
  
  const checkLoginStatus = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        // ユーザーがログインしていない場合、ログインページにリダイレクト
        navigate('/login', { state: { redirectTo: `/events/${id}/register` } });
      }
    } catch (err) {
      navigate('/login', { state: { redirectTo: `/events/${id}/register` } });
    }
  };
  
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
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleAddGuest = () => {
    if (!newGuestEmail.trim()) {
      setEmailError('メールアドレスを入力してください');
      return;
    }
    
    if (!validateEmail(newGuestEmail)) {
      setEmailError('有効なメールアドレスを入力してください');
      return;
    }
    
    if (guestEmails.includes(newGuestEmail)) {
      setEmailError('このメールアドレスは既に追加されています');
      return;
    }
    
    if (guestEmails.length >= MAX_GUESTS) {
      setEmailError(`招待者は最大${MAX_GUESTS}人までです`);
      return;
    }
    
    setGuestEmails([...guestEmails, newGuestEmail]);
    setNewGuestEmail('');
    setEmailError('');
  };
  
  const handleRemoveGuest = (email: string) => {
    setGuestEmails(guestEmails.filter(e => e !== email));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    const totalParticipants = 1 + guestEmails.length; // 自分 + 招待者
    
    if (event?.capacity && totalParticipants > (event.capacity - (event.participant_count || 0))) {
      setError(`招待者が多すぎます。あと${event.capacity - (event.participant_count || 0)}人まで登録できます。`);
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      await RegistrationService.registerForEvent(parseInt(id), comments, guestEmails.length > 0 ? guestEmails : undefined);
      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error('イベント登録中にエラーが発生しました', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('イベント登録に失敗しました。後でもう一度お試しください。');
      }
    } finally {
      setSubmitting(false);
    }
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
  
  // 日付をフォーマットする
  const formatEventDate = (dateString: string) => {
    try {
      // 日付形式が正しいことを確認
      const date = new Date(dateString);
      
      // 無効な日付かチェック
      if (isNaN(date.getTime())) {
        return '日付情報なし';
      }
      
      return format(date, 'yyyy年MM月dd日(E) HH:mm', { locale: ja });
    } catch (error) {
      console.error('日付のフォーマット中にエラーが発生しました:', error);
      return '日付情報なし';
    }
  };
  
  // 有効な残り定員数
  const getRemainingCapacity = (): number => {
    if (!event || !event.capacity) return MAX_GUESTS;
    return Math.max(0, event.capacity - (event.participant_count || 0));
  };
  
  // 招待可能な最大人数を計算
  const getMaxGuestsAllowed = (): number => {
    const remainingCapacity = getRemainingCapacity();
    // 自分1人分は必ず確保する
    return Math.min(MAX_GUESTS, remainingCapacity > 0 ? remainingCapacity - 1 : 0);
  };
  
  // 成功画面を表示
  const renderSuccessView = () => {
    return (
      <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <Check sx={{ fontSize: 60, color: 'success.main' }} />
        </Box>
        
        <Typography variant="h5" gutterBottom>
          イベント参加登録が完了しました
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {event?.name} への参加登録が正常に完了しました。
          {guestEmails.length > 0 && (
            <Box mt={1}>
              {guestEmails.length}人のゲストを招待しました。
              招待メールが送信されます。
            </Box>
          )}
          イベント当日はお気をつけてお越しください。
        </Typography>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button 
            variant="contained" 
            onClick={() => navigate(`/events/${id}`)}
          >
            イベント詳細に戻る
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => navigate('/my-registrations')}
          >
            マイ参加登録一覧へ
          </Button>
        </Stack>
      </Paper>
    );
  };
  
  // 登録フォームを表示
  const renderRegistrationForm = () => {
    if (!event) return null;
    
    const maxGuestsAllowed = getMaxGuestsAllowed();
    
    return (
      <>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            イベント参加登録
          </Typography>
          <Typography variant="body1" color="text.secondary">
            以下のイベントに参加登録します
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* イベント概要 */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {event.name}
          </Typography>
          
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center">
              <CalendarMonth sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="body1" fontWeight="500">開催日時</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatEventDate(event.start_date)}
                  {event.end_date && ` 〜 ${formatEventDate(event.end_date)}`}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center">
              <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="body1" fontWeight="500">開催場所</Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.location}
                </Typography>
              </Box>
            </Box>
            
            {event.capacity && (
              <Box display="flex" alignItems="center">
                <PersonOutline sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body1" fontWeight="500">参加人数</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.participant_count || 0} / {event.capacity} 人
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
          
          {isEventFull() && (
            <Alert severity="error" sx={{ mb: 3 }}>
              このイベントは定員に達しています。現在は参加登録できません。
            </Alert>
          )}
        </Paper>
        
        {/* 参加登録フォーム */}
        {!isEventFull() && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              参加登録情報
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="コメント（任意）"
                name="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                multiline
                rows={4}
                placeholder="主催者へのメッセージや質問などがあれば入力してください"
                sx={{ mb: 3 }}
              />
              
              {/* ゲスト招待セクション */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonAdd sx={{ mr: 1 }} />
                  ゲストを招待する（最大{maxGuestsAllowed}人）
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  ゲストのメールアドレスを入力して招待することができます。
                  招待されたゲストには招待メールが送信されます。
                </Typography>
                
                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="ゲストのメールアドレス"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                    error={!!emailError}
                    helperText={emailError}
                    disabled={guestEmails.length >= maxGuestsAllowed}
                    placeholder="例: guest@example.com"
                    sx={{ mr: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddGuest}
                    disabled={guestEmails.length >= maxGuestsAllowed}
                    startIcon={<Add />}
                  >
                    追加
                  </Button>
                </Box>
                
                {guestEmails.length > 0 && (
                  <Box sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      招待ゲスト（{guestEmails.length}人）
                    </Typography>
                    
                    <List dense>
                      {guestEmails.map((email, index) => (
                        <ListItem
                          key={index}
                          secondaryAction={
                            <IconButton edge="end" onClick={() => handleRemoveGuest(email)}>
                              <Delete />
                            </IconButton>
                          }
                        >
                          <ListItemText primary={email} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
              
              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/events/${id}`)}
                >
                  キャンセル
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={<EventNote />}
                >
                  {submitting ? '送信中...' : '参加登録する'}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </>
    );
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={5}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {success ? renderSuccessView() : renderRegistrationForm()}
    </Box>
  );
};

export default EventRegisterPage; 