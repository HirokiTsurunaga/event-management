import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  CircularProgress, 
  Alert, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import AuthService from '../services/auth';
import EventService from '../services/event';
import RegistrationService from '../services/registration';

interface TestResponse {
  success: boolean;
  data: any;
  error?: string;
}

const ApiTestTool: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [apiFunction, setApiFunction] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [eventId, setEventId] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [page, setPage] = useState('1');
  const [comments, setComments] = useState('');
  const [token, setToken] = useState<string>('');
  const [tokenCopied, setTokenCopied] = useState(false);
  const [customToken, setCustomToken] = useState('');

  // トークン更新を監視
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken || '');
  }, [response]);

  // トークンをコピー
  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  // トークンをクリア
  const clearToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setCustomToken('');
  };

  // カスタムトークンを設定
  const setCustomAuthToken = () => {
    if (customToken) {
      localStorage.setItem('token', customToken);
      setToken(customToken);
    }
  };

  const testAuth = async (method: string) => {
    setLoading(true);
    setResponse(null);
    
    try {
      let result;
      switch (method) {
        case 'login':
          result = await AuthService.login({ email, password });
          break;
        case 'register':
          result = await AuthService.register({ 
            name, 
            email, 
            password, 
            password_confirmation: password 
          });
          break;
        case 'logout':
          result = await AuthService.logout();
          break;
        case 'user':
          result = await AuthService.getCurrentUser();
          break;
        default:
          throw new Error('不明な認証メソッドです');
      }
      
      setResponse({
        success: true,
        data: result
      });

      // トークン更新
      const storedToken = localStorage.getItem('token');
      setToken(storedToken || '');
    } catch (error: any) {
      setResponse({
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || '不明なエラーが発生しました'
      });
    } finally {
      setLoading(false);
    }
  };

  const testEvents = async (method: string) => {
    setLoading(true);
    setResponse(null);
    
    try {
      let result;
      switch (method) {
        case 'list':
          result = await EventService.getEvents(parseInt(page));
          break;
        case 'detail':
          if (!eventId) throw new Error('イベントIDが必要です');
          result = await EventService.getEvent(parseInt(eventId));
          break;
        default:
          throw new Error('不明なイベントメソッドです');
      }
      
      setResponse({
        success: true,
        data: result
      });
    } catch (error: any) {
      setResponse({
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || '不明なエラーが発生しました'
      });
    } finally {
      setLoading(false);
    }
  };

  const testRegistrations = async (method: string) => {
    setLoading(true);
    setResponse(null);
    
    try {
      let result;
      switch (method) {
        case 'my-list':
          result = await RegistrationService.getMyRegistrations(parseInt(page));
          break;
        case 'register':
          if (!eventId) throw new Error('イベントIDが必要です');
          result = await RegistrationService.registerForEvent(parseInt(eventId), comments);
          break;
        case 'detail':
          if (!registrationId) throw new Error('登録IDが必要です');
          result = await RegistrationService.getRegistration(parseInt(registrationId));
          break;
        case 'cancel':
          if (!registrationId) throw new Error('登録IDが必要です');
          result = await RegistrationService.cancelRegistration(parseInt(registrationId));
          break;
        default:
          throw new Error('不明な登録メソッドです');
      }
      
      setResponse({
        success: true,
        data: result
      });
    } catch (error: any) {
      setResponse({
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || '不明なエラーが発生しました'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = () => {
    const [category, method] = apiFunction.split('.');
    
    switch (category) {
      case 'auth':
        testAuth(method);
        break;
      case 'events':
        testEvents(method);
        break;
      case 'registrations':
        testRegistrations(method);
        break;
      default:
        setResponse({
          success: false,
          data: null,
          error: 'テスト機能を選択してください'
        });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API接続テストツール
      </Typography>
      
      {/* トークン管理セクション */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          認証トークン管理
        </Typography>
        
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="現在のトークン"
              value={token}
              variant="outlined"
              fullWidth
              InputProps={{
                readOnly: true,
              }}
            />
            <IconButton 
              color="primary" 
              onClick={copyToken}
              disabled={!token}
              sx={{ ml: 1 }}
            >
              <ContentCopyIcon />
            </IconButton>
            <IconButton 
              color="error" 
              onClick={clearToken}
              disabled={!token}
              sx={{ ml: 1 }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          
          {tokenCopied && (
            <Alert severity="success" sx={{ mt: 1 }}>
              トークンをクリップボードにコピーしました！
            </Alert>
          )}
          
          <Divider sx={{ my: 1 }} />
          
          <Typography variant="subtitle2">
            カスタムトークンを設定
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="カスタムトークン"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              variant="outlined"
              fullWidth
              placeholder="Bearer ..."
            />
            <Button 
              variant="contained" 
              sx={{ ml: 1, height: 56 }}
              disabled={!customToken}
              onClick={setCustomAuthToken}
            >
              設定
            </Button>
          </Box>
        </Stack>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          テスト機能
        </Typography>
        
        <Stack spacing={3} sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>テスト機能</InputLabel>
            <Select
              value={apiFunction}
              onChange={(e) => setApiFunction(e.target.value)}
              label="テスト機能"
            >
              <MenuItem value="" disabled>選択してください</MenuItem>
              <MenuItem disabled><em>認証関連</em></MenuItem>
              <MenuItem value="auth.login">ログイン</MenuItem>
              <MenuItem value="auth.register">新規登録</MenuItem>
              <MenuItem value="auth.logout">ログアウト</MenuItem>
              <MenuItem value="auth.user">現在のユーザー情報取得</MenuItem>
              
              <MenuItem disabled><em>イベント関連</em></MenuItem>
              <MenuItem value="events.list">イベント一覧取得</MenuItem>
              <MenuItem value="events.detail">イベント詳細取得</MenuItem>
              
              <MenuItem disabled><em>参加登録関連</em></MenuItem>
              <MenuItem value="registrations.my-list">自分の参加登録一覧</MenuItem>
              <MenuItem value="registrations.register">イベントに参加登録</MenuItem>
              <MenuItem value="registrations.detail">参加登録詳細取得</MenuItem>
              <MenuItem value="registrations.cancel">参加登録キャンセル</MenuItem>
            </Select>
          </FormControl>
          
          {/* 認証関連のフィールド */}
          {apiFunction.startsWith('auth.') && (
            <>
              {apiFunction === 'auth.register' && (
                <TextField
                  label="名前"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  variant="outlined"
                  fullWidth
                />
              )}
              
              {(apiFunction === 'auth.login' || apiFunction === 'auth.register') && (
                <>
                  <TextField
                    label="メールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    fullWidth
                  />
                  <TextField
                    label="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="outlined"
                    fullWidth
                    type="password"
                  />
                </>
              )}
            </>
          )}
          
          {/* イベント関連のフィールド */}
          {apiFunction.startsWith('events.') && (
            <>
              {apiFunction === 'events.list' && (
                <TextField
                  label="ページ番号"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  variant="outlined"
                  fullWidth
                  type="number"
                />
              )}
              
              {apiFunction === 'events.detail' && (
                <TextField
                  label="イベントID"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  variant="outlined"
                  fullWidth
                  type="number"
                />
              )}
            </>
          )}
          
          {/* 参加登録関連のフィールド */}
          {apiFunction.startsWith('registrations.') && (
            <>
              {apiFunction === 'registrations.my-list' && (
                <TextField
                  label="ページ番号"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  variant="outlined"
                  fullWidth
                  type="number"
                />
              )}
              
              {apiFunction === 'registrations.register' && (
                <>
                  <TextField
                    label="イベントID"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    variant="outlined"
                    fullWidth
                    type="number"
                  />
                  <TextField
                    label="コメント"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                  />
                </>
              )}
              
              {(apiFunction === 'registrations.detail' || apiFunction === 'registrations.cancel') && (
                <TextField
                  label="登録ID"
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  variant="outlined"
                  fullWidth
                  type="number"
                />
              )}
            </>
          )}
        </Stack>
        
        <Button 
          variant="contained" 
          onClick={handleTest} 
          disabled={loading || !apiFunction}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'テスト実行'}
        </Button>
      </Paper>
      
      {/* レスポンス表示 */}
      {response && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            テスト結果
          </Typography>
          
          {response.success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              リクエスト成功
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              エラー: {response.error}
            </Alert>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            レスポンスデータ:
          </Typography>
          
          <Card variant="outlined" sx={{ maxHeight: '400px', overflow: 'auto' }}>
            <CardContent>
              <pre style={{ margin: 0 }}>
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </Paper>
      )}
      
      {/* 現在の認証状態 */}
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          現在の認証状態
        </Typography>
        
        <Typography variant="body1">
          ログイン状態: {AuthService.isLoggedIn() ? '✅ ログイン中' : '❌ 未ログイン'}
        </Typography>
        
        <Typography variant="body1">
          管理者権限: {AuthService.isAdmin() ? '✅ 管理者' : '❌ 一般ユーザー'}
        </Typography>
        
        {AuthService.isLoggedIn() && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              ユーザー情報:
            </Typography>
            <pre>
              {JSON.stringify(AuthService.getUser(), null, 2)}
            </pre>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ApiTestTool; 