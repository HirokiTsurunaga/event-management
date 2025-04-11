<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CreateTestEvents extends Seeder
{
    /**
     * テスト用のイベントデータを作成
     */
    public function run()
    {
        // 管理者ユーザーの作成（もし存在しなければ）
        $admin = User::where('email', 'admin@example.com')->first();
        if (!$admin) {
            $admin = User::create([
                'name' => '管理者',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]);
        }

        // 一般ユーザーの作成（もし存在しなければ）
        $user = User::where('email', 'user@example.com')->first();
        if (!$user) {
            $user = User::create([
                'name' => '一般ユーザー',
                'email' => 'user@example.com',
                'password' => Hash::make('password'),
                'role' => 'participant',
            ]);
        }

        // テストイベントの作成
        $events = [
            [
                'name' => '公開テストイベント1',
                'description' => 'これは誰でも見れる公開イベントです',
                'start_date' => now()->addDays(10),
                'end_date' => now()->addDays(10)->addHours(2),
                'location' => '東京都渋谷区',
                'capacity' => 100,
                'is_published' => true,
                'user_id' => $admin->id,
            ],
            [
                'name' => '公開テストイベント2',
                'description' => 'これは誰でも見れる公開イベントです',
                'start_date' => now()->addDays(20),
                'end_date' => now()->addDays(20)->addHours(3),
                'location' => '大阪府大阪市',
                'capacity' => 50,
                'is_published' => true,
                'user_id' => $admin->id,
            ],
            [
                'name' => '非公開テストイベント',
                'description' => 'これは管理者のみ見れる非公開イベントです',
                'start_date' => now()->addDays(30),
                'end_date' => now()->addDays(30)->addHours(4),
                'location' => '福岡県福岡市',
                'capacity' => 30,
                'is_published' => false,
                'user_id' => $admin->id,
            ],
        ];

        foreach ($events as $eventData) {
            Event::create($eventData);
        }
    }
} 