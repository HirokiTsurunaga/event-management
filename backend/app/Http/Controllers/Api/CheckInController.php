<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckInController extends Controller
{
    /**
     * イベントのチェックイン一覧を取得（管理者用）
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $eventId
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $eventId)
    {
        // 管理者権限チェック
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // イベント存在確認と所有権チェック
        $event = Event::findOrFail($eventId);
        if ($request->user()->id !== $event->user_id) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // チェックイン一覧取得（日付によるフィルタリング対応）
        $date = $request->query('date');
        $checkInsQuery = $event->checkIns()->with(['registration', 'registration.user']);
        
        if ($date) {
            $checkInsQuery->whereDate('checked_in_at', $date);
        }
        
        $checkIns = $checkInsQuery->orderBy('checked_in_at', 'desc')->paginate(20);
        
        return response()->json([
            'event' => $event,
            'check_ins' => $checkIns,
        ]);
    }

    /**
     * 参加者をチェックイン処理する（管理者用）
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // 管理者権限チェック
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // バリデーション
        $validated = $request->validate([
            'registration_id' => 'required|exists:registrations,id',
            'notes' => 'nullable|string',
        ]);
        
        // 参加登録の取得と確認
        $registration = Registration::findOrFail($validated['registration_id']);
        
        // イベント所有権チェック
        if ($request->user()->id !== $registration->event->user_id) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // ステータスチェック（キャンセル済みはチェックイン不可）
        if ($registration->isCancelled()) {
            return response()->json([
                'message' => 'キャンセル済みの参加登録はチェックインできません。',
            ], 422);
        }
        
        // 既にチェックイン済みかチェック
        if ($registration->isCheckedIn()) {
            return response()->json([
                'message' => 'この参加者は既にチェックイン済みです。',
                'check_in' => $registration->checkIn,
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // チェックイン記録の作成
            $checkIn = CheckIn::create([
                'registration_id' => $registration->id,
                'event_id' => $registration->event_id,
                'checked_by_user_id' => $request->user()->id,
                'notes' => $validated['notes'] ?? null,
            ]);
            
            DB::commit();
            
            // 関連データを読み込み
            $checkIn->load(['registration', 'registration.user', 'event']);
            
            return response()->json([
                'message' => 'チェックインが完了しました。',
                'check_in' => $checkIn,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'チェックイン処理中にエラーが発生しました。',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 登録コード（QRコード）によるチェックイン処理（管理者用）
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function checkInByCode(Request $request)
    {
        // 管理者権限チェック
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // バリデーション
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'registration_code' => 'required|string',
            'notes' => 'nullable|string',
        ]);
        
        // イベント所有権チェック
        $event = Event::findOrFail($validated['event_id']);
        if ($request->user()->id !== $event->user_id) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // 登録コードから参加登録を検索
        $registration = Registration::where('registration_code', $validated['registration_code'])
            ->where('event_id', $validated['event_id'])
            ->first();
            
        if (!$registration) {
            return response()->json([
                'message' => '無効な登録コードです。',
            ], 404);
        }
        
        // ステータスチェック（キャンセル済みはチェックイン不可）
        if ($registration->isCancelled()) {
            return response()->json([
                'message' => 'キャンセル済みの参加登録はチェックインできません。',
            ], 422);
        }
        
        // 既にチェックイン済みかチェック
        if ($registration->isCheckedIn()) {
            return response()->json([
                'message' => 'この参加者は既にチェックイン済みです。',
                'check_in' => $registration->checkIn,
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // チェックイン記録の作成
            $checkIn = CheckIn::create([
                'registration_id' => $registration->id,
                'event_id' => $registration->event_id,
                'checked_by_user_id' => $request->user()->id,
                'notes' => $validated['notes'] ?? null,
            ]);
            
            DB::commit();
            
            // 関連データを読み込み
            $checkIn->load(['registration', 'registration.user', 'event']);
            
            return response()->json([
                'message' => 'チェックインが完了しました。',
                'check_in' => $checkIn,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'チェックイン処理中にエラーが発生しました。',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * チェックイン情報の詳細を取得
     *
     * @param  \App\Models\CheckIn  $checkIn
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, CheckIn $checkIn)
    {
        // 参加者本人かイベント管理者のみ閲覧可能
        if ($request->user()->id !== $checkIn->registration->user_id && 
            $request->user()->id !== $checkIn->event->user_id) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // 関連データをロード
        $checkIn->load(['registration', 'registration.user', 'event', 'checkedByUser']);
        
        return response()->json([
            'check_in' => $checkIn,
        ]);
    }

    /**
     * チェックイン情報を削除（管理者用）
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\CheckIn  $checkIn
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, CheckIn $checkIn)
    {
        // 管理者権限チェック
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // イベント所有権チェック
        if ($request->user()->id !== $checkIn->event->user_id) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // チェックイン情報の削除
        $checkIn->delete();
        
        return response()->json([
            'message' => 'チェックイン情報が削除されました。',
        ]);
    }

    /**
     * イベントのチェックイン統計情報を取得（管理者用）
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $eventId
     * @return \Illuminate\Http\Response
     */
    public function getEventStatistics(Request $request, $eventId)
    {
        // 管理者権限チェック
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // イベント存在確認と所有権チェック
        $event = Event::findOrFail($eventId);
        if ($request->user()->id !== $event->user_id) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。',
            ], 403);
        }
        
        // イベントの参加登録数
        $registrationCount = Registration::where('event_id', $eventId)
            ->where('status', 'confirmed')
            ->count();
            
        // チェックイン済み参加者数
        $checkedInCount = CheckIn::where('event_id', $eventId)->count();
        
        // チェックイン率の計算
        $checkInRate = $registrationCount > 0 ? round(($checkedInCount / $registrationCount) * 100, 2) : 0;
        
        return response()->json([
            'event' => $event,
            'statistics' => [
                'registration_count' => $registrationCount,
                'checked_in_count' => $checkedInCount,
                'check_in_rate' => $checkInRate,
            ],
        ]);
    }
} 