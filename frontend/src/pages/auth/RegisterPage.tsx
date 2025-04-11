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
import { 
  Visibility, 
  VisibilityOff, 
  PersonAdd 
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
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
    
    if (!formData.name) {
      newErrors.name = '名前を入力してください';
    }
    
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    }
    
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'パスワード（確認）を入力してください';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'パスワードが一致しません';
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
      await AuthService.register(formData);
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
        setErrorMessage('登録中にエラーが発生しました。後でもう一度お試しください。');
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
            アカウント登録
          </Typography>
          <Typography variant="body2" color="textSecondary">
            イベント参加用のアカウントを作成しましょう
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
            id="name"
            label="名前"
            name="name"
            autoComplete="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="メールアドレス"
            name="email"
            autoComplete="email"
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
            autoComplete="new-password"
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
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password_confirmation"
            label="パスワード（確認）"
            type={showPasswordConfirmation ? 'text' : 'password'}
            id="password_confirmation"
            autoComplete="new-password"
            value={formData.password_confirmation}
            onChange={handleChange}
            error={!!errors.password_confirmation}
            helperText={errors.password_confirmation}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="パスワード（確認）の表示/非表示"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    edge="end"
                  >
                    {showPasswordConfirmation ? <VisibilityOff /> : <Visibility />}
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
            startIcon={<PersonAdd />}
          >
            {isLoading ? '登録中...' : 'アカウント登録'}
          </Button>
          
          <Box textAlign="center">
            <Link component={RouterLink} to="/login" variant="body2">
              既にアカウントをお持ちの方はこちら
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage; 