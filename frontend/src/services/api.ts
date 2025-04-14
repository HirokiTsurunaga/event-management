import axios from 'axios';

// APIのベースURL設定
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true // クッキーを含める（CSRF対策に必要）
});

// リクエストインターセプター
api.interceptors.request.use(
  config => {
    // 認証トークンがある場合はヘッダーに追加
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // FormDataを送信する場合はContent-Typeヘッダーを削除（ブラウザが自動設定するため）
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // 認証エラー（401）の場合はログアウト
    if (error.response && error.response.status === 401) {
      // 直接localStorage操作
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // バリデーションエラー（422）はそのまま返す
    // レスポンスエラーの詳細をコンソールに出力（デバッグ用）
    if (error.response && error.response.status === 422) {
      console.error('バリデーションエラー:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api; 