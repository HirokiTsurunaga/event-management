import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  CircularProgress, 
  Alert,
  Stack,
  Divider,
  Container
} from '@mui/material';
import { 
  QrCode, 
  ArrowBack, 
  Download,
  Event, 
  CalendarMonth, 
  LocationOn
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import RegistrationService, { Registration } from '../../services/registration';
import AuthService from '../../services/auth';

const QrCodePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    checkLoginStatus();
    fetchRegistrationDetails();
  }, [id]);
  
  const checkLoginStatus = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        navigate('/login', { state: { redirectTo: `/registration/${id}/qrcode` } });
      }
    } catch (err) {
      navigate('/login', { state: { redirectTo: `/registration/${id}/qrcode` } });
    }
  };
  
  const fetchRegistrationDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    try {
      const data = await RegistrationService.getRegistration(parseInt(id));
      setRegistration(data);
    } catch (err) {
      console.error('登録情報の取得中にエラーが発生しました', err);
      setError('登録情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };
  
  // QRコードの内容（登録コード）を取得
  const getQrContent = () => {
    if (!registration) return '';
    return registration.registration_code;
  };
  
  // QRコードの画像としてダウンロード
  const handleDownloadQrCode = () => {
    const svgElement = document.getElementById('registration-qrcode');
    if (!svgElement) return;
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `参加登録_${registration?.event?.name || 'イベント'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
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
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={5}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box my={3}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/my-registrations')}
        >
          参加登録一覧に戻る
        </Button>
      </Box>
    );
  }
  
  if (!registration) {
    return (
      <Box textAlign="center" my={5}>
        <Typography variant="h6" color="text.secondary">
          登録情報が見つかりませんでした
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 3 }}
          startIcon={<ArrowBack />}
          onClick={() => navigate('/my-registrations')}
        >
          参加登録一覧に戻る
        </Button>
      </Box>
    );
  }
  
  if (registration.status === 'cancelled') {
    return (
      <Box my={3}>
        <Alert severity="error" sx={{ mb: 3 }}>
          この参加登録はキャンセルされています。QRコードは使用できません。
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/my-registrations')}
        >
          参加登録一覧に戻る
        </Button>
      </Box>
    );
  }
  
  if (registration.status !== 'confirmed') {
    return (
      <Box my={3}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          この参加登録はまだ確定していません。確定後にQRコードが有効になります。
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/my-registrations')}
        >
          参加登録一覧に戻る
        </Button>
      </Box>
    );
  }
  
  if (registration.isCheckedIn) {
    return (
      <Box my={3}>
        <Alert severity="info" sx={{ mb: 3 }}>
          すでにこのイベントにチェックイン済みです。
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/my-registrations')}
        >
          参加登録一覧に戻る
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          参加QRコード
        </Typography>
        <Typography variant="body1" color="text.secondary">
          このQRコードをイベント会場でスタッフに提示してください
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={4} 
          alignItems="center"
          justifyContent="space-between"
        >
          {/* QRコード */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              width: { xs: '100%', md: 'auto' }
            }}
          >
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                mb: 2, 
                display: 'flex', 
                justifyContent: 'center',
                backgroundColor: 'white'
              }}
            >
              <QRCodeSVG 
                id="registration-qrcode"
                value={getQrContent()} 
                size={200} 
                level="H"
                includeMargin={true}
              />
            </Paper>
            
            <Typography variant="subtitle1" align="center" gutterBottom>
              登録コード: <strong>{registration.registration_code}</strong>
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadQrCode}
              sx={{ mt: 1 }}
            >
              QRコードを保存
            </Button>
          </Box>
          
          {/* イベント情報 */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Typography variant="h5" gutterBottom>
              {registration.event?.name || 'イベント名不明'}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={2}>
              {registration.event?.start_date && (
                <Box display="flex" alignItems="center">
                  <CalendarMonth sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body1" fontWeight="500">開催日時</Typography>
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
                  <Box>
                    <Typography variant="body1" fontWeight="500">開催場所</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {registration.event.location}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>
      
      <Box display="flex" justifyContent="space-between">
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={() => navigate('/my-registrations')}
        >
          参加登録一覧に戻る
        </Button>
        
        <Button 
          variant="contained" 
          startIcon={<Event />}
          onClick={() => navigate(`/events/${registration.event_id}`)}
        >
          イベント詳細を見る
        </Button>
      </Box>
    </Box>
  );
};

export default QrCodePage; 