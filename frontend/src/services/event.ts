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

const EventService = {
  // イベント一覧取得
  getEvents: async (page = 1) => {
    const response = await api.get(`/events?page=${page}`);
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