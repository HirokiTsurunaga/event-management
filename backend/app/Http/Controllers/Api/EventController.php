<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventController extends Controller
{
    /**
     * イベント一覧を取得
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        // 認証されたユーザーの取得
        $user = $request->user();
        
        // クエリビルダーの初期化
        $query = Event::query();
        
        // 権限に基づいたクエリの制限
        if (!$user || !$user->isAdmin()) {
            $query->where('is_published', true);
        }
        
        // 検索パラメータの処理
        if ($request->has('search')) {
            $searchTerm = $request->input('search');
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%")
                  ->orWhere('location', 'like', "%{$searchTerm}%");
            });
        }
        
        // カテゴリーフィルター
        if ($request->has('categories')) {
            $categories = explode(',', $request->input('categories'));
            // イベントとカテゴリーの中間テーブルがある場合の実装例
            // $query->whereHas('categories', function($q) use ($categories) {
            //     $q->whereIn('category_id', $categories);
            // });
        }
        
        // 日付範囲フィルター
        if ($request->has('date_from')) {
            $query->where('start_date', '>=', $request->input('date_from'));
        }
        
        if ($request->has('date_to')) {
            $query->where('start_date', '<=', $request->input('date_to'));
        }
        
        // 参加可能なイベントのみ表示（満員でないもの）
        if ($request->boolean('available_only')) {
            $query->where(function($q) {
                $q->whereNull('capacity')
                  ->orWhereRaw('capacity > (SELECT COUNT(*) FROM registrations WHERE registrations.event_id = events.id)');
            });
        }
        
        // ソート順の処理
        $sortField = $request->input('sort_by', 'start_date');
        $sortDirection = $request->input('sort_dir', 'asc');
        
        // 許可されたソートフィールドのリスト
        $allowedSortFields = ['name', 'start_date', 'location', 'created_at'];
        
        // 入力値の検証
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'start_date';
        }
        
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }
        
        $query->orderBy($sortField, $sortDirection);
        
        // ページネーション
        $perPage = $request->input('per_page', 10);
        $events = $query->paginate($perPage);
        
        // 各イベントの参加者数を取得
        $events->getCollection()->transform(function ($event) {
            $event->participant_count = $event->registrations()->count();
            return $event;
        });
        
        return response()->json([
            'events' => $events,
        ]);
    }

    /**
     * イベントを新規作成
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // 認証チェック
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。'
            ], 403);
        }
        
        // バリデーション
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'required|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'is_published' => 'boolean',
            'image' => 'nullable|image|max:2048', // 2MB制限
        ]);
        
        // イベント画像のアップロード処理
        $imagePath = null;
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            $file = $request->file('image');
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $imagePath = $file->storeAs('event-images', $filename, 'public');
        }
        
        // イベント作成
        $event = Event::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'location' => $validated['location'],
            'capacity' => $validated['capacity'] ?? null,
            'is_published' => $validated['is_published'] ?? false,
            'image_path' => $imagePath,
        ]);
        
        return response()->json([
            'message' => 'イベントが作成されました',
            'event' => $event,
        ], 201);
    }

    /**
     * 特定のイベント詳細を取得
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $event = Event::with(['registrations.user', 'creator'])->findOrFail($id);
        
        // 認証されたユーザーの取得
        $user = request()->user();
        
        // 公開イベントの場合は誰でもアクセス可能
        if ($event->is_published) {
            return response()->json([
                'event' => $event,
            ]);
        }
        
        // 非公開イベントは管理者または作成者のみアクセス可能
        if ($user && ($user->isAdmin() || $event->user_id === $user->id)) {
            return response()->json([
                'event' => $event,
            ]);
        }
        
        return response()->json([
            'message' => 'このイベントにアクセスする権限がありません。',
        ], 403);
    }

    /**
     * 指定イベントを更新
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Event  $event
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Event $event)
    {
        // 認証チェック
        $user = $request->user();
        if (!$user || !$user->isAdmin() || $user->id !== $event->user_id) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。'
            ], 403);
        }
        
        // バリデーション
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after_or_equal:start_date',
            'location' => 'sometimes|required|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'is_published' => 'boolean',
            'image' => 'nullable|image|max:2048', // 2MB制限
        ]);
        
        // イベント画像のアップロード処理
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            // 古い画像の削除
            if ($event->image_path) {
                Storage::disk('public')->delete($event->image_path);
            }
            
            // 新しい画像のアップロード
            $file = $request->file('image');
            $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();
            $imagePath = $file->storeAs('event-images', $filename, 'public');
            
            $validated['image_path'] = $imagePath;
        }
        
        // イベント更新
        $event->update($validated);
        
        return response()->json([
            'message' => 'イベントが更新されました',
            'event' => $event,
        ]);
    }

    /**
     * 指定イベントを削除
     *
     * @param  \App\Models\Event  $event
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, Event $event)
    {
        // 管理者かつイベント作成者のみ削除可能
        $user = $request->user();
        if (!$user || !$user->isAdmin() || $user->id !== $event->user_id) {
            return response()->json([
                'message' => 'この操作を行う権限がありません。'
            ], 403);
        }
        
        // 画像の削除
        if ($event->image_path) {
            Storage::disk('public')->delete($event->image_path);
        }
        
        // イベントの削除
        $event->delete();
        
        return response()->json([
            'message' => 'イベントが削除されました',
        ]);
    }
}
