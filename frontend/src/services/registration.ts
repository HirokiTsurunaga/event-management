import api from './api';

export interface Registration {
  id: number;
  event_id: number;
  user_id: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  comments: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  registration_code: string;
  created_at: string;
  updated_at: string;
  event?: any;
  user?: any;
  isCheckedIn?: boolean;
}

const RegistrationService = {
  // 自分の参加登録一覧取得
  getMyRegistrations: async (page = 1) => {
    const response = await api.get(`/registrations?page=${page}`);
    return response.data;
  },
  
  // イベントに参加登録
  registerForEvent: async (eventId: number, comments?: string, guestEmails?: string[]) => {
    const data: any = {
      event_id: eventId,
      comments
    };
    
    if (guestEmails && guestEmails.length > 0) {
      data.guest_emails = guestEmails;
    }
    
    const response = await api.post('/registrations', data);
    return response.data;
  },
  
  // 参加登録詳細取得
  getRegistration: async (id: number) => {
    const response = await api.get(`/registrations/${id}`);
    return response.data;
  },
  
  // 参加登録をキャンセル
  cancelRegistration: async (id: number) => {
    const response = await api.post(`/registrations/${id}/cancel`);
    return response.data;
  },
  
  // イベントの参加者一覧取得（管理者用）
  getEventParticipants: async (eventId: number, page = 1, status?: string) => {
    let url = `/events/${eventId}/participants?page=${page}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await api.get(url);
    return response.data;
  },
  
  // 参加登録のステータス更新（管理者用）
  updateRegistrationStatus: async (id: number, status: 'pending' | 'confirmed' | 'cancelled') => {
    const data = { status };
    const response = await api.patch(`/registrations/${id}/status`, data);
    return response.data;
  }
};

export default RegistrationService; 