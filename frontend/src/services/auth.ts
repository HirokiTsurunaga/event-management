import api from './api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const AuthService = {
  // ユーザー登録
  register: async (userData: RegisterData) => {
    const response = await api.post('/register', userData);
    
    // APIレスポンスの形式チェック
    if (response.data.access_token) {
      // 新しいAPIフォーマット
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } else if (response.data.token) {
      // 古いAPIフォーマット
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } else if (response.data.role) {
      // ユーザーオブジェクトが直接返された場合
      // トークンはヘッダーから取得できない場合があるため、既存のトークンを使用
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    }
    
    return response.data;
  },
  
  // ログイン
  login: async (credentials: LoginData) => {
    const response = await api.post('/login', credentials);
    
    // APIレスポンスの形式チェック
    if (response.data.access_token) {
      // 新しいAPIフォーマット
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } else if (response.data.token) {
      // 古いAPIフォーマット
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } else if (response.data.role) {
      // ユーザーオブジェクトが直接返された場合
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response.data;
  },
  
  // ログアウト
  logout: async () => {
    try {
      const response = await api.post('/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  // 現在のユーザー情報取得
  getCurrentUser: async () => {
    const response = await api.get('/user');
    // ユーザー情報更新
    if (response.data && response.data.id) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  
  // ローカルストレージからユーザー情報取得
  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
  
  // ログイン状態チェック
  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('token');
  },
  
  // 管理者権限チェック
  isAdmin: (): boolean => {
    const user = AuthService.getUser();
    return !!user && user.role === 'admin';
  }
};

export default AuthService; 