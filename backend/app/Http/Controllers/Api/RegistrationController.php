<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegistrationController extends Controller
{
    /**
     * ユーザーの参加登録一覧を取得
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $registrations = Registration::with('event')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        return response()->json($registrations);
    }

    /**
     * イベントに参加登録する
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'comments' => 'nullable|string|max:1000',
            'guest_emails' => 'nullable|array|max:45', // 最大45人の招待制限
            'guest_emails.*' => 'email|distinct|max:255',
        ]);
        
        // トランザクション開始
        return DB::transaction(function () use ($validated, $request) {
            $eventId = $validated['event_id'];
            $event = Event::findOrFail($eventId);
            
            // イベント定員チェック
            if ($event->capacity) {
                $currentParticipants = Registration::where('event_id', $eventId)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->count();
                    
                // 自分+ゲストの合計人数
                $guestCount = isset($validated['guest_emails']) ? count($validated['guest_emails']) : 0;
                $totalRegistrations = $currentParticipants + 1 + $guestCount;
                
                if ($totalRegistrations > $event->capacity) {
                    return response()->json([
                        'message' => 'イベントの定員を超えています。'
                    ], 422);
                }
            }
            
            // 既に登録済みかチェック
            $existingRegistration = Registration::where('event_id', $eventId)
                ->where('user_id', Auth::id())
                ->first();
                
            if ($existingRegistration) {
                return response()->json([
                    'message' => '既にこのイベントに登録済みです。'
                ], 422);
            }
            
            // 本人の登録
            $registration = new Registration([
                'event_id' => $eventId,
                'user_id' => Auth::id(),
                'status' => 'pending',
                'comments' => $validated['comments'] ?? null,
                'registration_code' => strtoupper(Str::random(8)),
            ]);
            $registration->save();
            
            // ゲスト招待処理
            $guestRegistrations = [];
            if (isset($validated['guest_emails']) && count($validated['guest_emails']) > 0) {
                foreach ($validated['guest_emails'] as $email) {
                    // 既存ユーザーかチェック
                    $user = User::where('email', $email)->first();
                    $userId = $user ? $user->id : null;
                    
                    // ゲストの登録
                    $guestRegistration = new Registration([
                        'event_id' => $eventId,
                        'user_id' => $userId,
                        'invited_by' => Auth::id(),
                        'invited_email' => $email,
                        'status' => 'pending',
                        'registration_code' => strtoupper(Str::random(8)),
                    ]);
                    $guestRegistration->save();
                    $guestRegistrations[] = $guestRegistration;
                    
                    // TODO: 招待メール送信処理
                }
            }
            
            return response()->json([
                'message' => 'イベントに正常に登録されました。',
                'registration' => $registration,
                'guest_registrations' => $guestRegistrations
            ], 201);
        });
    }

    /**
     * 指定された参加登録の詳細を表示
     *
     * @param  \App\Models\Registration  $registration
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $registration = Registration::with('event')
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();
            
        return response()->json($registration);
    }

    /**
     * 参加登録をキャンセルする
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Registration  $registration
     * @return \Illuminate\Http\Response
     */
    public function cancel($id)
    {
        $registration = Registration::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();
            
        $registration->status = 'cancelled';
        $registration->cancelled_at = now();
        $registration->save();
        
        return response()->json([
            'message' => '参加登録がキャンセルされました。',
            'registration' => $registration
        ]);
    }

    /**
     * イベントの参加者一覧を取得（管理者用）
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $eventId
     * @return \Illuminate\Http\Response
     */
    public function getEventParticipants($eventId, Request $request)
    {
        // 管理者権限確認
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => '権限がありません。'], 403);
        }
        
        $event = Event::findOrFail($eventId);
        
        // クエリパラメータ
        $status = $request->query('status');
        
        $query = Registration::with('user')
            ->where('event_id', $eventId);
            
        // ステータスフィルター
        if ($status) {
            $query->where('status', $status);
        }
        
        $registrations = $query->orderBy('created_at', 'desc')
            ->paginate(15);
            
        return response()->json($registrations);
    }

    /**
     * 参加登録のステータスを更新（管理者用）
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Registration  $registration
     * @return \Illuminate\Http\Response
     */
    public function updateStatus($id, Request $request)
    {
        // 管理者権限確認
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => '権限がありません。'], 403);
        }
        
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled',
        ]);
        
        $registration = Registration::findOrFail($id);
        $oldStatus = $registration->status;
        $registration->status = $validated['status'];
        
        // ステータスに応じた日時更新
        if ($validated['status'] === 'confirmed' && $oldStatus !== 'confirmed') {
            $registration->confirmed_at = now();
        } elseif ($validated['status'] === 'cancelled' && $oldStatus !== 'cancelled') {
            $registration->cancelled_at = now();
        }
        
        $registration->save();
        
        return response()->json([
            'message' => '参加登録ステータスが更新されました。',
            'registration' => $registration
        ]);
    }
}
