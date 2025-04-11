import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Stack,
  Link, 
  Box, 
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // 入力時にエラーをクリア
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      await AuthService.login(formData);
      navigate('/');
    } catch (error: any) {
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          // バリデーションエラー
          const serverErrors = error.response.data.errors;
          const formattedErrors: Record<string, string> = {};
          
          Object.keys(serverErrors).forEach(key => {
            formattedErrors[key] = serverErrors[key][0];
          });
          
          setErrors(formattedErrors);
        } else if (error.response.data.message) {
          // 一般的なエラーメッセージ
          setErrorMessage(error.response.data.message);
        }
      } else {
        setErrorMessage('ログイン中にエラーが発生しました。後でもう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            ログイン
          </Typography>
          <Typography variant="body2" color="textSecondary">
            アカウントにログインして、イベントに参加しましょう
          </Typography>
        </Box>
        
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="メールアドレス"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="パスワード"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="パスワードの表示/非表示"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
            startIcon={<LoginIcon />}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
          
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              パスワードをお忘れですか？
            </Link>
            <Link component={RouterLink} to="/register" variant="body2">
              アカウントをお持ちでない方はこちら
            </Link>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage; 