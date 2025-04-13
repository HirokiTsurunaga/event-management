import api from './api';

export interface Event {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string;
  capacity: number | null;
  is_published: boolean;
  image_path: string | null;
  created_at: string;
  updated_at: string;
  participant_count?: number;
  creator?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface EventFormData {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  capacity?: number;
  is_published: boolean;
  image?: File;
}

export interface EventSearchParams {
  search?: string;
  categories?: string;
  date_from?: string;
  date_to?: string;
  available_only?: boolean;
  sort_by?: 'name' | 'start_date' | 'location' | 'created_at';
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

const EventService = {
  // イベント一覧取得
  getEvents: async (params: EventSearchParams = {}) => {
    const queryParams = new URLSearchParams();
    
    // ページネーションパラメータ
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    
    if (params.per_page) {
      queryParams.append('per_page', params.per_page.toString());
    }
    
    // 検索パラメータ
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    // カテゴリーフィルター
    if (params.categories) {
      queryParams.append('categories', params.categories);
    }
    
    // 日付範囲フィルター
    if (params.date_from) {
      queryParams.append('date_from', params.date_from);
    }
    
    if (params.date_to) {
      queryParams.append('date_to', params.date_to);
    }
    
    // 参加可能なイベントのみ表示
    if (params.available_only) {
      queryParams.append('available_only', params.available_only.toString());
    }
    
    // ソート順
    if (params.sort_by) {
      queryParams.append('sort_by', params.sort_by);
    }
    
    if (params.sort_dir) {
      queryParams.append('sort_dir', params.sort_dir);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/events?${queryString}` : '/events';
    
    const response = await api.get(endpoint);
    return response.data;
  },
  
  // イベント詳細取得
  getEvent: async (id: number) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  
  // イベント作成（管理者用）
  createEvent: async (eventData: EventFormData) => {
    // FormDataを使用して、ファイルと通常のデータを一緒に送信
    const formData = new FormData();
    Object.entries(eventData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    const response = await api.post('/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // イベント更新（管理者用）
  updateEvent: async (id: number, eventData: EventFormData) => {
    const formData = new FormData();
    Object.entries(eventData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    // PUTの代わりにPOSTを使用し、_methodフィールドでHTTPメソッドを指定
    formData.append('_method', 'PUT');
    
    const response = await api.post(`/events/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // イベント削除（管理者用）
  deleteEvent: async (id: number) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  }
};

export default EventService; 