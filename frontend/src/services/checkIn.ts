import api from './api';

export interface CheckIn {
  id: number;
  registration_id: number;
  event_id: number;
  checked_by_user_id: number;
  checked_in_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  registration?: any;
  event?: any;
  checked_by_user?: any;
}

export interface CheckInStatistics {
  registration_count: number;
  checked_in_count: number;
  check_in_rate: number;
}

const CheckInService = {
  // イベントのチェックイン一覧取得
  getEventCheckIns: async (eventId: number, page = 1, date?: string) => {
    let url = `/events/${eventId}/check-ins?page=${page}`;
    if (date) {
      url += `&date=${date}`;
    }
    const response = await api.get(url);
    return response.data;
  },
  
  // 参加者をチェックイン処理
  checkInParticipant: async (registrationId: number, notes?: string) => {
    const data = {
      registration_id: registrationId,
      notes
    };
    const response = await api.post('/check-ins', data);
    return response.data;
  },
  
  // 登録コード（QRコード）によるチェックイン
  checkInByCode: async (eventId: number, registrationCode: string, notes?: string) => {
    const data = {
      event_id: eventId,
      registration_code: registrationCode,
      notes
    };
    const response = await api.post('/check-ins/by-code', data);
    return response.data;
  },
  
  // チェックイン情報の詳細取得
  getCheckIn: async (id: number) => {
    const response = await api.get(`/check-ins/${id}`);
    return response.data;
  },
  
  // チェックイン情報の削除
  deleteCheckIn: async (id: number) => {
    const response = await api.delete(`/check-ins/${id}`);
    return response.data;
  },
  
  // イベントのチェックイン統計情報取得
  getEventStatistics: async (eventId: number) => {
    const response = await api.get(`/events/${eventId}/check-in-statistics`);
    return response.data;
  }
};

export default CheckInService; 