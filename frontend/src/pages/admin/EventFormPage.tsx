import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControlLabel, 
  Switch, 
  Grid as MuiGrid, 
  Paper, 
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import EventService, { Event, EventFormData } from '../../services/event';
import { PhotoCamera, ArrowBack } from '@mui/icons-material';
import AuthService from '../../services/auth';
import { format } from 'date-fns';

// カスタムGridコンポーネント
const Grid = (props: any) => <MuiGrid {...props} />;
const GridItem = (props: any) => <MuiGrid item {...props} />;

const EventFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  
  // フォームの初期値
  const initialFormState: EventFormData = {
    name: '',
    description: '',
    start_date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    end_date: format(new Date(Date.now() + 3600000), 'yyyy-MM-dd HH:mm:ss'), // 1時間後
    location: '',
    capacity: undefined,
    is_published: false
  };
  
  // フォームの状態
  const [formData, setFormData] = useState<EventFormData>(initialFormState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date(Date.now() + 3600000));
  
  // UI状態
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 編集モードの場合、イベント情報を取得
  useEffect(() => {
    // 管理者権限がない場合はホームページにリダイレクト
    if (!AuthService.isAdmin()) {
      navigate('/');
      return;
    }
    
    if (isEditMode && id) {
      fetchEventDetails(parseInt(id));
    }
  }, [id, isEditMode, navigate]);
  
  // イベント詳細を取得
  const fetchEventDetails = async (eventId: number) => {
    setLoading(true);
    try {
      const response = await EventService.getEvent(eventId);
      const event = response.event;
      
      // 日付文字列をDateオブジェクトに変換
      const startDateObj = new Date(event.start_date);
      const endDateObj = new Date(event.end_date);
      
      setStartDate(startDateObj);
      setEndDate(endDateObj);
      
      setFormData({
        name: event.name,
        description: event.description || '',
        start_date: event.start_date,
        end_date: event.end_date,
        location: event.location,
        capacity: event.capacity || undefined,
        is_published: event.is_published
      });
      
      // 画像プレビュー設定
      if (event.image_path) {
        setImagePreview(`http://localhost:8000/storage/${event.image_path}`);
      }
    } catch (err) {
      console.error('イベント情報の取得中にエラーが発生しました', err);
      setError('イベント情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };
  
  // テキストフィールド変更ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 数値入力ハンドラ（定員用）
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? undefined : parseInt(value);
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };
  
  // 公開設定スイッチハンドラ
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      is_published: e.target.checked
    }));
  };
  
  // 開始日時変更ハンドラ
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    if (date) {
      // ISO形式ではなく、MySQL互換のフォーマットに変換
      const formattedDate = format(date, 'yyyy-MM-dd HH:mm:ss');
      setFormData(prev => ({
        ...prev,
        start_date: formattedDate
      }));
      
      // 開始日時が終了日時より後の場合、終了日時を自動調整
      if (endDate && date > endDate) {
        const newEndDate = new Date(date.getTime() + 3600000); // 開始時刻の1時間後
        setEndDate(newEndDate);
        setFormData(prev => ({
          ...prev,
          end_date: format(newEndDate, 'yyyy-MM-dd HH:mm:ss')
        }));
      }
    }
  };
  
  // 終了日時変更ハンドラ
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    if (date) {
      // ISO形式ではなく、MySQL互換のフォーマットに変換
      const formattedDate = format(date, 'yyyy-MM-dd HH:mm:ss');
      setFormData(prev => ({
        ...prev,
        end_date: formattedDate
      }));
    }
  };
  
  // 画像選択ハンドラ
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // プレビュー表示
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImagePreview(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (isEditMode && id) {
        // 既存イベントの更新
        await EventService.updateEvent(parseInt(id), formData);
        setSuccess('イベントが更新されました。');
      } else {
        // 新規イベント作成
        await EventService.createEvent(formData);
        setSuccess('イベントが作成されました。');
        
        // 成功したら管理ページに戻る（少し待ってから）
        setTimeout(() => {
          navigate('/admin/events');
        }, 1500);
      }
    } catch (err: any) {
      console.error('イベントの保存中にエラーが発生しました', err);
      
      // より詳細なエラーメッセージを表示
      if (err.response && err.response.data && err.response.data.message) {
        setError(`エラー: ${err.response.data.message}`);
      } else if (err.response && err.response.data && err.response.data.errors) {
        // バリデーションエラーの場合
        const errorMessages = Object.values(err.response.data.errors).flat();
        setError(`入力エラー: ${errorMessages.join(', ')}`);
      } else {
        setError('イベントの保存に失敗しました。入力内容を確認してください。');
      }
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // キャンセルボタンハンドラ
  const handleCancel = () => {
    navigate('/admin/events');
  };

  return (
    <Box>
      <Box mb={4} display="flex" alignItems="center">
        <IconButton 
          onClick={handleCancel} 
          sx={{ mr: 2 }}
          aria-label="戻る"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'イベントの編集' : '新規イベント作成'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
              <Grid container spacing={3}>
                {/* イベント名 */}
                <GridItem xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="イベント名"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </GridItem>
                
                {/* 説明 */}
                <GridItem xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="イベント説明"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </GridItem>
                
                {/* 日時 */}
                <GridItem xs={12} md={6}>
                  <DateTimePicker
                    label="開始日時"
                    value={startDate}
                    onChange={handleStartDateChange}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </GridItem>
                
                <GridItem xs={12} md={6}>
                  <DateTimePicker
                    label="終了日時"
                    value={endDate}
                    onChange={handleEndDateChange}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        required: true,
                        helperText: startDate && endDate && startDate > endDate ? '終了日時は開始日時より後にしてください' : ''
                      } 
                    }}
                  />
                </GridItem>
                
                {/* 場所 */}
                <GridItem xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="開催場所"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    variant="outlined"
                  />
                </GridItem>
                
                {/* 定員 */}
                <GridItem xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="定員"
                    name="capacity"
                    type="number"
                    value={formData.capacity === undefined ? '' : formData.capacity}
                    onChange={handleNumberChange}
                    variant="outlined"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">人</InputAdornment>,
                    }}
                    inputProps={{ min: 1 }}
                    helperText="空欄の場合は定員無制限"
                  />
                </GridItem>
                
                {/* 画像アップロード */}
                <GridItem xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      イベント画像
                    </Typography>
                  </Divider>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<PhotoCamera />}
                    >
                      画像を選択
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageChange}
                      />
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      JPG, PNG, GIF形式 (最大2MB)
                    </Typography>
                  </Box>
                  
                  {imagePreview && (
                    <Box mt={2} mb={3} sx={{ maxWidth: 400 }}>
                      <img 
                        src={imagePreview} 
                        alt="イベントのプレビュー画像" 
                        style={{ width: '100%', borderRadius: '4px' }} 
                      />
                    </Box>
                  )}
                </GridItem>
                
                {/* 公開設定 */}
                <GridItem xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_published}
                        onChange={handleSwitchChange}
                        name="is_published"
                        color="primary"
                      />
                    }
                    label="このイベントを公開する"
                  />
                  <Typography variant="body2" color="text.secondary">
                    非公開の場合はイベント一覧に表示されません
                  </Typography>
                </GridItem>
                
                {/* 送信ボタン */}
                <GridItem xs={12}>
                  <Divider sx={{ mb: 2 }} />
                  <Box display="flex" justifyContent="flex-end" gap={2}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={submitLoading}
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submitLoading}
                      startIcon={submitLoading && <CircularProgress size={20} color="inherit" />}
                    >
                      {submitLoading 
                        ? '保存中...' 
                        : isEditMode 
                          ? '変更を保存' 
                          : 'イベントを作成'
                      }
                    </Button>
                  </Box>
                </GridItem>
              </Grid>
            </LocalizationProvider>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default EventFormPage; 